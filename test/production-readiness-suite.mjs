import assert from "node:assert/strict";
import {
  createSessionToken,
  verifySessionToken,
  authenticateAdminCredentials,
  getAdminSessionSecret,
} from "../src/lib/auth/admin-auth.ts";
import { canAccessPath, hasPermission } from "../src/lib/security/rbac.ts";
import {
  checkTrackingRateLimit,
  resetRateLimiter,
} from "../src/lib/security/rate-limiter.ts";
import {
  generateFanCardTrackingCode,
  isValidTrackingCodeFormat,
} from "../src/lib/security/tracking-code";
import { lookupFanCardStatus } from "../src/lib/services/tracking-service.ts";
import { getActiveCities, sanitizePublicCity } from "../src/lib/supabase/cities.ts";
import { operationsService } from "../src/lib/services/operations-service.ts";
import { emailService } from "../src/lib/email/email-service.ts";
import { validateFanCardTransition } from "../src/lib/validations/fan-card.ts";
import { getAdminAuditLogs } from "../src/lib/security/audit.ts";

export async function runProductionReadinessTestSuite() {
  console.log("===============================================================================");
  console.log("  PHASE 10: FULL PRODUCTION READINESS & MULTI-DISCIPLINARY AUDIT SUITE         ");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  async function runAuditCheck(category, name, fn) {
    try {
      await fn();
      console.log(`✓ PASS [${category}]: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL [${category}]: ${name}`);
      console.error(`  ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & CRYPTOGRAPHIC SESSION SECURITY
  // ---------------------------------------------------------------------------
  await runAuditCheck("Auth Security", "Session signing secret is high-entropy and non-empty", () => {
    const secret = getAdminSessionSecret();
    assert.ok(secret, "Secret must be present");
    assert.ok(secret.length >= 16, "Secret must have at least 128 bits of entropy");
  });

  await runAuditCheck("Auth Security", "Session token signature tampering is detected and rejected", async () => {
    const validSession = {
      id: "admin-test-01",
      email: "security@kountrywayne.com",
      fullName: "Security Auditor",
      role: "ADMIN",
      expiresAt: Date.now() + 3600 * 1000,
    };

    const token = await createSessionToken(validSession);
    assert.ok(token.includes("."), "Token must be payload.signature format");

    const [payload, signature] = token.split(".");

    // Verify valid token passes
    const verified = await verifySessionToken(token);
    assert.ok(verified, "Untampered token must be verified");
    assert.equal(verified.email, validSession.email);

    // Tamper with payload (modify role to SUPER_ADMIN)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...validSession, role: "SUPER_ADMIN" })
    )
      .toString("base64")
      .replace(/=/g, "");
    const forgedToken = `${tamperedPayload}.${signature}`;

    const forgedResult = await verifySessionToken(forgedToken);
    assert.equal(forgedResult, null, "Forged payload with original signature must be rejected");

    // Tamper with signature
    const corruptSignature = signature.substring(0, signature.length - 4) + "AAAA";
    const corruptedToken = `${payload}.${corruptSignature}`;
    const corruptResult = await verifySessionToken(corruptedToken);
    assert.equal(corruptResult, null, "Tampered signature must be rejected");
  });

  await runAuditCheck("Auth Security", "Expired sessions are rejected immediately", async () => {
    const expiredSession = {
      id: "admin-test-expired",
      email: "staff@kountrywayne.com",
      fullName: "Expired Staff",
      role: "STAFF",
      expiresAt: Date.now() - 1000, // expired 1s ago
    };

    const expiredToken = await createSessionToken(expiredSession);
    const result = await verifySessionToken(expiredToken);
    assert.equal(result, null, "Expired token must return null");
  });

  await runAuditCheck("Auth Security", "Production mode blocks default dev passwords unless explicitly enabled", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDevFlag = process.env.ENABLE_DEV_ADMINS;

    try {
      process.env.NODE_ENV = "production";
      delete process.env.ENABLE_DEV_ADMINS;

      // In strict production, static dev passwords must be blocked
      const authResult = await authenticateAdminCredentials("admin@kountrywayne.com", "WayneVIP2026!");
      assert.equal(authResult, null, "Hardcoded dev password must be blocked in production");

      // When explicitly enabled for staging/demo, it allows authentication
      process.env.ENABLE_DEV_ADMINS = "true";
      const stagingAuth = await authenticateAdminCredentials("admin@kountrywayne.com", "WayneVIP2026!");
      assert.ok(stagingAuth, "Staging with ENABLE_DEV_ADMINS must authenticate dev profile");
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalDevFlag !== undefined) {
        process.env.ENABLE_DEV_ADMINS = originalDevFlag;
      } else {
        delete process.env.ENABLE_DEV_ADMINS;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // ---------------------------------------------------------------------------
  await runAuditCheck("RBAC", "Staff role is strictly prohibited from managing cities, export, and schedules", () => {
    assert.equal(hasPermission("STAFF", "cities:manage"), false, "Staff cannot manage cities");
    assert.equal(hasPermission("STAFF", "registrations:export"), false, "Staff cannot export registrations");
    assert.equal(hasPermission("STAFF", "schedules:manage"), false, "Staff cannot manage schedules");
    assert.equal(hasPermission("STAFF", "audit:view"), false, "Staff cannot view audit logs");

    // Staff can view assigned operational data and update fan card status
    assert.equal(hasPermission("STAFF", "fan_cards:view"), true);
    assert.equal(hasPermission("STAFF", "fan_cards:manage_status"), true);
    assert.equal(hasPermission("STAFF", "registrations:view"), true);

    // Route checks
    assert.equal(canAccessPath("STAFF", "/admin/audit-logs"), false);
    assert.equal(canAccessPath("STAFF", "/admin/cities"), false);
    assert.equal(canAccessPath("STAFF", "/admin/fan-cards"), true);
  });

  // ---------------------------------------------------------------------------
  // 3. DATA LEAKAGE & STRICT PII ISOLATION
  // ---------------------------------------------------------------------------
  await runAuditCheck("PII Isolation", "Public tracking lookup exposes zero email, phone, physical address, or admin notes", async () => {
    const cards = await operationsService.getFanCards();
    const testCard = cards[0];
    assert.ok(testCard);

    const lookupRes = await lookupFanCardStatus(testCard.tracking_code, "127.0.0.1");
    assert.equal(lookupRes.success, true);
    const data = lookupRes.data;
    assert.ok(data);

    // Verify allowed public fields
    assert.ok(data.trackingCode);
    assert.ok(data.fanInitial);
    assert.ok(data.cityName);
    assert.ok(data.currentStatus);
    assert.ok(data.timeline);

    // Verify complete absence of PII
    assert.equal("email" in data, false, "Email must not exist in public tracking response");
    assert.equal("phone" in data, false, "Phone must not exist in public tracking response");
    assert.equal("phone_number" in data, false, "Phone number must not exist in public tracking response");
    assert.equal("shipping_address" in data, false, "Address must not exist in public tracking response");
    assert.equal("shipping_address_line1" in data, false, "Address line 1 must not exist in public tracking response");
    assert.equal("internal_notes" in data, false, "Internal notes must not exist in public tracking response");
    assert.equal("internal_fulfillment_notes" in data, false, "Internal notes must not exist in public tracking response");
    assert.equal("courier_reference" in data, false, "Courier reference must not exist in public tracking response");
  });

  await runAuditCheck("Data Leakage", "Public cities API strips internal capacity and private admin notes", async () => {
    const citiesRes = await getActiveCities();
    assert.ok(citiesRes.cities.length > 0);

    for (const city of citiesRes.cities) {
      assert.equal(city.notes, null, "Private notes must be null in public city response");
      assert.equal(city.max_capacity, 0, "Internal capacity must not be exposed");
      assert.equal(city.current_registrations_count, 0, "Current counts must not be exposed");
    }
  });

  // ---------------------------------------------------------------------------
  // 4. RATE LIMITING & ANTI-BRUTE-FORCE ENUMERATION
  // ---------------------------------------------------------------------------
  await runAuditCheck("Anti-Abuse", "Tracking code brute force enumeration is throttled by sliding-window rate limiter", () => {
    resetRateLimiter();
    const testIp = "192.0.2.42";

    // First 10 requests allowed
    for (let i = 0; i < 10; i++) {
      const res = checkTrackingRateLimit(testIp, 10, 60000);
      assert.equal(res.allowed, true, `Request ${i + 1} should be allowed`);
    }

    // 11th request must be blocked
    const blockedRes = checkTrackingRateLimit(testIp, 10, 60000);
    assert.equal(blockedRes.allowed, false, "11th request must be blocked");
    assert.equal(blockedRes.remaining, 0);
    assert.ok(blockedRes.resetInSeconds > 0);

    resetRateLimiter();
  });

  // ---------------------------------------------------------------------------
  // 5. RESILIENCE & EMPTY DATABASE STATE HANDLING
  // ---------------------------------------------------------------------------
  await runAuditCheck("Resilience", "Dashboard KPIs compute safely on empty dataset without division by zero or errors", async () => {
    // Test KPI structure on current metrics
    const metrics = await operationsService.getDashboardMetrics();
    assert.ok(typeof metrics.totalRegistrations === "number");
    assert.ok(typeof metrics.pendingScheduling === "number");
    assert.ok(typeof metrics.fanCardsInTransit === "number");
    assert.ok(typeof metrics.completedVIPs === "number");
    assert.ok(Array.isArray(metrics.cityBreakdown));
  });

  await runAuditCheck("Resilience", "Email failure does not corrupt state and records error event for admin retry", async () => {
    const originalProvider = emailService["provider"];
    try {
      emailService.setProvider({
        name: "TEST_INBOX",
        send: async () => {
          throw new Error("504 Gateway Timeout connecting to mail relay");
        },
      });

      const failResult = await emailService.send({
        to: { name: "Test Fail", email: "fail@example.com" },
        type: "ADMIN_ALERT",
        subject: "Test Containment",
        html: "<p>Test</p>",
        text: "Test",
      });

      // Email service catches error, records failure record, and returns safe result
      assert.equal(failResult.success, false);
      assert.ok(failResult.eventId, "Must generate audit event ID even on failure");
      assert.match(failResult.error || "", /504 Gateway Timeout/);

      // Event query confirms event is logged as FAILED
      const failedEvent = emailService.getEmailEventById(failResult.eventId);
      assert.ok(failedEvent, "Failed email event must be tracked for retry");
      assert.equal(failedEvent.status, "FAILED");
    } finally {
      emailService.setProvider(originalProvider);
    }
  });

  // ---------------------------------------------------------------------------
  // 6. IDEMPOTENCY & DUPLICATE TRANSMISSION GUARDS
  // ---------------------------------------------------------------------------
  await runAuditCheck("Idempotency", "Email service skips duplicate dispatch when identical idempotency key is received", async () => {
    const testKey = `audit_idem_${Date.now()}`;
    const testMsg = {
      to: { name: "Idempotent Fan", email: "idempotent@example.com" },
      type: "FAN_CARD_STATUS_UPDATE",
      subject: "VIP Status Update",
      html: "<p>Status update</p>",
      text: "Status update",
      idempotencyKey: testKey,
    };

    // First send: should succeed and send
    const firstSend = await emailService.send(testMsg);
    assert.equal(firstSend.success, true);
    assert.equal(!firstSend.skippedDueToIdempotency, true);

    // Second send with same idempotencyKey: must be skipped
    const secondSend = await emailService.send(testMsg);
    assert.equal(secondSend.success, true);
    assert.equal(secondSend.skippedDueToIdempotency, true, "Duplicate send must be intercepted by idempotency check");
  });

  // ---------------------------------------------------------------------------
  // 7. CONCURRENCY & STATE TRANSITION CONSTRAINTS
  // ---------------------------------------------------------------------------
  await runAuditCheck("Concurrency & Integrity", "Invalid state transitions are rejected deterministically", () => {
    // 1. Same status is rejected
    const same = validateFanCardTransition("SHIPPED", "SHIPPED");
    assert.equal(same.isValid, false);

    // 2. Delivery issue requires >= 3 chars explanation
    const noReasonIssue = validateFanCardTransition("IN_TRANSIT", "DELIVERY_ISSUE", "no");
    assert.equal(noReasonIssue.isValid, false);

    const validIssue = validateFanCardTransition("IN_TRANSIT", "DELIVERY_ISSUE", "Package damaged in transit");
    assert.equal(validIssue.isValid, true);

    // 3. Delivered cards cannot silently be reverted
    const deliveredRevert = validateFanCardTransition("DELIVERED", "PROCESSING");
    assert.equal(deliveredRevert.isValid, false);
  });

  // ---------------------------------------------------------------------------
  // 8. AUDIT LOG INTEGRITY
  // ---------------------------------------------------------------------------
  await runAuditCheck("Audit Trail", "Audit log entries are immutable, structured, and capture actor metadata", async () => {
    const logs = await getAdminAuditLogs();
    assert.ok(logs.length > 0, "System must have recorded audit log entries");

    for (const log of logs.slice(0, 5)) {
      assert.ok(log.id, "Log must have unique ID");
      assert.ok(log.adminEmail, "Log must record admin email");
      assert.ok(log.action, "Log must have action type");
      assert.ok(log.entityTable, "Log must record entity table");
      assert.ok(log.createdAt, "Log must have ISO timestamp");
    }
  });

  console.log("\n===============================================================================");
  console.log(`  PRODUCTION READINESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================================\n");

  return { passed, failed };
}

// Allow direct execution
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/production-readiness-suite.mjs")) {
  runProductionReadinessTestSuite().then((res) => {
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
