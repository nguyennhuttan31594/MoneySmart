'use client';

import React from 'react';
import {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  HeartPulse,
  Baby,
  CreditCard,
  Wallet,
  Tag,
  TrendingUp,
} from 'lucide-react';

interface CategoryIcon3DProps {
  categoryName?: string;
  iconName?: string;
  isExpense?: boolean;
  size?: number;
}

type IconConfig = {
  gradient: string;
  solidColor: string;
  icon: React.ReactNode;
};

const getIconConfig = (categoryName: string, iconName: string, isExpense: boolean): IconConfig => {
  const name = (categoryName || '').toLowerCase();
  const icon = (iconName || '').toLowerCase();

  // --- Chi tiêu categories ---
  if (name.includes('ăn uống') || name.includes('cà phê') || name.includes('ăn') || icon === 'utensils') {
    return {
      gradient: 'linear-gradient(135deg, #FF9F0A 0%, #FF375F 100%)',
      solidColor: '#FF375F',
      icon: <Utensils style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  if (name.includes('di chuyển') || name.includes('xăng') || name.includes('xe') || icon === 'car') {
    return {
      gradient: 'linear-gradient(135deg, #64D2FF 0%, #0A84FF 100%)',
      solidColor: '#0A84FF',
      icon: <Car style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  if (name.includes('hóa đơn') || name.includes('điện nước') || icon === 'zap') {
    return {
      gradient: 'linear-gradient(135deg, #5E5CE6 0%, #5856D6 100%)',
      solidColor: '#5E5CE6',
      icon: <Zap style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  if (name.includes('mua sắm') || name.includes('giải trí') || icon === 'shoppingbag') {
    return {
      gradient: 'linear-gradient(135deg, #BF5AF2 0%, #AF52DE 100%)',
      solidColor: '#BF5AF2',
      icon: <ShoppingBag style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  if (name.includes('sức khỏe') || name.includes('y tế') || name.includes('bệnh') || icon === 'stethoscope' || icon === 'heartpulse') {
    return {
      gradient: 'linear-gradient(135deg, #FF375F 0%, #FF2D55 100%)',
      solidColor: '#FF375F',
      icon: <HeartPulse style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  if (name.includes('con cái') || name.includes('trẻ em') || icon === 'baby') {
    return {
      gradient: 'linear-gradient(135deg, #FFD60A 0%, #FF9F0A 100%)',
      solidColor: '#FF9F0A',
      icon: <Baby style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  if (name.includes('trả nợ') || name.includes('vay') || icon === 'creditcard') {
    return {
      gradient: 'linear-gradient(135deg, #FF6961 0%, #FF453A 100%)',
      solidColor: '#FF453A',
      icon: <CreditCard style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }

  // --- Thu nhập ---
  if (name.includes('thu nhập') || name.includes('lương') || !isExpense || icon === 'wallet') {
    return {
      gradient: 'linear-gradient(135deg, #30D158 0%, #28CD41 100%)',
      solidColor: '#30D158',
      icon: <Wallet style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }

  // Default fallback
  if (isExpense) {
    return {
      gradient: 'linear-gradient(135deg, #8E8E93 0%, #636366 100%)',
      solidColor: '#8E8E93',
      icon: <Tag style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
    };
  }
  return {
    gradient: 'linear-gradient(135deg, #30D158 0%, #28CD41 100%)',
    solidColor: '#30D158',
    icon: <TrendingUp style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />,
  };
};

export const CategoryIcon3D: React.FC<CategoryIcon3DProps> = ({
  categoryName = '',
  iconName = '',
  isExpense = true,
}) => {
  const config = getIconConfig(categoryName, iconName, isExpense);

  return (
    <div
      className="icon-capsule"
      style={{
        background: config.gradient,
        boxShadow: `0 4px 16px ${config.solidColor}44, inset 0 1px 0 rgba(255,255,255,0.35)`,
      }}
    >
      {/* Layer 2: Glyph */}
      <span className="icon-glyph">
        {config.icon}
      </span>
      {/* Layer 3: specular is handled by ::before in CSS */}
    </div>
  );
};
