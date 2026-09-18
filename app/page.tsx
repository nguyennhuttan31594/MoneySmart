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
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

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

  // Load initial data from Supabase or LocalStorage
  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured && supabase) {
        try {
          // 1. Fetch categories
          const { data: catData, error: catErr } = await supabase.from('categories').select('*');
          if (catErr) {
            console.error('Supabase categories error:', catErr);
          } else if (catData && catData.length > 0) {
            setCategories(catData);
          } else {
            // Seed default categories into Supabase if empty
            const { data: seededCats } = await supabase.from('categories').upsert(DEFAULT_CATEGORIES).select();
            if (seededCats && seededCats.length > 0) {
              setCategories(seededCats);
            }
          }

          // 2. Fetch transactions from Supabase
          const { data: txData, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

          if (txErr) {
            console.error('Supabase transactions fetch error:', txErr);
            const localTxs = localStorage.getItem('moneysmartflow_transactions') || localStorage.getItem('moneyflow_transactions');
            if (localTxs) setTransactions(JSON.parse(localTxs));
          } else if (txData) {
            setTransactions(txData);
            localStorage.setItem('moneysmartflow_transactions', JSON.stringify(txData));
          }
        } catch (err) {
          console.error('Supabase load error:', err);
          const localTxs = localStorage.getItem('moneysmartflow_transactions') || localStorage.getItem('moneyflow_transactions');
          if (localTxs) setTransactions(JSON.parse(localTxs));
        }
      } else {
        const localCats = localStorage.getItem('moneysmartflow_categories') || localStorage.getItem('moneyflow_categories');
        const localTxs = localStorage.getItem('moneysmartflow_transactions') || localStorage.getItem('moneyflow_transactions');
        if (localCats) setCategories(JSON.parse(localCats));
        if (localTxs) setTransactions(JSON.parse(localTxs));
      }
    }
    loadData();
  }, []);

  // Sync to LocalStorage Backup on any change
  useEffect(() => {
    localStorage.setItem('moneysmartflow_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('moneysmartflow_transactions', JSON.stringify(transactions));
  }, [transactions]);

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

  // Confirm & Save transaction directly into Supabase transactions table
  const handleConfirmTransaction = async (finalData: ParsedVoiceResult) => {
    let txDateIso: string;
    if (finalData.transaction_date && finalData.transaction_date.length === 10) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      txDateIso = new Date(`${finalData.transaction_date}T${timeStr}`).toISOString();
    } else {
      txDateIso = new Date(finalData.transaction_date || Date.now()).toISOString();
    }

    const newTxPayload = {
      category_id: finalData.category_id,
      amount: finalData.amount,
      type: finalData.type,
      description: finalData.description,
      raw_text: finalData.description,
      transaction_date: txDateIso,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([newTxPayload])
          .select();

        if (error) {
          console.error('Supabase insert transaction error:', error);
          const fallbackTx: Transaction = { id: `tx-${Date.now()}`, ...newTxPayload };
          setTransactions((prev) => [fallbackTx, ...prev]);
        } else if (data && data[0]) {
          setTransactions((prev) => [data[0], ...prev]);
        }
      } catch (err) {
        console.error('Supabase insert exception:', err);
        const fallbackTx: Transaction = { id: `tx-${Date.now()}`, ...newTxPayload };
        setTransactions((prev) => [fallbackTx, ...prev]);
      }
    } else {
      const fallbackTx: Transaction = { id: `tx-${Date.now()}`, ...newTxPayload };
      setTransactions((prev) => [fallbackTx, ...prev]);
    }

    setIsPreviewOpen(false);
    setParsedResult(null);
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

