'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '@/lib/types';
import {
  Search,
  Trash2,
  Calendar,
  Tag,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Stethoscope,
  Baby,
  CreditCard,
  Wallet,
  TrendingUp,
  Home,
  GraduationCap,
  Plane,
} from 'lucide-react';

interface TransactionFeedProps {
  transactions: Transaction[];
  categories: Category[];
  onDeleteTransaction: (id: string) => void;
}

const renderCategoryIcon = (categoryName?: string, iconName?: string, isExpense: boolean = true) => {
  const lowerName = (categoryName || '').toLowerCase();
  const lowerIcon = (iconName || '').toLowerCase();

  if (lowerName.includes('ăn uống') || lowerName.includes('cà phê') || lowerName.includes('ăn') || lowerIcon === 'utensils') {
    return <Utensils className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('di chuyển') || lowerName.includes('xăng') || lowerName.includes('xe') || lowerIcon === 'car') {
    return <Car className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('hóa đơn') || lowerName.includes('điện nước') || lowerIcon === 'zap') {
    return <Zap className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('mua sắm') || lowerName.includes('giải trí') || lowerIcon === 'shoppingbag') {
    return <ShoppingBag className="w-5 h-5" strokeWidth={2} />;
  }
  if (
    lowerName.includes('sức khỏe') ||
    lowerName.includes('y tế') ||
    lowerName.includes('bệnh') ||
    lowerIcon === 'stethoscope' ||
    lowerIcon === 'heartpulse'
  ) {
    return <Stethoscope className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('con cái') || lowerName.includes('trẻ em') || lowerIcon === 'baby') {
    return <Baby className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('trả nợ') || lowerName.includes('vay') || lowerIcon === 'creditcard') {
    return <CreditCard className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('học tập') || lowerName.includes('sách') || lowerIcon === 'graduationcap') {
    return <GraduationCap className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('nhà ở') || lowerName.includes('tiền phòng') || lowerIcon === 'home') {
    return <Home className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('du lịch') || lowerIcon === 'plane') {
    return <Plane className="w-5 h-5" strokeWidth={2} />;
  }
  if (lowerName.includes('thu nhập') || lowerName.includes('lương') || !isExpense || lowerIcon === 'wallet') {
    return <Wallet className="w-5 h-5" strokeWidth={2} />;
  }

  return isExpense ? <Tag className="w-5 h-5" strokeWidth={2} /> : <TrendingUp className="w-5 h-5" strokeWidth={2} />;
};

export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  transactions,
  categories,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.raw_text && t.raw_text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCatId === 'all' || t.category_id === selectedCatId;
      const matchesType = selectedType === 'all' || t.type === selectedType;

      return matchesSearch && matchesCat && matchesType;
    });
  }, [transactions, searchQuery, selectedCatId, selectedType]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { label: string; dateObj: Date; items: Transaction[] } } = {};

    const today = new Date();
    const todayStr = today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredTransactions.forEach((tx) => {
      const txDate = new Date(tx.transaction_date);
      const txDateStr = txDate.toDateString();

      let groupKey = txDateStr;
      let label = txDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (txDateStr === todayStr) {
        label = 'Hôm nay';
      } else if (txDateStr === yesterdayStr) {
        label = 'Hôm qua';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { label, dateObj: txDate, items: [] };
      }
      groups[groupKey].items.push(tx);
    });

    return Object.values(groups).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [filteredTransactions]);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="apple-white-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-xl text-black tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#007AFF]" strokeWidth={2} /> Nhật Ký Giao Dịch
          </h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">Sắp xếp theo dòng thời gian mới nhất</p>
        </div>

        <span className="text-xs font-semibold bg-[#F2F2F7] text-[#8E8E93] px-3.5 py-1 rounded-full border border-black/[0.04]">
          {filteredTransactions.length} giao dịch
        </span>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhật ký..."
            className="w-full bg-[#F2F2F7] border border-black/[0.04] rounded-xl pl-9 pr-3 py-2 text-xs text-black placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Tag className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-3" strokeWidth={2} />
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="w-full bg-[#F2F2F7] border border-black/[0.04] rounded-xl pl-9 pr-3 py-2 text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'expense' ? 'Chi' : 'Thu'})
              </option>
            ))}
          </select>
        </div>

        {/* Type Segment Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#E5E5EA] rounded-xl">
          <button
            onClick={() => setSelectedType('all')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
              selectedType === 'all' ? 'bg-white text-black shadow-sm' : 'text-[#8E8E93]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
              selectedType === 'expense' ? 'bg-white text-[#FF3B30] shadow-sm' : 'text-[#8E8E93]'
            }`}
          >
            Chi tiêu
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
              selectedType === 'income' ? 'bg-white text-[#34C759] shadow-sm' : 'text-[#8E8E93]'
            }`}
          >
            Thu nhập
          </button>
        </div>
      </div>

      {/* Date-Grouped Transaction Timeline */}
      <div className="space-y-6">
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">
                  {group.label}
                </span>
                <div className="flex-1 h-[1px] bg-black/[0.05]"></div>
              </div>

              <div className="bg-[#F2F2F7] border border-black/[0.04] rounded-[20px] overflow-hidden divide-y divide-black/[0.04]">
                {group.items.map((tx) => {
                  const cat = categoryMap.get(tx.category_id || '');
                  const isExpense = tx.type === 'expense';

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between bg-white hover:bg-[#F2F2F7]/50 px-4 py-3.5 transition group"
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Category Symbol Icon Container */}
                        <div
                          className="p-2.5 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${cat?.color || (isExpense ? '#FF3B30' : '#34C759')}15`,
                            color: cat?.color || (isExpense ? '#FF3B30' : '#34C759'),
                          }}
                        >
                          {renderCategoryIcon(cat?.name, cat?.icon, isExpense)}
                        </div>

                        <div>
                          {/* Top Line: Category Name (Hạng mục) */}
                          <h4 className="font-semibold text-black text-sm tracking-tight">
                            {cat ? cat.name : (isExpense ? 'Chi tiêu' : 'Thu nhập')}
                          </h4>

                          {/* Bottom Line: Time + Transaction Description/Note (Ẩn hoàn toàn câu thoại giọng nói gốc) */}
                          <div className="flex items-center gap-2 text-xs text-[#8E8E93] font-medium mt-0.5">
                            <span>{formatTimeOnly(tx.transaction_date)}</span>
                            <span>•</span>
                            <span className="text-slate-700 font-normal">{tx.description}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-base font-bold ${
                            isExpense ? 'text-[#FF3B30]' : 'text-[#34C759]'
                          }`}
                        >
                          {isExpense ? '-' : '+'}{formatVND(tx.amount)}
                        </span>

                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#8E8E93] hover:text-[#FF3B30] p-1.5 rounded-full hover:bg-[#F2F2F7] transition"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-[#F2F2F7] rounded-[20px] border border-dashed border-black/[0.06]">
            <p className="text-sm font-semibold text-[#8E8E93]">Chưa có giao dịch phù hợp</p>
            <p className="text-xs text-[#8E8E93] mt-1">Nói hoặc gõ vào ô ở góc dưới màn hình để ghi chép!</p>
          </div>
        )}
      </div>
    </div>
  );
};
