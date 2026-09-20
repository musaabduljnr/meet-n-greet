-- ============================================================================
-- KOUNTRY WAYNE VIP PLATFORM: ADMIN SECURITY & ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. Ensure Admin Role Enum Exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role_enum') THEN
        CREATE TYPE admin_role_enum AS ENUM (
            'SUPER_ADMIN',
            'ADMIN',
            'STAFF'
        );
    END IF;
END$$;

-- 2. Create public.admins table if not exists
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create public.audit_logs table if not exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_state JSONB,
    new_state JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Security Definer Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE id = auth.uid()
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_admin_role(required_roles admin_role_enum[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE id = auth.uid()
        AND is_active = TRUE
        AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Row-Level Security on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_and_greet_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_card_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Granular Table Policies

-- (A) public.admins
CREATE POLICY "Admins can view other admins"
ON public.admins FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Super Admins can manage admins"
ON public.admins FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum]));

-- (B) public.cities
CREATE POLICY "Public can view active cities"
ON public.cities FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

CREATE POLICY "Admins can manage cities"
ON public.cities FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

-- (C) public.fans & public.registrations
CREATE POLICY "Admins and Staff can view fans"
ON public.fans FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage fans"
ON public.fans FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

CREATE POLICY "Admins and Staff can view registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage registrations"
ON public.registrations FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

-- (D) public.meet_and_greet_schedules
CREATE POLICY "Staff can view schedules"
ON public.meet_and_greet_schedules FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage schedules"
ON public.meet_and_greet_schedules FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

-- (E) public.fan_cards & history
CREATE POLICY "All staff can view fan cards"
ON public.fan_cards FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Staff and Admins can update fan card status"
ON public.fan_cards FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage fan cards"
ON public.fan_cards FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

CREATE POLICY "Staff can view status history"
ON public.fan_card_status_history FOR SELECT
TO authenticated
USING (public.is_admin());

-- (F) public.audit_logs & public.email_events
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

CREATE POLICY "Admins can view email events"
ON public.email_events FOR SELECT
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));
