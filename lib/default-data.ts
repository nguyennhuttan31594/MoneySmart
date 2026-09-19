import { Category, Transaction } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Parent Categories (Tier 1)
  { id: 'cat-p-expense', name: 'Chi Tiêu', type: 'expense', icon: 'ShoppingCart', color: '#EF4444', parent_id: null },
  { id: 'cat-p-income', name: 'Thu Nhập', type: 'income', icon: 'Wallet', color: '#22C55E', parent_id: null },

  // 7 Standard Expense Categories (Tier 2)
  { id: 'cat-c-food', parent_id: 'cat-p-expense', name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#F97316', budget_limit: 5000000 },
  { id: 'cat-c-transport', parent_id: 'cat-p-expense', name: 'Di chuyển', type: 'expense', icon: 'Car', color: '#3B82F6', budget_limit: 1500000 },
  { id: 'cat-c-bills', parent_id: 'cat-p-expense', name: 'Hóa đơn & Điện nước', type: 'expense', icon: 'Zap', color: '#EAB308', budget_limit: 2000000 },
  { id: 'cat-c-shopping', parent_id: 'cat-p-expense', name: 'Mua sắm/Giải trí', type: 'expense', icon: 'ShoppingBag', color: '#F43F5E', budget_limit: 3000000 },
  { id: 'cat-c-medical', parent_id: 'cat-p-expense', name: 'Sức khỏe', type: 'expense', icon: 'Stethoscope', color: '#EC4899', budget_limit: 1000000 },
  { id: 'cat-c-children', parent_id: 'cat-p-expense', name: 'Con cái', type: 'expense', icon: 'HeartPulse', color: '#8B5CF6', budget_limit: 2000000 },
  { id: 'cat-c-debt', parent_id: 'cat-p-expense', name: 'Trả nợ', type: 'expense', icon: 'CreditCard', color: '#64748B' },

  // 1 Standard Income Category (Tier 2)
  { id: 'cat-c-income', parent_id: 'cat-p-income', name: 'Thu nhập', type: 'income', icon: 'Wallet', color: '#22C55E' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

