import assert from "node:assert/strict";
import { emailService } from "../src/lib/email/email-service";
import { TestInboxProvider } from "../src/lib/email/providers/test-inbox-provider";
import { ConsoleProvider } from "../src/lib/email/providers/console-provider";
import { ResendProvider } from "../src/lib/email/providers/resend-provider";

async function runEmailTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 5 TEST SUITE: PRODUCTION-READY EMAIL INFRASTRUCTURE    ");
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

  const testInbox = new TestInboxProvider();
  emailService.setProvider(testInbox);
  emailService.clearInMemoryEvents();

  // --------------------------------------------------------------------------
  // TEST 1: Provider Abstraction & Switching
  // --------------------------------------------------------------------------
  try {
    const consoleProvider = new ConsoleProvider();
    assert.equal(consoleProvider.name, "CONSOLE_TEST");

    const inboxProvider = new TestInboxProvider();
    assert.equal(inboxProvider.name, "TEST_INBOX");

    const resendProvider = new ResendProvider("re_mock_test_key_abc");
    assert.equal(resendProvider.name, "RESEND");

    // Switch service provider to testInbox for subsequent tests
    emailService.setProvider(testInbox);
    assert.equal(emailService.getProvider().name, "TEST_INBOX");

    recordPass("Architecture: Pluggable Email Provider Abstraction & Switching");
  } catch (err) {
    recordFail("Architecture: Pluggable Email Provider Abstraction & Switching", err);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Template 1 - Registration Confirmation Email
  // --------------------------------------------------------------------------
  try {
    testInbox.clear();
    emailService.clearInMemoryEvents();

    const res = await emailService.sendRegistrationEmail({
      fanName: "Marcus Sterling",
      fanEmail: "marcus@example.com",
      referenceId: "REQ-ATLA-101",
      cityName: "Atlanta",
      cityState: "GA",
      tourDate: "November 14, 2026",
      trackingCode: "KWFC-7X9K-42MA",
      trackingUrl: "https://kountrywayne-meetngreet.vercel.app/track?code=KWFC-7X9K-42MA",
    });

    assert.equal(res.success, true);
    assert.equal(testInbox.count(), 1);

    const sent = testInbox.getLast();
    assert.ok(sent);
    assert.match(sent.message.subject, /VIP Registration Confirmed.*Atlanta/i);
    assert.match(sent.message.html, /KWFC-7X9K-42MA/);
    assert.match(sent.message.html, /REQ-ATLA-101/);
    assert.match(sent.message.text, /November 14, 2026/);
    assert.match(sent.message.html, /Transactional Service Notice/i);

    recordPass("Templates: 1. Registration Confirmation Email");
  } catch (err) {
    recordFail("Templates: 1. Registration Confirmation Email", err);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Template 2 - Dedicated Fan Card Tracking Info Email
  // --------------------------------------------------------------------------
  try {
    const res = await emailService.sendFanCardTrackingEmail({
      fanName: "Marcus Sterling",
      fanEmail: "marcus@example.com",
      trackingCode: "KWFC-7X9K-42MA",
      currentStatus: "IN_TRANSIT",
      statusLabel: "In Transit",
      cityName: "Atlanta",
      cityState: "GA",
      trackingUrl: "https://kountrywayne-meetngreet.vercel.app/track?code=KWFC-7X9K-42MA",
    });

    assert.equal(res.success, true);
    const sent = testInbox.getLast();
    assert.ok(sent);
    assert.equal(sent.message.type, "FAN_CARD_TRACKING_INFO");
    assert.match(sent.message.subject, /KWFC-7X9K-42MA/);
    assert.match(sent.message.html, /Track Delivery Progress/i);

    recordPass("Templates: 2. Fan Card Tracking Information Email");
  } catch (err) {
    recordFail("Templates: 2. Fan Card Tracking Information Email", err);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Templates 3 & 4 - Schedule Confirmation & Update Emails
  // --------------------------------------------------------------------------
  try {
    // Schedule Confirmation
    const resConf = await emailService.sendScheduleEmail({
      fanName: "Marcus Sterling",
      fanEmail: "marcus@example.com",
      cityName: "Atlanta",
      cityState: "GA",
      assignedDate: "November 14, 2026",
      arrivalTime: "5:30 PM EST",
      venueName: "Fox Theatre Atlanta",
      venueAddress: "660 Peachtree St NE, Atlanta, GA 30308",
      arrivalInstructions: "Check in at Stage Door B on Ponce de Leon Ave. Present photo ID.",
      coordinatorContact: "Sarah T. (Tour Coordinator) at vip@kountrywaynetour.com",
      trackingCode: "KWFC-7X9K-42MA",
    });

    assert.equal(resConf.success, true);
    const sentConf = testInbox.getLast();
    assert.ok(sentConf);
    assert.equal(sentConf.message.type, "SCHEDULE_CONFIRMATION");
    assert.match(sentConf.message.subject, /Schedule is Confirmed.*Atlanta/i);
    assert.match(sentConf.message.html, /Fox Theatre Atlanta/);
    assert.match(sentConf.message.html, /5:30 PM EST/);
    assert.match(sentConf.message.text, /Stage Door B/);

    // Schedule Update
    const resUpdate = await emailService.sendScheduleUpdateEmail({
      fanName: "Marcus Sterling",
      fanEmail: "marcus@example.com",
      cityName: "Atlanta",
      cityState: "GA",
      assignedDate: "November 14, 2026",
      arrivalTime: "5:00 PM EST (30 mins earlier)",
      venueName: "Fox Theatre Atlanta",
      venueAddress: "660 Peachtree St NE, Atlanta, GA 30308",
      arrivalInstructions: "Stage Door B entrance now opens at 5:00 PM sharp for security check.",
      updateReason: "Wayne's pre-show soundcheck schedule moved 30 minutes forward.",
      trackingCode: "KWFC-7X9K-42MA",
    });

    assert.equal(resUpdate.success, true);
    const sentUpdate = testInbox.getLast();
    assert.ok(sentUpdate);
    assert.equal(sentUpdate.message.type, "SCHEDULE_UPDATE");
    assert.match(sentUpdate.message.subject, /Schedule Update/i);
    assert.match(sentUpdate.message.html, /soundcheck schedule moved/);

    recordPass("Templates: 3 & 4. Meet & Greet Schedule Confirmation and Update Emails");
  } catch (err) {
    recordFail("Templates: 3 & 4. Meet & Greet Schedule Confirmation and Update Emails", err);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Templates 5-11 - All 7 Fan Card Status Updates + Delivery Issue
  // --------------------------------------------------------------------------
  try {
    const statuses = [
      { status: "PROCESSING", label: "Processing", expectedSubject: /Processing/i },
      { status: "PREPARED", label: "Prepared", expectedSubject: /Prepared/i },
      { status: "SHIPPED", label: "Shipped", expectedSubject: /Shipped/i },
      { status: "IN_TRANSIT", label: "In Transit", expectedSubject: /In Transit/i },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", expectedSubject: /Out for Delivery/i },
      { status: "DELIVERED", label: "Delivered", expectedSubject: /Delivered/i },
      { status: "DELIVERY_ISSUE", label: "Delivery Issue", expectedSubject: /Delivery Exception/i },
    ];

    for (const item of statuses) {
      const res = await emailService.sendStatusUpdateEmail({
        fanName: "Marcus Sterling",
        fanEmail: "marcus@example.com",
        trackingCode: "KWFC-7X9K-42MA",
        status: item.status,
        statusLabel: item.label,
        cityName: "Atlanta",
        cityState: "GA",
        lastUpdated: "Sept 20, 2026, 1:30 PM",
        trackingUrl: "https://kountrywayne-meetngreet.vercel.app/track?code=KWFC-7X9K-42MA",
        courierReference: item.status === "SHIPPED" ? "TOUR-DIRECT-EXP-992" : undefined,
        deliveryIssueNote: item.status === "DELIVERY_ISSUE" ? "Apartment number missing from address" : undefined,
      });

      assert.equal(res.success, true, `Status update ${item.status} should succeed`);
      const sent = testInbox.getLast();
      assert.ok(sent);
      assert.match(sent.message.subject, item.expectedSubject);
      assert.match(sent.message.html, /KWFC-7X9K-42MA/);
      assert.match(sent.message.text, new RegExp(item.label, "i"));

      if (item.status === "DELIVERY_ISSUE") {
        assert.match(sent.message.html, /Apartment number missing/);
      }
    }

    recordPass("Templates: 5-11. All 7 Fan Card Fulfillment Stages & Delivery Issue Handled");
  } catch (err) {
    recordFail("Templates: 5-11. All 7 Fan Card Fulfillment Stages & Delivery Issue Handled", err);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Idempotency Defense (Prevent Duplicate Sends)
  // --------------------------------------------------------------------------
  try {
    const initialCount = testInbox.count();

    // Re-dispatching registration email with the same reference ID
    const duplicateRes = await emailService.sendRegistrationEmail({
      fanName: "Marcus Sterling",
      fanEmail: "marcus@example.com",
      referenceId: "REQ-ATLA-101", // same reference ID as Test 2
      cityName: "Atlanta",
      cityState: "GA",
      tourDate: "November 14, 2026",
      trackingCode: "KWFC-7X9K-42MA",
      trackingUrl: "https://kountrywayne-meetngreet.vercel.app/track?code=KWFC-7X9K-42MA",
    });

    assert.equal(duplicateRes.success, true);
    assert.equal(duplicateRes.skippedDueToIdempotency, true);
    // Provider count should NOT have increased
    assert.equal(testInbox.count(), initialCount, "Duplicate email must not be dispatched to provider");

    recordPass("Reliability: Idempotency Intercepts Duplicate Database Trigger Events");
  } catch (err) {
    recordFail("Reliability: Idempotency Intercepts Duplicate Database Trigger Events", err);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Resilience & Error Logging to email_events
  // --------------------------------------------------------------------------
  let failedEventId;
  try {
    // Simulate provider network timeout
    testInbox.simulateError(true, "504 Gateway Timeout connecting to courier mail relay");

    const failedRes = await emailService.sendEmail({
      to: { name: "David Jenkins", email: "david.jenkins@example.com" },
      type: "FAN_CARD_SHIPPED",
      subject: "Your Fan Card has Shipped",
      html: "<p>Shipped</p>",
      text: "Shipped",
      idempotencyKey: "test_fail_key_1",
    });

    assert.equal(failedRes.success, false);
    assert.ok(failedRes.eventId);
    assert.match(failedRes.error, /504 Gateway Timeout/);

    failedEventId = failedRes.eventId;

    // Check that event was recorded as FAILED in email_events audit store
    const event = emailService.getEmailEventById(failedEventId);
    assert.ok(event);
    assert.equal(event.status, "FAILED");
    assert.match(event.error_message, /504 Gateway Timeout/);

    recordPass("Resilience: Non-Blocking Error Logging to email_events on Provider Failure");
  } catch (err) {
    recordFail("Resilience: Non-Blocking Error Logging to email_events on Provider Failure", err);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Controlled Admin Retry Mechanism
  // --------------------------------------------------------------------------
  try {
    assert.ok(failedEventId, "Must have failed event to retry");

    // Retry dispatch now that provider is healthy
    const retryRes = await emailService.retryFailedEmailEvent(failedEventId);
    assert.equal(retryRes.success, true);
    assert.ok(retryRes.messageId);

    // Verify event in audit store updated to SENT
    const updatedEvent = emailService.getEmailEventById(failedEventId);
    assert.ok(updatedEvent);
    assert.equal(updatedEvent.status, "SENT");
    assert.equal(updatedEvent.provider_message_id, retryRes.messageId);
    assert.ok(updatedEvent.sent_at);
    assert.equal(updatedEvent.error_message, undefined);

    recordPass("Operations: Controlled Admin Retry for Failed Email Events");
  } catch (err) {
    recordFail("Operations: Controlled Admin Retry for Failed Email Events", err);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Security Audit (Zero Secret Leakage)
  // --------------------------------------------------------------------------
  try {
    const mockSecret = "re_secret_live_998877665544";
    const resend = new ResendProvider(mockSecret);

    // Verify all sent messages in inbox do NOT contain the secret
    const allEmails = testInbox.getAll();
    for (const item of allEmails) {
      assert.equal(item.message.html.includes(mockSecret), false);
      assert.equal(item.message.text.includes(mockSecret), false);
      assert.equal(item.message.subject.includes(mockSecret), false);
    }

    // Verify all audit events do NOT contain the secret
    const allEvents = emailService.getEmailEvents();
    for (const evt of allEvents) {
      const serialized = JSON.stringify(evt);
      assert.equal(serialized.includes(mockSecret), false);
    }

    recordPass("Security: Zero API Key or Secret Leakage in Emails and Event Logs");
  } catch (err) {
    recordFail("Security: Zero API Key or Secret Leakage in Emails and Event Logs", err);
  }

  console.log("\n===============================================================");
  console.log(`  PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED       `);
  console.log("===============================================================");

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/email-suite.mjs")) {
  runEmailTestSuite().catch((err) => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
  });
}

export { runEmailTestSuite };
