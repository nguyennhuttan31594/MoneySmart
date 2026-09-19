'use client';

import React, { useState, useEffect } from 'react';
import { ParsedVoiceResult, Category } from '@/lib/types';
import { Check, X, Calendar, Tag, DollarSign, FileText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface ParsedPreviewModalProps {
  isOpen: boolean;
  parsedData: ParsedVoiceResult | null;
  categories: Category[];
  onConfirm: (finalData: ParsedVoiceResult) => void;
  onClose: () => void;
}

export const ParsedPreviewModal: React.FC<ParsedPreviewModalProps> = ({
  isOpen,
  parsedData,
  categories,
  onConfirm,
  onClose,
}) => {
  const [formData, setFormData] = useState<ParsedVoiceResult | null>(null);

  useEffect(() => {
    if (parsedData) {
      const typeCats = categories.filter(
        (c) => c.type === parsedData.type && c.parent_id !== null
      );
      let matchedCat = typeCats.find(
        (c) =>
          c.id === parsedData.category_id ||
          c.name.toLowerCase() === (parsedData.category_name || '').toLowerCase()
      );
      if (!matchedCat && typeCats.length > 0) matchedCat = typeCats[0];

      const now = new Date();
      const localTodayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const targetDate =
        parsedData.transaction_date && parsedData.transaction_date.length >= 10
          ? parsedData.transaction_date.substring(0, 10)
          : localTodayYmd;

      setFormData({
        ...parsedData,
        category_id: matchedCat ? matchedCat.id : parsedData.category_id,
        category_name: matchedCat ? matchedCat.name : parsedData.category_name,
        transaction_date: targetDate,
      });
    }
  }, [parsedData, categories]);

  if (!isOpen || !formData) return null;

  const filteredCategories = categories.filter(
    (c) => c.type === formData.type && c.parent_id !== null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) onConfirm(formData);
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  /* ── shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(118,118,128,0.09)',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 14,
    padding: '10px 14px',
    fontSize: 14,
    color: '#1C1C1E',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'box-shadow 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#86868B',
    marginBottom: 6,
  };

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Panel */}
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 24px 64px rgba(0,0,0,0.18)',
          borderRadius: 28,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #30D158 0%, #28CD41 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(48,209,88,0.4), inset 0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <Check style={{ width: 20, height: 20, color: '#fff' }} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-cat" style={{ fontSize: 17, color: '#1C1C1E' }}>Ghi chép giao dịch AI</h3>
              <p className="text-note" style={{ fontSize: 12 }}>Xác nhận thông tin từ MoneySmartflow AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(118,118,128,0.12)',
              color: '#86868B',
              transition: 'background 0.15s',
            }}
          >
            <X style={{ width: 16, height: 16 }} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Expense / Income Toggle */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 4,
              padding: 4,
              background: 'rgba(118,118,128,0.10)',
              borderRadius: 18,
            }}
          >
            {[
              { type: 'expense' as const, label: 'Chi Tiêu', color: '#FF453A', Icon: ArrowDownCircle },
              { type: 'income' as const, label: 'Thu Nhập', color: '#32D74B', Icon: ArrowUpCircle },
            ].map(({ type, label, color, Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  const defaultCat = categories.find((c) => c.type === type && c.parent_id);
                  setFormData({
                    ...formData,
                    type,
                    category_id: defaultCat?.id || formData.category_id,
                    category_name: defaultCat?.name || formData.category_name,
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 0',
                  borderRadius: 14,
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.18s ease',
                  ...(formData.type === type
                    ? {
                        background: 'rgba(255,255,255,0.92)',
                        color,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      }
                    : { color: '#86868B' }),
                }}
              >
                <Icon style={{ width: 15, height: 15 }} strokeWidth={2.2} />
                {label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label style={labelStyle}>
              <DollarSign style={{ width: 13, height: 13, color: '#007AFF' }} strokeWidth={2.2} />
              Số tiền (VND)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.amount ? new Intl.NumberFormat('vi-VN').format(formData.amount) : ''}
              onChange={(e) => {
                const rawDigits = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, amount: rawDigits ? Number(rawDigits) : 0 });
              }}
              placeholder="0"
              required
              style={{
                ...inputStyle,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: formData.type === 'expense' ? '#FF453A' : '#32D74B',
                padding: '10px 16px',
              }}
            />
            <p className="text-note" style={{ fontSize: 12, marginTop: 4 }}>{formatVND(formData.amount)}</p>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>
              <FileText style={{ width: 13, height: 13, color: '#86868B' }} strokeWidth={2.2} />
              Mô tả / Ghi chú
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="VD: Đi ăn cơm tấm, Tiền điện..."
              required
              style={inputStyle}
            />
          </div>

          {/* Category + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>
                <Tag style={{ width: 13, height: 13, color: '#86868B' }} strokeWidth={2.2} />
                Danh mục
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => {
                  const selectedCat = categories.find((c) => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    category_id: e.target.value,
                    category_name: selectedCat ? selectedCat.name : formData.category_name,
                  });
                }}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                <Calendar style={{ width: 13, height: 13, color: '#86868B' }} strokeWidth={2.2} />
                Ngày giao dịch
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                color: '#86868B',
                background: 'rgba(118,118,128,0.1)',
                transition: 'background 0.15s',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)',
                boxShadow: '0 4px 16px rgba(0,122,255,0.35)',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
            >
              Lưu Giao Dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
