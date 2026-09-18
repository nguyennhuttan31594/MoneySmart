-- ========================================================
-- VOICE-FIRST EXPENSE TRACKER - SUPABASE DATABASE SCHEMA
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE (2-Tier Hierarchy)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT NULL, -- NULL means system default category available to all users
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    icon VARCHAR(100) NOT NULL DEFAULT 'Tag',
    color VARCHAR(50) NOT NULL DEFAULT '#6B7280',
    budget_limit NUMERIC(15, 2) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL, -- VND amounts handled cleanly as integers
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    description TEXT NOT NULL,
    raw_text TEXT, -- Speech input recorded text
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST ANALYTICS QUERY
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- SEED 8 STANDARD EXPENSE & INCOME CATEGORIES
DO $$
DECLARE
    -- Parent IDs
    parent_expense UUID := '10000000-0000-0000-0000-000000000001';
    parent_income  UUID := '20000000-0000-0000-0000-000000000000';
BEGIN

    -- Insert Parent Categories (Tier 1)
    INSERT INTO public.categories (id, user_id, parent_id, name, type, icon, color) VALUES
    (parent_expense, NULL, NULL, 'Chi Tiêu', 'expense', 'ShoppingCart', '#EF4444'),
    (parent_income,  NULL, NULL, 'Thu Nhập', 'income', 'Wallet', '#22C55E')
    ON CONFLICT (id) DO NOTHING;

    -- Insert Child Categories (7 Expense + 1 Income)
    INSERT INTO public.categories (user_id, parent_id, name, type, icon, color, budget_limit) VALUES
    -- 7 Chi Tiêu
    (NULL, parent_expense, 'Ăn uống', 'expense', 'Utensils', '#F97316', 5000000),
    (NULL, parent_expense, 'Di chuyển', 'expense', 'Car', '#3B82F6', 1500000),
    (NULL, parent_expense, 'Hóa đơn & Điện nước', 'expense', 'Zap', '#EAB308', 2000000),
    (NULL, parent_expense, 'Mua sắm/Giải trí', 'expense', 'ShoppingBag', '#F43F5E', 3000000),
    (NULL, parent_expense, 'Sức khỏe', 'expense', 'Stethoscope', '#EC4899', 1000000),
    (NULL, parent_expense, 'Con cái', 'expense', 'HeartPulse', '#8B5CF6', 2000000),
    (NULL, parent_expense, 'Trả nợ', 'expense', 'CreditCard', '#64748B', NULL),

    -- 1 Thu Nhập
    (NULL, parent_income, 'Thu nhập', 'income', 'Wallet', '#22C55E', NULL)
    ON CONFLICT DO NOTHING;

END $$;
