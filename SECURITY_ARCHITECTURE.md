# Security Architecture: Kountry Wayne Meet & Greet Platform

## 1. Threat Model & Security Principles

The Kountry Wayne Meet & Greet platform manages VIP fan contact information, physical shipping addresses, confidential tour schedules, and physical Fan Card fulfillment records.

### Primary Threat Vectors:
1. **Public Tracking Code Enumeration / Brute-Force**: Attackers attempting to scrape fan schedules or names by cycling through sequential or low-entropy tracking numbers.
2. **PII Leakage in Public APIs**: Exposing fan phone numbers, complete shipping addresses, or VIP arrival instructions on the public tracking portal.
3. **Privilege Escalation**: Unauthorized users accessing administrative routes or database tables.
4. **Secret Exposure in Client Bundles**: Leaking `SUPABASE_SERVICE_ROLE_KEY` or email SMTP credentials into browser JavaScript.
5. **Registration Spam & Form Abuse**: Automated bot submissions flooding city rosters and exhausting event capacity.

---

## 2. Authentication & Authorization Strategy

### 2.1 Fan Access Model (Zero-Password / Cryptographic Token Model)
- Fans **do not** register accounts or store passwords in the database.
- Verification and access are anchored on:
  1. A verified email address submitted during registration.
  2. A private, cryptographically generated **Fan Card Tracking Code** (e.g., `KW-9F7A-2V4K`).
- Tracking code lookup returns strictly sanitized, non-PII milestones through a PostgreSQL `SECURITY DEFINER` RPC function.

### 2.2 Admin Access Model (RBAC via Supabase Auth)
- Admins authenticate via Supabase Auth (email + strong password, with support for MFA).
- Every authenticated `auth.users` ID must correspond to an active record in `public.admins`.
- **Admin Roles**:
  - `SUPER_ADMIN`: Full control over cities, fan registrations, scheduling, card fulfillment, admin invitations, and audit logs.
  - `TOUR_COORDINATOR`: Can manage cities, view fan registrations, and manage VIP schedules.
  - `FULFILLMENT_MANAGER`: Can view registrations and advance Fan Card statuses (`PROCESSING` through `DELIVERED`).
  - `READ_ONLY`: Observability only; cannot mutate records or trigger emails.

---

## 3. Row-Level Security (RLS) Implementation

PostgreSQL Row-Level Security is strictly enforced across every table. The public role (`anon`) has zero direct access to sensitive tables.

```sql
-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_and_greet_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_card_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an active admin
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

-- Helper function: Check if current user has specific admin roles
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
```

### Table Policies

#### 1. `cities`
- **Public**: Can view active cities only.
- **Admin**: Full read/write access.
```sql
CREATE POLICY "Public can view active cities"
ON public.cities FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

CREATE POLICY "Admins can manage cities"
ON public.cities FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

#### 2. `fans` & `registrations`
- **Public**: Cannot SELECT. Mutations (fan registrations) are routed via validated Server Actions executing under the trusted server environment.
- **Admins**: Full read/update.
```sql
CREATE POLICY "Admins can view and manage fans"
ON public.fans FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view and manage registrations"
ON public.registrations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

#### 3. `meet_and_greet_schedules`
- **Public**: Zero direct table access. (Data is queried exclusively through `get_public_tracking_status()`).
- **Admins**: Accessible by authorized tour coordinators and super admins.
```sql
CREATE POLICY "Admins can view and manage schedules"
ON public.meet_and_greet_schedules FOR ALL
TO authenticated
USING (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'TOUR_COORDINATOR'::admin_role_enum]))
WITH CHECK (public.has_admin_role(ARRAY['SUPER_ADMIN'::admin_role_enum, 'TOUR_COORDINATOR'::admin_role_enum]));
```

#### 4. `fan_cards` & `fan_card_status_history`
- **Public**: Zero direct table access.
- **Admins**: Accessible by fulfillment managers, tour coordinators, and super admins.
```sql
CREATE POLICY "Admins can view and update fan cards"
ON public.fan_cards FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view fan card history"
ON public.fan_card_status_history FOR SELECT
TO authenticated
USING (public.is_admin());
```

#### 5. `audit_logs` & `email_events`
- **Public**: Zero access.
- **Admins**: Read-only for admins; inserts handled by system triggers or service role.
```sql
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view email events"
ON public.email_events FOR SELECT
TO authenticated
USING (public.is_admin());
```

---

## 4. Cryptographic Tracking Code Entropy

Public tracking codes must be unguessable to defeat automated scraping:
- **Alphabet**: 30 unambiguous uppercase alphanumeric characters (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), eliminating `0`, `O`, `1`, `I` to prevent user transcription errors.
- **Length**: 8 random characters formatted as `KW-XXXX-XXXX`.
- **Entropy Calculation**:
  $$\text{Possible combinations} = 30^8 = 656,100,000,000 \text{ (656 billion)}$$
- Even at 10,000 registrations, the probability of an attacker guessing a valid code in a single blind attempt is:
  $$P \approx \frac{10,000}{6.56 \times 10^{11}} \approx 1.52 \times 10^{-8}$$
- Combined with rate-limiting, blind scanning is computationally unfeasible.

---

## 5. Rate Limiting & Anti-Scraping

### 5.1 Public Tracking Rate Limiter
- **Limit**: Max 10 tracking requests per IP per minute.
- **Backoff**: Exponential HTTP 429 Too Many Requests response with `Retry-After` header.

### 5.2 Registration Form Rate Limiter & Bot Shield
- **Limit**: Max 3 registration submissions per IP per 10 minutes.
- **Honeypot Trap**: Invisible field `website_hp` on the client form. Submissions with filled honeypots are dropped silently.
- **Turnstile / reCAPTCHA Ready**: Hook prepared for Cloudflare Turnstile token verification in server actions.

---

## 6. Secrets & Environment Variable Boundary

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Anon public key (restricted by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | High-privilege server client for registrations & triggers |
| `EMAIL_PROVIDER` | Server Only | `CONSOLE_TEST` \| `SMTP` \| `RESEND` |
| `RESEND_API_KEY` | Server Only | API key for production transactional emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Server Only | Gmail / Staging credentials |
| `ADMIN_INVITATION_SECRET` | Server Only | Secret for onboarding initial admin |

---

## 7. Audit Trail Specification

Every administrative mutation is logged to `public.audit_logs` with the following payload structure:

```json
{
  "admin_id": "8f3b2d10-47b2-4d33-9118-a6d1b28d7120",
  "action": "FAN_CARD_STATUS_UPDATE",
  "entity_table": "fan_cards",
  "entity_id": "3c98b680-e889-4a0b-9df6-2c5e50587cb1",
  "old_state": {
    "current_status": "PREPARED",
    "courier_reference": null
  },
  "new_state": {
    "current_status": "SHIPPED",
    "courier_reference": "BATCH-2026-ATL-01"
  },
  "ip_address": "198.51.100.24",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "created_at": "2026-09-20T12:00:00Z"
}
```
