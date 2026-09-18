export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  user_id?: string | null;
  parent_id?: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  budget_limit?: number | null;
  created_at?: string;
  children?: Category[];
}

export interface Transaction {
  id: string;
  user_id?: string | null;
  category_id?: string | null;
  category?: Category;
  amount: number; // Bigint in DB, mapped to number in JS
  type: TransactionType;
  description: string;
  raw_text?: string | null;
  transaction_date: string;
  created_at?: string;
}

export interface ParsedVoiceResult {
  amount: number;
  type: TransactionType;
  category_id: string;
  category_name: string;
  description: string;
  transaction_date: string; // YYYY-MM-DD
}

export type AnalyticsTimeframe = 'daily' | 'weekly' | 'monthly';
