# Implementation Roadmap: Kountry Wayne Meet & Greet Platform

## 1. Roadmap Overview & Timeline

The Kountry Wayne Meet & Greet platform is structured into **6 sequential, milestone-driven phases**. Each phase builds strictly on verified foundations to ensure zero regression, ironclad security, and high visual excellence.

```
+---------------------------------------------------------------------------------------+
|  PHASE 1: Foundation, Infrastructure & Database Architecture                          |
|  - Next.js 15 App Router + TypeScript + VIP Styling System                           |
|  - Supabase PostgreSQL Migrations, Custom Enums, Triggers & RLS Policies              |
|  - Seed Data with Initial Tour Cities & Test Admin Role                               |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|  PHASE 2: Core Domain Services, Validation & Abstraction Layer                        |
|  - Cryptographic Fan Card Tracking Code Generator (KW-XXXX-XXXX)                      |
|  - Abstracted Email Service (Console Test / SMTP / Resend)                            |
|  - Isomorphic Zod Validation Schemas for Registrations, Schedules & Statuses          |
|  - Supabase Client Adapters (SSR cookies, Admin Service Role, Client anon)            |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|  PHASE 3: Public Fan Experience (Responsive VIP Portal)                               |
|  - Landing Page with Live Tour Cities Overview & VIP Branding                         |
|  - Multi-Step VIP Registration Flow (City -> Fan Details -> Shipping Address)        |
|  - Immediate Confirmation Screen with Private Tracking Code                           |
|  - Public Tracking Portal (Fan Card Milestone Stepper + Schedule Status)              |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|  PHASE 4: Admin Operations Console (Command & Control)                                |
|  - Secure Supabase Admin Login with RBAC Enforcement                                  |
|  - Operations KPI Dashboard (Registrations, Status Distributions, Tour Load)          |
|  - City Management (Capacity limits, Active toggle, Venue information)                |
|  - Fan Registration Roster (Search, Filters, Detail Inspector)                        |
|  - Meet & Greet Scheduling Tool (Time slot assignment, venue address, instructions)    |
|  - Fan Card Fulfillment Queue (Manual status advance, internal notes, courier tag)   |
|  - Immutable Audit Log Browser                                                        |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|  PHASE 5: Transactional Email Notifications & Event Logging                           |
|  - High-Contrast VIP HTML & Text Email Templates                                      |
|  - Automated Registration Confirmation Dispatch                                       |
|  - Admin-Triggered Schedule Notification with Venue & Instructions                   |
|  - Fan Card Status Advance Email Dispatch                                             |
|  - Logging to public.email_events & Admin Resend Trigger                              |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|  PHASE 6: Verification, Security Auditing & Production Hardening                      |
|  - End-to-End User Flow Tests (Fan Registration -> Admin Schedule -> Card Delivery)  |
|  - RLS Policy & Rate-Limiter Penetration Check                                        |
|  - Vercel Deployment & Environment Config Hardening                                  |
+---------------------------------------------------------------------------------------+
```

---

## 2. Phase-by-Phase Implementation Checklist

### Phase 1: Foundation & Supabase Database
- [ ] Initialize Next.js 15 project with TypeScript and strict mode.
- [ ] Install essential runtime dependencies:
  - `@supabase/supabase-js`, `@supabase/ssr`
  - `zod`, `react-hook-form`, `@hookform/resolvers`
  - `lucide-react` (icons)
  - `clsx`, `tailwind-merge`
- [ ] Configure styling tokens in `globals.css` / Tailwind:
  - Luxury VIP dark palette: `#0B0B0E`, `#131318`, `#1B1B22`
  - Metallic gold accents: `#D4AF37`, `#F3E5AB`, `#997D20`
  - Premium typography (Outfit / Inter)
- [ ] Create initial Supabase migration file `supabase/migrations/20260920000001_initial_schema.sql`:
  - Enums (`admin_role_enum`, `registration_status_enum`, `fan_card_status_enum`, `email_status_enum`, `email_type_enum`)
  - Tables (`admins`, `cities`, `fans`, `registrations`, `meet_and_greet_schedules`, `fan_cards`, `fan_card_status_history`, `email_events`, `audit_logs`)
  - Foreign key constraints & unique indexes
  - Triggers (`updated_at`, `record_fan_card_status_change`, `sync_city_registrations_count`)
  - Security definer function `get_public_tracking_status`
  - Row Level Security (RLS) policies on all tables
- [ ] Create `supabase/seed.sql` with sample cities (Atlanta, Houston, Chicago, Los Angeles, Charlotte) and default admin setup.

### Phase 2: Core Domain Logic & Security Foundations
- [ ] Create cryptographic tracking code generator in `src/lib/security/tracking-code.ts` using `node:crypto` (`KW-XXXX-XXXX` with 30-char unambiguous alphabet).
- [ ] Create isomorphic Zod schemas in `src/lib/validations/`:
  - `registrationSchema` (name, email, phone, full shipping address, city selection)
  - `trackingLookupSchema`
  - `scheduleAssignmentSchema`
  - `fanCardStatusUpdateSchema`
  - `citySchema`
- [ ] Implement Supabase client factories in `src/lib/supabase/`:
  - `client.ts` (browser client using anon key)
  - `server.ts` (SSR client reading cookies)
  - `admin.ts` (privileged client using `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Implement pluggable Email Service in `src/lib/email/`:
  - `EmailService` interface and types
  - `ConsoleProvider` (local debug/stdout)
  - `SmtpProvider` (Gmail / custom SMTP via Nodemailer)
  - `ResendProvider` (production API)
  - `EmailService` factory driven by `EMAIL_PROVIDER` env variable.
- [ ] Implement Audit Logging helper in `src/lib/security/audit.ts`.

### Phase 3: Public Fan Experience
- [ ] Build Hero Landing Page (`/`):
  - Kountry Wayne VIP branding and tour overview.
  - Active Tour Cities roster dynamically fetched from Supabase.
  - Quick Tracking Code search bar.
- [ ] Build Multi-Step Fan Registration (`/register`):
  - Dynamic city selection (reads active cities with remaining capacity).
  - Fan contact info input with real-time validation.
  - Shipping address collection for physical Fan Card delivery.
  - Honeypot anti-spam field (`website_hp`).
  - Server Action handling atomic registration:
    1. Upsert fan record.
    2. Insert registration record with `REGISTERED` status.
    3. Generate cryptographic Fan Card tracking code.
    4. Insert `fan_cards` record with `REGISTERED` status.
    5. Trigger `REGISTRATION_CONFIRMATION` email.
- [ ] Build Confirmation Screen (`/register/confirmation`):
  - Celebratory VIP confirmation view.
  - Large display of private tracking code with copy-to-clipboard button.
  - Clear expectation setting regarding scheduling review by the tour team.
- [ ] Build Public Tracking Portal (`/track`):
  - Clean tracking code query input (accepts query param `?code=KW-XXXX-XXXX`).
  - Visual Stepper for **Meet & Greet Schedule Status** (`REGISTERED` -> `SCHEDULE_PENDING` -> `SCHEDULED` -> `COMPLETED`).
  - Visual Stepper for **Physical Fan Card Delivery Status** (`REGISTERED` -> `PROCESSING` -> `PREPARED` -> `SHIPPED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
  - Handles exception states (`DELIVERY_ISSUE`, `CANCELLED`).
  - Shows masked fan initials and tour city; guarantees zero PII leaks.

### Phase 4: Admin VIP Operations Console
- [ ] Implement Admin Authentication (`/admin/login`):
  - Supabase Auth email/password login.
  - Middleware route protection ensuring only verified admins can access `/admin/*`.
- [ ] Build Admin Navigation & Layout:
  - Sidebar with routes: Dashboard, Cities, Registrations, Schedules, Fan Cards, Audit Logs.
  - Current admin profile badge and secure sign-out.
- [ ] Build Admin Dashboard (`/admin`):
  - KPI metric cards: Total Registrations, Pending Schedules, Active Fan Cards in Transit, Delivered Cards.
  - City breakdown table.
  - Recent operational activity feed.
- [ ] Build City Management (`/admin/cities`):
  - Table of tour cities with date, venue, capacity, registrations count, and status badge.
  - Modal to create or edit city, toggle active status, and update notes.
- [ ] Build Fan Registration Roster (`/admin/registrations`):
  - Searchable, filterable table (by city, registration status, date).
  - Fan detail modal showing full contact info, shipping address, and tracking code.
  - Actions: Change status, jump to schedule, resend confirmation email.
- [ ] Build Meet & Greet Scheduling Console (`/admin/schedules`):
  - Queue of fans in `REGISTERED` or `SCHEDULE_PENDING` status.
  - Scheduling modal: Assign date, arrival time, venue name, address, and arrival instructions.
  - Checkbox: "Send Schedule Confirmation Email to Fan Immediately".
  - Status updates to `SCHEDULED` upon dispatch.
- [ ] Build Fan Card Fulfillment Pipeline (`/admin/fan-cards`):
  - Kanban / Table view of cards by status (`REGISTERED`, `PROCESSING`, `PREPARED`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_ISSUE`).
  - Status advancement dropdown with optional internal notes and courier reference tags.
  - Checkbox: "Notify fan of status update via email".
  - History drawer showing all past status transitions with timestamps and author.
- [ ] Build Audit Log Viewer (`/admin/audit-logs`):
  - Chronological table of administrative actions with timestamp, actor, action, table, and diff inspector.

### Phase 5: Transactional Email Subsystem
- [ ] Design and build email templates:
  - `RegistrationConfirmationTemplate`
  - `ScheduleNotificationTemplate`
  - `ScheduleUpdateTemplate`
  - `FanCardStatusUpdateTemplate`
- [ ] Wire email dispatcher to Server Actions:
  - Fan registration triggers confirmation email.
  - Admin scheduling triggers schedule notification.
  - Admin card status change optionally triggers card status email.
- [ ] Implement error handling and logging to `public.email_events`:
  - Graceful fallback: Registration succeeds even if SMTP fails.
  - Provide "Resend Email" button in Admin console for failed dispatches.

### Phase 6: Testing, Hardening & Deployment
- [ ] Unit tests for tracking code generator (test entropy, charset, uniqueness).
- [ ] Integration tests for registration Server Action and database integrity.
- [ ] Verification of RLS policies with anonymous vs authenticated test tokens.
- [ ] Verify rate-limiting on public tracking lookups.
- [ ] Cross-browser and responsive testing (iOS Safari, Android Chrome, Desktop).
- [ ] Prepare Vercel production deployment configuration and documentation.

---

## 3. Architectural Risks & Mitigation Strategies

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| **Brute-force tracking code guessing** | High | Low | 8-character Base-30 alphabet yields 656 billion possibilities; combined with IP rate limiting (10 req/min) and zero PII returned. |
| **Email deliverability failures** | Medium | Medium | Pluggable email interface; failed emails are non-blocking for fan registration; email events are logged in Supabase with admin re-dispatch triggers. |
| **Concurrent over-registration past venue capacity** | Medium | Low | Database trigger and server-side atomic check before inserting new registrations; cities display "Sold Out / Capacity Reached" when limit is reached. |
| **Exposure of secret Supabase service keys** | Critical | Low | Strict Next.js architecture: Service role keys only referenced in `src/lib/supabase/admin.ts` which is isolated from client bundles. |
| **Admin session hijacking or unauthorized access** | High | Low | Supabase Auth with server-side cookie validation in Next.js Middleware; active admin status verified in `public.admins` on every protected route. |
| **Fan confusion over non-instant scheduling** | Medium | Medium | Transparent UX messaging throughout landing page, registration form, confirmation screen, and tracking portal explicitly explaining the admin-curated scheduling process. |
