'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Category } from '@/lib/types';
import { Check, X, Calendar, Tag, DollarSign, FileText, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: Category[];
  onSave: (updatedTx: Transaction) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const vibrate = (p: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
};

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  categories,
  onSave,
  onDelete,
  onClose,
}) => {
  const [formData, setFormData] = useState<{
    id: string;
    type: 'expense' | 'income';
    amount: number;
    description: string;
    category_id: string;
    dateStr: string; // YYYY-MM-DD
  } | null>(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const grabberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transaction) {
      const d = new Date(transaction.transaction_date);
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const year = validDate.getFullYear();
      const month = String(validDate.getMonth() + 1).padStart(2, '0');
      const day = String(validDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      setFormData({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id || '',
        dateStr,
      });
      setShowConfirmDelete(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction || !formData) return null;

  const filteredCats = categories.filter((c) => c.type === formData.type && c.parent_id !== null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    vibrate(12);

    // Reconstruct ISO string maintaining hours/mins if available
    let updatedIsoDate: string;
    try {
      const origDate = new Date(transaction.transaction_date);
      const hours = isNaN(origDate.getTime()) ? 12 : origDate.getHours();
      const mins = isNaN(origDate.getTime()) ? 0 : origDate.getMinutes();
      const secs = isNaN(origDate.getTime()) ? 0 : origDate.getSeconds();
      const [y, m, d] = formData.dateStr.split('-').map(Number);
      updatedIsoDate = new Date(y, m - 1, d, hours, mins, secs).toISOString();
    } catch {
      updatedIsoDate = `${formData.dateStr}T12:00:00.000Z`;
    }

    const updatedTx: Transaction = {
      ...transaction,
      type: formData.type,
      amount: formData.amount,
      description: formData.description,
      category_id: formData.category_id,
      transaction_date: updatedIsoDate,
    };

    onSave(updatedTx);
    onClose();
  };

  const handleDelete = () => {
    vibrate([15, 50, 15]);
    onDelete(transaction.id);
    onClose();
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
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Chỉnh sửa giao dịch">
      {/* Backdrop */}
      <div className="sheet-backdrop" onClick={handleClose} />

      {/* Sheet panel */}
      <div
        className="sheet-panel glass-thick"
        style={{ maxWidth: 640, margin: '0 auto' }}
      >
        {/* Grabber */}
        <div className="sheet-grabber" ref={grabberRef} aria-hidden="true" />

        <div style={{ padding: '12px 20px 20px' }}>
          {/* Sheet Header */}
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
                  background: 'color-mix(in srgb, var(--blue) 15%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText style={{ width: 18, height: 18, color: 'var(--blue)' }} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="type-headline" style={{ color: 'var(--label)' }}>
                  Chỉnh Sửa Giao Dịch
                </h2>
                <p className="type-footnote" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>
                  Cập nhật thông tin chi tiết hoặc ngày tháng
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Đóng"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--fill-quaternary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--label-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 15, height: 15 }} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Type toggle */}
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
                { type: 'income' as const, label: 'Thu Nhập', color: 'var(--green)', Icon: ArrowUpCircle },
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
                    border: 'none',
                    cursor: 'pointer',
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
              <p className="type-footnote tabular-num" style={{ color: 'var(--label-tertiary)', marginTop: 4 }}>
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
                placeholder="VD: Mua bách hóa, Tiền điện..."
                required
                aria-label="Mô tả giao dịch"
                style={inputStyle}
              />
            </div>

            {/* Category + Date picker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>
                  <Tag style={{ width: 11, height: 11 }} aria-hidden="true" />
                  Danh mục
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  aria-label="Chọn danh mục"
                  style={inputStyle}
                >
                  {filteredCats.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <Calendar style={{ width: 11, height: 11 }} aria-hidden="true" />
                  Ngày giao dịch
                </label>
                <input
                  type="date"
                  value={formData.dateStr}
                  onChange={(e) => setFormData({ ...formData, dateStr: e.target.value })}
                  required
                  aria-label="Ngày giao dịch"
                  style={{
                    ...inputStyle,
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Actions: Delete button + Cancel button + Save button */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 12,
                borderTop: '0.5px solid var(--separator)',
                marginTop: 4,
              }}
            >
              {showConfirmDelete ? (
                /* Delete confirmation sub-bar */
                <div
                  style={{
                    background: 'rgba(255,59,48,0.10)',
                    border: '1px solid rgba(255,59,48,0.30)',
                    borderRadius: 14,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FF3B30' }}>
                    Xác nhận xóa giao dịch này?
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: 'var(--fill-quaternary)',
                        color: 'var(--label)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: '#FF3B30',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Xóa Luôn
                    </button>
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Delete trigger button */}
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="press-scale"
                  aria-label="Xóa giao dịch"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 59, 48, 0.12)',
                    color: '#FF3B30',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 style={{ width: 20, height: 20 }} strokeWidth={2} />
                </button>

                {/* Cancel button */}
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
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: 48,
                  }}
                >
                  Hủy
                </button>

                {/* Save button */}
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
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: 48,
                  }}
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
