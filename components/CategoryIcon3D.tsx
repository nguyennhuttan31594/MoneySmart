'use client';

import React from 'react';
import {
  Utensils, Car, Zap, ShoppingBag, HeartPulse,
  Baby, CreditCard, Wallet, Tag, TrendingUp,
} from 'lucide-react';

interface CategoryIconProps {
  categoryName?: string;
  iconName?: string;
  isExpense?: boolean;
  size?: 'sm' | 'md';  /* sm=32px (reports), md=40px (transactions) */
}

type IconCfg = {
  color: string;       /* iOS system color for glyph */
  bgAlpha: number;     /* tinted bg alpha */
  Icon: React.ElementType;
};

const getCfg = (name: string, icon: string, isExpense: boolean): IconCfg => {
  const n = name.toLowerCase();
  const ic = icon.toLowerCase();

  if (n.includes('ăn uống') || n.includes('cà phê') || n.includes('ăn') || ic === 'utensils')
    return { color: 'var(--orange)', bgAlpha: 0.12, Icon: Utensils };

  if (n.includes('di chuyển') || n.includes('xăng') || n.includes('xe') || ic === 'car')
    return { color: 'var(--indigo)', bgAlpha: 0.12, Icon: Car };

  if (n.includes('hóa đơn') || n.includes('điện nước') || ic === 'zap')
    return { color: 'var(--purple)', bgAlpha: 0.12, Icon: Zap };

  if (n.includes('mua sắm') || n.includes('giải trí') || ic === 'shoppingbag')
    return { color: 'var(--pink)', bgAlpha: 0.12, Icon: ShoppingBag };

  if (n.includes('sức khỏe') || n.includes('y tế') || n.includes('bệnh') || ic === 'heartpulse' || ic === 'stethoscope')
    return { color: 'var(--red)', bgAlpha: 0.12, Icon: HeartPulse };

  if (n.includes('con cái') || n.includes('trẻ em') || ic === 'baby')
    return { color: 'var(--yellow)', bgAlpha: 0.12, Icon: Baby };

  if (n.includes('trả nợ') || n.includes('vay') || ic === 'creditcard')
    return { color: 'var(--red)', bgAlpha: 0.10, Icon: CreditCard };

  if (!isExpense || n.includes('thu nhập') || n.includes('lương') || ic === 'wallet')
    return { color: 'var(--green)', bgAlpha: 0.12, Icon: Wallet };

  if (n.includes('tiết kiệm') || n.includes('đầu tư'))
    return { color: 'var(--teal)', bgAlpha: 0.12, Icon: TrendingUp };

  return isExpense
    ? { color: 'var(--label-secondary)', bgAlpha: 0.08, Icon: Tag }
    : { color: 'var(--green)', bgAlpha: 0.12, Icon: Wallet };
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName = '',
  iconName = '',
  isExpense = true,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 32 : 40;
  const iconSize = size === 'sm' ? 16 : 20;
  const cfg = getCfg(categoryName, iconName, isExpense);

  return (
    <div
      className="tx-icon flex-shrink-0"
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: cfg.color,  /* using color-mix via opacity on container */
        opacity: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* tinted circle: solid color at low alpha */
        backgroundColor: `color-mix(in srgb, ${cfg.color} ${Math.round(cfg.bgAlpha * 100)}%, transparent)`,
      }}
    >
      <cfg.Icon
        style={{
          width: iconSize,
          height: iconSize,
          color: cfg.color,
          flexShrink: 0,
        }}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </div>
  );
};

/* Legacy name export for backward compat */
export const CategoryIcon3D = CategoryIcon;
