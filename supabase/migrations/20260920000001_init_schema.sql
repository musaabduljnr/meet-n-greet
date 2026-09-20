-- ============================================================================
-- KOUNTRY WAYNE VIP PLATFORM: COMPLETE INITIAL SCHEMA DDL
-- Migration: 20260920000001_init_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PostgreSQL Enumerations & Custom Types
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role_enum') THEN
        CREATE TYPE admin_role_enum AS ENUM (
            'SUPER_ADMIN',
            'ADMIN',
            'STAFF'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status_enum') THEN
        CREATE TYPE registration_status_enum AS ENUM (
            'REGISTERED',
            'SCHEDULE_PENDING',
            'SCHEDULED',
            'COMPLETED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fan_card_status_enum') THEN
        CREATE TYPE fan_card_status_enum AS ENUM (
            'REGISTERED',
            'PROCESSING',
            'PREPARED',
            'SHIPPED',
            'IN_TRANSIT',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'DELIVERY_ISSUE',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status_enum') THEN
        CREATE TYPE email_status_enum AS ENUM (
            'QUEUED',
            'SENT',
            'DELIVERED',
            'FAILED',
            'BOUNCED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_type_enum') THEN
        CREATE TYPE email_type_enum AS ENUM (
            'REGISTRATION_CONFIRMATION',
            'SCHEDULE_NOTIFICATION',
            'SCHEDULE_UPDATE',
            'FAN_CARD_STATUS_UPDATE',
            'ADMIN_ALERT'
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Tables DDL
-- ----------------------------------------------------------------------------

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    tour_date DATE NOT NULL,
    venue_name TEXT,
    venue_address TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 50,
    current_registrations_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_city_date UNIQUE (name, tour_date)
);

-- Fans table
CREATE TABLE IF NOT EXISTS public.fans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    preferred_name TEXT,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT NOT NULL DEFAULT 'USA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID NOT NULL REFERENCES public.fans(id) ON DELETE RESTRICT,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
    status registration_status_enum NOT NULL DEFAULT 'REGISTERED',
    special_notes TEXT,
    check_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_fan_city_registration UNIQUE (fan_id, city_id)
);

-- Meet and Greet Schedules table
CREATE TABLE IF NOT EXISTS public.meet_and_greet_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    arrival_instructions TEXT NOT NULL,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    notified_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Fan Cards table
CREATE TABLE IF NOT EXISTS public.fan_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    fan_id UUID NOT NULL REFERENCES public.fans(id) ON DELETE RESTRICT,
    tracking_code TEXT NOT NULL UNIQUE,
    current_status fan_card_status_enum NOT NULL DEFAULT 'REGISTERED',
    internal_fulfillment_notes TEXT,
    courier_reference TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Fan Card Status History table
CREATE TABLE IF NOT EXISTS public.fan_card_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_card_id UUID NOT NULL REFERENCES public.fan_cards(id) ON DELETE CASCADE,
    previous_status fan_card_status_enum,
    new_status fan_card_status_enum NOT NULL,
    status_notes TEXT,
    changed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Email Events table
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    fan_id UUID REFERENCES public.fans(id) ON DELETE SET NULL,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
    fan_card_id UUID REFERENCES public.fan_cards(id) ON DELETE SET NULL,
    email_type email_type_enum NOT NULL,
    status email_status_enum NOT NULL DEFAULT 'QUEUED',
    provider TEXT NOT NULL,
    provider_message_id TEXT,
    error_message TEXT,
    subject TEXT NOT NULL,
    idempotency_key TEXT,
    payload_snapshot JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- 3. Initial Tour Cities Seed Data
-- ----------------------------------------------------------------------------

INSERT INTO public.cities (name, state, country, tour_date, venue_name, venue_address, max_capacity, is_active)
VALUES
    ('Atlanta', 'GA', 'USA', '2026-11-14', 'Fox Theatre', '660 Peachtree St NE, Atlanta, GA 30308', 50, TRUE),
    ('Houston', 'TX', 'USA', '2026-11-21', 'Smart Financial Centre', '18111 Lexington Blvd, Sugar Land, TX 77479', 50, TRUE),
    ('Chicago', 'IL', 'USA', '2026-12-05', 'The Chicago Theatre', '175 N State St, Chicago, IL 60601', 40, TRUE),
    ('Los Angeles', 'CA', 'USA', '2026-12-12', 'The Wiltern', '3790 Wilshire Blvd, Los Angeles, CA 90010', 40, TRUE),
    ('Detroit', 'MI', 'USA', '2026-12-19', 'Fox Theatre Detroit', '2211 Woodward Ave, Detroit, MI 48201', 35, TRUE),
    ('Miami', 'FL', 'USA', '2027-01-09', 'The Fillmore Miami Beach', '1700 Washington Ave, Miami Beach, FL 33139', 30, TRUE)
ON CONFLICT (name, tour_date) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Utility Functions & Triggers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_cities ON public.cities;
CREATE TRIGGER set_timestamp_cities BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_fans ON public.fans;
CREATE TRIGGER set_timestamp_fans BEFORE UPDATE ON public.fans FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_registrations ON public.registrations;
CREATE TRIGGER set_timestamp_registrations BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_schedules ON public.meet_and_greet_schedules;
CREATE TRIGGER set_timestamp_schedules BEFORE UPDATE ON public.meet_and_greet_schedules FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_fan_cards ON public.fan_cards;
CREATE TRIGGER set_timestamp_fan_cards BEFORE UPDATE ON public.fan_cards FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Sync registration counter
CREATE OR REPLACE FUNCTION public.trigger_sync_city_registrations_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.cities SET current_registrations_count = current_registrations_count + 1 WHERE id = NEW.city_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.cities SET current_registrations_count = current_registrations_count - 1 WHERE id = OLD.city_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_city_registrations_count ON public.registrations;
CREATE TRIGGER sync_city_registrations_count
AFTER INSERT OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_city_registrations_count();
