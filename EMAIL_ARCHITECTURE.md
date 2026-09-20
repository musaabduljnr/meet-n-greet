# Email Architecture: Kountry Wayne Meet & Greet Platform

## 1. Architecture Overview

Communication is the central nervous system of this platform. Because Meet & Greet schedules and physical Fan Card fulfillment are curated rather than automated instantaneous checkouts, transactional emails keep fans informed at every critical juncture.

The email subsystem is designed with a **pluggable provider abstraction pattern**:
- **Environment Agnostic**: The application business logic depends solely on the generic `EmailService` interface.
- **Environment Switches via ENV**:
  - `EMAIL_PROVIDER=CONSOLE_TEST` for local development (prints formatted emails to stdout without sending).
  - `EMAIL_PROVIDER=SMTP` for staging or testing with Gmail/Nodemailer.
  - `EMAIL_PROVIDER=RESEND` for production delivery using custom domain verification (e.g., `vip@kountrywayne.com`).
- **Resilience**: Database recording occurs atomically; failures in email dispatch are logged to `public.email_events` and do not break the fan's registration.

```
+-------------------------------------------------------------------------------+
|                             APPLICATION DOMAIN                                |
|   (Registration Action / Admin Schedule Dispatch / Fan Card Status Advance)   |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       EMAIL DISPATCHER & TEMPLATE ENGINE                      |
|                                                                               |
|  - Renders HTML & Text Templates (VIP Gold & Black Theme)                     |
|  - Logs 'QUEUED' event to public.email_events                                 |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                         ABSTRACT EMAIL PROVIDER INTERFACE                     |
|                                                                               |
|       interface EmailProvider {                                               |
|           send(message: EmailMessage): Promise<EmailSendResult>;              |
|       }                                                                       |
+---------+-----------------------------+-----------------------------+---------+
          |                             |                             |
          v                             v                             v
+--------------------+       +--------------------+       +---------------------+
|  ConsoleProvider   |       |    SmtpProvider    |       |   ResendProvider    |
| (Local Dev / Test) |       | (Gmail / Staging)  |       | (Production Domain) |
+--------------------+       +--------------------+       +---------------------+
          |                             |                             |
          +-----------------------------+-----------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       AUDIT & EVENT RECORDING (Supabase)                      |
|                                                                               |
|  - Updates public.email_events: status ('SENT' or 'FAILED')                   |
|  - Captures provider_message_id and error diagnostics                         |
+-------------------------------------------------------------------------------+
```

---

## 2. Core Types & Interfaces

```typescript
export type EmailType =
  | 'REGISTRATION_CONFIRMATION'
  | 'SCHEDULE_NOTIFICATION'
  | 'SCHEDULE_UPDATE'
  | 'FAN_CARD_STATUS_UPDATE'
  | 'ADMIN_ALERT';

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailMessage {
  to: EmailRecipient;
  type: EmailType;
  subject: string;
  html: string;
  text: string;
  referenceId?: {
    fanId?: string;
    registrationId?: string;
    fanCardId?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'CONSOLE_TEST' | 'SMTP' | 'RESEND';
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
```

---

## 3. Provider Implementations

### 3.1 Console Provider (`ConsoleProvider`)
Active during development and offline unit testing. Logs the full subject, recipient, plain-text body, and rendered HTML length to terminal logs.

### 3.2 SMTP / Gmail Provider (`SmtpProvider`)
Utilizes `nodemailer` with standard SMTP or Gmail App Passwords:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=kwmeetngreet@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM="Kountry Wayne VIP <kwmeetngreet@gmail.com>"
```

### 3.3 Resend Production Provider (`ResendProvider`)
Connects via official SDK or HTTPS REST API to Resend with high deliverability, DKIM, SPF, and DMARC:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Kountry Wayne VIP <vip@kountrywaynetour.com>"
```

---

## 4. Transactional Email Templates & Triggers

### 4.1 Registration Confirmation
- **Trigger**: Automatically dispatched upon successful fan registration.
- **Subject**: `🎟️ VIP Registration Confirmed - Your Private Kountry Wayne Tracking Code`
- **Key Payload**:
  - Fan Preferred Name
  - Tour City & Tour Date
  - **Cryptographic Tracking Code** (`KW-XXXX-XXXX`)
  - Important notice: *"Your Meet & Greet time and secret location will be scheduled by our tour team. Check your tracking link anytime to view status updates."*
  - Direct tracking button link: `https://vip.kountrywayne.com/track?code=KW-XXXX-XXXX`

### 4.2 Schedule Notification
- **Trigger**: Explicitly fired by Tour Coordinator from Admin Console when a fan's time slot and venue are confirmed.
- **Subject**: `⭐ Your Kountry Wayne Meet & Greet Schedule is Confirmed! (City: {CityName})`
- **Key Payload**:
  - Assigned Date
  - Mandatory Arrival / Check-in Time
  - VIP Venue Name & Secret Address
  - Security, ID requirement, and dress code instructions
  - VIP Coordinator contact information

### 4.3 Fan Card Physical Status Advance
- **Trigger**: Optionally fired when an admin updates a Fan Card to `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, or `DELIVERED`.
- **Subject**: `📦 Your Kountry Wayne VIP Fan Card is {StatusTitle}`
- **Key Payload**:
  - Current status with progress visual
  - Destination City & State
  - Link to the live tracking page

---

## 5. Visual Design System for Emails

All emails adhere to the high-end VIP aesthetic:
- **Canvas**: Obsidian Dark (`#0E0E10`)
- **Card Container**: Rich Charcoal (`#1A1A1E`) with subtle gold border (`#D4AF37` / 1px solid)
- **Accents & Badges**: Metallic Gold gradient (`#E5C07B` to `#D4AF37`)
- **Typography**: Clean sans-serif (`Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Tracking Badge**: Monospaced, high-contrast, large tracking code box with one-click copy and track link.
- **Mobile Responsive**: Single-column 600px container centered, with 16px minimum text size for readability on smartphones.

---

## 6. Resilience, Queueing & Error Handling

1. **Non-Blocking Execution**: Fan registration transactions are committed to Supabase before email dispatch begins. If the email provider is temporarily unavailable:
   - Registration succeeds and the tracking code is displayed immediately on the confirmation page.
   - An event is created in `public.email_events` with status `FAILED` and the error message.
2. **Admin Resend Capability**: From the Admin Console (`/admin/registrations` or `/admin/fan-cards`), admins have a "Resend Email" button to re-trigger confirmation, scheduling, or tracking emails at any time.
3. **Audit Log Integration**: Every dispatch attempt records the provider used, timestamp, recipient, and provider message ID.
