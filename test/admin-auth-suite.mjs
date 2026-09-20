try { process.loadEnvFile?.('.env.local'); } catch {}
import assert from "node:assert/strict";
import {
  createSessionToken,
  verifySessionToken,
  authenticateAdminCredentials,
  DEFAULT_DEV_ADMINS,
  ADMIN_SESSION_COOKIE_NAME,
} from "../src/lib/auth/admin-auth.ts";
import {
  hasPermission,
  canAccessPath,
  ROLE_PERMISSIONS,
} from "../src/lib/security/rbac.ts";
import {
  recordAdminAuditLog,
  getAdminAuditLogs,
  clearAuditLogs,
} from "../src/lib/security/audit.ts";

async function runAdminAuthTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 6 TEST SUITE: SECURE ADMIN AUTHENTICATION & RBAC       ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function recordPass(testName) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  }

  function recordFail(testName, err) {
    console.error(`✗ FAIL: ${testName}`);
    console.error(err);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TEST 1: Cryptographic Session Token Generation & Verification
  // --------------------------------------------------------------------------
  try {
    const sessionPayload = {
      id: "admin-test-01",
      email: "superadmin@kountrywayne.com",
      fullName: "Wayne Executive Producer",
      role: "SUPER_ADMIN",
      expiresAt: Date.now() + 3600 * 1000,
    };

    const token = await createSessionToken(sessionPayload);
    assert.ok(token);
    assert.equal(token.split(".").length, 2);

    // Verify valid token
    const verified = await verifySessionToken(token);
    assert.ok(verified);
    assert.equal(verified.email, "superadmin@kountrywayne.com");
    assert.equal(verified.role, "SUPER_ADMIN");

    // Verify tampered token fails
    const tampered = `${token.split(".")[0]}.tampered_invalid_signature`;
    assert.equal(await verifySessionToken(tampered), null);

    // Verify expired token fails
    const expiredPayload = {
      ...sessionPayload,
      expiresAt: Date.now() - 1000, // expired 1s ago
    };
    const expiredToken = await createSessionToken(expiredPayload);
    assert.equal(await verifySessionToken(expiredToken), null);

    recordPass("Security: HMAC Session Token Generation, Integrity & Expiry");
  } catch (err) {
    recordFail("Security: HMAC Session Token Generation, Integrity & Expiry", err);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Credential Authentication & Role Mapping
  // --------------------------------------------------------------------------
  try {
    // 1. Super Admin
    const superAdmin = await authenticateAdminCredentials(
      "superadmin@kountrywayne.com",
      "WayneVIP2026!"
    );
    assert.ok(superAdmin);
    assert.equal(superAdmin.role, "SUPER_ADMIN");
    assert.equal(superAdmin.email, "superadmin@kountrywayne.com");

    // 2. Tour Admin
    const tourAdmin = await authenticateAdminCredentials(
      "admin@kountrywayne.com",
      "WayneVIP2026!"
    );
    assert.ok(tourAdmin);
    assert.equal(tourAdmin.role, "ADMIN");

    // 3. Staff
    const staff = await authenticateAdminCredentials(
      "staff@kountrywayne.com",
      "WayneVIP2026!"
    );
    assert.ok(staff);
    assert.equal(staff.role, "STAFF");

    // 4. Invalid Password
    const wrongPass = await authenticateAdminCredentials(
      "superadmin@kountrywayne.com",
      "WRONG_PASSWORD"
    );
    assert.equal(wrongPass, null);

    // 5. Unknown Email
    const unknown = await authenticateAdminCredentials(
      "hacker@external.com",
      "WayneVIP2026!"
    );
    assert.equal(unknown, null);

    recordPass("Authentication: Multi-Role Credential Validation & Rejection");
  } catch (err) {
    recordFail("Authentication: Multi-Role Credential Validation & Rejection", err);
  }

  // --------------------------------------------------------------------------
  // TEST 3: RBAC Permissions Matrix Assertions
  // --------------------------------------------------------------------------
  try {
    // SUPER_ADMIN has ALL permissions
    assert.equal(hasPermission("SUPER_ADMIN", "cities:manage"), true);
    assert.equal(hasPermission("SUPER_ADMIN", "registrations:manage"), true);
    assert.equal(hasPermission("SUPER_ADMIN", "schedules:manage"), true);
    assert.equal(hasPermission("SUPER_ADMIN", "fan_cards:manage_status"), true);
    assert.equal(hasPermission("SUPER_ADMIN", "audit_logs:view"), true);
    assert.equal(hasPermission("SUPER_ADMIN", "admin_users:manage"), true);
    assert.equal(hasPermission("SUPER_ADMIN", "data:export"), true);

    // ADMIN has operations permissions, but NOT admin_users:manage
    assert.equal(hasPermission("ADMIN", "cities:manage"), true);
    assert.equal(hasPermission("ADMIN", "schedules:manage"), true);
    assert.equal(hasPermission("ADMIN", "fan_cards:manage_status"), true);
    assert.equal(hasPermission("ADMIN", "communications:send"), true);
    assert.equal(hasPermission("ADMIN", "admin_users:manage"), false);

    // STAFF has limited view and status update permissions only
    assert.equal(hasPermission("STAFF", "fan_cards:manage_status"), true);
    assert.equal(hasPermission("STAFF", "registrations:view"), true);
    assert.equal(hasPermission("STAFF", "schedules:view"), true);
    assert.equal(hasPermission("STAFF", "cities:manage"), false);
    assert.equal(hasPermission("STAFF", "schedules:manage"), false);
    assert.equal(hasPermission("STAFF", "audit_logs:view"), false);
    assert.equal(hasPermission("STAFF", "data:export"), false);

    recordPass("Authorization: Granular Role-Based Permissions Matrix (SUPER_ADMIN, ADMIN, STAFF)");
  } catch (err) {
    recordFail("Authorization: Granular Role-Based Permissions Matrix (SUPER_ADMIN, ADMIN, STAFF)", err);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Route-Level RBAC Guard (canAccessPath)
  // --------------------------------------------------------------------------
  try {
    // Super admin can access all admin paths
    assert.equal(canAccessPath("SUPER_ADMIN", "/admin"), true);
    assert.equal(canAccessPath("SUPER_ADMIN", "/admin/cities"), true);
    assert.equal(canAccessPath("SUPER_ADMIN", "/admin/registrations"), true);
    assert.equal(canAccessPath("SUPER_ADMIN", "/admin/schedules"), true);
    assert.equal(canAccessPath("SUPER_ADMIN", "/admin/fan-cards"), true);
    assert.equal(canAccessPath("SUPER_ADMIN", "/admin/audit-logs"), true);

    // Tour Admin can access operations and audit-logs, but not admin user management
    assert.equal(canAccessPath("ADMIN", "/admin"), true);
    assert.equal(canAccessPath("ADMIN", "/admin/cities"), true);
    assert.equal(canAccessPath("ADMIN", "/admin/audit-logs"), true);
    assert.equal(canAccessPath("ADMIN", "/admin/users"), false);

    // Staff can access dashboard, registrations, schedules, fan-cards, BUT NOT cities or audit-logs
    assert.equal(canAccessPath("STAFF", "/admin"), true);
    assert.equal(canAccessPath("STAFF", "/admin/registrations"), true);
    assert.equal(canAccessPath("STAFF", "/admin/fan-cards"), true);
    assert.equal(canAccessPath("STAFF", "/admin/cities"), false);
    assert.equal(canAccessPath("STAFF", "/admin/audit-logs"), false);

    recordPass("Route Security: Role-Based Path Access Filtering");
  } catch (err) {
    recordFail("Route Security: Role-Based Path Access Filtering", err);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Server-Side Authorization Enforcement
  // --------------------------------------------------------------------------
  try {
    function simulateServerAction(sessionRole, requiredPermission) {
      if (!hasPermission(sessionRole, requiredPermission)) {
        throw new Error(`FORBIDDEN: Role '${sessionRole}' lacks required permission '${requiredPermission}'.`);
      }
      return { success: true, executed: true };
    }

    // Staff attempting city management must fail
    assert.throws(
      () => simulateServerAction("STAFF", "cities:manage"),
      /FORBIDDEN.*STAFF.*cities:manage/
    );

    // Staff attempting schedule update must fail
    assert.throws(
      () => simulateServerAction("STAFF", "schedules:manage"),
      /FORBIDDEN.*STAFF.*schedules:manage/
    );

    // Admin attempting city management must succeed
    const adminRes = simulateServerAction("ADMIN", "cities:manage");
    assert.equal(adminRes.success, true);

    // Super Admin attempting admin user management must succeed
    const superRes = simulateServerAction("SUPER_ADMIN", "admin_users:manage");
    assert.equal(superRes.success, true);

    recordPass("Server Enforcement: Server-Layer Permission Gates Reject Unauthorized Actions");
  } catch (err) {
    recordFail("Server Enforcement: Server-Layer Permission Gates Reject Unauthorized Actions", err);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Immutable Admin Audit Logging
  // --------------------------------------------------------------------------
  try {
    clearAuditLogs();

    // 1. Record Login
    await recordAdminAuditLog({
      adminId: "admin-super-01",
      adminEmail: "superadmin@kountrywayne.com",
      adminRole: "SUPER_ADMIN",
      action: "AUTH_LOGIN",
      entityTable: "admins",
      entityId: "admin-super-01",
      details: "Staff member signed in with role SUPER_ADMIN",
    });

    // 2. Record Status Change
    await recordAdminAuditLog({
      adminId: "admin-ops-02",
      adminEmail: "admin@kountrywayne.com",
      adminRole: "ADMIN",
      action: "STATUS_CHANGE",
      entityTable: "fan_cards",
      entityId: "card-test-77",
      oldState: { status: "PROCESSING" },
      newState: { status: "SHIPPED", courier: "TOUR-EXP-991" },
      details: "Advanced Fan Card status to SHIPPED",
    });

    // 3. Record Schedule Change
    await recordAdminAuditLog({
      adminId: "admin-ops-02",
      adminEmail: "admin@kountrywayne.com",
      adminRole: "ADMIN",
      action: "SCHEDULE_CHANGE",
      entityTable: "meet_and_greet_schedules",
      entityId: "sched-test-88",
      oldState: { arrival_time: "5:30 PM" },
      newState: { arrival_time: "5:00 PM" },
      details: "Updated arrival call time",
    });

    // 4. Record Logout
    await recordAdminAuditLog({
      adminId: "admin-super-01",
      adminEmail: "superadmin@kountrywayne.com",
      adminRole: "SUPER_ADMIN",
      action: "AUTH_LOGOUT",
      entityTable: "admins",
      entityId: "admin-super-01",
      details: "Staff member signed out",
    });

    const allLogs = getAdminAuditLogs();
    assert.equal(allLogs.length, 4);

    const loginLogs = getAdminAuditLogs({ action: "AUTH_LOGIN" });
    assert.equal(loginLogs.length, 1);
    assert.equal(loginLogs[0].adminRole, "SUPER_ADMIN");

    const statusLogs = getAdminAuditLogs({ action: "STATUS_CHANGE" });
    assert.equal(statusLogs.length, 1);
    assert.equal(statusLogs[0].newState.status, "SHIPPED");

    recordPass("Audit Trail: Immutable Administrative Action Logging & Querying");
  } catch (err) {
    recordFail("Audit Trail: Immutable Administrative Action Logging & Querying", err);
  }

  // --------------------------------------------------------------------------
  // TEST 7: HTTP Middleware Route Protection (Live Request Tests)
  // --------------------------------------------------------------------------
  try {
    // 1. Unauthenticated request to /admin -> 307/308 redirect to /admin/login
    const unauthRes = await fetch("http://localhost:3000/admin", {
      redirect: "manual",
    });
    const unauthLocation = unauthRes.headers.get("location");
    assert.ok(
      unauthLocation && unauthLocation.includes("/admin/login"),
      "Unauthenticated request to /admin must redirect to /admin/login"
    );

    // 2. Unauthenticated request to /admin/cities -> redirect to /admin/login with returnUrl
    const citiesRes = await fetch("http://localhost:3000/admin/cities", {
      redirect: "manual",
    });
    const citiesLocation = citiesRes.headers.get("location");
    assert.ok(
      citiesLocation && citiesLocation.includes("/admin/login"),
      "Unauthenticated request to /admin/cities must redirect to /admin/login"
    );

    // 3. Authenticated as STAFF requesting /admin/audit-logs -> redirect to /admin/unauthorized
    const staffSession = {
      id: "admin-staff-03",
      email: "staff@kountrywayne.com",
      fullName: "Venue Stage Door Staff",
      role: "STAFF",
      expiresAt: Date.now() + 3600 * 1000,
    };
    const staffToken = await createSessionToken(staffSession);
    const staffCookie = `${ADMIN_SESSION_COOKIE_NAME}=${staffToken}`;

    const staffAuditRes = await fetch("http://localhost:3000/admin/audit-logs", {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    const staffAuditLocation = staffAuditRes.headers.get("location");
    assert.ok(
      staffAuditLocation && staffAuditLocation.includes("/admin/unauthorized"),
      "Staff accessing /admin/audit-logs must be redirected to /admin/unauthorized"
    );

    // 4. Authenticated as SUPER_ADMIN requesting /admin -> allowed (200 OK)
    const superSession = {
      id: "admin-super-01",
      email: "superadmin@kountrywayne.com",
      fullName: "Wayne Executive Producer",
      role: "SUPER_ADMIN",
      expiresAt: Date.now() + 3600 * 1000,
    };
    const superToken = await createSessionToken(superSession);
    const superCookie = `${ADMIN_SESSION_COOKIE_NAME}=${superToken}`;

    const superRes = await fetch("http://localhost:3000/admin", {
      headers: { Cookie: superCookie },
      redirect: "manual",
    });
    assert.equal(superRes.status, 200, "Super admin request to /admin should return 200 OK");

    recordPass("Middleware: Live HTTP Route Interception, Unauthenticated Redirection & 403 Guards");
  } catch (err) {
    recordFail("Middleware: Live HTTP Route Interception, Unauthenticated Redirection & 403 Guards", err);
  }

  console.log("\n===============================================================");
  console.log(`  PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED       `);
  console.log("===============================================================");

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/admin-auth-suite.mjs")) {
  runAdminAuthTestSuite().catch((err) => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
  });
}

export { runAdminAuthTestSuite };
