'use client';

import React, { useState, useRef } from 'react';
import { Category, TransactionType, VoiceRule } from '@/lib/types';
import { Plus, Trash2, FolderPlus, DollarSign, Layers, Pencil, Check, X, Brain, Mic, Sparkles } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon3D';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (newCategory: Omit<Category, 'id'>) => void;
  onUpdateCategory: (updatedCategory: Category) => void;
  onDeleteCategory: (id: string) => void;
  voiceRules: VoiceRule[];
  onAddVoiceRule: (rule: Omit<VoiceRule, 'id'>) => void;
  onDeleteVoiceRule: (id: string) => void;
}

const vibrate = (p: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  voiceRules,
  onAddVoiceRule,
  onDeleteVoiceRule,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [thumbIdx, setThumbIdx] = useState(0);

  // Add category state
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState('#007AFF');
  const [budgetLimit, setBudgetLimit] = useState<number | ''>('');

  // Edit category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBudgetLimit, setEditBudgetLimit] = useState<number | ''>('');

  // Voice Trainer state
  const [misspokenInput, setMisspokenInput] = useState('');
  const [correctInput, setCorrectInput] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [isRecordingMisspoken, setIsRecordingMisspoken] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  const startEdit = (cat: Category) => {
    vibrate(8);
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditBudgetLimit(cat.budget_limit || '');
  };

  const cancelEdit = () => {
    vibrate(6);
    setEditingCatId(null);
    setEditName('');
    setEditBudgetLimit('');
  };

  const handleSaveEdit = (cat: Category) => {
    if (!editName.trim()) return;
    vibrate(15);
    onUpdateCategory({
      ...cat,
      name: editName.trim(),
      budget_limit: editBudgetLimit !== '' ? Number(editBudgetLimit) : null,
    });
    setEditingCatId(null);
  };

  const formatVND = (val?: number | null) =>
    val ? new Intl.NumberFormat('vi-VN').format(val) + '\u00a0₫' : 'Chưa đặt hạn mức';

  const handleSegment = (idx: number, type: TransactionType) => {
    vibrate(8);
    setThumbIdx(idx);
    setActiveTab(type);
    cancelEdit();
  };

  const handleSaveVoiceRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!misspokenInput.trim() || !correctInput.trim()) return;
    vibrate(15);
    onAddVoiceRule({
      misspoken_phrase: misspokenInput.trim(),
      correct_phrase: correctInput.trim(),
      category_id: selectedCatId || null,
    });
    setMisspokenInput('');
    setCorrectInput('');
    setSelectedCatId('');
  };

  const recordMisspokenVoice = () => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Trình duyệt chưa hỗ trợ thu âm.');
      return;
    }
    if (isRecordingMisspoken) {
      recognitionRef.current?.stop();
      setIsRecordingMisspoken(false);
      return;
    }
    try {
      const r = new SR();
      r.continuous = false;
      r.interimResults = true;
      r.lang = 'vi-VN';
      r.onstart = () => setIsRecordingMisspoken(true);
      r.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        setMisspokenInput(t);
      };
      r.onerror = () => setIsRecordingMisspoken(false);
      r.onend = () => setIsRecordingMisspoken(false);
      recognitionRef.current = r;
      r.start();
    } catch (err) {
      console.error(err);
    }
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
                style={inputStyle}
              />
            </div>

            {parentCategories.length > 0 && (
              <div>
                <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 6 }}>
                  Thuộc nhóm mẹ
                </label>
                <select
                  value={parentId || parentCategories[0]?.id || ''}
                  onChange={(e) => setParentId(e.target.value)}
                  style={inputStyle}
                >
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {activeTab === 'expense' && (
            <div>
              <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 6 }}>
                Hạn mức chi tiêu tháng (VND)
              </label>
              <input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value ? Number(e.target.value) : '')}
                placeholder="VD: 5000000 (Để trống nếu không đặt)"
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            className="press-scale"
            style={{
              alignSelf: 'flex-end',
              padding: '10px 20px',
              borderRadius: 12,
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.23px',
              color: '#fff',
              background: 'var(--blue)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(0,122,255,0.30)',
            }}
          >
            Lưu Danh Mục
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { vibrate(8); setIsAdding(true); }}
          className="press-scale"
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 12,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.23px',
            color: 'var(--blue)',
            background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
            border: 'none',
          }}
        >
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.2} aria-hidden="true" />
          Thêm danh mục {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'}
        </button>
      )}

      {/* Category List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {parentCategories.map((parent) => {
          const children = categories.filter((c) => c.parent_id === parent.id);
          return (
            <div key={parent.id} className="card-solid" style={{ padding: 16 }}>
              {/* Parent Header */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {children.map((child) => (
                  <React.Fragment key={child.id}>
                    {editingCatId === child.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleSaveEdit(child); }}
                        className="animate-slide-up"
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1.5px solid var(--blue)',
                          borderRadius: 14,
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          boxShadow: '0 4px 16px rgba(0,122,255,0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="type-subhead" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                            Chỉnh sửa danh mục
                          </span>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="type-footnote"
                            style={{ color: 'var(--label-secondary)' }}
                          >
                            Hủy
                          </button>
                        </div>

                        <div>
                          <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 4 }}>
                            Tên danh mục *
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            style={inputStyle}
                          />
                        </div>

                        {child.type === 'expense' && (
                          <div>
                            <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 4 }}>
                              Hạn mức chi tiêu hàng tháng (VND)
                            </label>
                            <input
                              type="number"
                              value={editBudgetLimit}
                              onChange={(e) => setEditBudgetLimit(e.target.value ? Number(e.target.value) : '')}
                              placeholder="VD: 5000000"
                              style={inputStyle}
                            />
                            {/* Quick budget presets */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                              {[
                                { label: '1Tr', val: 1000000 },
                                { label: '2Tr', val: 2000000 },
                                { label: '3Tr', val: 3000000 },
                                { label: '5Tr', val: 5000000 },
                                { label: '10Tr', val: 10000000 },
                              ].map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setEditBudgetLimit(p.val)}
                                  className="press-scale"
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    background: editBudgetLimit === p.val ? 'var(--blue)' : 'var(--fill-tertiary)',
                                    color: editBudgetLimit === p.val ? '#fff' : 'var(--label-secondary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {p.label}
                                </button>
                              ))}
                              {editBudgetLimit !== '' && (
                                <button
                                  type="button"
                                  onClick={() => setEditBudgetLimit('')}
                                  className="press-scale"
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(255, 59, 48, 0.12)',
                                    color: 'var(--red)',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Xóa hạn mức
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="press-scale"
                            style={{
                              padding: '8px 14px',
                              borderRadius: 10,
                              background: 'var(--fill-tertiary)',
                              color: 'var(--label-secondary)',
                              fontWeight: 600,
                              fontSize: 13,
                              border: 'none',
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="press-scale"
                            style={{
                              padding: '8px 16px',
                              borderRadius: 10,
                              background: 'var(--blue)',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: 13,
                              border: 'none',
                              boxShadow: '0 2px 8px rgba(0,122,255,0.25)',
                            }}
                          >
                            Lưu Thay Đổi
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => startEdit(child)}
                            aria-label={`Sửa danh mục ${child.name}`}
                            className="press-scale"
                            style={{
                              width: 32, height: 32,
                              borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--blue)',
                              background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Pencil style={{ width: 14, height: 14 }} strokeWidth={2} aria-hidden="true" />
                          </button>

                          <button
                            onClick={() => { vibrate([10, 40, 10]); onDeleteCategory(child.id); }}
                            aria-label={`Xóa danh mục ${child.name}`}
                            className="press-scale"
                            style={{
                              width: 32, height: 32,
                              borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--label-tertiary)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} strokeWidth={2} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
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

      {/* ── STT & Voice Trainer Section ── */}
      <div className="card-solid" style={{ padding: 20, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--purple) 15%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Brain style={{ width: 22, height: 22, color: 'var(--purple)' }} strokeWidth={2} />
          </div>
          <div>
            <h3 className="type-title3" style={{ color: 'var(--label)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Huấn Luyện Giọng Nói AI
              <Sparkles style={{ width: 16, height: 16, color: 'var(--yellow)' }} />
            </h3>
            <p className="type-footnote" style={{ color: 'var(--label-secondary)', marginTop: 1 }}>
              Dạy AI tự động sửa các từ Chrome dịch nhầm thành từ đúng theo ý bạn
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveVoiceRule} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <div>
            <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 4 }}>
              1. Từ Chrome hay nghe nhầm (Bấm 🎤 để đọc thử hoặc gõ tay) *
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={misspokenInput}
                onChange={(e) => setMisspokenInput(e.target.value)}
                placeholder="VD: 100 multiple xanh (hoặc bấm 🎤)"
                required
                style={inputStyle}
              />
              <button
                type="button"
                onClick={recordMisspokenVoice}
                className="press-scale"
                title="Đọc từ nghe nhầm"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: isRecordingMisspoken ? '#FF3B30' : 'var(--purple)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(175,82,222,0.3)',
                }}
              >
                <Mic style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          <div>
            <label className="type-caption" style={{ color: 'var(--label-secondary)', display: 'block', marginBottom: 4 }}>
              2. Từ ĐÚNG bạn muốn ứng dụng quy đổi *
            </label>
            <input
              type="text"
              value={correctInput}
              onChange={(e) => setCorrectInput(e.target.value)}
              placeholder="VD: Bách Hóa Xanh (hoặc mua kính 140k)"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            className="press-scale"
            style={{
              alignSelf: 'flex-end',
              padding: '10px 20px',
              borderRadius: 12,
              background: 'var(--purple)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              border: 'none',
              boxShadow: '0 4px 14px rgba(175, 82, 222, 0.35)',
              cursor: 'pointer',
            }}
          >
            + Lưu Quy Tắc Dạy AI
          </button>
        </form>

        {/* Saved voice rules list */}
        {voiceRules && voiceRules.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="type-caption" style={{ color: 'var(--label-secondary)' }}>
              Danh sách từ đã huấn luyện ({voiceRules.length} từ)
            </p>
            {voiceRules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--fill-quaternary)',
                  padding: '10px 14px',
                  borderRadius: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <span className="type-footnote" style={{ color: '#FF3B30', textDecoration: 'line-through', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    "{rule.misspoken_phrase}"
                  </span>
                  <span style={{ color: 'var(--label-tertiary)', flexShrink: 0 }}>➔</span>
                  <span className="type-subhead" style={{ color: 'var(--green)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    "{rule.correct_phrase}"
                  </span>
                </div>
                <button
                  onClick={() => { vibrate([10, 40, 10]); onDeleteVoiceRule(rule.id); }}
                  aria-label="Xóa quy tắc huấn luyện"
                  className="press-scale"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--label-tertiary)',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
