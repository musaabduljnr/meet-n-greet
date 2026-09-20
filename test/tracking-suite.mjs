import assert from "node:assert/strict";
import { lookupFanCardStatus, registerDemoCard } from "../src/lib/services/tracking-service";
import { checkTrackingRateLimit, resetRateLimiter } from "../src/lib/security/rate-limiter";
import { isValidTrackingCodeFormat } from "../src/lib/security/tracking-code";

async function runTrackingTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 4 TEST SUITE: SECURE FAN CARD TRACKING SYSTEM          ");
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

  resetRateLimiter();

  // Register test card for predictable assertions
  registerDemoCard("KWFC-7X9K-42MA", {
    initial: "M.",
    cityName: "Atlanta",
    cityState: "GA",
    tourDate: "2026-11-14",
    status: "IN_TRANSIT",
    updatedAt: "2026-09-20T12:00:00Z",
  });

  registerDemoCard("KWFC-8S9U-2ARD", {
    initial: "D.",
    cityName: "Houston",
    cityState: "TX",
    tourDate: "2026-11-20",
    status: "DELIVERY_ISSUE",
    updatedAt: "2026-09-20T13:00:00Z",
  });

  // TEST 1: Format Validation
  try {
    assert.equal(isValidTrackingCodeFormat("KWFC-7X9K-42MA"), true);
    assert.equal(isValidTrackingCodeFormat("KW-7X9K-42MA"), true);
    assert.equal(isValidTrackingCodeFormat("kwfc-7x9k-42ma"), true); // case-insensitive check
    assert.equal(isValidTrackingCodeFormat("INVALID-FORMAT"), false);
    assert.equal(isValidTrackingCodeFormat(""), false);
    assert.equal(isValidTrackingCodeFormat("KWFC-123"), false);

    // Call service with invalid format
    const res = await lookupFanCardStatus("INVALID-CODE", "test-ip-1");
    assert.equal(res.success, false);
    assert.equal(res.code, "INVALID_FORMAT");

    recordPass("Security: Tracking Code Format Validation");
  } catch (err) {
    recordFail("Security: Tracking Code Format Validation", err);
  }

  // TEST 2: Successful Fan Card Lookup & Timeline Progression
  try {
    const res = await lookupFanCardStatus("KWFC-7X9K-42MA", "test-ip-2");
    assert.equal(res.success, true);
    assert.ok(res.data);
    assert.equal(res.data.trackingCode, "KWFC-7X9K-42MA");
    assert.equal(res.data.currentStatus, "IN_TRANSIT");
    assert.equal(res.data.statusLabel, "In Transit");
    assert.equal(res.data.cityName, "Atlanta");
    assert.equal(res.data.cityState, "GA");
    assert.equal(res.data.fanInitial, "M.");
    assert.equal(res.data.hasIssue, false);

    // Check timeline steps
    assert.equal(res.data.timeline.length, 7);
    const titles = res.data.timeline.map((t) => t.title);
    assert.deepEqual(titles, [
      "Registration Received",
      "Processing",
      "Prepared",
      "Shipped",
      "In Transit",
      "Out for Delivery",
      "Delivered",
    ]);

    // Check states: stages before IN_TRANSIT should be completed, IN_TRANSIT is current, rest upcoming
    assert.equal(res.data.timeline[0].state, "completed"); // Registration Received
    assert.equal(res.data.timeline[1].state, "completed"); // Processing
    assert.equal(res.data.timeline[2].state, "completed"); // Prepared
    assert.equal(res.data.timeline[3].state, "completed"); // Shipped
    assert.equal(res.data.timeline[4].state, "current");   // In Transit
    assert.equal(res.data.timeline[5].state, "upcoming");  // Out for Delivery
    assert.equal(res.data.timeline[6].state, "upcoming");  // Delivered

    recordPass("Functional: Successful Lookup & 7-Stage Timeline Progression");
  } catch (err) {
    recordFail("Functional: Successful Lookup & 7-Stage Timeline Progression", err);
  }

  // TEST 3: Delivery Issue Exception State Support
  try {
    const res = await lookupFanCardStatus("KWFC-8S9U-2ARD", "test-ip-3");
    assert.equal(res.success, true);
    assert.ok(res.data);
    assert.equal(res.data.currentStatus, "DELIVERY_ISSUE");
    assert.equal(res.data.hasIssue, true);
    assert.ok(res.data.issueMessage);
    assert.match(res.data.issueMessage, /delivery exception/i);

    // Verify error state in timeline
    assert.ok(res.data.timeline.some((t) => t.state === "error"));

    recordPass("Functional: Delivery Issue Exception State Support");
  } catch (err) {
    recordFail("Functional: Delivery Issue Exception State Support", err);
  }

  // TEST 4: Not Found State with Generic Response
  try {
    const res = await lookupFanCardStatus("KWFC-9999-9999", "test-ip-4");
    assert.equal(res.success, false);
    assert.equal(res.code, "NOT_FOUND");
    assert.match(res.message, /No Fan Card record found matching this code/i);

    recordPass("Security: Generic Error Response on Non-Existent Codes");
  } catch (err) {
    recordFail("Security: Generic Error Response on Non-Existent Codes", err);
  }

  // TEST 5: Zero PII Leakage
  try {
    const res = await lookupFanCardStatus("KWFC-7X9K-42MA", "test-ip-5");
    assert.equal(res.success, true);
    const data = res.data;

    // Strict assertions: zero PII fields must exist on the returned object
    assert.equal("email" in data, false, "Must not contain email");
    assert.equal("phone" in data, false, "Must not contain phone");
    assert.equal("phoneNumber" in data, false, "Must not contain phoneNumber");
    assert.equal("address" in data, false, "Must not contain address");
    assert.equal("street" in data, false, "Must not contain street");
    assert.equal("notes" in data, false, "Must not contain notes");
    assert.equal("specialNotes" in data, false, "Must not contain specialNotes");
    assert.equal("adminNotes" in data, false, "Must not contain adminNotes");
    assert.equal("fullName" in data, false, "Must not contain full name");

    // Only initial is revealed
    assert.equal(data.fanInitial, "M.");

    recordPass("Security: Zero PII Leakage in Public Tracking Output");
  } catch (err) {
    recordFail("Security: Zero PII Leakage in Public Tracking Output", err);
  }

  // TEST 6: Brute-Force Rate Limiting Protection
  try {
    const targetIp = "192.168.1.50";
    resetRateLimiter();

    // Perform 10 lookups (the maximum allowed threshold)
    for (let i = 0; i < 10; i++) {
      const res = checkTrackingRateLimit(targetIp, 10, 60000);
      assert.equal(res.allowed, true, `Lookup ${i + 1} should be allowed`);
    }

    // The 11th lookup must be blocked
    const blockedRes = checkTrackingRateLimit(targetIp, 10, 60000);
    assert.equal(blockedRes.allowed, false, "11th lookup should be blocked");
    assert.equal(blockedRes.remaining, 0);
    assert.ok(blockedRes.resetInSeconds > 0);

    // Call service with blocked IP
    const serviceRes = await lookupFanCardStatus("KWFC-7X9K-42MA", targetIp);
    assert.equal(serviceRes.success, false);
    assert.equal(serviceRes.code, "RATE_LIMITED");
    assert.match(serviceRes.message, /Too many tracking lookups/i);

    recordPass("Security: Anti-Brute-Force Rate Limiter");
  } catch (err) {
    recordFail("Security: Anti-Brute-Force Rate Limiter", err);
  }

  console.log("\n===============================================================");
  console.log(`  PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED       `);
  return { passed, failed };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/tracking-suite.mjs")) {
  runTrackingTestSuite().catch((e) => {
    console.error("FATAL TRACKING TEST SUITE ERROR:", e);
    process.exit(1);
  });
}

export { runTrackingTestSuite };
