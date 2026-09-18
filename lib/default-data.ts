import { Category, Transaction } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Parent Expenses
  { id: 'cat-p-essential', name: 'Thiết yếu', type: 'expense', icon: 'ShoppingCart', color: '#EF4444', parent_id: null },
  { id: 'cat-p-health', name: 'Phát triển & Sức khỏe', type: 'expense', icon: 'HeartPulse', color: '#10B981', parent_id: null },
  { id: 'cat-p-personal', name: 'Cá nhân & Giải trí', type: 'expense', icon: 'Smile', color: '#8B5CF6', parent_id: null },
  { id: 'cat-p-finance', name: 'Tài chính & Khác', type: 'expense', icon: 'Landmark', color: '#6B7280', parent_id: null },

  // Children Expenses
  { id: 'cat-c-food', parent_id: 'cat-p-essential', name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#F97316', budget_limit: 5000000 },
  { id: 'cat-c-transport', parent_id: 'cat-p-essential', name: 'Xăng xe & Di chuyển', type: 'expense', icon: 'Car', color: '#3B82F6', budget_limit: 1500000 },
  { id: 'cat-c-bills', parent_id: 'cat-p-essential', name: 'Tiền điện nước & Hóa đơn', type: 'expense', icon: 'Zap', color: '#EAB308', budget_limit: 2000000 },
  { id: 'cat-c-housing', parent_id: 'cat-p-essential', name: 'Nhà ở / Tiền phòng', type: 'expense', icon: 'Home', color: '#6366F1', budget_limit: 4000000 },

  { id: 'cat-c-education', parent_id: 'cat-p-health', name: 'Học tập', type: 'expense', icon: 'GraduationCap', color: '#14B8A6', budget_limit: 1000000 },
  { id: 'cat-c-medical', parent_id: 'cat-p-health', name: 'Sức khỏe & Y tế', type: 'expense', icon: 'Stethoscope', color: '#EC4899', budget_limit: 1000000 },

  { id: 'cat-c-shopping', parent_id: 'cat-p-personal', name: 'Mua sắm', type: 'expense', icon: 'ShoppingBag', color: '#F43F5E', budget_limit: 2000000 },
  { id: 'cat-c-entertainment', parent_id: 'cat-p-personal', name: 'Giải trí & Du lịch', type: 'expense', icon: 'Plane', color: '#A855F7', budget_limit: 2000000 },

  { id: 'cat-c-debt', parent_id: 'cat-p-finance', name: 'Vay nợ / Trả nợ', type: 'expense', icon: 'CreditCard', color: '#64748B' },
  { id: 'cat-c-other-exp', parent_id: 'cat-p-finance', name: 'Khác', type: 'expense', icon: 'MoreHorizontal', color: '#94A3B8' },

  // Income Parent & Children
  { id: 'cat-p-income', name: 'Thu nhập', type: 'income', icon: 'Wallet', color: '#22C55E', parent_id: null },
  { id: 'cat-c-salary', parent_id: 'cat-p-income', name: 'Lương', type: 'income', icon: 'Banknote', color: '#10B981' },
  { id: 'cat-c-bonus', parent_id: 'cat-p-income', name: 'Thưởng', type: 'income', icon: 'Gift', color: '#F59E0B' },
  { id: 'cat-c-invest', parent_id: 'cat-p-income', name: 'Đầu tư', type: 'income', icon: 'TrendingUp', color: '#06B6D4' },
  { id: 'cat-c-other-inc', parent_id: 'cat-p-income', name: 'Khác (Thu nhập)', type: 'income', icon: 'Coins', color: '#84CC16' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    category_id: 'cat-c-food',
    amount: 35000,
    type: 'expense',
    description: 'Ăn sáng phở bò',
    raw_text: 'Ăn sáng phở bò 35k',
    transaction_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-2',
    category_id: 'cat-c-food',
    amount: 55000,
    type: 'expense',
    description: 'Cơm trưa văn phòng',
    raw_text: 'Ăn trưa 55k',
    transaction_date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-3',
    category_id: 'cat-c-transport',
    amount: 100000,
    type: 'expense',
    description: 'Đổ xăng xe máy',
    raw_text: 'Đổ xăng 100k',
    transaction_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-4',
    category_id: 'cat-c-bills',
    amount: 450000,
    type: 'expense',
    description: 'Trả tiền điện tháng này',
    raw_text: 'Trả tiền điện 450k',
    transaction_date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-5',
    category_id: 'cat-c-salary',
    amount: 18000000,
    type: 'income',
    description: 'Nhận lương tháng 9',
    raw_text: 'Nhận lương 18 củ',
    transaction_date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
];
