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
  size?: 'sm' | 'md';
}

/* ── Hard-coded hex so they work in inline styles (no CSS var issues) ── */
type IconCfg = {
  glyphColor: string;   /* icon glyph color */
  bgColor: string;      /* tinted background — rgba hex */
  Icon: React.ElementType;
};

const getCfg = (name: string, icon: string, isExpense: boolean): IconCfg => {
  const n = name.toLowerCase();
  const ic = icon.toLowerCase();

  if (n.includes('ăn uống') || n.includes('ăn') || n.includes('cà phê') || n.includes('food') || ic.includes('utensil'))
    return { glyphColor: '#FF9500', bgColor: 'rgba(255,149,0,0.14)', Icon: Utensils };

  if (n.includes('di chuyển') || n.includes('xăng') || n.includes('xe') || ic.includes('car'))
    return { glyphColor: '#5856D6', bgColor: 'rgba(88,86,214,0.12)', Icon: Car };

  if (n.includes('hóa đơn') || n.includes('điện nước') || n.includes('điện') || ic.includes('zap'))
    return { glyphColor: '#AF52DE', bgColor: 'rgba(175,82,222,0.12)', Icon: Zap };

  if (n.includes('mua sắm') || n.includes('giải trí') || n.includes('quần áo') || ic.includes('shopping'))
    return { glyphColor: '#FF2D55', bgColor: 'rgba(255,45,85,0.12)', Icon: ShoppingBag };

  if (n.includes('sức khỏe') || n.includes('y tế') || n.includes('bệnh') || n.includes('thuốc') || ic.includes('heart'))
    return { glyphColor: '#FF3B30', bgColor: 'rgba(255,59,48,0.12)', Icon: HeartPulse };

  if (n.includes('con cái') || n.includes('trẻ em') || n.includes('học phí') || ic.includes('baby'))
    return { glyphColor: '#FFCC00', bgColor: 'rgba(255,204,0,0.14)', Icon: Baby };

  if (n.includes('trả nợ') || n.includes('vay nợ') || n.includes('nợ') || ic.includes('credit'))
    return { glyphColor: '#FF3B30', bgColor: 'rgba(255,59,48,0.10)', Icon: CreditCard };

  if (!isExpense || n.includes('thu nhập') || n.includes('lương') || n.includes('income'))
    return { glyphColor: '#34C759', bgColor: 'rgba(52,199,89,0.12)', Icon: Wallet };

  if (n.includes('tiết kiệm') || n.includes('đầu tư'))
    return { glyphColor: '#30B0C7', bgColor: 'rgba(48,176,199,0.12)', Icon: TrendingUp };

  /* fallback */
  return isExpense
    ? { glyphColor: '#8E8E93', bgColor: 'rgba(142,142,147,0.10)', Icon: Tag }
    : { glyphColor: '#34C759', bgColor: 'rgba(52,199,89,0.12)', Icon: Wallet };
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName = '',
  iconName = '',
  isExpense = true,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 32 : 40;
  const iconSize = size === 'sm' ? 15 : 19;
  const cfg = getCfg(categoryName, iconName, isExpense);

  return (
    <div
      aria-hidden="true"
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',                 /* tròn 40px */
        backgroundColor: cfg.bgColor,        /* tinted alpha 0.12 */
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <cfg.Icon
        style={{ width: iconSize, height: iconSize, color: cfg.glyphColor }}
        strokeWidth={2.0}
      />
    </div>
  );
};

/* backward compat export */
export const CategoryIcon3D = CategoryIcon;
