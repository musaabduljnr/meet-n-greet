# Production Deployment & Infrastructure Runbook: Kountry Wayne VIP Platform

This runbook outlines the exact, reproducible operational workflow for deploying the **Kountry Wayne VIP Meet & Greet Platform** to production using **Vercel** for the edge frontend/API layer and **Supabase (Managed PostgreSQL + Auth)** for the relational database backend.

---

## 1. Pre-Deployment Prerequisites

Ensure the deployment engineer has access to:
- **Node.js**: v20.x LTS or v22.x LTS (Next.js 16 runtime)
- **Vercel CLI**: Installed and authenticated (`npm i -g vercel && vercel login`)
- **Supabase CLI**: Authenticated (`supabase login`) or web access to Supabase Dashboard
- **Resend Account**: Access to manage API keys and verify DNS records for `kountrywayne.com`
- **DNS Provider Access**: Cloudflare / AWS Route53 for adding CNAME and TXT records

---

## 2. Supabase Database Provisioning & Schema Migration

### 2.1 Project Initialization
1. Log in to [Supabase Management Console](https://app.supabase.com).
2. Create a new organization project:
   - **Name**: `kountry-wayne-vip-production`
   - **Region**: `us-east-1` (North Virginia) or closest to target tour concentration
   - **Database Password**: High-entropy 32+ character generated secret
   - **Pricing Plan**: Pro (enables daily backups and Point-in-Time Recovery)

### 2.2 Applying Schema Migrations
Execute the SQL migration scripts in chronological order via the Supabase SQL Editor or Supabase CLI:

```bash
# Link project reference
supabase link --project-ref <production-project-ref>

# Apply migrations sequentially
supabase db push
```

Alternatively, paste the contents of each file into the Supabase SQL Editor:
1. `supabase/migrations/20260920000001_init_schema.sql`
   - Creates ENUM types: `registration_status`, `schedule_status`, `fan_card_status`, `admin_role`, `email_status`
   - Creates tables: `cities`, `fans`, `registrations`, `schedules`, `schedule_history`, `fan_cards`, `fan_card_status_history`, `email_events`, `admin_audit_logs`, `admin_users`
   - Sets up initial tour cities and constraints.
2. `supabase/migrations/20260920000002_fix_rls_and_roles.sql`
   - Enables Row-Level Security (RLS) on all tables
   - Creates security definer helper functions: `is_admin()`, `has_admin_role()`
   - Establishes strict read/write policies for public, staff, admin, and super_admin tiers.
3. `supabase/migrations/20260920000003_perf_indexes.sql`
   - Provisions 14 performance B-Tree indexes for high-frequency queries:
     - Fan email normalization lookup
     - Public Fan Card tracking code lookups
     - Registrations by city, date, and status
     - Email idempotency and dispatch history
     - Administrative audit logs by actor and timestamp

### 2.3 Verify Database Health & Constraints
Run the verification query in the Supabase SQL Editor:
```sql
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
*Verification Check*: Ensure `rowsecurity = true` for every table in `public`.

### 2.4 Seed Initial Super Administrator
Execute the following SQL statement in the Supabase SQL Editor to provision the primary production executive administrator:
```sql
INSERT INTO admin_users (email, full_name, role, is_active)
VALUES 
  ('operations@kountrywayne.com', 'Kountry Wayne Tour Director', 'SUPER_ADMIN', true)
ON CONFLICT (email) DO UPDATE 
SET role = 'SUPER_ADMIN', is_active = true;
```

---

## 3. Transactional Email Infrastructure (Resend)

### 3.1 Domain Verification
1. In the [Resend Console](https://resend.com/domains), click **Add Domain** (`vip.kountrywayne.com` or `kountrywayne.com`).
2. Add the required DNS records to your DNS provider:
   - **DKIM TXT**: `resend._domainkey.kountrywayne.com`
   - **SPF TXT**: `v=spf1 include:amazonses.com ~all`
   - **DMARC TXT**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@kountrywayne.com`
3. Click **Verify Records** in Resend until status displays **Verified**.

### 3.2 Production API Key Provisioning
1. Navigate to **Resend > API Keys**.
2. Click **Create API Key**:
   - **Name**: `kountry-wayne-vip-prod`
   - **Permission**: `Sending access` (or Restricted domain sending)
   - **Domain**: `vip.kountrywayne.com`
3. Copy the key (`re_xxxxxxxxxxxx`) securely.

---

## 4. Vercel Production Deployment

### 4.1 Link Repository & Configure Project
1. In the Vercel Dashboard, import the Git repository.
2. Select **Framework Preset**: `Next.js`.
3. Root Directory: `./`
4. Build Command: `next build`
5. Output Directory: `.next`

### 4.2 Configure Production Environment Variables
Configure the following variables in **Project Settings > Environment Variables** (Apply to **Production**):

```ini
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://vip.kountrywayne.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
ADMIN_SESSION_SECRET=<64-char-random-hex-string>
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Kountry Wayne VIP <vip@kountrywayne.com>
ENABLE_DEV_ADMINS=false
ALLOW_REAL_USER_TEST_EMAILS=false
```

*Important*: Ensure `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`, and `RESEND_API_KEY` have the **"Automatically expose System Environment Variables"** option disabled, and are never prefixed with `NEXT_PUBLIC_`.

### 4.3 Configure Custom Domain & SSL
1. Under **Project Settings > Domains**, add `vip.kountrywayne.com`.
2. Configure DNS at your provider:
   - **Type**: `CNAME`
   - **Name**: `vip`
   - **Target**: `cname.vercel-dns.com`
3. Verify that SSL certificate is automatically provisioned by Let's Encrypt / Vercel Edge Network.

### 4.4 Trigger Production Build
```bash
vercel --prod
```
Verify build logs complete with:
- Zero TypeScript compilation errors (`tsc --noEmit`)
- Route compilation for all static and dynamic routes
- Generated security headers from `vercel.json`

---

## 5. Post-Deployment Smoke Test & Sanity Checks

Run the automated 17-step end-to-end smoke test against the live deployment:

```bash
# Run against the live production URL
NEXT_PUBLIC_APP_URL=https://vip.kountrywayne.com npx tsx test/production-smoke-test.mjs
```

### Manual Edge Checks
1. **Homepage** (`/`):
   - Fast load (< 800ms)
   - City tour stop cards display correct capacity badges and dates
   - "Track Fan Card" CTA button functions properly
2. **Registration Flow** (`/register?city=atlanta`):
   - Submit registration with valid data
   - Verify immediate on-screen confirmation and reference number
   - Verify physical Fan Card tracking code displayed
3. **Public Tracking** (`/track`):
   - Enter tracking code
   - Verify timeline loads with zero PII leakage (no email, phone, or private notes)
4. **Admin Portal** (`/admin/login`):
   - Authenticate with authorized staff credentials
   - Confirm role-based access to dashboard, registrations, and scheduling
   - Perform test status update on Fan Card

---

## 6. Rollback Procedures & Incident Response

### 6.1 Instant Frontend Rollback (Vercel)
If a critical frontend bug or regression occurs:
1. Open the [Vercel Dashboard](https://vercel.com).
2. Go to **Deployments**.
3. Locate the previous known-good deployment.
4. Click the three dots (`...`) menu and select **Instant Rollback**.
5. Traffic will be redirected to the previous immutable deployment within seconds across all edge locations.

### 6.2 Database Rollback & Point-in-Time Recovery (Supabase)
If an errant migration or data corruption occurs:
1. Open **Supabase Dashboard > Database > Backups**.
2. For Pro tier projects, select **Point in Time Recovery (PITR)**.
3. Select a restore target timestamp prior to the incident.
4. Alternatively, execute down-migration scripts if manual column reversions are required.

### 6.3 Emergency Escalation Contacts
- **Tour Coordinator & Stage Management**: `operations@kountrywayne.com`
- **VIP Ticketing Operations**: `vip-support@kountrywayne.com`
- **Security & Incident Lead**: `security@kountrywayne.com`
