'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const TxRow: React.FC<TxRowProps> = ({
  tx,
  cat,
  isLast,
  onDelete,
  animationDelay,
  isOpen,
  onOpen,
  onClose,
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const isExpense = tx.type === 'expense';
  const amountColor = isExpense ? '#FF3B30' : '#34C759';
  const prefix = isExpense ? '−' : '+';

  const currentSwipeX = dragOffset !== null ? dragOffset : (isOpen ? -120 : 0);

  const handleStart = (clientX: number, clientY: number) => {
    setStartX(clientX);
    setStartY(clientY);
    setIsDragging(false);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (startX === null || startY === null) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    // Ignore horizontal swipe if user is scrolling vertically
    if (!isDragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      return;
    }

    if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
      setIsDragging(true);
    }

    if (isDragging || Math.abs(dx) > 6) {
      const basePos = isOpen ? -120 : 0;
      const clamped = Math.max(-120, Math.min(0, basePos + dx));
      setDragOffset(clamped);
    }
  };

  const handleEnd = () => {
    if (startX === null) return;
    if (dragOffset !== null) {
      if (dragOffset < -50) {
        onOpen();
      } else {
        onClose();
      }
    } else if (isOpen) {
      // User tapped on the open row without dragging -> CLOSE IT!
      onClose();
    }
    setStartX(null);
    setStartY(null);
    setIsDragging(false);
    setDragOffset(null);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (isOpen) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate([10, 40, 10]);
    onDelete(tx.id);
  };

  const handleCancelSwipe = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrate(6);
    onClose();
  };

  const rawNumStr = new Intl.NumberFormat('vi-VN').format(Math.abs(tx.amount));

  return (
    <div
      data-tx-id={tx.id}
      className="animate-slide-up"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Swipe action backdrop — 120px wide backdrop with Xóa + Hủy buttons */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 120,
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 1,
        }}
      >
        <button
          onClick={handleCancelSwipe}
          aria-label="Hủy xóa"
          style={{
            background: '#8E8E93',
            color: '#fff',
            borderRadius: 0,
            width: 50,
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Hủy
        </button>
        <button
          onClick={handleDelete}
          aria-label="Xóa giao dịch"
          style={{
            background: '#FF3B30',
            color: '#fff',
            borderRadius: 0,
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Xoá
        </button>
      </div>

      {/* Row content — slides left/right on drag or swipe */}
      <div
        className="tx-row"
        onClick={handleRowClick}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => { if (startX !== null) handleMove(e.clientX, e.clientY); }}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if (startX !== null) handleEnd(); }}
        style={{
          transform: `translateX(${currentSwipeX}px)`,
          transition: isDragging || dragOffset !== null ? 'none' : 'transform 320ms cubic-bezier(0.32,0.72,0,1)',
          background: '#FFFFFF',
          position: 'relative',
          zIndex: 2,
          userSelect: 'none',
          cursor: isOpen ? 'pointer' : 'default',
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
            zIndex: 3,
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
  const [openTxId, setOpenTxId] = useState<string | null>(null);

  // Close open row when clicking anywhere outside
  useEffect(() => {
    if (!openTxId) return;
    const handleOutside = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-tx-id="${openTxId}"]`)) {
        setOpenTxId(null);
      }
    };
    window.addEventListener('touchstart', handleOutside, { passive: true });
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('pointerdown', handleOutside);
    return () => {
      window.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('pointerdown', handleOutside);
    };
  }, [openTxId]);

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
        <h1 className="type-large-title" style={{ color: 'var(--label)' }}>
          Giao Dịch
        </h1>
        <span
          className="type-footnote tabular-num"
          style={{
            color: 'var(--label-tertiary)',
            background: 'var(--fill-quaternary)',
            padding: '2px 10px',
            borderRadius: 9999,
          }}
        >
          {filteredTransactions.length} mục
        </span>
      </div>

      {/* ── Search bar ── */}
      <div
        className="glass-thin"
        style={{
          borderRadius: 14,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
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
                      isOpen={openTxId === tx.id}
                      onOpen={() => setOpenTxId(tx.id)}
                      onClose={() => setOpenTxId(null)}
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
