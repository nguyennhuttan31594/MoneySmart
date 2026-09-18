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
      if (!matchedCat && typeCats.length > 0) {
        matchedCat = typeCats[0];
      }

      setFormData({
        ...parsedData,
        category_id: matchedCat ? matchedCat.id : parsedData.category_id,
        category_name: matchedCat ? matchedCat.name : parsedData.category_name,
      });
    }
  }, [parsedData, categories]);

  if (!isOpen || !formData) return null;

  const filteredCategories = categories.filter(
    (c) => c.type === formData.type && c.parent_id !== null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onConfirm(formData);
    }
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-black/[0.08] w-full max-w-lg rounded-[28px] shadow-[0_24px_48px_rgba(0,0,0,0.16)] overflow-hidden text-slate-900">
        {/* iOS Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#34C759]/10 text-[#34C759]">
              <Check className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">Ghi chép giao dịch AI</h3>
              <p className="text-xs text-slate-500">Xác nhận thông tin từ MoneySmartflow AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* iOS Segmented Control for Expense vs Income */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#E5E5EA]/60 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                const defaultExpCat = categories.find((c) => c.type === 'expense' && c.parent_id);
                setFormData({
                  ...formData,
                  type: 'expense',
                  category_id: defaultExpCat?.id || formData.category_id,
                  category_name: defaultExpCat?.name || formData.category_name,
                });
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition ${
                formData.type === 'expense'
                  ? 'bg-white text-[#FF3B30] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" strokeWidth={2.2} />
              Chi Tiêu
            </button>
            <button
              type="button"
              onClick={() => {
                const defaultIncCat = categories.find((c) => c.type === 'income' && c.parent_id);
                setFormData({
                  ...formData,
                  type: 'income',
                  category_id: defaultIncCat?.id || formData.category_id,
                  category_name: defaultIncCat?.name || formData.category_name,
                });
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition ${
                formData.type === 'income'
                  ? 'bg-white text-[#34C759] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" strokeWidth={2.2} />
              Thu Nhập
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#007AFF]" strokeWidth={2.2} /> Số tiền (VND)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full bg-[#F2F2F7] border border-black/[0.05] rounded-2xl px-4 py-2.5 text-2xl font-black text-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
              required
            />
            <p className="text-xs text-slate-400 font-medium mt-1">{formatVND(formData.amount)}</p>
          </div>

          {/* Description Field */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.2} /> Mô tả / Ghi chú
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#F2F2F7] border border-black/[0.05] rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
              placeholder="VD: Đi ăn cơm tấm, Tiền điện..."
              required
            />
          </div>

          {/* Category Dropdown & Date Picker in 2 cols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Select */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.2} /> Danh mục
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
                className="w-full bg-[#F2F2F7] border border-black/[0.05] rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.2} /> Ngày giao dịch
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full bg-[#F2F2F7] border border-black/[0.05] rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-md shadow-[#007AFF]/20 transition transform active:scale-95"
            >
              Lưu Giao Dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
