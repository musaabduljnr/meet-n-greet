# Kountry Wayne VIP Meet & Greet — Production Environment Specification

This document provides an exhaustive inventory, security classification, rotation policy, and verification standard for all environment variables and secrets required to operate the Kountry Wayne VIP Meet & Greet platform in production across **Vercel** and **Supabase**.

---

## 1. Environment Variable Architecture & Scope

All configuration adheres to the 12-factor application methodology. Client-accessible variables are strictly segregated using Next.js `NEXT_PUBLIC_` prefixes, and no secret keys or database administrative credentials are ever packaged into client bundles.

| Variable Name | Required Scope | Sensitivity Level | Default / Allowed Values | Purpose & Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Build & Runtime | Standard | `production` \| `development` \| `test` | System execution mode. In `production`, development admin credentials and test bypasses are unconditionally disabled. |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Public | e.g. `https://vip.kountrywayne.com` | Base public canonical URL of the application. Used for absolute link generation in transactional emails, metadata, and canonical headers. |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public | `https://<ref>.supabase.co` | Supabase API Gateway endpoint. Used by `@supabase/ssr` browser and server clients for authenticated REST and RPC queries. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public (RLS Bound) | Supabase `anon` JWT | Public anon key for Supabase queries. Subject to PostgreSQL Row-Level Security (RLS). Permitted only for safe public reads (e.g., active tour stops). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | **CRITICAL SECRET** | Supabase `service_role` JWT | High-privilege administrative secret key. **NEVER EXPOSE TO CLIENT.** Bypasses RLS for secure server-side transactional mutations (attendee creation, status transitions). |
| `ADMIN_SESSION_SECRET` | Server-Only | **CRITICAL SECRET** | 64+ char hex string | High-entropy HMAC-SHA256 key used to cryptographically sign and verify admin session cookies (`kw_admin_session`). Minimum 256 bits of cryptographic entropy. |
| `EMAIL_PROVIDER` | Server-Only | Operational Config | `resend` \| `console` | Selects transactional email provider. Must be set to `resend` in production. Falls back to `console` in isolated development/test environments. |
| `RESEND_API_KEY` | Server-Only | **CRITICAL SECRET** | `re_xxxxxxxxxxxx` | API key from Resend dashboard. Grants permission to dispatch transactional emails via `vip@kountrywayne.com` or verified sending domain. |
| `RESEND_FROM_EMAIL` | Server-Only | Operational Config | `Kountry Wayne VIP <vip@kountrywayne.com>` | Sender address and display name for all outbound transactional communications (registration confirmations, schedules, card fulfillment updates). |
| `ENABLE_DEV_ADMINS` | Server-Only | Security Guard | `false` | When set to `false` (enforced in production), all hardcoded fallback credentials (`admin@kountrywayne.com`) are permanently deactivated. |
| `ALLOW_REAL_USER_TEST_EMAILS`| Server-Only | Safety Guard | `false` | Anti-leak safeguard. If `NODE_ENV !== "production"`, emails to non-whitelisted domains are suppressed unless this flag is explicitly `"true"`. |

---

## 2. Cryptographic Security Standards

### 2.1 Admin Session Signing Key (`ADMIN_SESSION_SECRET`)
- **Algorithm**: Web Crypto API standard HMAC using SHA-256 (`HMAC-SHA256`).
- **Entropy Requirement**: Minimum 32 bytes (256 bits), formatted as a 64-character hexadecimal or base64 string.
- **Generation Command**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Lifecycle & Storage**:
  - Configured strictly as a Vercel Encrypted Environment Variable.
  - Automatically regenerated with a zero-warning ephemeral fallback if absent in development; in production, absence triggers a configuration alert.
  - Tokens expire after 8 hours of inactivity.

### 2.2 Tracking Code Entropy
- **Format**: `KWFC-XXXX-XXXX` (where `XXXX` consists of Crockford Base32 characters: `23456789ABCDEFGHJKMNPQRSTVWXYZ`).
- **Collision Resistance**: 32^8 ≈ 1.099 × 10^12 combinations per namespace.
- **Enumeration Protection**: Rate-limited at the API layer (maximum 10 queries per minute per IP address) and returns uniform 404 responses to eliminate timing attacks.

---

## 3. Email Safety Interceptors & Anti-Leak Guards

To guarantee that staging, testing, or preview deployments never accidentally dispatch emails to real fans or attendees:

1. **Production Verification Check**:
   - `ResendProvider` verifies that `process.env.NODE_ENV === "production"`.
   - If `NODE_ENV !== "production"`, emails are only dispatched to test recipients (`*@example.com`, `*@example.org`, `*@test.com`) or explicit testing allowlists.
2. **Idempotency Gate**:
   - All email dispatches generate a deterministic SHA-256 idempotency key from `recipient + type + metadata_reference`. Duplicate triggers within 10 minutes are dropped with a logged `DUPLICATE_SUPPRESSED` warning.
3. **Plaintext Fallback**:
   - All templates render both responsive HTML and clean plaintext variants to ensure deliverability across legacy mobile clients and accessibility readers.

---

## 4. Secret Rotation & Incident Response Policy

### 4.1 Periodic Rotation (Quarterly)
1. **Resend API Key**:
   - Generate new API Key in Resend dashboard.
   - Update `RESEND_API_KEY` in Vercel Production Environment Variables.
   - Redeploy production build (`vercel --prod`).
   - Revoke previous key in Resend dashboard after verifying first live dispatch.
2. **Admin Session Secret**:
   - Generate a new 64-character hex key.
   - Update `ADMIN_SESSION_SECRET` on Vercel.
   - Trigger production deployment. Existing admin sessions will gracefully expire, requiring staff to re-authenticate.

### 4.2 Emergency Revocation (Suspected Leak)
1. Immediately navigate to **Supabase Dashboard > Settings > API**.
2. Click **Roll API Keys** to instantly invalidate the existing `anon` and `service_role` keys.
3. Update Vercel environment variables immediately with the new keys.
4. Redeploy Vercel with cleared build cache:
   ```bash
   vercel --prod --force
   ```
5. Check audit logs (`SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100;`) for unauthorized operations.

---

## 5. Client Bundle Verification Command

Verify that no secret keys or database tokens leak into the client bundle:

```bash
# Search production build outputs for private keys
grep -rn "service_role" .next/static/ || echo "✓ ZERO service_role keys in client bundles"
grep -rn "ADMIN_SESSION_SECRET" .next/static/ || echo "✓ ZERO session secrets in client bundles"
grep -rn "re_" .next/static/ || echo "✓ ZERO Resend API keys in client bundles"
```
