'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, Category } from '@/lib/types';
import { Search, SlidersHorizontal } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon3D';

interface TransactionFeedProps {
  transactions: Transaction[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
}

/* ── Format helpers ────────────────────────────────────────────── */
const formatVND = (val: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.abs(val)) + '\u00a0₫';

const formatTimeOnly = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/* ── Haptic helper ─────────────────────────────────────────────── */
const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/* ── Single Transaction Row ────────────────────────────────────── */
interface TxRowProps {
  tx: Transaction;
  cat?: Category;
  isLast: boolean;
  onDelete: (id: string) => void;
  animationDelay: number;
}

const TxRow: React.FC<TxRowProps> = ({ tx, cat, isLast, onDelete, animationDelay }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isExpense = tx.type === 'expense';
  const amountColor = isExpense ? 'var(--red)' : 'var(--green)';
  const prefix = isExpense ? '−' : '+';

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const dx = e.touches[0].clientX - startX;
    if (dx < -8) setIsDragging(true);
    if (isDragging) {
      const clamped = Math.max(-120, Math.min(0, dx));
      setSwipeX(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -60) {
      setSwipeX(-120);
    } else {
      setSwipeX(0);
    }
    setStartX(null);
    setIsDragging(false);
  };

  const handleDelete = () => {
    vibrate([10, 40, 10]);
    onDelete(tx.id);
  };

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${animationDelay}ms`, position: 'relative', overflow: 'hidden' }}
    >
      {/* Swipe action backdrop */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingRight: 8,
        }}
      >
        <button
          onClick={handleDelete}
          aria-label="Xóa giao dịch"
          style={{
            background: 'var(--red)',
            color: '#fff',
            borderRadius: 12,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Xoá
        </button>
      </div>

      {/* Row content — slides left on swipe */}
      <div
        className="tx-row"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.32,0.72,0,1)',
          background: 'var(--bg-elevated)',
          /* Remove last separator handled via CSS :not(:last-child) */
        }}
        role="listitem"
      >
        {/* Col 1: Icon */}
        <CategoryIcon
          categoryName={cat?.name}
          iconName={cat?.icon}
          isExpense={isExpense}
          size="md"
        />

        {/* Col 2: Text */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p
            className="type-headline"
            style={{
              color: 'var(--label)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cat?.name ?? (isExpense ? 'Chi tiêu' : 'Thu nhập')}
          </p>
          <p
            className="type-subhead"
            style={{
              color: 'var(--label-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTimeOnly(tx.transaction_date)}
            {tx.description ? ` · ${tx.description}` : ''}
          </p>
        </div>

        {/* Col 3: Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p
            className="tabular-num"
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.23px',
              color: amountColor,
              whiteSpace: 'nowrap',
            }}
          >
            {prefix}{formatVND(tx.amount)}
          </p>
        </div>
      </div>

      {/* Inset separator (CSS handles, but last row needs none) */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 60,
            right: 0,
            height: '0.5px',
            background: 'var(--separator)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────── */
export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  transactions,
  categories,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [thumbIndex, setThumbIndex] = useState(0);

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        (t.raw_text && t.raw_text.toLowerCase().includes(q));
      const matchType = selectedType === 'all' || t.type === selectedType;
      return matchSearch && matchType;
    });
  }, [transactions, searchQuery, selectedType]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { label: string; dateObj: Date; items: Transaction[] } } = {};
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.transaction_date);
      const ds = d.toDateString();
      let label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (ds === todayStr) label = 'Hôm nay';
      else if (ds === yesterdayStr) label = 'Hôm qua';
      if (!groups[ds]) groups[ds] = { label, dateObj: d, items: [] };
      groups[ds].items.push(tx);
    });

    return Object.values(groups).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [filteredTransactions]);

  const handleSegment = useCallback((idx: number, type: typeof selectedType) => {
    vibrate(8);
    setThumbIndex(idx);
    setSelectedType(type);
  }, []);

  const segmentOptions = [
    { label: 'Tất cả', value: 'all' as const },
    { label: 'Chi tiêu', value: 'expense' as const },
    { label: 'Thu nhập', value: 'income' as const },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ paddingTop: 4 }}>
        <h2 className="type-title2" style={{ color: 'var(--label)' }}>
          Nhật Ký Giao Dịch
        </h2>
        <p className="type-subhead" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>
          {filteredTransactions.length} giao dịch
        </p>
      </div>

      {/* ── Search bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--fill-quaternary)',
          borderRadius: 9999,
          padding: '0 14px',
          height: 36,
        }}
      >
        <Search
          style={{ width: 17, height: 17, color: 'var(--label-tertiary)', flexShrink: 0 }}
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm..."
          aria-label="Tìm kiếm giao dịch"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: 17,
            letterSpacing: '-0.43px',
            color: 'var(--label)',
          }}
        />
      </div>

      {/* ── Segmented control ── */}
      <div style={{ position: 'relative', display: 'inline-flex', alignSelf: 'flex-start' }}>
        <div className="segment-track" style={{ position: 'relative' }}>
          {/* Sliding thumb */}
          <div
            className="segment-thumb"
            style={{
              left: `calc(${thumbIndex} * (100% / 3) + 2px)`,
              width: `calc(100% / 3 - 4px)`,
            }}
          />
          {segmentOptions.map((opt, idx) => (
            <button
              key={opt.value}
              className={`segment-btn${selectedType === opt.value ? ' active' : ''}`}
              onClick={() => handleSegment(idx, opt.value)}
              aria-pressed={selectedType === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grouped Transaction List ── */}
      <div
        className="stagger-list"
        role="list"
        style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
      >
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <div key={group.label} className="animate-slide-up">
              {/* Date label */}
              <p
                className="type-caption"
                style={{
                  color: 'var(--label-secondary)',
                  paddingLeft: 16,
                  marginBottom: 8,
                }}
              >
                {group.label}
              </p>

              {/* Solid card — NOT glass */}
              <div className="card-solid" role="list">
                {group.items.map((tx, idx) => {
                  const cat = categoryMap.get(tx.category_id || '');
                  return (
                    <TxRow
                      key={tx.id}
                      tx={tx}
                      cat={cat}
                      isLast={idx === group.items.length - 1}
                      onDelete={onDeleteTransaction}
                      animationDelay={idx * 30}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          /* Empty state */
          <div className="empty-state">
            <div style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: 'var(--fill-quaternary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}>
              <SlidersHorizontal
                style={{ width: 28, height: 28, color: 'var(--label-tertiary)' }}
                strokeWidth={1.5}
              />
            </div>
            <p className="type-title3" style={{ color: 'var(--label)' }}>
              Chưa có giao dịch
            </p>
            <p className="type-body" style={{ color: 'var(--label-secondary)', maxWidth: 260 }}>
              Nói hoặc gõ vào ô bên dưới để bắt đầu ghi chép thu chi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
