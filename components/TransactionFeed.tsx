'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '@/lib/types';
import { Search, Trash2, Calendar, Tag } from 'lucide-react';
import { CategoryIcon3D } from '@/components/CategoryIcon3D';

interface TransactionFeedProps {
  transactions: Transaction[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  transactions,
  categories,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.raw_text && t.raw_text.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCatId === 'all' || t.category_id === selectedCatId;
      const matchesType = selectedType === 'all' || t.type === selectedType;
      return matchesSearch && matchesCat && matchesType;
    });
  }, [transactions, searchQuery, selectedCatId, selectedType]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { label: string; dateObj: Date; items: Transaction[] } } = {};
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredTransactions.forEach((tx) => {
      const txDate = new Date(tx.transaction_date);
      const txDateStr = txDate.toDateString();
      let groupKey = txDateStr;
      let label = txDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (txDateStr === todayStr) label = 'Hôm nay';
      else if (txDateStr === yesterdayStr) label = 'Hôm qua';

      if (!groups[groupKey]) groups[groupKey] = { label, dateObj: txDate, items: [] };
      groups[groupKey].items.push(tx);
    });

    return Object.values(groups).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [filteredTransactions]);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatTimeOnly = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="apple-white-card p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-cat text-xl text-black flex items-center gap-2">
            <Calendar style={{ width: 20, height: 20, color: '#007AFF' }} strokeWidth={2} />
            Nhật Ký Giao Dịch
          </h2>
          <p className="text-note text-xs mt-0.5">Sắp xếp theo dòng thời gian mới nhất</p>
        </div>
        <span
          className="text-xs font-semibold px-3.5 py-1 rounded-full"
          style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}
        >
          {filteredTransactions.length} giao dịch
        </span>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            style={{ width: 15, height: 15, color: '#86868B', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            strokeWidth={2}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhật ký..."
            style={{
              width: '100%',
              background: 'rgba(118,118,128,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 12,
              paddingLeft: 34,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13,
              color: '#1C1C1E',
              outline: 'none',
            }}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Tag
            style={{ width: 15, height: 15, color: '#86868B', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
            strokeWidth={2}
          />
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(118,118,128,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 12,
              paddingLeft: 34,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13,
              color: '#1C1C1E',
              outline: 'none',
              appearance: 'none',
            }}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'expense' ? 'Chi' : 'Thu'})
              </option>
            ))}
          </select>
        </div>

        {/* Type Toggle */}
        <div className="segment-track">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`segment-btn flex-1 ${selectedType === t ? 'active' : ''}`}
              style={
                selectedType === t && t === 'expense'
                  ? { color: '#FF453A' }
                  : selectedType === t && t === 'income'
                  ? { color: '#32D74B' }
                  : {}
              }
            >
              {t === 'all' ? 'Tất cả' : t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-5">
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <div key={group.label} className="animate-slide-up">
              {/* Date divider */}
              <div className="date-divider">{group.label}</div>

              {/* Transaction items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((tx) => {
                  const cat = categoryMap.get(tx.category_id || '');
                  const isExpense = tx.type === 'expense';
                  const amountColor = isExpense ? '#FF453A' : '#32D74B';

                  return (
                    <div key={tx.id} className="tx-item group">
                      {/* Left: Icon + Text */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <CategoryIcon3D
                          categoryName={cat?.name}
                          iconName={cat?.icon}
                          isExpense={isExpense}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            className="text-cat"
                            style={{ fontSize: 14, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {cat ? cat.name : (isExpense ? 'Chi tiêu' : 'Thu nhập')}
                          </p>
                          <p
                            className="text-note"
                            style={{ fontSize: 12, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {tx.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount + Time + Delete */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <span
                          className="text-amount"
                          style={{ fontSize: 15, color: amountColor }}
                        >
                          {isExpense ? '-' : '+'}{formatVND(tx.amount)}
                        </span>
                        <span className="text-note" style={{ fontSize: 11 }}>
                          {formatTimeOnly(tx.transaction_date)}
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="tx-delete-btn"
                        title="Xóa giao dịch"
                        style={{
                          padding: '6px',
                          borderRadius: '50%',
                          color: '#86868B',
                          flexShrink: 0,
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#FF453A';
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,69,58,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#86868B';
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <Trash2 style={{ width: 15, height: 15 }} strokeWidth={2} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 24px',
              background: 'rgba(118,118,128,0.06)',
              borderRadius: 20,
              border: '1.5px dashed rgba(0,0,0,0.08)',
            }}
          >
            <p className="text-cat" style={{ fontSize: 15, color: '#86868B' }}>
              Chưa có giao dịch phù hợp
            </p>
            <p className="text-note" style={{ fontSize: 13, marginTop: 6 }}>
              Nói hoặc gõ vào ô ở góc dưới để ghi chép!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
