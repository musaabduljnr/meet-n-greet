# Database Architecture: Kountry Wayne Meet & Greet Platform

## 1. Relational Entity-Relationship Model

```
                                +-------------------+
                                |    auth.users     |
                                +---------+---------+
                                          | (1:1)
                                          v
                                +-------------------+
                                |      admins       |
                                +---------+---------+
                                          | (1:N audit logs / updates)
                                          +---------------------------------------+
                                          |                                       |
    +-------------------+                 |                                       |
    |      cities       |                 |                                       |
    +---------+---------+                 |                                       |
              | (1:N)                     v                                       v
              |                 +-------------------+                   +-------------------+
              +---------------->|   registrations   |                   |    audit_logs     |
                                +---------+---------+                   +-------------------+
                                          | (N:1)                                 ^
                                          |                                       |
    +-------------------+                 |                                       |
    |       fans        |<----------------+                                       |
    +---------+---------+                 |                                       |
              | (1:N)                     | (1:1)                                 |
              |                           v                                       |
              |                 +-----------------------+                         |
              |                 | meet_and_greet_       |                         |
              |                 | schedules             |                         |
              |                 +-----------------------+                         |
              |                           |                                       |
              |                           | (1:1)                                 |
              |                           v                                       |
              |                 +-------------------+                             |
              +---------------->|     fan_cards     |<----------------------------+
                                +---------+---------+
                                          |
                                          | (1:N)
                                          v
                                +---------------------------+
                                | fan_card_status_history   |
                                +---------------------------+
                                          |
                                          | (1:N)
                                          v
                                +-------------------+
                                |   email_events    |
                                +-------------------+
```

---

## 2. PostgreSQL Enumerations & Custom Types

```sql
-- 1. Admin roles
CREATE TYPE admin_role_enum AS ENUM (
    'SUPER_ADMIN',
    'TOUR_COORDINATOR',
    'FULFILLMENT_MANAGER',
    'READ_ONLY'
);

-- 2. Fan registration and attendance lifecycle status
CREATE TYPE registration_status_enum AS ENUM (
    'REGISTERED',
    'SCHEDULE_PENDING',
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED'
);

-- 3. Fan card physical fulfillment lifecycle status (Admin controlled)
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

-- 4. Email delivery status
CREATE TYPE email_status_enum AS ENUM (
    'QUEUED',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED'
);

-- 5. Email trigger types
CREATE TYPE email_type_enum AS ENUM (
    'REGISTRATION_CONFIRMATION',
    'SCHEDULE_NOTIFICATION',
    'SCHEDULE_UPDATE',
    'FAN_CARD_STATUS_UPDATE',
-- 4. VIP Membership tier
CREATE TYPE membership_tier_enum AS ENUM (
    'GOLD_VIP',
    'DIAMOND_VIP',
    'SILVER_MEMBER'
);
```

---

## 3. Detailed Entity Schemas (DDL)

### 3.1 `admins`
Stores authorized administrative operators mapped directly to `auth.users`.
```sql
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role admin_role_enum NOT NULL DEFAULT 'TOUR_COORDINATOR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.2 `cities`
Tour tour stops and venues. Never hardcoded into the frontend.
```sql
CREATE TABLE public.cities (
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
```

### 3.3 `fans`
Normalized representation of individual fan profiles. Prevents duplicate storage of person-level identities across multiple city tour registrations. Contains verified government photo ID and shipping coordinates.
```sql
CREATE TABLE public.fans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    preferred_name TEXT,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    date_of_birth DATE,
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT NOT NULL DEFAULT 'USA',
    id_type TEXT,
    id_number TEXT,
    id_document_name TEXT,
    id_document_url TEXT,
    id_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.4 `registrations`
Links a fan to a specific tour city and VIP membership pass. Contains fan attendance lifecycle.
```sql
CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID NOT NULL REFERENCES public.fans(id) ON DELETE RESTRICT,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
    membership_tier membership_tier_enum NOT NULL DEFAULT 'GOLD_VIP',
    status registration_status_enum NOT NULL DEFAULT 'REGISTERED',
    special_notes TEXT,
    check_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_fan_city_registration UNIQUE (fan_id, city_id)
);
```

### 3.5 `meet_and_greet_schedules`
Contains private VIP scheduling data determined by the admin team.
```sql
CREATE TABLE public.meet_and_greet_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    arrival_instructions TEXT NOT NULL,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    notified_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.6 `fan_cards`
Physical commemorative VIP Fan Cards. The tracking code is a cryptographically secure random alphanumeric string.
```sql
CREATE TABLE public.fan_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    fan_id UUID NOT NULL REFERENCES public.fans(id) ON DELETE RESTRICT,
    -- Format: 'KW-' followed by 8 cryptographically secure alphanumeric characters (e.g. KW-8K2M-9P4X)
    tracking_code TEXT NOT NULL UNIQUE,
    current_status fan_card_status_enum NOT NULL DEFAULT 'REGISTERED',
    internal_fulfillment_notes TEXT,
    courier_reference TEXT, -- Free-form administrative reference label (no automated carrier API)
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.7 `fan_card_status_history`
Immutable record of all physical card status transitions with notes.
```sql
CREATE TABLE public.fan_card_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_card_id UUID NOT NULL REFERENCES public.fan_cards(id) ON DELETE CASCADE,
    previous_status fan_card_status_enum,
    new_status fan_card_status_enum NOT NULL,
    status_notes TEXT,
    changed_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.8 `email_events`
Audit log of all transactional email notifications sent to fans.
```sql
CREATE TABLE public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    fan_id UUID REFERENCES public.fans(id) ON DELETE SET NULL,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
    fan_card_id UUID REFERENCES public.fan_cards(id) ON DELETE SET NULL,
    email_type email_type_enum NOT NULL,
    status email_status_enum NOT NULL DEFAULT 'QUEUED',
    provider TEXT NOT NULL, -- e.g. 'RESEND', 'GMAIL_SMTP', 'CONSOLE_TEST'
    provider_message_id TEXT,
    error_message TEXT,
    subject TEXT NOT NULL,
    payload_snapshot JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 3.9 `audit_logs`
Immutable compliance and operations log tracking every administrative mutation.
```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g. 'ADVANCE_FAN_CARD_STATUS', 'UPDATE_SCHEDULE', 'DEACTIVATE_CITY'
    entity_table TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_state JSONB,
    new_state JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

---

## 4. Cryptographic Tracking Code Generation

To guarantee zero sequential predictability and high entropy:
```sql
-- Function to generate a secure random alphanumeric code: KW-XXXX-XXXX
CREATE OR REPLACE FUNCTION public.generate_fan_card_tracking_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Excludes ambiguous chars: 0, 1, I, O
    result TEXT := 'KW-';
    i INTEGER;
    random_byte INTEGER;
BEGIN
    -- Part 1: 4 chars
    FOR i IN 1..4 LOOP
        random_byte := get_byte(gen_random_bytes(1), 0);
        result := result || substr(chars, (random_byte % length(chars)) + 1, 1);
    END LOOP;
    
    result := result || '-';
    
    -- Part 2: 4 chars
    FOR i IN 1..4 LOOP
        random_byte := get_byte(gen_random_bytes(1), 0);
        result := result || substr(chars, (random_byte % length(chars)) + 1, 1);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;
```

---

## 5. Automated Database Triggers

### 5.1 Updated At Automation
```sql
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_admins BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_cities BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_fans BEFORE UPDATE ON public.fans FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_registrations BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_schedules BEFORE UPDATE ON public.meet_and_greet_schedules FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_fan_cards BEFORE UPDATE ON public.fan_cards FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();
```

### 5.2 Automatic Fan Card Status History Recording
Whenever an admin updates `fan_cards.current_status`, a new entry is automatically appended to `fan_card_status_history`:
```sql
CREATE OR REPLACE FUNCTION public.trigger_record_fan_card_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.current_status IS DISTINCT FROM NEW.current_status) THEN
        INSERT INTO public.fan_card_status_history (
            fan_card_id,
            previous_status,
            new_status,
            status_notes
        ) VALUES (
            NEW.id,
            OLD.current_status,
            NEW.current_status,
            NEW.internal_fulfillment_notes
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_fan_card_status_change
AFTER UPDATE ON public.fan_cards
FOR EACH ROW
EXECUTE FUNCTION public.trigger_record_fan_card_status_change();
```

### 5.3 City Registration Counter Synchronizer
```sql
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

CREATE TRIGGER sync_city_registrations_count
AFTER INSERT OR DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sync_city_registrations_count();
```

---

## 6. Public Secure Tracking Lookup View / Function

To prevent any leakage of PII (phone number, complete street address, internal admin notes) on the public tracking portal, fans query via a dedicated RPC function:

```sql
CREATE OR REPLACE FUNCTION public.get_public_tracking_status(p_tracking_code TEXT)
RETURNS TABLE (
    tracking_code TEXT,
    fan_first_initial TEXT,
    city_name TEXT,
    city_state TEXT,
    tour_date DATE,
    registration_status registration_status_enum,
    fan_card_status fan_card_status_enum,
    fan_card_created_at TIMESTAMPTZ,
    fan_card_shipped_at TIMESTAMPTZ,
    fan_card_delivered_at TIMESTAMPTZ,
    schedule_assigned_date DATE,
    schedule_arrival_time TIME,
    schedule_is_notified BOOLEAN,
    history JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.tracking_code,
        substring(f.first_name from 1 for 1) || '***' AS fan_first_initial,
        c.name AS city_name,
        c.state AS city_state,
        c.tour_date,
        r.status AS registration_status,
        fc.current_status AS fan_card_status,
        fc.created_at AS fan_card_created_at,
        fc.shipped_at AS fan_card_shipped_at,
        fc.delivered_at AS fan_card_delivered_at,
        s.assigned_date AS schedule_assigned_date,
        CASE WHEN s.is_notified THEN s.arrival_time ELSE NULL END AS schedule_arrival_time,
        s.is_notified AS schedule_is_notified,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'status', h.new_status,
                    'created_at', h.created_at
                ) ORDER BY h.created_at ASC
            )
            FROM public.fan_card_status_history h
            WHERE h.fan_card_id = fc.id
        ) AS history
    FROM public.fan_cards fc
    JOIN public.fans f ON fc.fan_id = f.id
    JOIN public.registrations r ON fc.registration_id = r.id
    JOIN public.cities c ON r.city_id = c.id
    LEFT JOIN public.meet_and_greet_schedules s ON r.id = s.registration_id
    WHERE fc.tracking_code = UPPER(TRIM(p_tracking_code))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. Performance Indexes

```sql
-- Fast lookup for fan card tracking
CREATE INDEX idx_fan_cards_tracking_code ON public.fan_cards(tracking_code);
CREATE INDEX idx_fan_cards_current_status ON public.fan_cards(current_status);
CREATE INDEX idx_fan_cards_registration_id ON public.fan_cards(registration_id);

-- Registrations filters
CREATE INDEX idx_registrations_city_id ON public.registrations(city_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_registrations_fan_id ON public.registrations(fan_id);

-- Fans lookup
CREATE INDEX idx_fans_email ON public.fans(email);

-- Active cities
CREATE INDEX idx_cities_active_date ON public.cities(is_active, tour_date);

-- Audit log sorting
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_table, entity_id);
```
