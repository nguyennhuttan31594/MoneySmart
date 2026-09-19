'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Category, Transaction, ParsedVoiceResult } from '@/lib/types';
import { DEFAULT_CATEGORIES, INITIAL_TRANSACTIONS } from '@/lib/default-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { VoiceFAB } from '@/components/VoiceFAB';
import { ParsedPreviewModal } from '@/components/ParsedPreviewModal';
import { CategoryManager } from '@/components/CategoryManager';
import { ReportsDashboard } from '@/components/ReportsDashboard';
import { TransactionFeed } from '@/components/TransactionFeed';

import { Wallet, PieChart, Layers, ListFilter } from 'lucide-react';
import { CurrencyDollar } from '@phosphor-icons/react';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'transactions' | 'reports' | 'categories'>('transactions');
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /* ── Scroll-aware header state ── */
  const [scrolled, setScrolled] = useState(false);
  const [scrolledFar, setScrolledFar] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  /* ── FAB focus state — hides tab bar ── */
  const [fabFocused, setFabFocused] = useState(false);

  /* ── Scroll listener for header edge effect ── */
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      setScrolled(y > 8);
      setScrolledFar(y > 56);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Haptic helper ── */
  const vibrate = useCallback((p: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
  }, []);

  const switchTab = useCallback((tab: typeof activeTab, idx: number) => {
    vibrate(8);
    setActiveTab(tab);
    setActiveTabIdx(idx);
  }, [vibrate]);

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
      // 1. Fetch from Supabase as absolute source of truth
      if (isSupabaseConfigured && supabase) {
        try {
          // Fetch categories
          const { data: catData, error: catErr } = await supabase.from('categories').select('*');
          console.log('[Supabase Fetch Categories] Data:', catData, 'Error:', catErr);
          if (catErr) console.error('[Supabase Fetch Categories Error]', catErr);

          if (catData && catData.length > 0) {
            setCategories(catData);
            localStorage.setItem('moneysmartflow_categories', JSON.stringify(catData));
          } else {
            console.log('[Supabase Seeding Categories...]');
            const { error: seedErr } = await supabase.from('categories').upsert(DEFAULT_CATEGORIES);
            if (seedErr) console.error('[Supabase Seed Categories Error]', seedErr);
          }

          // Fetch transactions from Supabase Cloud
          const { data: txData, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

          console.log('[Supabase Fetch Transactions] Rows:', txData?.length, 'Data:', txData, 'Error:', txErr);
          if (txErr) console.error('[Supabase Fetch Transactions Error]', txErr);

          if (!txErr && txData) {
            setTransactions(txData);
            localStorage.setItem('moneysmartflow_transactions', JSON.stringify(txData));
          }
        } catch (err) {
          console.error('Supabase load exception:', err);
        }
      } else {
        // Fallback for offline without Supabase
        try {
          const rawLocalCats = localStorage.getItem('moneysmartflow_categories');
          const rawLocalTxs = localStorage.getItem('moneysmartflow_transactions');
          if (rawLocalCats) setCategories(JSON.parse(rawLocalCats));
          if (rawLocalTxs) setTransactions(JSON.parse(rawLocalTxs));
        } catch (err) {
          console.error('LocalStorage read error:', err);
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

  // Supabase Realtime Subscription for instant cross-device sync (Phone <-> PC)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    console.log('[Supabase Realtime] Subscribing to postgres_changes on table transactions...');
    const channel = supabase
      .channel('realtime_transactions_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('[Supabase Realtime Event Received]:', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            const newTx = payload.new as Transaction;
            setTransactions((prev) => {
              const exists = prev.some((t) => t.id === newTx.id);
              if (exists) return prev;
              const filtered = prev.filter(
                (t) => !(t.description === newTx.description && t.amount === newTx.amount && t.id.startsWith('tx-'))
              );
              const updated = [newTx, ...filtered].sort(
                (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
              );
              localStorage.setItem('moneysmartflow_transactions', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTransactions((prev) => {
              const updated = prev.filter((t) => t.id !== deletedId);
              localStorage.setItem('moneysmartflow_transactions', JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTx = payload.new as Transaction;
            setTransactions((prev) => {
              const updated = prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
              localStorage.setItem('moneysmartflow_transactions', JSON.stringify(updated));
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime Channel Status]:', status);
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

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
      const insertPayload = {
        category_id: newTxRecord.category_id,
        amount: newTxRecord.amount,
        type: newTxRecord.type,
        description: newTxRecord.description,
        raw_text: newTxRecord.raw_text,
        transaction_date: newTxRecord.transaction_date,
      };
      console.log('[Supabase Inserting Transaction Payload]:', insertPayload);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([insertPayload])
          .select();

        console.log('[Supabase Insert Transaction Response] Data:', data, 'Error:', error);

        if (error) {
          console.error('[Supabase Insert Transaction Error]:', error);
          alert('Lỗi lưu Supabase: ' + error.message);
        } else if (data && data[0]) {
          console.log('[Supabase Insert Transaction Success]:', data[0]);
          // Replace temp ID with real Supabase database row ID
          setTransactions((prev) => {
            const replaced = prev.map((t) => (t.id === tempId ? data[0] : t));
            localStorage.setItem('moneysmartflow_transactions', JSON.stringify(replaced));
            return replaced;
          });
        }
      } catch (err) {
        console.error('[Supabase Insert Exception]:', err);
      }

      // 3. Auto-Save User Preference Memory rule into category_rules table for AI learning
      if (finalData.description && finalData.category_name) {
        const cleanKeyword = finalData.description.toLowerCase().trim();
        if (cleanKeyword.length >= 2) {
          try {
            console.log('[Supabase Saving AI Memory Rule]:', cleanKeyword, '->', finalData.category_name);
            await supabase.from('category_rules').upsert(
              {
                keyword: cleanKeyword,
                category_id: finalData.category_id,
                category_name: finalData.category_name,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'keyword' }
            );
          } catch (err) {
            console.warn('[Supabase Category Rule Memory Upsert Warning]:', err);
          }
        }
      }
    }
  };

  // Category CRUD Handlers
  const handleAddCategory = async (newCat: Omit<Category, 'id'>) => {
    const catId = `cat-${Date.now()}`;
    const createdCat: Category = { ...newCat, id: catId };

    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase Add Category Payload]:', newCat);
      const { data, error } = await supabase.from('categories').insert([newCat]).select();
      console.log('[Supabase Add Category Response] Data:', data, 'Error:', error);
      if (error) console.error('[Supabase Add Category Error]:', error);
      if (data && data[0]) {
        setCategories((prev) => [...prev, data[0]]);
        return;
      }
    }
    setCategories((prev) => [...prev, createdCat]);
  };

  const handleUpdateCategory = async (updatedCat: Category) => {
    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase Update Category Payload]:', updatedCat);
      const { data, error } = await supabase.from('categories').update({
        name: updatedCat.name,
        color: updatedCat.color,
        budget_limit: updatedCat.budget_limit,
        updated_at: new Date().toISOString(),
      }).eq('id', updatedCat.id).select();
      if (error) console.error('[Supabase Update Category Error]:', error);
      if (data && data[0]) {
        console.log('[Supabase Update Category Success]:', data[0]);
      }
    }
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === updatedCat.id ? updatedCat : c));
      localStorage.setItem('moneysmartflow_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase Delete Category ID]:', id);
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) console.error('[Supabase Delete Category Error]:', error);
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      console.log('[Supabase Delete Transaction ID]:', id);
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) console.error('[Supabase Delete Transaction Error]:', error);
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  /* ─── nav tab config ─── */
  const navTabs = [
    { id: 'transactions' as const, label: 'Nhật ký',  Icon: ListFilter },
    { id: 'reports'      as const, label: 'Báo cáo',  Icon: PieChart   },
    { id: 'categories'  as const, label: 'Danh mục', Icon: Layers     },
  ];

  /* ── Tab indicator width & position ── */
  const tabW = `${100 / navTabs.length}%`;
  const tabIndicatorLeft = `calc(${activeTabIdx} * ${tabW} + 4px)`;
  const tabIndicatorWidth = `calc(${tabW} - 8px)`;

  return (
    /* Outer scroll container — needed for scroll-aware header */
    <div
      ref={mainRef}
      style={{
        height: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--bg-grouped)',
        position: 'relative',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ── Scroll-aware Header (Height: 52px, Sticky, 3-Col Grid) ── */}
      <header
        className={`app-header ${scrolled ? 'scrolled' : 'at-top'}`}
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="app-shell"
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr auto',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Icon fancy tờ tiền dollar màu tím nổi bật */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #AF52DE 0%, #5856D6 100%)',
              boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(175,82,222,0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CurrencyDollar
              weight="fill"
              style={{ width: 20, height: 20, color: '#FFFFFF' }}
              aria-hidden="true"
            />
          </div>

          {/* Tên app MoneySmartflow nổi bật màu tím */}
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.44px',
              color: '#AF52DE',
              lineHeight: '22px',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            MoneySmartflow
          </h1>

          {/* Badge Live / Local */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 9999,
              padding: '0 10px',
              height: 22,
              background: isSupabaseConfigured ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.12)',
              color: isSupabaseConfigured ? '#248A3D' : '#C67300',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isSupabaseConfigured ? '#34C759' : '#FF9500',
                display: 'inline-block',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            {isSupabaseConfigured ? 'Live' : 'Local'}
          </div>
        </div>
      </header>

      {/* ── Main Page Content ── */}
      <div
        className="app-shell"
        style={{
          paddingTop: 12,
          paddingBottom: 190, /* Extra space so dock never overlaps content */
        }}
      >
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

      {/* ── Bottom Sheet Modal ── */}
      <ParsedPreviewModal
        isOpen={isPreviewOpen}
        parsedData={parsedResult}
        categories={categories}
        onConfirm={handleConfirmTransaction}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* ── Scrim Gradient Background Behind Dock ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          zIndex: 39,
          pointerEvents: 'none',
          background: 'linear-gradient(to top, #F2F2F7 30%, rgba(242,242,247,0.85) 60%, rgba(242,242,247,0) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Fixed Bottom Dock ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        <div
          className="app-shell"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'auto',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* FAB — morphing glass input */}
          <VoiceFAB
            onTranscriptComplete={handleTranscriptComplete}
            isProcessing={isProcessingVoice}
            onFocusChange={(focused) => setFabFocused(focused)}
          />

          {/* Pill Tab Bar — glass floating pill */}
          <nav
            className="tab-bar glass-regular"
            aria-label="Điều hướng chính"
            style={{
              height: fabFocused ? 0 : 56,
              opacity: fabFocused ? 0 : 1,
              overflow: 'hidden',
              borderRadius: 9999,
              transition: 'height 400ms cubic-bezier(0.32,0.72,0,1), opacity 280ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Sliding capsule indicator */}
            <div
              className="tab-indicator"
              style={{
                left: tabIndicatorLeft,
                width: tabIndicatorWidth,
                borderRadius: 9999,
                background: 'color-mix(in srgb, #007AFF 12%, transparent)',
              }}
              aria-hidden="true"
            />

            {navTabs.map(({ id, label, Icon }, idx) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  className={`tab-bar-btn${isActive ? ' active' : ''}`}
                  onClick={() => switchTab(id, idx)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                  style={{
                    color: isActive ? '#007AFF' : 'rgba(60,60,67,0.60)',
                  }}
                >
                  <Icon
                    style={{ width: 22, height: 22 }}
                    strokeWidth={isActive ? 2 : 1.6}
                    aria-hidden="true"
                  />
                  <span className="tab-label" style={{ fontSize: 10, fontWeight: 600 }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

