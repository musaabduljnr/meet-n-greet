# meet-n-greet

# Kountry Wayne VIP Meet & Greet Platform

An enterprise-grade VIP attendee portal and tour management application for comedian and entertainer **Kountry Wayne's** national tour.

Built with **Next.js 16 (App Router + Turbopack)**, **Supabase (PostgreSQL + RLS)**, and **Resend (Transactional Email Infrastructure)**.

---

## Features

- **VIP Tour Stop Discovery**: Real-time inspection of active tour dates, venue locations, and capacity tracking.
- **Fan Registration Portal**: Strict input validation, normalization, and honeypot anti-bot defense.
- **Cryptographic Fan Card Fulfillment**: Unique, high-entropy Crockford Base32 tracking codes (`KWFC-XXXX-XXXX`).
- **Zero-PII Public Tracking**: Secure server-side tracking portal displaying milestone progression without leaking attendee emails, phone numbers, or private notes.
- **Tour Coordinator Admin Console**:
  - Role-Based Access Control (`SUPER_ADMIN`, `ADMIN`, `STAFF`).
  - Isomorphic Web Crypto HMAC-SHA256 session management.
  - Granular Meet & Greet scheduling with call times and stage door check-in instructions.
  - Multi-stage physical Fan Card fulfillment pipeline (`REGISTERED` $\to$ `PROCESSING` $\to$ `PREPARED` $\to$ `SHIPPED` $\to$ `IN_TRANSIT` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`).
  - Immutable administrative audit logging.
- **Transactional Email Pipeline**: 11 dedicated templates with responsive HTML and plain-text fallbacks.

---

## Tech Stack

- **Framework**: Next.js 16.3.5 (App Router, Turbopack, Server Actions)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase PostgreSQL, Row-Level Security (RLS)
- **Emails**: Resend API
- **Deployment**: Vercel Edge Network

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```
Refer to `PRODUCTION_ENVIRONMENT.md` for secret isolation and rotation rules.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
# Run all 71 tests across 8 feature suites
npm test

# Run 17-step end-to-end production smoke test
npx tsx test/production-smoke-test.mjs
```

---

## Documentation

- [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md) — Step-by-step production setup on Vercel and Supabase.
- [`PRODUCTION_ENVIRONMENT.md`](PRODUCTION_ENVIRONMENT.md) — Environment variables, secrets, and rotation runbook.
- [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) — Operational verification and sign-off checklist.
- [`DATABASE_ARCHITECTURE.md`](DATABASE_ARCHITECTURE.md) — Relational schema, RLS policies, and performance indexes.
- [`SECURITY_ARCHITECTURE.md`](SECURITY_ARCHITECTURE.md) — Security model, RBAC matrix, and audit controls.
- [`EMAIL_ARCHITECTURE.md`](EMAIL_ARCHITECTURE.md) — Transactional email dispatch and template specifications.
