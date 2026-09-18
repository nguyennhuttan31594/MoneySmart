'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Category, AnalyticsTimeframe } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Wallet, Banknote, Shield, PieChart as PieIcon, ShieldAlert, BarChart3 } from 'lucide-react';

interface ReportsDashboardProps {
  transactions: Transaction[];
  categories: Category[];
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  transactions,
  categories,
}) => {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('monthly');

  // Formatters
  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatShortVND = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Dynamic filter according to timeframe
  const filteredTxs = useMemo(() => {
    const now = new Date();

    if (timeframe === 'daily') {
      const todayStr = now.toISOString().split('T')[0];
      return transactions.filter((t) => t.transaction_date.startsWith(todayStr));
    }

    if (timeframe === 'weekly') {
      const currentDay = now.getDay();
      const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - distanceToMon);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return transactions.filter((t) => {
        const d = new Date(t.transaction_date);
        return d >= startOfWeek && d <= endOfWeek;
      });
    }

    // Monthly default
    return transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions, timeframe]);

  // Aggregated data for selected timeframe
  const periodData = useMemo(() => {
    const totalExpense = filteredTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = filteredTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Dynamic Donut / Pie Chart data using Apple Pastel colors
    const categoryTotals: Record<string, number> = {};
    filteredTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const catId = t.category_id || 'cat-c-other-exp';
        categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.amount);
      });

    // Apple Pastel Palette
    const iosPastelColors = ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5856D6', '#5AC8FA', '#8E8E93'];

    const pieData = Object.entries(categoryTotals).map(([catId, amount], idx) => {
      const cat = categoryMap.get(catId);
      return {
        name: cat ? cat.name : 'Khác',
        value: amount,
        color: cat ? cat.color : iosPastelColors[idx % iosPastelColors.length],
        percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0,
      };
    });

    // Budget progress bars mapped for current timeframe
    const childExpenseCategories = categories.filter((c) => c.type === 'expense' && c.parent_id);
    const budgetProgress = childExpenseCategories
      .filter((c) => c.budget_limit && c.budget_limit > 0)
      .map((cat) => {
        const spent = categoryTotals[cat.id] || 0;
        let limit = cat.budget_limit || 1;

        if (timeframe === 'daily') limit = Math.round(limit / 30);
        if (timeframe === 'weekly') limit = Math.round(limit / 4);

        const percent = Math.min(100, Math.round((spent / limit) * 100));
        return {
          id: cat.id,
          name: cat.name,
          spent,
          limit,
          percent,
          color: cat.color,
        };
      });

    return { totalExpense, totalIncome, pieData, budgetProgress };
  }, [filteredTxs, categories, categoryMap, timeframe]);

  // Dynamic Card Titles
  const getCardTitles = () => {
    switch (timeframe) {
      case 'daily':
        return { expense: 'Tổng Chi Tiêu Hôm Nay', income: 'Thu Nhập Hôm Nay' };
      case 'weekly':
        return { expense: 'Tổng Chi Tiêu Tuần Này', income: 'Thu Nhập Tuần Này' };
      case 'monthly':
      default:
        return { expense: 'Tổng Chi Tiêu Tháng Này', income: 'Thu Nhập Tháng Này' };
    }
  };

  const titles = getCardTitles();

  // Weekly Bar Chart
  const weeklyBarData = useMemo(() => {
    if (timeframe !== 'weekly') return [];
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const barData = days.map((day) => ({ day, expense: 0, income: 0 }));

    filteredTxs.forEach((t) => {
      const d = new Date(t.transaction_date);
      let dayIdx = d.getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;

      if (t.type === 'expense') {
        barData[dayIdx].expense += Number(t.amount);
      } else {
        barData[dayIdx].income += Number(t.amount);
      }
    });

    return barData;
  }, [filteredTxs, timeframe]);

  // Daily Hourly Chart
  const dailyHourlyData = useMemo(() => {
    if (timeframe !== 'daily') return [];
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      amount: 0,
    }));

    filteredTxs.forEach((t) => {
      if (t.type === 'expense') {
        const hour = new Date(t.transaction_date).getHours();
        hourly[hour].amount += Number(t.amount);
      }
    });

    return hourly;
  }, [filteredTxs, timeframe]);

  return (
    <div className="space-y-6">
      {/* Header & iOS Segment Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-black tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#007AFF]" strokeWidth={2} /> Phân Tích Báo Cáo
          </h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">Báo cáo tài chính theo thời gian chọn</p>
        </div>

        {/* iOS Segmented Controls Group */}
        <div className="flex items-center gap-1 p-1 bg-[#E5E5EA] rounded-xl">
          <button
            onClick={() => setTimeframe('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition ${
              timeframe === 'daily'
                ? 'bg-white text-[#007AFF] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'text-[#8E8E93] font-medium hover:text-black'
            }`}
          >
            Theo Ngày
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition ${
              timeframe === 'weekly'
                ? 'bg-white text-[#007AFF] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'text-[#8E8E93] font-medium hover:text-black'
            }`}
          >
            Theo Tuần
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition ${
              timeframe === 'monthly'
                ? 'bg-white text-[#007AFF] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'text-[#8E8E93] font-medium hover:text-black'
            }`}
          >
            Theo Tháng
          </button>
        </div>
      </div>

      {/* 3 Metrics Cards (Apple Gray Container #F2F2F7, Squircle rounded-[20px]) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Tổng Chi Tiêu */}
        <div className="bg-[#F2F2F7] border border-black/[0.04] rounded-[20px] p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">{titles.expense}</span>
            <div className="p-2 rounded-full bg-[#FF3B30]/10 text-[#FF3B30]">
              <Wallet className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#FF3B30] tracking-tight">
            {formatVND(periodData.totalExpense)}
          </p>
        </div>

        {/* Card 2: Thu Nhập */}
        <div className="bg-[#F2F2F7] border border-black/[0.04] rounded-[20px] p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">{titles.income}</span>
            <div className="p-2 rounded-full bg-[#34C759]/10 text-[#34C759]">
              <Banknote className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#34C759] tracking-tight">
            {formatVND(periodData.totalIncome)}
          </p>
        </div>

        {/* Card 3: Thặng Dư */}
        <div className="bg-[#F2F2F7] border border-black/[0.04] rounded-[20px] p-4.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8E93]">Thặng Dư Tích Lũy</span>
            <div className="p-2 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
              <Shield className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#007AFF] tracking-tight">
            {formatVND(periodData.totalIncome - periodData.totalExpense)}
          </p>
        </div>
      </div>

      {/* Main Charts Row (White Container #FFFFFF, Squircle rounded-[20px], Subtle Shadow) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="apple-white-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xl text-black tracking-tight flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#007AFF]" strokeWidth={2} /> Tỷ Lệ Chi Tiêu
            </h3>
            <span className="text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-full">
              {timeframe === 'daily' ? 'Hôm nay' : timeframe === 'weekly' ? 'Tuần này' : 'Tháng này'}
            </span>
          </div>

          {periodData.pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={periodData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {periodData.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatVND(val)}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-[#8E8E93] text-center py-16 font-medium">Chưa có chi tiêu trong khoảng thời gian này</p>
          )}
        </div>

        {/* Budget Progress Bars */}
        <div className="apple-white-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xl text-black tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FF9500]" strokeWidth={2} /> Tiến Độ Ngân Sách
            </h3>
            <span className="text-xs text-[#8E8E93] font-medium">
              {timeframe === 'daily' ? 'Hạn mức Ngày' : timeframe === 'weekly' ? 'Hạn mức Tuần' : 'Hạn mức Tháng'}
            </span>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {periodData.budgetProgress.length > 0 ? (
              periodData.budgetProgress.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-black">{item.name}</span>
                    <span className="text-[#8E8E93]">
                      {formatVND(item.spent)} / <span className="text-slate-400">{formatVND(item.limit)}</span> ({item.percent}%)
                    </span>
                  </div>
                  {/* Flat iOS Slider Progress Bar (rounded-full h-[6px], bg-[#E5E5EA]) */}
                  <div className="w-full h-[6px] bg-[#E5E5EA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percent >= 90
                          ? 'bg-[#FF3B30]'
                          : item.percent >= 70
                          ? 'bg-[#FF9500]'
                          : 'bg-[#34C759]'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8E8E93] py-16 text-center font-medium">Chưa cài đặt hạn mức ngân sách</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Timeframe Detailed Bar/Area Charts */}
      {timeframe === 'weekly' && (
        <div className="apple-white-card p-5 space-y-4 animate-in fade-in">
          <h3 className="font-semibold text-xl text-black tracking-tight">So Sánh Thu / Chi Theo Tuần</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData}>
                <XAxis dataKey="day" stroke="#8E8E93" />
                <YAxis tickFormatter={(v) => formatShortVND(v)} stroke="#8E8E93" />
                <Tooltip
                  formatter={(val: number) => formatVND(val)}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '16px' }}
                />
                <Legend />
                <Bar dataKey="expense" name="Chi tiêu" fill="#FF3B30" radius={[6, 6, 0, 0]} />
                <Bar dataKey="income" name="Thu nhập" fill="#34C759" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {timeframe === 'daily' && (
        <div className="apple-white-card p-5 space-y-4 animate-in fade-in">
          <h3 className="font-semibold text-xl text-black tracking-tight">Phân Bổ Chi Tiêu Theo Giờ</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHourlyData}>
                <XAxis dataKey="hour" stroke="#8E8E93" />
                <YAxis tickFormatter={(v) => formatShortVND(v)} stroke="#8E8E93" />
                <Tooltip
                  formatter={(val: number) => formatVND(val)}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.06)', borderRadius: '16px' }}
                />
                <Area type="monotone" dataKey="amount" name="Số tiền chi" stroke="#007AFF" fill="#007AFF" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
