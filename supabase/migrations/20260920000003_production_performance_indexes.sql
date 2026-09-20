-- ============================================================================
-- KOUNTRY WAYNE VIP PLATFORM: PRODUCTION PERFORMANCE & INTEGRITY INDEXES
-- ============================================================================
-- This migration ensures sub-millisecond lookups, eliminates table scans,
-- prevents duplicate race conditions, and optimizes admin dashboards.

-- 1. Fans & Registrations Indexes
CREATE INDEX IF NOT EXISTS idx_fans_email 
    ON public.fans(email);

CREATE INDEX IF NOT EXISTS idx_fans_phone 
    ON public.fans(phone_number);

CREATE INDEX IF NOT EXISTS idx_registrations_fan_id 
    ON public.registrations(fan_id);

CREATE INDEX IF NOT EXISTS idx_registrations_city_status 
    ON public.registrations(city_id, status);

CREATE INDEX IF NOT EXISTS idx_registrations_created_at 
    ON public.registrations(created_at DESC);

-- Unique constraint ensuring no fan can register twice for the same city stop
CREATE UNIQUE INDEX IF NOT EXISTS uq_registrations_fan_city 
    ON public.registrations(fan_id, city_id);

-- 2. Fan Cards & Fulfillment Indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_fan_cards_tracking_code 
    ON public.fan_cards(tracking_code);

CREATE INDEX IF NOT EXISTS idx_fan_cards_reg_id 
    ON public.fan_cards(registration_id);

CREATE INDEX IF NOT EXISTS idx_fan_cards_fan_id 
    ON public.fan_cards(fan_id);

CREATE INDEX IF NOT EXISTS idx_fan_cards_current_status 
    ON public.fan_cards(current_status);

CREATE INDEX IF NOT EXISTS idx_fan_cards_updated_at 
    ON public.fan_cards(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_fan_card_history_card_date 
    ON public.fan_card_status_history(fan_card_id, created_at DESC);

-- 3. Meet & Greet VIP Schedules Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_reg_id 
    ON public.meet_and_greet_schedules(registration_id);

CREATE INDEX IF NOT EXISTS idx_schedules_assigned_date 
    ON public.meet_and_greet_schedules(assigned_date);


-- 4. Audit & Email Compliance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
    ON public.audit_logs(entity_table, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_date 
    ON public.audit_logs(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
    ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_email_events_idempotency 
    ON public.email_events(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_email_events_recipient_date 
    ON public.email_events(recipient_email, created_at DESC);
