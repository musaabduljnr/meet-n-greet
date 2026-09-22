-- Migration: 20260922000003_super_admin_city_management.sql
-- Description: Grants Super Admin and Admin full management rights on tour cities,
--              including deletion by updating the foreign key constraint on registrations
--              to ON DELETE SET NULL (converting linked attendees to Nationwide VIP).

BEGIN;

-- 1. Modify foreign key constraint on registrations(city_id) to ON DELETE SET NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'registrations_city_id_fkey'
          AND table_name = 'registrations'
    ) THEN
        ALTER TABLE public.registrations
        DROP CONSTRAINT registrations_city_id_fkey;
    END IF;
END $$;

ALTER TABLE public.registrations
    ADD CONSTRAINT registrations_city_id_fkey
    FOREIGN KEY (city_id)
    REFERENCES public.cities(id)
    ON DELETE SET NULL;

-- 2. Ensure RLS Policy explicitly covers ALL actions (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities;

CREATE POLICY "Admins can manage cities"
ON public.cities FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'ADMIN'::admin_role_enum]));

-- 3. Ensure Super Admin role has unconditional execution privilege
GRANT ALL ON TABLE public.cities TO authenticated;
GRANT ALL ON TABLE public.cities TO service_role;

COMMIT;
