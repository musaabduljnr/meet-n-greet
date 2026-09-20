try { process.loadEnvFile?.('.env.local'); } catch {}
process.env.ENABLE_DEV_ADMINS = "true";

import assert from "node:assert/strict";
import { processRegistration } from "../src/lib/services/registration-service.ts";
import { lookupFanCardStatus } from "../src/lib/services/tracking-service.ts";
import {
  authenticateAdminCredentials,
  createSessionToken,
} from "../src/lib/auth/admin-auth.ts";
import { operationsService } from "../src/lib/services/operations-service.ts";
import { emailService } from "../src/lib/email/email-service.ts";
import { getActiveCities } from "../src/lib/supabase/cities.ts";

async function runProductionSmokeTest() {
  console.log("===============================================================================");
  console.log("  KOUNTRY WAYNE VIP PLATFORM: 17-STEP PRODUCTION SMOKE TEST                    ");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  function recordPass(stepNum, description) {
    console.log(`✓ STEP ${stepNum} PASS: ${description}`);
    passed++;
  }

  function recordFail(stepNum, description, error) {
    console.error(`✗ STEP ${stepNum} FAIL: ${description}`);
    console.error("  ", error.message || error);
    failed++;
  }

  let testContext = {
    cityId: null,
    cityName: null,
    registrationId: null,
    fanId: null,
    trackingCode: null,
    fanCardId: null,
    adminSession: null,
    adminToken: null,
  };

  // --------------------------------------------------------------------------
  // STEP 1: Open Homepage
  // --------------------------------------------------------------------------
  try {
    const res = await fetch("http://127.0.0.1:3000/", { redirect: "follow" });
    assert.equal(res.status, 200, "Homepage must return HTTP 200 OK");
    const html = await res.text();
    assert.ok(html.includes("Kountry Wayne") || html.includes("Meet & Greet"), "Homepage must include VIP brand title");
    recordPass(1, "Open Homepage & Verify HTTP 200 OK with VIP branding");
  } catch (err) {
    recordFail(1, "Open Homepage", err);
  }

  // --------------------------------------------------------------------------
  // STEP 2: Select City
  // --------------------------------------------------------------------------
  try {
    const { cities } = await getActiveCities();
    assert.ok(Array.isArray(cities) && cities.length > 0, "Must retrieve active tour cities");
    const atlanta = cities.find((c) => c.name.toLowerCase() === "atlanta") || cities[0];
    assert.ok(atlanta, "Must find Atlanta tour stop or active city");
    testContext.cityId = atlanta.id;
    testContext.cityName = atlanta.name;
    recordPass(2, `Select City: Chosen tour stop '${atlanta.name}, ${atlanta.state}' (ID: ${atlanta.id})`);
  } catch (err) {
    recordFail(2, "Select City", err);
  }

  // --------------------------------------------------------------------------
  // STEP 3: Register Fan
  // --------------------------------------------------------------------------
  const uniqueSuffix = Date.now().toString(36);
  const fanProfile = {
    firstName: "Marcus",
    lastName: "Vance",
    preferredName: "Marc",
    email: `marcus.vance.${uniqueSuffix}@example.com`,
    phone: "(404) 555-0192",
    cityId: testContext.cityId,
    shippingAddressLine1: "1240 Peachtree St NE",
    shippingAddressLine2: "Suite 400",
    shippingCity: "Atlanta",
    shippingState: "GA",
    shippingPostalCode: "30309",
    specialNotes: "Lifetime fan, excited for the Fox Theatre VIP experience!",
  };

  try {
    const regResult = await processRegistration({
      firstName: fanProfile.firstName,
      lastName: fanProfile.lastName,
      email: fanProfile.email,
      phone: fanProfile.phone,
      cityId: fanProfile.cityId,
      notes: fanProfile.specialNotes,
    });
    assert.equal(regResult.success, true, "Registration must succeed");

    // Retrieve the newly created registration from operations store
    const adminRegs = await operationsService.getRegistrations({ search: fanProfile.email });
    assert.ok(adminRegs.length > 0, "Registration record must be located in store");
    const regRecord = adminRegs[0];

    testContext.registrationId = regRecord.id;
    testContext.fanId = regRecord.fan.id;
    testContext.trackingCode = regRecord.fanCard.tracking_code;
    testContext.fanCardId = regRecord.fanCard.id;

    recordPass(3, `Register: VIP registration accepted for ${fanProfile.firstName} ${fanProfile.lastName}`);
  } catch (err) {
    recordFail(3, "Register Fan", err);
  }

  // --------------------------------------------------------------------------
  // STEP 4: Verify Database Record
  // --------------------------------------------------------------------------
  try {
    const regRecord = await operationsService.getRegistrationById(testContext.registrationId);
    assert.ok(regRecord, "Must retrieve registration from database");
    assert.equal(regRecord.fan.email, fanProfile.email.toLowerCase(), "Database record email must match");
    assert.equal(regRecord.city.id, testContext.cityId, "Database city must match selected tour city");
    recordPass(4, `Verify Database Record: Confirmed registration ${testContext.registrationId} exists with normalized email`);
  } catch (err) {
    recordFail(4, "Verify Database Record", err);
  }

  // --------------------------------------------------------------------------
  // STEP 5: Verify Fan Card Generated
  // --------------------------------------------------------------------------
  try {
    assert.ok(testContext.fanCardId, "Fan Card ID must be present");
    const regRecord = await operationsService.getRegistrationById(testContext.registrationId);
    assert.ok(regRecord.fanCard, "Fan Card entity must be linked to registration");
    assert.equal(regRecord.fanCard.current_status, "REGISTERED", "Initial Fan Card status must be REGISTERED");
    recordPass(5, `Verify Fan Card Generated: Linked Fan Card ${testContext.fanCardId} created with status 'REGISTERED'`);
  } catch (err) {
    recordFail(5, "Verify Fan Card Generated", err);
  }

  // --------------------------------------------------------------------------
  // STEP 6: Verify Tracking Code Format
  // --------------------------------------------------------------------------
  try {
    const code = testContext.trackingCode;
    const trackingCodeRegex = /^KWFC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
    assert.ok(
      trackingCodeRegex.test(code),
      `Tracking code '${code}' must conform to strict KWFC-XXXX-XXXX format`
    );
    recordPass(6, `Verify Tracking Code: Verified cryptographic format '${code}'`);
  } catch (err) {
    recordFail(6, "Verify Tracking Code Format", err);
  }

  // --------------------------------------------------------------------------
  // STEP 7: Verify Registration Email Event
  // --------------------------------------------------------------------------
  try {
    const events = emailService.getEmailEvents();
    const regEmail = events.find(
      (e) =>
        e.email_type === "REGISTRATION_CONFIRMATION" &&
        e.recipient_email.toLowerCase() === fanProfile.email.toLowerCase()
    );
    assert.ok(regEmail, "Registration confirmation email must be recorded in email events");
    assert.equal(regEmail.status, "SENT", "Registration confirmation email status must be SENT");
    recordPass(7, `Verify Registration Email: Confirmed transactional email event '${regEmail.id}' sent to ${regEmail.recipient_email}`);
  } catch (err) {
    recordFail(7, "Verify Registration Email Event", err);
  }

  // --------------------------------------------------------------------------
  // STEP 8: Track Fan Card on Public Portal
  // --------------------------------------------------------------------------
  try {
    const trackResult = await lookupFanCardStatus(testContext.trackingCode);
    assert.equal(trackResult.success, true, "Tracking lookup must find the registered card");
    assert.ok(trackResult.data, "Tracking data must be present");
    assert.equal(trackResult.data.currentStatus, "REGISTERED", "Tracking status must reflect REGISTERED");
    assert.ok(trackResult.data.fanInitial, "Fan initial must be present");
    assert.equal(trackResult.data.email, undefined, "Email must NEVER be exposed in tracking lookup");
    assert.equal(trackResult.data.phone, undefined, "Phone must NEVER be exposed in tracking lookup");
    recordPass(8, `Track Fan Card: Public lookup resolved status 'REGISTERED' with zero PII leakage`);
  } catch (err) {
    recordFail(8, "Track Fan Card", err);
  }

  // --------------------------------------------------------------------------
  // STEP 9: Login as Admin
  // --------------------------------------------------------------------------
  try {
    const authSession = await authenticateAdminCredentials("admin@kountrywayne.com", "WayneVIP2026!");
    assert.ok(authSession, "Admin credentials must authenticate");
    assert.equal(authSession.role, "ADMIN", "Admin role must match ADMIN");
    testContext.adminSession = authSession;
    testContext.adminToken = await createSessionToken(authSession);
    assert.ok(testContext.adminToken, "Admin session token must be created");
    recordPass(9, `Login as Admin: Authenticated as '${authSession.fullName}' (${authSession.role})`);
  } catch (err) {
    recordFail(9, "Login as Admin", err);
  }

  // --------------------------------------------------------------------------
  // STEP 10: Open Registration
  // --------------------------------------------------------------------------
  try {
    const registration = await operationsService.getRegistrationById(testContext.registrationId);
    assert.ok(registration, "Admin must be able to open registration dossier");
    assert.equal(registration.fan.first_name, "Marcus", "Attendee first name must be accessible to admin");
    assert.equal(registration.fan.shipping_city, "Atlanta", "Shipping city must be accessible to admin");
    recordPass(10, `Open Registration: Loaded dossier for ${registration.fan.first_name} ${registration.fan.last_name}`);
  } catch (err) {
    recordFail(10, "Open Registration", err);
  }

  // --------------------------------------------------------------------------
  // STEP 11: Schedule Fan
  // --------------------------------------------------------------------------
  try {
    const schedResult = await operationsService.createSchedule({
      registrationId: testContext.registrationId,
      date: "2026-11-14",
      startTime: "17:30",
      location: "Fox Theatre Atlanta - Stage Door North",
      instructions: "Check in at Stage Door North VIP Desk. Present valid photo ID.",
      sendEmail: true,
      adminId: testContext.adminSession.id,
      adminEmail: testContext.adminSession.email,
    });
    assert.ok(schedResult.schedule, "Schedule creation must succeed");

    // Verify registration status advanced to SCHEDULED
    const updatedReg = await operationsService.getRegistrationById(testContext.registrationId);
    assert.equal(updatedReg.status, "SCHEDULED", "Registration status must be updated to SCHEDULED");
    recordPass(11, "Schedule Fan: Assigned call time 17:30 at Fox Theatre North VIP Desk (status: SCHEDULED)");
  } catch (err) {
    recordFail(11, "Schedule Fan", err);
  }

  // --------------------------------------------------------------------------
  // STEP 12: Verify Schedule Email
  // --------------------------------------------------------------------------
  try {
    const events = emailService.getEmailEvents();
    const schedEmail = events.find(
      (e) =>
        (e.email_type === "SCHEDULE_CONFIRMATION" || e.email_type === "SCHEDULE_NOTIFICATION") &&
        e.recipient_email.toLowerCase() === fanProfile.email.toLowerCase()
    );
    assert.ok(schedEmail, "Schedule notification email must be logged in email events");
    assert.equal(schedEmail.status, "SENT", "Schedule notification email must have SENT status");
    recordPass(12, `Verify Schedule Email: Confirmed dispatch '${schedEmail.id}' for VIP schedule`);
  } catch (err) {
    recordFail(12, "Verify Schedule Email", err);
  }

  // --------------------------------------------------------------------------
  // STEP 13: Change Fan Card Status
  // --------------------------------------------------------------------------
  const courierRef = "FEDEX-VIP-9948123";
  try {
    // 1. Advance to PROCESSING
    await operationsService.updateFanCardStatus(
      testContext.fanCardId,
      "PROCESSING",
      {
        internalNotes: "Badge embossing underway",
        adminId: testContext.adminSession.id,
        adminEmail: testContext.adminSession.email,
        adminRole: testContext.adminSession.role,
      }
    );

    // 2. Advance to PREPARED
    await operationsService.updateFanCardStatus(
      testContext.fanCardId,
      "PREPARED",
      {
        internalNotes: "Card packaged in gold commemorative sleeve",
        adminId: testContext.adminSession.id,
        adminEmail: testContext.adminSession.email,
        adminRole: testContext.adminSession.role,
      }
    );

    // 3. Advance to SHIPPED
    const shipResult = await operationsService.updateFanCardStatus(
      testContext.fanCardId,
      "SHIPPED",
      {
        courierReference: courierRef,
        internalNotes: "Handed over to FedEx Priority Express courier",
        sendEmail: true,
        adminId: testContext.adminSession.id,
        adminEmail: testContext.adminSession.email,
        adminRole: testContext.adminSession.role,
      }
    );
    assert.ok(shipResult.card, "Status update to SHIPPED must succeed");
    recordPass(13, `Change Fan Card Status: Advanced through PROCESSING -> PREPARED -> SHIPPED (Ref: ${courierRef})`);
  } catch (err) {
    recordFail(13, "Change Fan Card Status", err);
  }

  // --------------------------------------------------------------------------
  // STEP 14: Verify Status History
  // --------------------------------------------------------------------------
  try {
    const history = await operationsService.getFanCardHistory(testContext.fanCardId);
    assert.ok(Array.isArray(history) && history.length >= 3, "Fan Card must have at least 3 history entries");
    const statuses = history.map((h) => h.new_status || h.status);
    assert.ok(statuses.includes("PROCESSING"), "History must record PROCESSING transition");
    assert.ok(statuses.includes("PREPARED"), "History must record PREPARED transition");
    assert.ok(statuses.includes("SHIPPED"), "History must record SHIPPED transition");
    recordPass(14, `Verify Status History: ${history.length} chronological audit milestones recorded`);
  } catch (err) {
    recordFail(14, "Verify Status History", err);
  }

  // --------------------------------------------------------------------------
  // STEP 15: Verify Status Notification Email
  // --------------------------------------------------------------------------
  try {
    const events = emailService.getEmailEvents();
    const statusEmails = events.filter(
      (e) =>
        ["FAN_CARD_SHIPPED", "FAN_CARD_PREPARED", "FAN_CARD_PROCESSING", "FAN_CARD_STATUS_UPDATE"].includes(e.email_type) &&
        e.recipient_email.toLowerCase() === fanProfile.email.toLowerCase()
    );
    assert.ok(statusEmails.length > 0, "Must record at least one Fan Card fulfillment email event");
    const shippedEmail = statusEmails.find((e) => e.email_type === "FAN_CARD_SHIPPED" || e.subject.includes("Shipped"));
    assert.ok(shippedEmail, "Must send email notification for SHIPPED milestone");
    assert.equal(shippedEmail.status, "SENT", "Shipped email notification must have SENT status");
    recordPass(15, `Verify Status Email: Confirmed milestone dispatch '${shippedEmail.id}' for SHIPPED state`);
  } catch (err) {
    recordFail(15, "Verify Status Notification Email", err);
  }

  // --------------------------------------------------------------------------
  // STEP 16: Track Fan Card Again
  // --------------------------------------------------------------------------
  let retrackResult = null;
  try {
    retrackResult = await lookupFanCardStatus(testContext.trackingCode);
    assert.equal(retrackResult.success, true, "Tracking lookup must find card on second lookup");
    recordPass(16, `Track Fan Card Again: Re-queried tracking code '${testContext.trackingCode}'`);
  } catch (err) {
    recordFail(16, "Track Fan Card Again", err);
  }

  // --------------------------------------------------------------------------
  // STEP 17: Verify Updated Status & Timeline
  // --------------------------------------------------------------------------
  try {
    assert.equal(retrackResult.data.currentStatus, "SHIPPED", "Live tracking status must reflect SHIPPED");
    assert.ok(retrackResult.data.timeline, "Live tracking must include timeline");
    const shippedStage = retrackResult.data.timeline.find((t) => t.id === "SHIPPED");
    assert.ok(shippedStage && shippedStage.state === "current", "SHIPPED stage must be marked current in timeline");
    assert.equal(retrackResult.data.courierReference, courierRef, "Public tracking must reflect courier reference");
    recordPass(17, `Verify Updated Status: Confirmed live status 'SHIPPED' with courier '${courierRef}' and current timeline milestone`);
  } catch (err) {
    recordFail(17, "Verify Updated Status & Timeline", err);
  }

  console.log("\n===============================================================================");
  console.log(`  17-STEP PRODUCTION SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED     `);
  console.log("===============================================================================\n");

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/production-smoke-test.mjs")) {
  runProductionSmokeTest()
    .then(({ failed }) => {
      if (failed > 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal test error:", err);
      process.exit(1);
    });
}

export { runProductionSmokeTest };
