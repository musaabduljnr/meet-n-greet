# Project Architecture: Kountry Wayne Meet & Greet Platform

## 1. Executive Summary & Product Objective

The **Kountry Wayne Meet & Greet Platform** is a dedicated VIP experience management and physical memorabilia fulfillment system built specifically for comedian, author, and entertainer Kountry Wayne. 

Unlike conventional ticketing or checkout platforms (e.g., Eventbrite, Ticketmaster), this platform decouples registration from automated instant scheduling:
1. **Fans** register interest for specific tour cities, supply verified contact and shipping information, and receive a private, high-entropy alphanumeric **Fan Card Tracking Code**.
2. **Admins and Tour Operations Team** review registrations, organize cohort capacities, assign discrete time slots and secret VIP locations, and manually manage the physical **Fan Card production and fulfillment pipeline**.
3. **Communication** is mediated through a secure, multi-stage transactional email system that delivers scheduling instructions, venue locations, and tracking milestones directly to fans.
4. **Public Tracking Portal** allows fans to look up their Fan Card physical status and current Meet & Greet scheduling status strictly via their private tracking code—without requiring account signups or password overhead for fans.

---

## 2. Technology Stack & Hosting Topology

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|                                                                                       |
|   +---------------------------------------+   +-----------------------------------+   |
|   |         Public Fan Portal             |   |          Admin VIP Console        |   |
|   |  - City Selection & Registration      |   |  - City & Tour Route Management   |   |
|   |  - Tracking Code Lookups              |   |  - Fan Triage & Scheduling        |   |
|   |  - Responsive Mobile VIP Experience   |   |  - Card Fulfillment Pipeline      |   |
|   |  - Dynamic Live Status Tracker        |   |  - Broadcast / Transactional Email|   |
|   +---------------------------------------+   +-----------------------------------+   |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                           EDGE ROUTING & APPLICATION LAYER                            |
|                               (Vercel Next.js 15 App Router)                          |
|                                                                                       |
|   - Server Actions (Zod Validation, Mutation Logic, Session Checks)                   |
|   - Route Handlers (Secure Webhooks, Public Lookups, Status APIs)                     |
|   - Server Components (Direct Read Models via Server-Side Supabase Client)            |
|   - Next.js Middleware (Admin Route Protection & Session Refresh)                     |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                               BACKEND DATA & AUTH LAYER                               |
|                                     (Supabase)                                        |
|                                                                                       |
|   +-------------------+   +-------------------------+   +-------------------------+   |
|   |   Supabase Auth   |   |   PostgreSQL 16 Engine  |   |    Supabase Storage     |   |
|   |  - Admin Identity |   |  - Row Level Security   |   |  - VIP Photos           |   |
|   |  - MFA / RBAC     |   |  - Automated Triggers   |   |  - Fan Card Badge Assets|   |
|   |  - Session Tokens |   |  - Audit Log Tracking   |   |  - Private Media        |   |
|   +-------------------+   +-------------------------+   +-------------------------+   |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                              TRANSACTIONAL EMAIL ENGINE                               |
|                             (Abstracted Email Adapter)                                |
|                                                                                       |
|   [ Development / Testing ]                         [ Production ]                    |
|   - Local Mock Console Adapter                      - Resend API (Custom Domain)      |
|   - Nodemailer / Gmail SMTP                         - Strict SPF / DKIM / DMARC       |
+---------------------------------------------------------------------------------------+
```

### Core Technologies
- **Runtime Environment**: Node.js (v20+ / v26.x compatible)
- **Framework**: Next.js (App Router, React 19 / React Server Components, Server Actions)
- **Language**: TypeScript (strict type checking enabled across frontend and backend)
- **Styling Architecture**: Custom CSS Design System / Tailwind CSS with tokenized palette (Kountry Wayne gold/black VIP aesthetic, glassmorphism, fluid responsive layouts)
- **Database & Identity**: Supabase (PostgreSQL 16, pg_crypto, Row-Level Security, Supabase Auth)
- **Hosting**: Vercel (Edge network, automated CI/CD previews, zero-trust serverless execution)
- **Form Management & Validation**: React Hook Form + Zod (isomorphic validation on client and server)
- **Transactional Email**: Pluggable provider abstraction (`EmailProvider` interface) supporting Console Mock, SMTP/Gmail (staging/testing), and Resend API (production).

---

## 3. System Architecture & Component Hierarchy

### 3.1 Public Fan Interface
- `/`: Hero landing, tour city overview, registration call-to-action, and quick tracking code input.
- `/register`: Multi-step city-specific VIP registration form.
  - Step 1: City & event selection (filtered dynamically from active cities in database).
  - Step 2: Fan personal information (legal name, preferred name, email, phone).
  - Step 3: Fan Card shipping address (street, apt/suite, city, state, postal code, country).
  - Step 4: Verification, terms acknowledgment, and submission.
- `/register/confirmation`: Instant confirmation screen displaying their newly minted private tracking code and email dispatch notification.
- `/track`: Dynamic Fan Card & Schedule tracking portal.
  - Public tracking lookup form accepting tracking codes (e.g., `KW-7X9K-42M1`).
  - Read-only visual stepper displaying both **Meet & Greet Schedule Status** and **Physical Fan Card Delivery Status**.
  - Secure masking of personal data (only showing first name initial, sanitized city, and status milestones).

### 3.2 Admin VIP Operations Console
- `/admin/login`: Secure Supabase Auth credential login with brute-force rate-limiting.
- `/admin`: Dashboard with high-level KPIs:
  - Total registrations per city
  - Fan lifecycle distribution (Registered vs Schedule Pending vs Scheduled vs Completed)
  - Fulfillment pipeline counts (Processing, Prepared, Shipped, In-Transit, Out-for-Delivery, Delivered, Issues)
  - Recent audit logs and system activity
- `/admin/cities`: City management (add city, tour date, venue, capacity limit, active/inactive toggle, notes).
- `/admin/registrations`: Unified data table for all fan registrations with filtering by city, status, date, and search by fan name/email/tracking code.
- `/admin/schedules`: Scheduling interface:
  - Assign specific dates, arrival times, check-in instructions, and private venue addresses to individual fans or cohorts.
  - Trigger "Meet & Greet Schedule Confirmation" emails upon schedule finalization.
- `/admin/fan-cards`: Physical Fan Card fulfillment management:
  - Batch or individual status advancement.
  - Manual status selector (`PROCESSING`, `PREPARED`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_ISSUE`, `CANCELLED`).
  - Internal fulfillment notes and courier reference tags (for administrative record only; no automated carrier APIs).
  - Audit-trailed status transitions with optional fan email dispatch triggers.
- `/admin/audit-logs`: Chronological immutable record of every administrative action, user modification, schedule alteration, and email trigger.

---

## 4. Lifecycles & State Machines

### 4.1 Fan Attendance Lifecycle
The fan's journey is strictly state-governed:

```
                  +-----------------------+
                  |      REGISTERED       |  <-- Fan submits registration form
                  +-----------+-----------+
                              |
                              v
                  +-----------------------+
                  |   SCHEDULE_PENDING    |  <-- Admin confirms registration is in review
                  +-----------+-----------+
                              |
                              v
                  +-----------------------+
                  |       SCHEDULED       |  <-- Admin assigns time, venue & instructions
                  +-----------+-----------+
                              |
                              v
                  +-----------------------+
                  |       COMPLETED       |  <-- Fan checked in & attended Meet & Greet
                  +-----------------------+

             [ Branch: CANCELLED permitted from any pre-COMPLETED state ]
```

### 4.2 Fan Card Physical Fulfillment Lifecycle
The commemorative Fan Card status is completely administrative:

```
        +-------------------------------------------------------+
        |                      REGISTERED                       |
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                      PROCESSING                       |  (Badge data queued for print)
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                       PREPARED                        |  (Card printed & packaged)
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                       SHIPPED                         |  (Dispatched to shipping depot)
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                      IN_TRANSIT                       |  (En route across distribution network)
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                   OUT_FOR_DELIVERY                    |  (Final local delivery leg)
        +---------------------------+---------------------------+
                                    |
                                    v
        +-------------------------------------------------------+
        |                       DELIVERED                       |  (Package delivered to fan address)
        +-------------------------------------------------------+

        [ Exception States: DELIVERY_ISSUE | CANCELLED ]
```

---

## 5. Security & Isolation Boundaries

1. **Client Isolation**: Secrets (Supabase Service Role keys, SMTP credentials, Resend API keys) are strictly confined to server-side code (Next.js Server Actions and Route Handlers). Client bundles only receive public environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. **Row-Level Security (RLS)**:
   - Public anonymous requests cannot perform arbitrary SELECT or UPDATE operations.
   - Public tracking endpoint executes via a constrained Database Function or server action using limited field selection, preventing leak of physical addresses, phone numbers, or private notes.
   - Admin routes and database operations require authenticated Supabase sessions matching an entry in the `admins` table.
3. **Audit Trail**: Every mutation performed by an admin logs the actor ID, timestamp, target entity, previous state, new state, and client metadata.

---

## 6. Directory Structure Blueprint

```
kountry-wayne-meet-n-greet/
├── .env.example
├── .gitignore
├── README.md
├── PROJECT_ARCHITECTURE.md
├── IMPLEMENTATION_ROADMAP.md
├── DATABASE_ARCHITECTURE.md
├── SECURITY_ARCHITECTURE.md
├── EMAIL_ARCHITECTURE.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts (or vanilla design tokens)
├── supabase/
│   ├── migrations/
│   │   └── 20260920000001_initial_schema.sql
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                     # Landing & City overview
│   │   │   ├── register/
│   │   │   │   ├── page.tsx                 # Multi-step fan registration
│   │   │   │   └── confirmation/page.tsx    # Success & tracking code
│   │   │   ├── track/
│   │   │   │   └── page.tsx                 # Fan Card & Schedule tracking
│   │   │   └── layout.tsx
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx                 # Admin dashboard overview
│   │   │   │   ├── login/page.tsx           # Admin authentication
│   │   │   │   ├── cities/page.tsx          # City management
│   │   │   │   ├── registrations/page.tsx   # Fan triage & search
│   │   │   │   ├── schedules/page.tsx       # M&G scheduling & dispatch
│   │   │   │   ├── fan-cards/page.tsx       # Card fulfillment management
│   │   │   │   └── audit-logs/page.tsx      # Immutable audit trail
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── track/route.ts               # Secure public tracking lookup API
│   │   │   └── webhooks/route.ts            # Secure webhook ingress
│   │   ├── layout.tsx
│   │   └── globals.css                      # VIP styling & design tokens
│   ├── components/
│   │   ├── ui/                              # Reusable primitives (buttons, modals, badges)
│   │   ├── public/                          # Public landing, registration form, tracking stepper
│   │   └── admin/                           # Tables, filters, status editors, analytics cards
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                    # Client-side Supabase client (anon)
│   │   │   ├── server.ts                    # Server-side Supabase client (cookies)
│   │   │   └── admin.ts                     # Privileged admin client (service role)
│   │   ├── email/
│   │   │   ├── email-service.ts             # Abstracted email service interface
│   │   │   ├── providers/
│   │   │   │   ├── console-provider.ts      # Local mock email provider
│   │   │   │   ├── smtp-provider.ts         # Gmail / SMTP email provider
│   │   │   │   └── resend-provider.ts       # Production Resend API provider
│   │   │   └── templates/                   # Transactional HTML/Text templates
│   │   ├── security/
│   │   │   ├── tracking-code.ts             # Cryptographic code generator
│   │   │   └── audit.ts                     # Audit log recorder
│   │   └── validations/                     # Zod schemas for all forms & actions
│   └── types/                               # TypeScript domain entities & Supabase types
```
