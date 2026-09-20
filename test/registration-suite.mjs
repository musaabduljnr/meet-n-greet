import assert from "node:assert/strict";
import { generateFanCardTrackingCode, generateRequestReference, isValidTrackingCodeFormat } from "../src/lib/security/tracking-code.ts";
import { registrationInputSchema, normalizeName, normalizePhoneNumber } from "../src/lib/validations/registration.ts";
import { processRegistration, resetRegistrationStorage } from "../src/lib/services/registration-service.ts";
import { emailService } from "../src/lib/email/email-service.ts";

async function runRegistrationTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 3 TEST SUITE: REGISTRATION & TRACKING VALIDATION       ");
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

  // TEST 1: Cryptographic Tracking Code & Reference Generator
  try {
    const code = generateFanCardTrackingCode();
    const ref = generateRequestReference();

    assert.match(code, /^KWFC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/, "Code must match KWFC-XXXX-XXXX format");
    assert.match(ref, /^REQ-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/, "Reference must match REQ-XXXX-XXXX format");
    assert.equal(isValidTrackingCodeFormat(code), true, "isValidTrackingCodeFormat should return true");
    assert.equal(isValidTrackingCodeFormat("INVALID-CODE"), false, "Invalid code format should return false");

    // Test entropy: generate 5,000 codes and check zero collisions
    const set = new Set();
    for (let i = 0; i < 5000; i++) {
      const c = generateFanCardTrackingCode();
      assert.equal(set.has(c), false, `Collision detected on iteration ${i}`);
      set.add(c);
    }

    recordPass("Cryptographic Tracking Code Generator (Entropy & Uniqueness)");
  } catch (err) {
    recordFail("Cryptographic Tracking Code Generator", err);
  }

  // TEST 2: Normalization Helpers
  try {
    assert.equal(normalizeName("  marcus   sterling  "), "Marcus Sterling");
    assert.equal(normalizeName("ALICE M. COOPER"), "Alice M. Cooper");
    assert.equal(normalizePhoneNumber("4045550199"), "(404) 555-0199");
    assert.equal(normalizePhoneNumber("14045550199"), "+1 (404) 555-0199");

    recordPass("Data Normalization (Names, Phones, Emails)");
  } catch (err) {
    recordFail("Data Normalization", err);
  }

  // TEST 3: Zod Schema Validation (Valid Form)
  try {
    const validData = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
      firstName: "Marcus",
      lastName: "Sterling",
      email: "Marcus.S@Example.com",
      phone: "(404) 555-0199",
      notes: "Wheelchair ramp access requested",
      website_hp: "",
    };

    const parsed = registrationInputSchema.safeParse(validData);
    assert.equal(parsed.success, true);

    recordPass("Validation: Valid Form Input");
  } catch (err) {
    recordFail("Validation: Valid Form Input", err);
  }

  // TEST 4: Zod Schema Validation (Invalid Form - Malformed Email & Phone)
  try {
    const invalidData = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
      firstName: "",
      lastName: "",
      email: "not-an-email",
      phone: "123",
    };

    const parsed = registrationInputSchema.safeParse(invalidData);
    assert.equal(parsed.success, false);
    assert.ok(parsed.error.issues.some((i) => i.path.includes("email")));
    assert.ok(parsed.error.issues.some((i) => i.path.includes("phone")));
    assert.ok(parsed.error.issues.some((i) => i.path.includes("firstName")));

    recordPass("Validation: Rejection of Malformed Inputs");
  } catch (err) {
    recordFail("Validation: Rejection of Malformed Inputs", err);
  }

  // TEST 5: Honeypot Anti-Bot Shield
  try {
    resetRegistrationStorage();
    const botSubmission = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
      firstName: "Bot",
      lastName: "Spammer",
      email: "bot@spam.com",
      phone: "4045550199",
      website_hp: "http://spam-link.com",
    };

    const res = await processRegistration(botSubmission);
    assert.equal(res.success, false);
    assert.equal(res.code, "VALIDATION_ERROR");

    recordPass("Security: Honeypot Bot Trap");
  } catch (err) {
    recordFail("Security: Honeypot Bot Trap", err);
  }

  // TEST 6: Successful End-to-End Registration
  try {
    resetRegistrationStorage();
    const submission = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", // Atlanta
      firstName: "Marcus",
      lastName: "Sterling",
      email: "marcus.sterling@example.com",
      phone: "4045550199",
      notes: "First time attendee",
    };

    const res = await processRegistration(submission);
    assert.equal(res.success, true);
    assert.ok(res.data);
    assert.equal(res.data.cityName, "Atlanta");
    assert.equal(res.data.cityState, "GA");
    assert.equal(res.data.email, "marcus.sterling@example.com");
    assert.match(res.data.confirmationReference, /^REQ-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    assert.equal(res.data.emailDispatched, true);

    recordPass("Service: Successful Relational Registration & Email Dispatch");
  } catch (err) {
    recordFail("Service: Successful Relational Registration", err);
  }

  // TEST 7: Duplicate Registration Protection (Same email + same city)
  try {
    const duplicateSubmission = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", // Same city (Atlanta)
      firstName: "Marcus",
      lastName: "Sterling",
      email: "marcus.sterling@example.com", // Same email
      phone: "4045550199",
    };

    const res = await processRegistration(duplicateSubmission);
    assert.equal(res.success, false);
    assert.equal(res.code, "DUPLICATE_REGISTRATION");
    assert.match(res.message, /already submitted a VIP Meet & Greet request/i);

    recordPass("Idempotency: Duplicate Registration Prevention");
  } catch (err) {
    recordFail("Idempotency: Duplicate Registration Prevention", err);
  }

  // TEST 8: Rejection of Unavailable / Inactive City
  try {
    const invalidCitySubmission = {
      cityId: "non-existent-city-uuid",
      firstName: "Alice",
      lastName: "Wonderland",
      email: "alice@example.com",
      phone: "4045550199",
    };

    const res = await processRegistration(invalidCitySubmission);
    assert.equal(res.success, false);
    assert.equal(res.code, "CITY_UNAVAILABLE");

    recordPass("Integrity: Inactive / Invalid City Rejection");
  } catch (err) {
    recordFail("Integrity: Inactive / Invalid City Rejection", err);
  }

  // TEST 9: Email Failure Resilience (Non-Blocking Transaction)
  try {
    // Mock failing email provider
    const failingProvider = {
      async send() {
        throw new Error("SMTP server connection timed out");
      },
    };
    emailService.setProvider(failingProvider);

    const submissionWithFailingEmail = {
      cityId: "b2c3d4e5-f6a7-4b6c-9d8e-0f1a2b3c4d5e", // Houston
      firstName: "David",
      lastName: "Miller",
      email: "david.miller@example.com",
      phone: "7135550144",
    };

    const res = await processRegistration(submissionWithFailingEmail);
    // Registration must succeed, but emailDispatched flag should be false
    assert.equal(res.success, true, "Registration must still succeed if email fails");
    assert.equal(res.data.emailDispatched, false, "emailDispatched flag should indicate failure");
    assert.ok(res.data.confirmationReference);

    recordPass("Resilience: Email Failure Handled Without Breaking Registration");
  } catch (err) {
    recordFail("Resilience: Email Failure Handled Without Breaking Registration", err);
  }

  console.log("\n===============================================================");
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED               `);
  console.log("===============================================================");

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/registration-suite.mjs")) {
  runRegistrationTestSuite().catch((e) => {
    console.error("FATAL TEST SUITE ERROR:", e);
    process.exit(1);
  });
}

export { runRegistrationTestSuite };
