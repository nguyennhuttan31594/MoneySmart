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
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatShortVND = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

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
    return transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions, timeframe]);

  const periodData = useMemo(() => {
    const totalExpense = filteredTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = filteredTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);

    const categoryTotals: Record<string, number> = {};
    filteredTxs.filter((t) => t.type === 'expense').forEach((t) => {
      const catId = t.category_id || 'cat-c-other-exp';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.amount);
    });

    const liquidColors = ['#FF9F0A', '#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F', '#FFD60A', '#FF453A', '#30D158'];
    const pieData = Object.entries(categoryTotals).map(([catId, amount], idx) => {
      const cat = categoryMap.get(catId);
      return {
        name: cat ? cat.name : 'Khác',
        value: amount,
        color: cat ? cat.color : liquidColors[idx % liquidColors.length],
        percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0,
      };
    });

    const childExpenseCategories = categories.filter((c) => c.type === 'expense' && c.parent_id);
    const budgetProgress = childExpenseCategories
      .filter((c) => c.budget_limit && c.budget_limit > 0)
      .map((cat) => {
        const spent = categoryTotals[cat.id] || 0;
        let limit = cat.budget_limit || 1;
        if (timeframe === 'daily') limit = Math.round(limit / 30);
        if (timeframe === 'weekly') limit = Math.round(limit / 4);
        const percent = Math.min(100, Math.round((spent / limit) * 100));
        return { id: cat.id, name: cat.name, spent, limit, percent, color: cat.color };
      });

    return { totalExpense, totalIncome, pieData, budgetProgress };
  }, [filteredTxs, categories, categoryMap, timeframe]);

  const getCardTitles = () => {
    switch (timeframe) {
      case 'daily': return { expense: 'Tổng Chi Tiêu Hôm Nay', income: 'Thu Nhập Hôm Nay' };
      case 'weekly': return { expense: 'Tổng Chi Tiêu Tuần Này', income: 'Thu Nhập Tuần Này' };
      default: return { expense: 'Tổng Chi Tiêu Tháng Này', income: 'Thu Nhập Tháng Này' };
    }
  };
  const titles = getCardTitles();

  const weeklyBarData = useMemo(() => {
    if (timeframe !== 'weekly') return [];
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const barData = days.map((day) => ({ day, expense: 0, income: 0 }));
    filteredTxs.forEach((t) => {
      const d = new Date(t.transaction_date);
      let dayIdx = d.getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;
      if (t.type === 'expense') barData[dayIdx].expense += Number(t.amount);
      else barData[dayIdx].income += Number(t.amount);
    });
    return barData;
  }, [filteredTxs, timeframe]);

  const dailyHourlyData = useMemo(() => {
    if (timeframe !== 'daily') return [];
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00`, amount: 0 }));
    filteredTxs.forEach((t) => {
      if (t.type === 'expense') {
        const hour = new Date(t.transaction_date).getHours();
        hourly[hour].amount += Number(t.amount);
      }
    });
    return hourly;
  }, [filteredTxs, timeframe]);

  if (!isMounted) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#86868B', fontWeight: 500 }}>
        Đang tải báo cáo...
      </div>
    );
  }

  const glassTooltipStyle = {
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Segment Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 className="text-cat" style={{ fontSize: 20, color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 style={{ width: 20, height: 20, color: '#007AFF' }} strokeWidth={2} />
            Phân Tích Báo Cáo
          </h2>
          <p className="text-note" style={{ fontSize: 12, marginTop: 3 }}>Báo cáo tài chính theo thời gian chọn</p>
        </div>

        <div className="segment-track">
          {(['daily', 'weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`segment-btn ${timeframe === t ? 'active' : ''}`}
            >
              {t === 'daily' ? 'Theo Ngày' : t === 'weekly' ? 'Theo Tuần' : 'Theo Tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: titles.expense, value: periodData.totalExpense, color: '#FF453A', icon: <Wallet style={{ width: 16, height: 16 }} strokeWidth={2} /> },
          { label: titles.income, value: periodData.totalIncome, color: '#32D74B', icon: <Banknote style={{ width: 16, height: 16 }} strokeWidth={2} /> },
          { label: 'Thặng Dư Tích Lũy', value: periodData.totalIncome - periodData.totalExpense, color: '#007AFF', icon: <Shield style={{ width: 16, height: 16 }} strokeWidth={2} /> },
        ].map((card) => (
          <div
            key={card.label}
            className="liquid-glass animate-slide-up"
            style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="text-note" style={{ fontSize: 12 }}>{card.label}</span>
              <div style={{
                padding: 8, borderRadius: '50%',
                background: `${card.color}18`,
                color: card.color,
              }}>
                {card.icon}
              </div>
            </div>
            <p className="text-amount" style={{ fontSize: 22, color: card.color }}>
              {formatVND(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Donut Chart */}
        <div className="apple-white-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="text-cat" style={{ fontSize: 18, color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieIcon style={{ width: 18, height: 18, color: '#007AFF' }} strokeWidth={2} />
              Tỷ Lệ Chi Tiêu
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(0,122,255,0.1)', color: '#007AFF', padding: '3px 10px', borderRadius: 99 }}>
              {timeframe === 'daily' ? 'Hôm nay' : timeframe === 'weekly' ? 'Tuần này' : 'Tháng này'}
            </span>
          </div>
          {periodData.pieData.length > 0 ? (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={periodData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {periodData.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatVND(val)} contentStyle={glassTooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-note" style={{ textAlign: 'center', padding: '56px 0', fontSize: 13 }}>
              Chưa có chi tiêu trong khoảng thời gian này
            </p>
          )}
        </div>

        {/* Budget Progress */}
        <div className="apple-white-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="text-cat" style={{ fontSize: 18, color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert style={{ width: 18, height: 18, color: '#FF9F0A' }} strokeWidth={2} />
              Tiến Độ Ngân Sách
            </h3>
            <span className="text-note" style={{ fontSize: 12 }}>
              {timeframe === 'daily' ? 'Hạn mức Ngày' : timeframe === 'weekly' ? 'Hạn mức Tuần' : 'Hạn mức Tháng'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 240, overflowY: 'auto' }}>
            {periodData.budgetProgress.length > 0 ? (
              periodData.budgetProgress.map((item) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-cat" style={{ fontSize: 13, color: '#1C1C1E' }}>{item.name}</span>
                    <span className="text-note" style={{ fontSize: 12 }}>
                      {formatVND(item.spent)} / {formatVND(item.limit)} ({item.percent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#E5E5EA', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percent}%`,
                        borderRadius: 9999,
                        background: item.percent >= 90 ? '#FF453A' : item.percent >= 70 ? '#FF9F0A' : '#32D74B',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-note" style={{ textAlign: 'center', padding: '56px 0', fontSize: 13 }}>
                Chưa cài đặt hạn mức ngân sách
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      {timeframe === 'weekly' && (
        <div className="apple-white-card animate-fade-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="text-cat" style={{ fontSize: 18, color: '#1C1C1E' }}>So Sánh Thu / Chi Theo Tuần</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData}>
                <XAxis dataKey="day" stroke="#86868B" style={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatShortVND(v)} stroke="#86868B" style={{ fontSize: 12 }} />
                <Tooltip formatter={(val: number) => formatVND(val)} contentStyle={glassTooltipStyle} />
                <Legend />
                <Bar dataKey="expense" name="Chi tiêu" fill="#FF453A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="income" name="Thu nhập" fill="#32D74B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Area Chart */}
      {timeframe === 'daily' && (
        <div className="apple-white-card animate-fade-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="text-cat" style={{ fontSize: 18, color: '#1C1C1E' }}>Phân Bổ Chi Tiêu Theo Giờ</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHourlyData}>
                <XAxis dataKey="hour" stroke="#86868B" style={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatShortVND(v)} stroke="#86868B" style={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number) => formatVND(val)} contentStyle={glassTooltipStyle} />
                <Area type="monotone" dataKey="amount" name="Số tiền chi" stroke="#007AFF" fill="#007AFF" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
