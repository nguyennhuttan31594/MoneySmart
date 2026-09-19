import { Category, Transaction } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Parent Categories (Tier 1)
  { id: 'cat-p-expense', name: 'Chi Tiêu', type: 'expense', icon: 'ShoppingCart', color: '#FF3B30', parent_id: null },
  { id: 'cat-p-income', name: 'Thu Nhập', type: 'income', icon: 'Wallet', color: '#34C759', parent_id: null },

  // Standard Expense Categories (Tier 2) - 8 Distinct Colors
  { id: 'cat-c-food', parent_id: 'cat-p-expense', name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#FF9500', budget_limit: 5000000 },
  { id: 'cat-c-transport', parent_id: 'cat-p-expense', name: 'Di chuyển', type: 'expense', icon: 'Car', color: '#007AFF', budget_limit: 1500000 },
  { id: 'cat-c-bills', parent_id: 'cat-p-expense', name: 'Hóa đơn & Điện nước', type: 'expense', icon: 'Zap', color: '#FFCC00', budget_limit: 2000000 },
  { id: 'cat-c-shopping', parent_id: 'cat-p-expense', name: 'Mua sắm', type: 'expense', icon: 'ShoppingBag', color: '#FF2D55', budget_limit: 3000000 },
  { id: 'cat-c-health', parent_id: 'cat-p-expense', name: 'Sức khỏe & Y tế', type: 'expense', icon: 'Activity', color: '#00C7BE', budget_limit: 1000000 },
  { id: 'cat-c-education', parent_id: 'cat-p-expense', name: 'Giáo dục & Học tập', type: 'expense', icon: 'BookOpen', color: '#5856D6', budget_limit: 2000000 },
  { id: 'cat-c-children', parent_id: 'cat-p-expense', name: 'Con cái', type: 'expense', icon: 'Baby', color: '#AF52DE', budget_limit: 3000000 },
  { id: 'cat-c-entertainment', parent_id: 'cat-p-expense', name: 'Giải trí', type: 'expense', icon: 'Film', color: '#FF3B30', budget_limit: 1000000 },
  { id: 'cat-c-debt', parent_id: 'cat-p-expense', name: 'Trả nợ', type: 'expense', icon: 'CreditCard', color: '#A2845E' },

  // Standard Income Categories (Tier 2)
  { id: 'cat-c-income', parent_id: 'cat-p-income', name: 'Thu nhập', type: 'income', icon: 'Wallet', color: '#34C759' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
