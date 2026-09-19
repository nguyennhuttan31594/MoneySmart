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

  return (
    <main className="min-h-screen bg-white text-black pb-32">
      {/* iOS Top Header Bar */}
      <header className="sticky top-0 z-30 ios-glass-bar border-b border-black/[0.05] px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#007AFF] text-white rounded-2xl shadow-sm">
              <Wallet className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Title: font-bold text-3xl tracking-tight */}
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  MoneySmartflow
                </h1>
                {/* Database Compact Status Pill Badge */}
                <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-white border border-black/[0.06] rounded-full px-2.5 py-0.5 shadow-sm text-[#8E8E93]">
                  <span className="h-2 w-2 rounded-full bg-[#34C759] animate-pulse"></span>
                  {isSupabaseConfigured ? 'Supabase Live' : 'Local Storage'}
                </span>
              </div>
              {/* Subtitle: Slogan chính thức */}
              <p className="text-xs text-[#8E8E93]">Quản lý tài chính cá nhân</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-36">
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

      {/* Parsed Voice Sheet Preview Modal */}
      <ParsedPreviewModal
        isOpen={isPreviewOpen}
        parsedData={parsedResult}
        categories={categories}
        onConfirm={handleConfirmTransaction}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Fixed Bottom Container: Input Dock + Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto space-y-2 pointer-events-auto">
          {/* Always-visible Text & Voice Input Bar */}
          <VoiceFAB
            onTranscriptComplete={handleTranscriptComplete}
            isProcessing={isProcessingVoice}
          />

          {/* Bottom iOS Navigation Tabs */}
          <nav className="ios-glass-bar border border-black/[0.06] rounded-2xl px-8 py-2 shadow-lg flex items-center justify-around">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex flex-col items-center gap-0.5 transition ${
                activeTab === 'transactions' ? 'text-[#007AFF]' : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              <ListFilter className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-bold">Nhật ký</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center gap-0.5 transition ${
                activeTab === 'reports' ? 'text-[#007AFF]' : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              <PieChart className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-bold">Báo cáo</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex flex-col items-center gap-0.5 transition ${
                activeTab === 'categories' ? 'text-[#007AFF]' : 'text-[#8E8E93] hover:text-black'
              }`}
            >
              <Layers className="w-5 h-5" strokeWidth={2} />
              <span className="text-[10px] font-bold">Danh mục</span>
            </button>
          </nav>
        </div>
      </div>
    </main>
  );
}

