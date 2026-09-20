'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ParsedVoiceResult, Category } from '@/lib/types';
import { Check, X, Calendar, Tag, DollarSign, FileText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface ParsedPreviewModalProps {
  isOpen: boolean;
  parsedData: ParsedVoiceResult | null;
  categories: Category[];
  onConfirm: (finalData: ParsedVoiceResult) => void;
  onClose: () => void;
}

const vibrate = (p: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
};

export const ParsedPreviewModal: React.FC<ParsedPreviewModalProps> = ({
  isOpen,
  parsedData,
  categories,
  onConfirm,
  onClose,
}) => {
  const [formData, setFormData] = useState<ParsedVoiceResult | null>(null);
  const grabberRef = useRef<HTMLDivElement>(null);

  const activeData = React.useMemo(() => {
    if (!parsedData) return null;
    const typeCats = categories.filter((c) => c.type === parsedData.type && c.parent_id !== null);
    let matchedCat = typeCats.find(
      (c) =>
        c.id === parsedData.category_id ||
        c.name.toLowerCase() === (parsedData.category_name || '').toLowerCase()
    );
    if (!matchedCat && typeCats.length > 0) matchedCat = typeCats[0];

    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const targetDate =
      parsedData.transaction_date && parsedData.transaction_date.length >= 10
        ? parsedData.transaction_date.substring(0, 10)
        : localToday;

    return {
      ...parsedData,
      category_id: matchedCat ? matchedCat.id : parsedData.category_id,
      category_name: matchedCat ? matchedCat.name : parsedData.category_name,
      transaction_date: targetDate,
    };
  }, [parsedData, categories]);

  useEffect(() => {
    if (activeData) {
      setFormData(activeData);
    }
  }, [activeData]);

  const currentData = formData || activeData;

  if (!isOpen || !currentData) return null;

  const filteredCats = categories.filter((c) => c.type === currentData.type && c.parent_id !== null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      vibrate(15);
      onConfirm(formData);
    }
  };

  const handleClose = () => {
    vibrate(8);
    onClose();
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.abs(val)) + '\u00a0₫';

  /* ── Shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--fill-quaternary)',
    border: 'none',
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 15,
    letterSpacing: '-0.23px',
    color: 'var(--label)',
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'var(--label-secondary)',
    marginBottom: 6,
  };

  return (
    /* ── Overlay ── */
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Ghi chép giao dịch">
      {/* Backdrop */}
      <div className="sheet-backdrop" onClick={handleClose} />

      {/* Nền phía sau scale xuống (stacked card iOS effect) */}
      {/* handled via CSS on body when open */}

      {/* Sheet panel — .glass-thick, slides from bottom */}
      <div
        className="sheet-panel glass-thick"
        style={{ maxWidth: 640, margin: '0 auto' }}
      >
        {/* Grabber */}
        <div className="sheet-grabber" ref={grabberRef} aria-hidden="true" />

        {/* Content */}
        <div style={{ padding: '12px 20px 20px' }}>
          {/* Sheet header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'color-mix(in srgb, var(--green) 15%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check style={{ width: 18, height: 18, color: 'var(--green)' }} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="type-headline" style={{ color: 'var(--label)' }}>
                  Ghi chép giao dịch AI
                </h2>
                <p className="type-footnote" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>
                  Xác nhận từ MoneySmartflow AI
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Đóng"
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'var(--fill-quaternary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--label-secondary)',
              }}
            >
              <X style={{ width: 15, height: 15 }} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Expense / Income Toggle */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
                padding: 4,
                background: 'var(--fill-quaternary)',
                borderRadius: 18,
              }}
            >
              {[
                { type: 'expense' as const, label: 'Chi Tiêu', color: 'var(--red)', Icon: ArrowDownCircle },
                { type: 'income'  as const, label: 'Thu Nhập', color: 'var(--green)', Icon: ArrowUpCircle },
              ].map(({ type, label, color, Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const def = categories.find((c) => c.type === type && c.parent_id);
                    setFormData({
                      ...formData,
                      type,
                      category_id: def?.id || formData.category_id,
                      category_name: def?.name || formData.category_name,
                    });
                  }}
                  aria-pressed={formData.type === type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 14,
                    fontFamily: 'inherit',
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: '-0.23px',
                    transition: 'all 280ms cubic-bezier(0.25,1.5,0.5,1)',
                    ...(formData.type === type
                      ? { background: 'var(--bg-elevated)', color, boxShadow: '0 3px 8px rgba(0,0,0,0.10)' }
                      : { color: 'var(--label-secondary)' }),
                  }}
                >
                  <Icon style={{ width: 15, height: 15 }} strokeWidth={2} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label style={labelStyle}>
                <DollarSign style={{ width: 11, height: 11 }} aria-hidden="true" />
                Số tiền (VND)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.amount ? new Intl.NumberFormat('vi-VN').format(formData.amount) : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, amount: digits ? Number(digits) : 0 });
                }}
                placeholder="0"
                required
                aria-label="Số tiền"
                style={{
                  ...inputStyle,
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: formData.type === 'expense' ? 'var(--red)' : 'var(--green)',
                  fontVariantNumeric: 'tabular-nums',
                  padding: '12px 16px',
                }}
              />
              <p
                className="type-footnote tabular-num"
                style={{ color: 'var(--label-tertiary)', marginTop: 4 }}
              >
                {formatVND(formData.amount)}
              </p>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>
                <FileText style={{ width: 11, height: 11 }} aria-hidden="true" />
                Mô tả / Ghi chú
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="VD: Đi ăn cơm tấm, Tiền điện..."
                required
                aria-label="Mô tả giao dịch"
                style={inputStyle}
              />
            </div>

            {/* Category + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>
                  <Tag style={{ width: 11, height: 11 }} aria-hidden="true" />
                  Danh mục
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      category_id: e.target.value,
                      category_name: cat?.name || formData.category_name,
                    });
                  }}
                  aria-label="Chọn danh mục"
                  style={inputStyle}
                >
                  {filteredCats.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <Calendar style={{ width: 11, height: 11 }} aria-hidden="true" />
                  Ngày
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                  aria-label="Ngày giao dịch"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                paddingTop: 8,
                borderTop: '0.5px solid var(--separator)',
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="press-scale"
                style={{
                  flex: 1,
                  padding: '13px 0',
                  borderRadius: 14,
                  fontFamily: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '-0.23px',
                  color: 'var(--label-secondary)',
                  background: 'var(--fill-quaternary)',
                  minHeight: 44,
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="press-scale"
                style={{
                  flex: 2,
                  padding: '13px 0',
                  borderRadius: 14,
                  fontFamily: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '-0.23px',
                  color: '#fff',
                  background: 'var(--blue)',
                  boxShadow: '0 4px 16px rgba(0,122,255,0.30)',
                  minHeight: 44,
                }}
              >
                Lưu Giao Dịch
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
