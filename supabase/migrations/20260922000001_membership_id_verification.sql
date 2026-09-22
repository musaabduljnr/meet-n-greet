-- ============================================================================
-- KOUNTRY WAYNE VIP PLATFORM: MEMBERSHIP REGISTRATION & ID VERIFICATION
-- Migration: 20260922000001_membership_id_verification.sql
-- ============================================================================

-- 1. Create membership tier enum if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_tier_enum') THEN
        CREATE TYPE membership_tier_enum AS ENUM (
            'GOLD_VIP',
            'DIAMOND_VIP',
            'SILVER_MEMBER'
        );
    END IF;
END $$;

-- 2. Enhance public.fans with date of birth and valid government ID verification metadata
ALTER TABLE public.fans
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS id_type TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS id_document_name TEXT,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;

-- 3. Enhance public.registrations with selected VIP membership tier & allow standalone membership without tour stop
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS membership_tier membership_tier_enum NOT NULL DEFAULT 'GOLD_VIP',
ALTER COLUMN city_id DROP NOT NULL;

-- 4. Create storage bucket for encrypted ID verification documents (Private Bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'id-verifications',
    'id-verifications',
    FALSE,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 5. Storage RLS Security: Strictly restrict ID uploads & reads to authenticated admins and service role
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Admins and service role can access ID verifications'
    ) THEN
        CREATE POLICY "Admins and service role can access ID verifications"
        ON storage.objects
        FOR ALL
        TO authenticated, service_role
        USING (bucket_id = 'id-verifications')
        WITH CHECK (bucket_id = 'id-verifications');
    END IF;
END $$;

-- 6. Comments on new fields
COMMENT ON COLUMN public.fans.date_of_birth IS 'Date of birth for VIP 18+ cohort eligibility verification.';
COMMENT ON COLUMN public.fans.id_type IS 'Type of government photo ID presented (e.g., DRIVERS_LICENSE, STATE_ID, PASSPORT, MILITARY_ID, PERMANENT_RESIDENT).';
COMMENT ON COLUMN public.fans.id_number IS 'Optional document identifier or license number for verification matching.';
COMMENT ON COLUMN public.fans.id_document_name IS 'Original filename of the uploaded government photo ID.';
COMMENT ON COLUMN public.fans.id_document_url IS 'Encrypted storage reference URL in Supabase Storage.';
COMMENT ON COLUMN public.registrations.membership_tier IS 'VIP Membership Tier selected (GOLD_VIP, DIAMOND_VIP, SILVER_MEMBER).';
