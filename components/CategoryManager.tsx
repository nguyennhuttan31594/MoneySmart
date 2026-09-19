'use client';

import React, { useState } from 'react';
import { Category, TransactionType } from '@/lib/types';
import { Plus, Trash2, FolderPlus, DollarSign, Layers } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon3D';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (newCategory: Omit<Category, 'id'>) => void;
  onUpdateCategory: (updatedCategory: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const vibrate = (p: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [thumbIdx, setThumbIdx] = useState(0);

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState('#007AFF');
  const [budgetLimit, setBudgetLimit] = useState<number | ''>('');

  const parentCategories = categories.filter((c) => c.type === activeTab && !c.parent_id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    vibrate(15);
    onAddCategory({
      name: name.trim(),
      type: activeTab,
      parent_id: parentId || (parentCategories[0]?.id || null),
      icon: 'Tag',
      color,
      budget_limit: budgetLimit ? Number(budgetLimit) : null,
    });
    setName(''); setBudgetLimit(''); setIsAdding(false);
  };

  const formatVND = (val?: number | null) =>
    val ? new Intl.NumberFormat('vi-VN').format(val) + '\u00a0₫' : 'Chưa đặt hạn mức';

  const handleSegment = (idx: number, type: TransactionType) => {
    vibrate(8);
    setThumbIdx(idx);
    setActiveTab(type);
  };

  /* ── Shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--fill-quaternary)',
    border: 'none',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 15,
    letterSpacing: '-0.23px',
    color: 'var(--label)',
    outline: 'none',
    fontFamily: 'inherit',
    appearance: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 className="type-title2" style={{ color: 'var(--label)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers style={{ width: 22, height: 22, color: 'var(--blue)', flexShrink: 0 }} strokeWidth={1.8} aria-hidden="true" />
          Quản Lý Danh Mục
        </h2>
        <p className="type-subhead" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>
          Cấu trúc 2 cấp (Nhóm mẹ - Nhóm con) &amp; Hạn mức chi tiêu
        </p>
      </div>

      {/* Segmented control */}
      <div style={{ alignSelf: 'flex-start', position: 'relative' }}>
        <div className="segment-track" style={{ position: 'relative' }}>
          <div
            className="segment-thumb"
            style={{
              left: `calc(${thumbIdx} * 50% + 2px)`,
              width: 'calc(50% - 4px)',
            }}
          />
          {[
            { label: 'Chi Tiêu', value: 'expense' as TransactionType },
            { label: 'Thu Nhập', value: 'income' as TransactionType },
          ].map((opt, idx) => (
            <button
              key={opt.value}
              className={`segment-btn${activeTab === opt.value ? ' active' : ''}`}
              style={{ minWidth: 100 }}
              onClick={() => handleSegment(idx, opt.value)}
              aria-pressed={activeTab === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add form or Add button */}
      {isAdding ? (
        <form
          onSubmit={handleCreate}
          className="card-solid animate-slide-up"
          style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3
              className="type-headline"
              style={{ color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FolderPlus style={{ width: 16, height: 16 }} strokeWidth={2} aria-hidden="true" />
              Thêm Danh Mục ({activeTab === 'expense' ? 'Chi tiêu' : 'Thu nhập'})
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              aria-label="Hủy thêm danh mục"
              className="type-footnote"
              style={{ color: 'var(--label-secondary)' }}
            >
              Hủy
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div>
              <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 6 }}>
                Tên danh mục *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cà phê, Quần áo..."
                required
                aria-label="Tên danh mục"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 6 }}>
                Thuộc Nhóm Mẹ
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                aria-label="Chọn nhóm mẹ"
                style={inputStyle}
              >
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {activeTab === 'expense' && (
              <div>
                <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 6 }}>
                  Ngân sách tháng (VND)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetLimit ? new Intl.NumberFormat('vi-VN').format(Number(budgetLimit)) : ''}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '');
                    setBudgetLimit(d ? Number(d) : '');
                  }}
                  placeholder="VD: 3.000.000"
                  aria-label="Ngân sách tháng"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="press-scale"
              aria-label="Lưu danh mục"
              style={{
                padding: '10px 24px',
                borderRadius: 9999,
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--blue)',
                boxShadow: '0 4px 12px rgba(0,122,255,0.28)',
                minHeight: 44,
              }}
            >
              Lưu Danh Mục
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => { setParentId(parentCategories[0]?.id || null); setIsAdding(true); }}
          className="press-scale"
          aria-label={`Thêm danh mục ${activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'} mới`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
            color: 'var(--blue)',
            borderRadius: 14,
            padding: '12px 16px',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            width: 'fit-content',
            minHeight: 44,
          }}
        >
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.2} aria-hidden="true" />
          Thêm danh mục {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'} mới
        </button>
      )}

      {/* Category tree */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {parentCategories.map((parent) => {
          const children = categories.filter((c) => c.parent_id === parent.id);
          return (
            <div key={parent.id} className="card-solid" style={{ padding: 16 }}>
              {/* Parent header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottom: '0.5px solid var(--separator)',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: parent.color, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span className="type-headline" style={{ color: 'var(--label)' }}>{parent.name}</span>
                </div>
                <span
                  className="type-footnote"
                  style={{
                    color: 'var(--label-secondary)',
                    background: 'var(--fill-quaternary)',
                    padding: '2px 8px',
                    borderRadius: 9999,
                  }}
                >
                  {children.length} nhóm con
                </span>
              </div>

              {/* Children */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {children.map((child) => (
                  <div
                    key={child.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--fill-quaternary)',
                      borderRadius: 10,
                      padding: '10px 12px',
                    }}
                    role="listitem"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CategoryIcon categoryName={child.name} iconName={child.icon} size="sm" />
                        <span className="type-subhead" style={{ color: 'var(--label)', fontWeight: 500 }}>
                          {child.name}
                        </span>
                      </div>
                      {child.type === 'expense' && (
                        <p className="type-footnote" style={{ color: 'var(--label-secondary)', marginTop: 2, paddingLeft: 14 }}>
                          Hạn mức: {formatVND(child.budget_limit)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => { vibrate([10, 40, 10]); onDeleteCategory(child.id); }}
                      aria-label={`Xóa danh mục ${child.name}`}
                      className="press-scale"
                      style={{
                        width: 32, height: 32,
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--label-tertiary)',
                        minHeight: 44,
                        minWidth: 44,
                      }}
                    >
                      <Trash2 style={{ width: 15, height: 15 }} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {children.length === 0 && (
                  <p className="type-footnote" style={{ color: 'var(--label-tertiary)', padding: '8px 0', textAlign: 'center' }}>
                    Chưa có nhóm con
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
