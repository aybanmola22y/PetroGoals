-- =====================================================
-- OKR TRACKER - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run these SQL queries in your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. OKRS TABLE (Objectives)
-- =====================================================
CREATE TABLE IF NOT EXISTS okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department TEXT NOT NULL,
    goal TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('on-track', 'at-risk', 'off-track')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. KEY RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target NUMERIC NOT NULL,
    current NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'quantitative' CHECK (target_type IN ('quantitative', 'milestone', 'milestone-custom')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. MILESTONE STAGES TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS milestone_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight NUMERIC NOT NULL DEFAULT 20,
    progress NUMERIC NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. PROGRESS HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS progress_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. INITIATIVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    assignee TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. COMMENT ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. CHECK-INS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
    okr_goal TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    department TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. CHECK-IN KEY RESULT UPDATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS check_in_key_result_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_in_id UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
    key_result_id TEXT NOT NULL,
    key_result_title TEXT NOT NULL,
    previous_value NUMERIC NOT NULL,
    new_value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. COMPANY INFO TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS company_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission TEXT NOT NULL,
    vision TEXT NOT NULL,
    core_values TEXT[] NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. NOTIFICATIONS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deadline_reminder', 'okr_update', 'checkin_reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    okr_id UUID REFERENCES okrs(id) ON DELETE SET NULL,
    key_result_id UUID REFERENCES key_results(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MIGRATION: Add deadline column to notifications
-- =====================================================
-- If you already have an existing notifications table, run:
-- ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deadline DATE;

-- =====================================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_okrs_department ON okrs(department);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_created_at ON okrs(created_at);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_key_results_target_type ON key_results(target_type);
CREATE INDEX IF NOT EXISTS idx_milestone_stages_key_result_id ON milestone_stages(key_result_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_key_result_id ON progress_history(key_result_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_date ON progress_history(date);
CREATE INDEX IF NOT EXISTS idx_initiatives_okr_id ON initiatives(okr_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_okr_id ON check_ins(okr_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON check_ins(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_key_result_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
-- For development, allow all operations for authenticated users

CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON okrs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON key_results
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for milestone_stages" ON milestone_stages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON progress_history
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON initiatives
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON comments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for comment_attachments" ON comment_attachments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON check_ins
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON check_in_key_result_updates
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON company_info
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for notifications" ON notifications
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- INITIAL COMPANY INFO DATA (OPTIONAL)
-- =====================================================
INSERT INTO company_info (mission, vision, core_values) 
VALUES (
    'To deliver excellence in energy solutions while fostering sustainable practices and driving innovation across all operations.',
    'To be the leading integrated energy company recognized for operational excellence, technological innovation, and commitment to environmental stewardship.',
    ARRAY['Safety First', 'Integrity & Transparency', 'Innovation & Excellence', 'Sustainability', 'Teamwork & Collaboration']
) ON CONFLICT DO NOTHING;

-- =====================================================
-- TRIGGER FOR AUTO-UPDATING updated_at COLUMN
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_okrs_updated_at
    BEFORE UPDATE ON okrs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DEMO USER (OPTIONAL - for testing)
-- =====================================================
INSERT INTO users (id, email, name, password) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@petro-okr.com',
    'Demo User',
    'demo123'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MIGRATION: Add 'milestone-custom' to target_type
-- =====================================================
-- If you already have an existing database and need to add
-- support for custom milestones, run this migration:

ALTER TABLE key_results DROP CONSTRAINT IF EXISTS key_results_target_type_check;
ALTER TABLE key_results ADD CONSTRAINT key_results_target_type_check 
    CHECK (target_type IN ('quantitative', 'milestone', 'milestone-custom'));

-- =====================================================
-- MIGRATION: Remove duplicate notifications
-- =====================================================
-- Run this query to delete duplicate notifications, keeping only the most recent
-- one per (user_id, okr_id, type) combination for deadline_reminder notifications:

DELETE FROM notifications
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, okr_id, type) id
    FROM notifications
    WHERE type = 'deadline_reminder' AND okr_id IS NOT NULL
    ORDER BY user_id, okr_id, type, created_at DESC
)
AND type = 'deadline_reminder'
AND okr_id IS NOT NULL;

-- =====================================================
