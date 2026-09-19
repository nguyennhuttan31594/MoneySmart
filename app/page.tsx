'use client';

import React, { useState, useEffect } from 'react';
import { Category, Transaction, ParsedVoiceResult } from '@/lib/types';
import { DEFAULT_CATEGORIES, INITIAL_TRANSACTIONS } from '@/lib/default-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { VoiceFAB } from '@/components/VoiceFAB';
import { ParsedPreviewModal } from '@/components/ParsedPreviewModal';
import { CategoryManager } from '@/components/CategoryManager';
import { ReportsDashboard } from '@/components/ReportsDashboard';
import { TransactionFeed } from '@/components/TransactionFeed';

import { Wallet, PieChart, Layers, ListFilter } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Default active tab: [Nhật ký] (transactions)
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports' | 'categories'>('transactions');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Helper to format local YYYY-MM-DD
  const getTodayLocalDate = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load initial data from LocalStorage & Supabase
  useEffect(() => {
    async function loadData() {
      // 1. Read cached data from LocalStorage first for instant render
      let localCats: Category[] = DEFAULT_CATEGORIES;
      let localTxs: Transaction[] = INITIAL_TRANSACTIONS;

      try {
        const rawLocalCats = localStorage.getItem('moneysmartflow_categories') || localStorage.getItem('moneyflow_categories');
        const rawLocalTxs = localStorage.getItem('moneysmartflow_transactions') || localStorage.getItem('moneyflow_transactions');
        if (rawLocalCats) localCats = JSON.parse(rawLocalCats);
        if (rawLocalTxs) localTxs = JSON.parse(rawLocalTxs);
      } catch (err) {
        console.error('LocalStorage read error:', err);
      }

      setCategories(localCats);
      setTransactions(localTxs);

      // 2. Fetch from Supabase and merge with local data
      if (isSupabaseConfigured && supabase) {
        try {
          // Fetch categories
          const { data: catData } = await supabase.from('categories').select('*');
          if (catData && catData.length > 0) {
            setCategories(catData);
            localStorage.setItem('moneysmartflow_categories', JSON.stringify(catData));
          } else {
            await supabase.from('categories').upsert(DEFAULT_CATEGORIES);
          }

          // Fetch transactions
          const { data: txData, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

          if (!txErr && txData) {
            if (txData.length > 0) {
              // Merge Supabase txData with local-only transactions (avoiding duplicates)
              const remoteIds = new Set(txData.map((t) => t.id));
              const localOnly = localTxs.filter((t) => !remoteIds.has(t.id));
              const merged = [...txData, ...localOnly].sort(
                (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
              );
              setTransactions(merged);
              localStorage.setItem('moneysmartflow_transactions', JSON.stringify(merged));
            } else if (localTxs.length > 0) {
              // Supabase empty, seed localTxs to Supabase
              const { data: seeded } = await supabase.from('transactions').insert(
                localTxs.map((t) => ({
                  category_id: t.category_id,
                  amount: t.amount,
                  type: t.type,
                  description: t.description,
                  raw_text: t.raw_text || t.description,
                  transaction_date: t.transaction_date,
                }))
              ).select();

              if (seeded && seeded.length > 0) {
                setTransactions(seeded);
                localStorage.setItem('moneysmartflow_transactions', JSON.stringify(seeded));
              }
            }
          }
        } catch (err) {
          console.error('Supabase load error:', err);
        }
      }

      setIsLoaded(true);
    }

    loadData();
  }, []);

  // Sync to LocalStorage Backup ONLY AFTER initial load is done
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('moneysmartflow_categories', JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('moneysmartflow_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  // Voice & Text transcript handler -> calls Gemini API route
  const handleTranscriptComplete = async (text: string) => {
    setIsProcessingVoice(true);
    try {
      const todayLocalDateStr = getTodayLocalDate();
      const response = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          currentDate: todayLocalDateStr,
          categories,
        }),
      });

      if (!response.ok) {
        throw new Error('API parse response error');
      }

      const data: ParsedVoiceResult = await response.json();
      setParsedResult(data);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Voice parsing error:', err);
      alert('Không thể phân tích giọng nói. Vui lòng kiểm tra API key hoặc thử lại!');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Confirm & Save transaction with immediate dual-write (LocalStorage + Supabase)
  const handleConfirmTransaction = async (finalData: ParsedVoiceResult) => {
    let txDateIso: string;
    if (finalData.transaction_date && finalData.transaction_date.length === 10) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      txDateIso = new Date(`${finalData.transaction_date}T${timeStr}`).toISOString();
    } else {
      txDateIso = new Date(finalData.transaction_date || Date.now()).toISOString();
    }

    const tempId = `tx-${Date.now()}`;
    const newTxRecord: Transaction = {
      id: tempId,
      category_id: finalData.category_id,
      amount: finalData.amount,
      type: finalData.type,
      description: finalData.description,
      raw_text: finalData.description,
      transaction_date: txDateIso,
    };

    // 1. Optimistic Update: Save to state & LocalStorage immediately!
    setTransactions((prev) => {
      const updated = [newTxRecord, ...prev];
      localStorage.setItem('moneysmartflow_transactions', JSON.stringify(updated));
      return updated;
    });

    setIsPreviewOpen(false);
    setParsedResult(null);

    // 2. Insert directly into Supabase database table
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([
            {
              category_id: newTxRecord.category_id,
              amount: newTxRecord.amount,
              type: newTxRecord.type,
              description: newTxRecord.description,
              raw_text: newTxRecord.raw_text,
              transaction_date: newTxRecord.transaction_date,
            },
          ])
          .select();

        if (error) {
          console.error('Supabase insert transaction error:', error);
        } else if (data && data[0]) {
          // Replace temp ID with real Supabase database row ID
          setTransactions((prev) => {
            const replaced = prev.map((t) => (t.id === tempId ? data[0] : t));
            localStorage.setItem('moneysmartflow_transactions', JSON.stringify(replaced));
            return replaced;
          });
        }
      } catch (err) {
        console.error('Supabase insert exception:', err);
      }
    }
  };

  // Category CRUD Handlers
  const handleAddCategory = async (newCat: Omit<Category, 'id'>) => {
    const catId = `cat-${Date.now()}`;
    const createdCat: Category = { ...newCat, id: catId };

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('categories').insert([newCat]).select();
      if (data && data[0]) {
        setCategories((prev) => [...prev, data[0]]);
        return;
      }
    }
    setCategories((prev) => [...prev, createdCat]);
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
  };

  const handleDeleteCategory = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('categories').delete().eq('id', id);
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('transactions').delete().eq('id', id);
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  /* ─── nav tab config ─── */
  const navTabs = [
    { id: 'transactions' as const, label: 'Nhật ký',   Icon: ListFilter },
    { id: 'reports'      as const, label: 'Báo cáo',   Icon: PieChart   },
    { id: 'categories'  as const, label: 'Danh mục',  Icon: Layers     },
  ];

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(circle at 15% 50%, #f1f2f6 0%, #e4e5ea 100%)',
        backgroundAttachment: 'fixed',
        paddingBottom: 128,
        color: '#1C1C1E',
      }}
    >
      {/* ── Sticky Glass Header ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(242,242,247,0.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          padding: '12px 20px',
        }}
      >
        <div style={{ maxWidth: 896, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo mark */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,122,255,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              <Wallet style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1
                  className="text-amount"
                  style={{ fontSize: 22, color: '#1C1C1E' }}
                >
                  MoneySmartflow
                </h1>
                {/* Live DB pill */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: 99,
                    padding: '2px 10px',
                    color: '#86868B',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: isSupabaseConfigured ? '#32D74B' : '#FF9F0A',
                      display: 'inline-block',
                      animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                    }}
                  />
                  {isSupabaseConfigured ? 'Supabase Live' : 'Local Storage'}
                </span>
              </div>
              <p className="text-note" style={{ fontSize: 12, marginTop: 1 }}>Quản lý tài chính cá nhân</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 896, margin: '0 auto', padding: '20px 16px 144px' }}>
        {activeTab === 'transactions' && (
          <TransactionFeed
            transactions={transactions}
            categories={categories}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsDashboard transactions={transactions} categories={categories} />
        )}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </div>

      {/* ── Modal ── */}
      <ParsedPreviewModal
        isOpen={isPreviewOpen}
        parsedData={parsedResult}
        categories={categories}
        onConfirm={handleConfirmTransaction}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* ── Fixed Bottom Dock ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          padding: '0 12px 12px',
          background: 'linear-gradient(to top, rgba(228,229,234,0.97) 60%, rgba(228,229,234,0) 100%)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'auto' }}>
          {/* Voice / Text Input */}
          <VoiceFAB
            onTranscriptComplete={handleTranscriptComplete}
            isProcessing={isProcessingVoice}
          />

          {/* Bottom Tab Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 24px rgba(0,0,0,0.1)',
              borderRadius: 22,
              padding: '6px 8px',
            }}
          >
            {navTabs.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    padding: '6px 4px',
                    borderRadius: 14,
                    color: isActive ? '#007AFF' : '#86868B',
                    background: isActive ? 'rgba(0,122,255,0.1)' : 'transparent',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Icon style={{ width: 20, height: 20 }} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}

