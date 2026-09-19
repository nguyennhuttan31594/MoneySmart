'use client';

import React from 'react';
import {
  ForkKnife,
  Motorcycle,
  CarSimple,
  Lightning,
  ShoppingBag,
  Heartbeat,
  Baby,
  CreditCard,
  Wallet,
  Tag,
  TrendUp,
} from '@phosphor-icons/react';

interface CategoryIconProps {
  categoryName?: string;
  iconName?: string;
  isExpense?: boolean;
  size?: 'sm' | 'md';
}

export type CategoryMeta = {
  color: string;
  Icon: React.ElementType;
};

export const CATEGORY_META_MAP: Record<string, CategoryMeta> = {
  'ăn uống': { color: '#FF9500', Icon: ForkKnife },
  'di chuyển': { color: '#5856D6', Icon: Motorcycle },
  'hóa đơn': { color: '#32ADE6', Icon: Lightning },
  'mua sắm': { color: '#FF2D55', Icon: ShoppingBag },
  'sức khỏe': { color: '#FF3B30', Icon: Heartbeat },
  'con cái': { color: '#AF52DE', Icon: Baby },
  'trả nợ': { color: '#A2845E', Icon: CreditCard },
  'thu nhập': { color: '#34C759', Icon: Wallet },
};

export const getCategoryMeta = (name: string, icon: string = '', isExpense: boolean = true): CategoryMeta => {
  const n = (name || '').toLowerCase();
  const ic = (icon || '').toLowerCase();

  if (n.includes('ăn uống') || n.includes('ăn') || n.includes('cà phê') || n.includes('food') || ic.includes('utensil') || ic.includes('food'))
    return CATEGORY_META_MAP['ăn uống'];

  if (n.includes('di chuyển') || n.includes('xăng') || n.includes('xe') || ic.includes('car') || ic.includes('motor'))
    return CATEGORY_META_MAP['di chuyển'];

  if (n.includes('hóa đơn') || n.includes('điện nước') || n.includes('điện') || ic.includes('zap') || ic.includes('lightning'))
    return CATEGORY_META_MAP['hóa đơn'];

  if (n.includes('mua sắm') || n.includes('giải trí') || n.includes('quần áo') || ic.includes('shopping'))
    return CATEGORY_META_MAP['mua sắm'];

  if (n.includes('sức khỏe') || n.includes('y tế') || n.includes('bệnh') || n.includes('thuốc') || ic.includes('heart'))
    return CATEGORY_META_MAP['sức khỏe'];

  if (n.includes('con cái') || n.includes('trẻ em') || n.includes('học phí') || ic.includes('baby'))
    return CATEGORY_META_MAP['con cái'];

  if (n.includes('trả nợ') || n.includes('vay nợ') || n.includes('nợ') || ic.includes('credit'))
    return CATEGORY_META_MAP['trả nợ'];

  if (!isExpense || n.includes('thu nhập') || n.includes('lương') || n.includes('income'))
    return CATEGORY_META_MAP['thu nhập'];

  if (n.includes('tiết kiệm') || n.includes('đầu tư'))
    return { color: '#30B0C7', Icon: TrendUp };

  return isExpense
    ? { color: '#8E8E93', Icon: Tag }
    : CATEGORY_META_MAP['thu nhập'];
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName = '',
  iconName = '',
  isExpense = true,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 28 : 32;
  const iconSize = size === 'sm' ? 14 : 17;
  const meta = getCategoryMeta(categoryName, iconName, isExpense);
  const VAR_COLOR = meta.color;

  return (
    <div
      aria-hidden="true"
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: `linear-gradient(180deg, color-mix(in srgb, ${VAR_COLOR} 88%, white) 0%, ${VAR_COLOR} 100%)`,
        boxShadow: `inset 0 0.5px 0 rgba(255,255,255,0.45), 0 1px 2px color-mix(in srgb, ${VAR_COLOR} 30%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <meta.Icon
        weight="fill"
        style={{ width: iconSize, height: iconSize, color: '#FFFFFF' }}
      />
    </div>
  );
};

/* backward compat export */
export const CategoryIcon3D = CategoryIcon;
