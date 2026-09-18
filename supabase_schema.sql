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

-- SEED DEFAULT EXPENSE & INCOME CATEGORIES
DO $$
DECLARE
    -- Parent Expense IDs
    parent_essential UUID := '10000000-0000-0000-0000-000000000001';
    parent_health UUID    := '10000000-0000-0000-0000-000000000002';
    parent_personal UUID  := '10000000-0000-0000-0000-000000000003';
    parent_finance UUID   := '10000000-0000-0000-0000-000000000004';
    
    -- Parent Income IDs
    parent_income UUID    := '20000000-0000-0000-0000-000000000000';
BEGIN

    -- Insert Parent Categories (Tier 1)
    INSERT INTO public.categories (id, user_id, parent_id, name, type, icon, color) VALUES
    (parent_essential, NULL, NULL, 'Thiết yếu', 'expense', 'ShoppingCart', '#EF4444'),
    (parent_health,    NULL, NULL, 'Phát triển & Sức khỏe', 'expense', 'HeartPulse', '#10B981'),
    (parent_personal,  NULL, NULL, 'Cá nhân & Giải trí', 'expense', 'Smile', '#8B5CF6'),
    (parent_finance,   NULL, NULL, 'Tài chính & Khác', 'expense', 'Landmark', '#6B7280'),
    (parent_income,    NULL, NULL, 'Thu nhập', 'income', 'Wallet', '#22C55E')
    ON CONFLICT (id) DO NOTHING;

    -- Insert Child Categories (Tier 2 Expense)
    INSERT INTO public.categories (user_id, parent_id, name, type, icon, color, budget_limit) VALUES
    -- Thiết yếu
    (NULL, parent_essential, 'Ăn uống', 'expense', 'Utensils', '#F97316', 5000000),
    (NULL, parent_essential, 'Xăng xe & Di chuyển', 'expense', 'Car', '#3B82F6', 1500000),
    (NULL, parent_essential, 'Tiền điện nước & Hóa đơn', 'expense', 'Zap', '#EAB308', 2000000),
    (NULL, parent_essential, 'Nhà ở / Tiền phòng', 'expense', 'Home', '#6366F1', 4000000),

    -- Phát triển & Sức khỏe
    (NULL, parent_health, 'Học tập', 'expense', 'GraduationCap', '#14B8A6', 1000000),
    (NULL, parent_health, 'Sức khỏe & Y tế', 'expense', 'Stethoscope', '#EC4899', 1000000),

    -- Cá nhân & Giải trí
    (NULL, parent_personal, 'Mua sắm', 'expense', 'ShoppingBag', '#F43F5E', 2000000),
    (NULL, parent_personal, 'Giải trí & Du lịch', 'expense', 'Plane', '#A855F7', 2000000),

    -- Tài chính & Khác
    (NULL, parent_finance, 'Vay nợ / Trả nợ', 'expense', 'CreditCard', '#64748B', NULL),
    (NULL, parent_finance, 'Khác', 'expense', 'MoreHorizontal', '#94A3B8', NULL)
    ON CONFLICT DO NOTHING;

    -- Insert Income Categories
    INSERT INTO public.categories (user_id, parent_id, name, type, icon, color) VALUES
    (NULL, parent_income, 'Lương', 'income', 'Banknote', '#10B981'),
    (NULL, parent_income, 'Thưởng', 'income', 'Gift', '#F59E0B'),
    (NULL, parent_income, 'Đầu tư', 'income', 'TrendingUp', '#06B6D4'),
    (NULL, parent_income, 'Khác (Thu nhập)', 'income', 'Coins', '#84CC16')
    ON CONFLICT DO NOTHING;

END $$;
