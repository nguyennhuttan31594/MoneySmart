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
  const amountColor = isExpense ? '#FF3B30' : '#34C759';
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
      const clamped = Math.max(-88, Math.min(0, dx));
      setSwipeX(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -44) {
      setSwipeX(-88);
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

  const rawNumStr = new Intl.NumberFormat('vi-VN').format(Math.abs(tx.amount));

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${animationDelay}ms`, position: 'relative', overflow: 'hidden' }}
    >
      {/* Swipe action backdrop — 88px wide delete button */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 88,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={handleDelete}
          aria-label="Xóa giao dịch"
          style={{
            background: '#FF3B30',
            color: '#fff',
            borderRadius: 0,
            width: '100%',
            height: '100%',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
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
          background: '#FFFFFF',
        }}
        role="listitem"
      >
        {/* Col 1: Icon — 40px circle */}
        <CategoryIcon
          categoryName={cat?.name}
          iconName={cat?.icon}
          isExpense={isExpense}
          size="md"
        />

        {/* Col 2: Text */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: '-0.43px',
              color: '#000000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
              lineHeight: '22px',
            }}
          >
            {cat?.name ?? (isExpense ? 'Chi tiêu' : 'Thu nhập')}
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 400,
              letterSpacing: '-0.23px',
              color: 'rgba(60, 60, 67, 0.60)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
              lineHeight: '20px',
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
              fontSize: 17,
              fontWeight: 600,
              color: amountColor,
              whiteSpace: 'nowrap',
              margin: 0,
              lineHeight: '22px',
            }}
          >
            {prefix}{rawNumStr}
            <span
              style={{
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(60, 60, 67, 0.45)',
                marginLeft: 3,
                display: 'inline-block',
              }}
            >
              ₫
            </span>
          </p>
        </div>
      </div>

      {/* Inset separator: 16 (pad) + 32 (icon) + 12 (gap) = 60px */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 60,
            right: 0,
            height: '0.5px',
            background: 'rgba(60, 60, 67, 0.20)',
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Header: Title 28px & Pill Count ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            lineHeight: '34px',
            color: '#000000',
            margin: 0,
          }}
        >
          Nhật Ký Giao Dịch
        </h2>
        <div
          style={{
            height: 24,
            padding: '0 10px',
            borderRadius: 9999,
            background: 'rgba(116, 116, 128, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(60, 60, 67, 0.60)',
          }}
        >
          {filteredTransactions.length} giao dịch
        </div>
      </div>

      {/* ── Search bar: 36px, radius 9999, background rgba(118,118,128,0.12) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(118, 118, 128, 0.12)',
          borderRadius: 9999,
          padding: '0 14px',
          height: 36,
          marginBottom: 12,
        }}
      >
        <Search
          style={{ width: 16, height: 16, color: 'rgba(60, 60, 67, 0.45)', flexShrink: 0 }}
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
            color: '#000000',
          }}
        />
      </div>

      {/* ── Segmented control: Full width 100%, height 32px ── */}
      <div style={{ width: '100%', marginBottom: 20 }}>
        <div className="segment-track" style={{ height: 32 }}>
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
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <div key={group.label} className="animate-slide-up" style={{ marginTop: 24 }}>
              {/* Date label: 12px / 600 / uppercase / letter-spacing 0.5px / rgba(60,60,67,0.55) */}
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(60, 60, 67, 0.55)',
                  paddingLeft: 16,
                  marginBottom: 8,
                  margin: '0 0 8px 0',
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
                      animationDelay={idx * 28}
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
