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
      {/* ── Scroll-aware Header ── */}
      <header
        className={`app-header ${scrolled ? 'scrolled' : 'at-top'}`}
        style={{ padding: '0 16px' }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: scrolled ? '10px 0' : '16px 0 12px',
            transition: 'padding 300ms cubic-bezier(0.32,0.72,0,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* Icon — always visible */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--fill-quaternary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Wallet
              style={{ width: 18, height: 18, color: 'var(--blue)' }}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          {/* Title — Large when at top, inline when scrolled */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: scrolled ? 'center' : 'flex-end',
              justifyContent: scrolled ? 'center' : 'flex-start',
              paddingLeft: scrolled ? 0 : 12,
              position: scrolled ? 'absolute' : 'relative',
              left: scrolled ? '50%' : 'auto',
              transform: scrolled ? 'translateX(-50%)' : 'none',
              transition: 'all 300ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <h1
              style={{
                fontSize: scrolled ? 17 : 28,
                fontWeight: scrolled ? 600 : 700,
                letterSpacing: scrolled ? '-0.43px' : '-0.40px',
                color: 'var(--label)',
                transition: 'font-size 300ms cubic-bezier(0.32,0.72,0,1), font-weight 300ms cubic-bezier(0.32,0.72,0,1)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              MoneySmartflow
            </h1>
          </div>

          {/* Supabase badge — always right */}
          <div
            className="glass-thin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 9999,
              padding: '3px 10px',
              color: 'var(--label-secondary)',
              flexShrink: 0,
              height: 22,
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

        {/* Large-title subtitle — only when at top */}
        {!scrolled && (
          <p
            className="type-subhead"
            style={{
              color: 'var(--label-secondary)',
              maxWidth: 640,
              margin: '0 auto',
              paddingLeft: 48,
              paddingBottom: 8,
              opacity: scrolled ? 0 : 1,
              transition: 'opacity 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Quản lý tài chính cá nhân
          </p>
        )}
      </header>

      {/* ── Page content ── */}
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '16px 16px 200px',
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

      {/* ── Fixed Bottom Dock ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          padding: `0 16px calc(8px + env(safe-area-inset-bottom, 0px))`,
          /* Fade-out gradient so content behind is readable */
          background: 'linear-gradient(to top, var(--bg-grouped) 55%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'auto',
          }}
        >
          {/* FAB — morphing glass input */}
          <VoiceFAB
            onTranscriptComplete={handleTranscriptComplete}
            isProcessing={isProcessingVoice}
            onFocusChange={(focused) => setFabFocused(focused)}
          />

          {/* Pill Tab Bar — glass, slides in/out */}
          <nav
            className="tab-bar glass-regular"
            aria-label="Điều hướng chính"
            style={{
              height: fabFocused ? 0 : 56,
              opacity: fabFocused ? 0 : 1,
              overflow: 'hidden',
              margin: fabFocused ? 0 : '0 0',
              transition: 'height 400ms cubic-bezier(0.32,0.72,0,1), opacity 280ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Sliding capsule indicator */}
            <div
              className="tab-indicator"
              style={{
                left: tabIndicatorLeft,
                width: tabIndicatorWidth,
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
                >
                  <Icon
                    style={{ width: 22, height: 22 }}
                    strokeWidth={isActive ? 2 : 1.6}
                    aria-hidden="true"
                  />
                  <span className="tab-label">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

