'use client';

import React, { useState } from 'react';
import { Category, TransactionType } from '@/lib/types';
import { Plus, Trash2, FolderPlus, DollarSign, Layers } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (newCategory: Omit<Category, 'id'>) => void;
  onUpdateCategory: (updatedCategory: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState('#007AFF');
  const [budgetLimit, setBudgetLimit] = useState<number | ''>('');

  const parentCategories = categories.filter((c) => c.type === activeTab && !c.parent_id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCategory({
      name: name.trim(),
      type: activeTab,
      parent_id: parentId || (parentCategories[0]?.id || null),
      icon: 'Tag',
      color,
      budget_limit: budgetLimit ? Number(budgetLimit) : null,
    });

    setName('');
    setBudgetLimit('');
    setIsAdding(false);
  };

  const formatVND = (val?: number | null) => {
    if (!val) return 'Chưa đặt hạn mức';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="apple-white-card p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.05] pb-4">
        <div>
          <h2 className="font-semibold text-xl text-black tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#007AFF]" strokeWidth={2} /> Quản Lý Danh Mục
          </h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">Cấu trúc 2 cấp (Nhóm mẹ - Nhóm con) & Hạn mức chi tiêu</p>
        </div>

        {/* Expense vs Income Segment Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#E5E5EA] rounded-xl">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'expense'
                ? 'bg-white text-[#FF3B30] shadow-sm'
                : 'text-[#8E8E93]'
            }`}
          >
            Chi Tiêu
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'income'
                ? 'bg-white text-[#34C759] shadow-sm'
                : 'text-[#8E8E93]'
            }`}
          >
            Thu Nhập
          </button>
        </div>
      </div>

      {/* Add Category Form Banner */}
      {isAdding ? (
        <form onSubmit={handleCreate} className="bg-[#F2F2F7] border border-black/[0.04] rounded-[20px] p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#007AFF] flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4" strokeWidth={2} /> Thêm Danh Mục Con Mới ({activeTab === 'expense' ? 'Chi tiêu' : 'Thu nhập'})
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[#8E8E93] hover:text-black font-medium"
            >
              Hủy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[#8E8E93] mb-1 block">Tên danh mục *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cà phê, Quần áo..."
                className="w-full bg-white border border-black/[0.05] rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] mb-1 block">Thuộc Nhóm Mẹ</label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full bg-white border border-black/[0.05] rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
              >
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'expense' && (
              <div>
                <label className="text-xs font-medium text-[#8E8E93] mb-1 block">Ngân sách tháng (VND)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetLimit ? new Intl.NumberFormat('vi-VN').format(Number(budgetLimit)) : ''}
                  onChange={(e) => {
                    const rawDigits = e.target.value.replace(/\D/g, '');
                    setBudgetLimit(rawDigits ? Number(rawDigits) : '');
                  }}
                  placeholder="VD: 3.000.000"
                  className="w-full bg-white border border-black/[0.05] rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md shadow-[#007AFF]/20"
            >
              Lưu Danh Mục
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setParentId(parentCategories[0]?.id || null);
            setIsAdding(true);
          }}
          className="flex items-center gap-2 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/20 rounded-2xl px-4 py-3 text-sm font-semibold transition w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} /> Thêm danh mục {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'} mới
        </button>
      )}

      {/* Categories Tree Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parentCategories.map((parent) => {
          const children = categories.filter((c) => c.parent_id === parent.id);

          return (
            <div
              key={parent.id}
              className="bg-[#F2F2F7] border border-black/[0.04] rounded-[20px] p-4 space-y-3"
            >
              {/* Parent Category Header */}
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: parent.color }}
                  ></div>
                  <h3 className="font-semibold text-black text-sm">{parent.name}</h3>
                </div>
                <span className="text-[11px] font-semibold bg-white text-[#8E8E93] px-2.5 py-0.5 rounded-full border border-black/[0.04]">
                  {children.length} nhóm con
                </span>
              </div>

              {/* Child Categories List */}
              <div className="space-y-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between bg-white border border-black/[0.04] rounded-xl p-3 transition shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: child.color }}
                        ></span>
                        <span className="text-sm font-semibold text-black">{child.name}</span>
                      </div>
                      {child.type === 'expense' && (
                        <p className="text-xs text-[#8E8E93] font-medium mt-0.5 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[#34C759]" strokeWidth={2} /> Hạn mức: {formatVND(child.budget_limit)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDeleteCategory(child.id)}
                        className="text-[#8E8E93] hover:text-[#FF3B30] p-1.5 rounded-lg hover:bg-[#F2F2F7] transition"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
