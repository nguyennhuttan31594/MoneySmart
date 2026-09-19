'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Category, AnalyticsTimeframe } from '@/lib/types';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
  AreaChart, Area,
} from 'recharts';
import { Wallet, Banknote, Shield, PieChart as PieIcon, ShieldAlert, BarChart3 } from 'lucide-react';

interface ReportsDashboardProps {
  transactions: Transaction[];
  categories: Category[];
}

/* ── All business logic preserved exactly ──────────────────────── */
export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  transactions,
  categories,
}) => {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('monthly');
  const [thumbIdx, setThumbIdx] = useState(2); // monthly = index 2
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => { setIsMounted(true); }, []);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(Math.abs(val))) + '\u00a0₫';

  const formatShortVND = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return `${val}`;
  };

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  /* ── Unchanged business logic ── */
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
    const totalIncome  = filteredTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);

    const categoryTotals: Record<string, number> = {};
    filteredTxs.filter((t) => t.type === 'expense').forEach((t) => {
      const catId = t.category_id || 'cat-c-other-exp';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.amount);
    });

    /* iOS system colors for pie */
    const iosColors = [
      'var(--orange)', 'var(--blue)', 'var(--indigo)', 'var(--purple)',
      'var(--pink)', 'var(--yellow)', 'var(--red)', 'var(--green)',
    ];
    const iosHex = ['#FF9500','#007AFF','#5856D6','#AF52DE','#FF2D55','#FFCC00','#FF3B30','#34C759'];

    const pieData = Object.entries(categoryTotals).map(([catId, amount], idx) => {
      const cat = categoryMap.get(catId);
      return {
        name: cat?.name ?? 'Khác',
        value: amount,
        color: cat?.color ?? iosHex[idx % iosHex.length],
        percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0,
      };
    });

    const childExpenseCats = categories.filter((c) => c.type === 'expense' && c.parent_id);
    const budgetProgress = childExpenseCats
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
      case 'daily':  return { expense: 'Tổng Chi Tiêu Hôm Nay', income: 'Thu Nhập Hôm Nay' };
      case 'weekly': return { expense: 'Tổng Chi Tiêu Tuần Này', income: 'Thu Nhập Tuần Này' };
      default:       return { expense: 'Tổng Chi Tiêu Tháng Này', income: 'Thu Nhập Tháng Này' };
    }
  };
  const titles = getCardTitles();

  const weeklyBarData = useMemo(() => {
    if (timeframe !== 'weekly') return [];
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const barData = days.map((day) => ({ day, expense: 0, income: 0 }));
    filteredTxs.forEach((t) => {
      let dayIdx = new Date(t.transaction_date).getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;
      if (t.type === 'expense') barData[dayIdx].expense += Number(t.amount);
      else barData[dayIdx].income += Number(t.amount);
    });
    return barData;
  }, [filteredTxs, timeframe]);

  const dailyHourlyData = useMemo(() => {
    if (timeframe !== 'daily') return [];
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, amount: 0 }));
    filteredTxs.forEach((t) => {
      if (t.type === 'expense') hourly[new Date(t.transaction_date).getHours()].amount += Number(t.amount);
    });
    return hourly;
  }, [filteredTxs, timeframe]);

  /* ── Skeleton while hydrating ── */
  if (!isMounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[240, 180, 200].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 20 }} />
        ))}
      </div>
    );
  }

  /* ── Tooltip style — glass-thin */
  const tooltipStyle = {
    background: 'rgba(255,255,255,0.88)',
    border: '0.5px solid rgba(255,255,255,0.55)',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    backdropFilter: 'blur(20px)',
    fontSize: 13,
    fontFamily: 'inherit',
    color: 'var(--label)',
  };

  const segmentOptions = [
    { label: 'Ngày', value: 'daily'   as const },
    { label: 'Tuần', value: 'weekly'  as const },
    { label: 'Tháng', value: 'monthly' as const },
  ];

  const metricCards = [
    {
      label: titles.expense,
      value: periodData.totalExpense,
      colorVar: 'var(--red)',
      hexColor: '#FF3B30',
      Icon: Wallet,
      prefix: '−',
    },
    {
      label: titles.income,
      value: periodData.totalIncome,
      colorVar: 'var(--green)',
      hexColor: '#34C759',
      Icon: Banknote,
      prefix: '+',
    },
    {
      label: 'Thặng Dư Tích Lũy',
      value: periodData.totalIncome - periodData.totalExpense,
      colorVar: 'var(--blue)',
      hexColor: '#007AFF',
      Icon: Shield,
      prefix: '',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header & Segment ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 className="type-title2" style={{ color: 'var(--label)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 style={{ width: 22, height: 22, color: 'var(--blue)', flexShrink: 0 }} strokeWidth={1.8} aria-hidden="true" />
            Phân Tích Báo Cáo
          </h2>
          <p className="type-subhead" style={{ color: 'var(--label-secondary)', marginTop: 2 }}>
            Báo cáo tài chính theo thời gian chọn
          </p>
        </div>

        {/* Segmented control — sliding thumb */}
        <div style={{ position: 'relative' }}>
          <div className="segment-track" style={{ position: 'relative' }}>
            <div
              className="segment-thumb"
              style={{
                left: `calc(${thumbIdx} * (100% / 3) + 2px)`,
                width: 'calc(100% / 3 - 4px)',
              }}
            />
            {segmentOptions.map((opt, idx) => (
              <button
                key={opt.value}
                className={`segment-btn${timeframe === opt.value ? ' active' : ''}`}
                onClick={() => { setThumbIdx(idx); setTimeframe(opt.value); }}
                aria-pressed={timeframe === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Metric Cards — SOLID, not glass ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="card-solid animate-slide-up"
            style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="type-caption" style={{ color: 'var(--label-secondary)' }}>{card.label}</p>
              <div
                style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: `color-mix(in srgb, ${card.hexColor} 12%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.colorVar,
                }}
              >
                <card.Icon style={{ width: 16, height: 16 }} strokeWidth={1.8} aria-hidden="true" />
              </div>
            </div>
            <p
              className="tabular-num"
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.40px',
                color: card.colorVar,
                lineHeight: 1.2,
              }}
            >
              {card.prefix}{formatVND(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts Row — SOLID cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        {/* Donut Chart */}
        <div className="card-solid" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="type-title3" style={{ color: 'var(--label)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieIcon style={{ width: 18, height: 18, color: 'var(--blue)' }} strokeWidth={1.8} aria-hidden="true" />
              Tỷ Lệ Chi Tiêu
            </h3>
            <span
              className="type-footnote"
              style={{
                color: 'var(--blue)',
                background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                padding: '3px 10px',
                borderRadius: 9999,
              }}
            >
              {timeframe === 'daily' ? 'Hôm nay' : timeframe === 'weekly' ? 'Tuần này' : 'Tháng này'}
            </span>
          </div>

          {periodData.pieData.length > 0 ? (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={periodData.pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {periodData.pieData.map((entry: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatVND(val), 'Số tiền']}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, fontFamily: 'inherit' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="type-subhead" style={{ color: 'var(--label-tertiary)' }}>
                Chưa có chi tiêu trong khoảng thời gian này
              </p>
            </div>
          )}
        </div>

        {/* Budget Progress */}
        <div className="card-solid" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="type-title3" style={{ color: 'var(--label)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert style={{ width: 18, height: 18, color: 'var(--orange)' }} strokeWidth={1.8} aria-hidden="true" />
              Tiến Độ Ngân Sách
            </h3>
            <span className="type-footnote" style={{ color: 'var(--label-secondary)' }}>
              {timeframe === 'daily' ? 'Hạn mức Ngày' : timeframe === 'weekly' ? 'Hạn mức Tuần' : 'Hạn mức Tháng'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 240, overflowY: 'auto' }}>
            {periodData.budgetProgress.length > 0 ? (
              periodData.budgetProgress.map((item) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span className="type-subhead" style={{ color: 'var(--label)', fontWeight: 500 }}>{item.name}</span>
                    <span className="type-footnote tabular-num" style={{ color: 'var(--label-secondary)', whiteSpace: 'nowrap' }}>
                      {item.percent}%
                    </span>
                  </div>
                  {/* Track */}
                  <div
                    style={{ width: '100%', height: 6, background: 'var(--fill-quaternary)', borderRadius: 9999, overflow: 'hidden' }}
                    role="progressbar"
                    aria-valuenow={item.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.name}: ${item.percent}%`}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percent}%`,
                        borderRadius: 9999,
                        background: item.percent >= 90
                          ? 'var(--red)'
                          : item.percent >= 70
                          ? 'var(--orange)'
                          : 'var(--green)',
                        transition: 'width 500ms cubic-bezier(0.32,0.72,0,1)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="type-footnote tabular-num" style={{ color: 'var(--label-secondary)' }}>
                      {formatVND(item.spent)}
                    </span>
                    <span className="type-footnote tabular-num" style={{ color: 'var(--label-tertiary)' }}>
                      / {formatVND(item.limit)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <p className="type-subhead" style={{ color: 'var(--label-tertiary)' }}>
                  Chưa cài đặt hạn mức ngân sách
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Weekly Bar Chart ── */}
      {timeframe === 'weekly' && (
        <div className="card-solid animate-fade-in" style={{ padding: 20 }}>
          <h3 className="type-title3" style={{ color: 'var(--label)', marginBottom: 16 }}>
            So Sánh Thu / Chi Theo Tuần
          </h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <XAxis dataKey="day" stroke="var(--label-tertiary)" style={{ fontSize: 12, fontFamily: 'inherit' }} />
                <YAxis tickFormatter={formatShortVND} stroke="var(--label-tertiary)" style={{ fontSize: 12, fontFamily: 'inherit' }} />
                <Tooltip formatter={(val: number) => [formatVND(val)]} contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontFamily: 'inherit' }} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#FF3B30" radius={[6, 6, 0, 0]} />
                <Bar dataKey="income"  name="Thu nhập" fill="#34C759" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Daily Area Chart ── */}
      {timeframe === 'daily' && (
        <div className="card-solid animate-fade-in" style={{ padding: 20 }}>
          <h3 className="type-title3" style={{ color: 'var(--label)', marginBottom: 16 }}>
            Phân Bổ Chi Tiêu Theo Giờ
          </h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <XAxis dataKey="hour" stroke="var(--label-tertiary)" style={{ fontSize: 11, fontFamily: 'inherit' }} />
                <YAxis tickFormatter={formatShortVND} stroke="var(--label-tertiary)" style={{ fontSize: 11, fontFamily: 'inherit' }} />
                <Tooltip formatter={(val: number) => [formatVND(val), 'Chi tiêu']} contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Số tiền chi"
                  stroke="#007AFF"
                  fill="#007AFF"
                  fillOpacity={0.10}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
