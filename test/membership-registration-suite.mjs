import assert from "node:assert/strict";
import { getUSStates, getCitiesForState, isValidUSStateCode } from "../src/lib/data/us-states-cities.ts";
import { registrationInputSchema } from "../src/lib/validations/registration.ts";
import { processRegistration, resetRegistrationStorage } from "../src/lib/services/registration-service.ts";

async function runMembershipRegistrationTestSuite() {
  console.log("===============================================================");
  console.log("  VIP MEMBERSHIP & COMPLETE USA STATES/CITIES TEST SUITE       ");
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

  // TEST 1: USA States & Cities Dataset Completeness
  try {
    const states = getUSStates();
    assert.equal(states.length >= 50, true, "Must have all 50 states");
    assert.equal(isValidUSStateCode("GA"), true, "Georgia should be valid");
    assert.equal(isValidUSStateCode("CA"), true, "California should be valid");
    assert.equal(isValidUSStateCode("NY"), true, "New York should be valid");
    assert.equal(isValidUSStateCode("PR"), true, "Puerto Rico should be valid");
    assert.equal(isValidUSStateCode("INVALID"), false, "Invalid code should return false");

    // Cities for Georgia
    const gaCities = getCitiesForState("GA");
    assert.ok(gaCities.includes("Atlanta"), "GA cities must include Atlanta");
    assert.ok(gaCities.includes("Savannah"), "GA cities must include Savannah");
    assert.ok(gaCities.length >= 10, "GA should have at least 10 cities");

    // Cities for California
    const caCities = getCitiesForState("CA");
    assert.ok(caCities.includes("Los Angeles"), "CA cities must include Los Angeles");
    assert.ok(caCities.includes("San Francisco"), "CA cities must include San Francisco");

    // Check case insensitivity
    const nyCities = getCitiesForState("ny");
    assert.ok(nyCities.includes("New York City"), "ny cities must include New York City");

    recordPass("USA States & Cities Dataset: All 50 States, DC, PR & Dependent Cities");
  } catch (err) {
    recordFail("USA States & Cities Dataset", err);
  }

  // TEST 2: Registration Input Schema with Address & Valid ID
  try {
    const membershipData = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
      membershipTier: "DIAMOND_VIP",
      firstName: "Marcus",
      lastName: "Sterling",
      email: "marcus.vip@example.com",
      phone: "(404) 555-0199",
      dateOfBirth: "1988-11-20",
      addressLine1: "123 Peachtree St NE",
      addressLine2: "Suite 400",
      state: "GA",
      city: "Atlanta",
      postalCode: "30303",
      idType: "DRIVERS_LICENSE",
      idNumber: "DL88991122",
      idDocumentName: "marcus-drivers-license.jpg",
      idDocumentUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
      notes: "Diamond cohort guest",
      website_hp: "",
    };

    const parsed = registrationInputSchema.safeParse(membershipData);
    assert.equal(parsed.success, true, "Membership input should pass validation");
    if (parsed.success) {
      assert.equal(parsed.data.membershipTier, "DIAMOND_VIP");
      assert.equal(parsed.data.addressLine1, "123 Peachtree St NE");
      assert.equal(parsed.data.state, "GA");
      assert.equal(parsed.data.city, "Atlanta");
      assert.equal(parsed.data.postalCode, "30303");
      assert.equal(parsed.data.idType, "DRIVERS_LICENSE");
      assert.equal(parsed.data.idDocumentName, "marcus-drivers-license.jpg");
    }

    recordPass("Validation: Membership Registration with Full Address & Valid ID");
  } catch (err) {
    recordFail("Validation: Membership Registration with Full Address & Valid ID", err);
  }

  // TEST 3: End-to-End Membership Registration Processing
  try {
    resetRegistrationStorage();
    const submission = {
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", // Atlanta
      membershipTier: "GOLD_VIP",
      firstName: "Wayne",
      lastName: "VIPFan",
      email: "wayne.vipfan@example.com",
      phone: "4045550188",
      dateOfBirth: "1992-04-10",
      addressLine1: "456 Piedmont Ave",
      state: "GA",
      city: "Atlanta",
      postalCode: "30308",
      idType: "PASSPORT",
      idDocumentName: "passport-photo.png",
      idDocumentUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...",
    };

    const res = await processRegistration(submission);
    assert.equal(res.success, true, "Registration must succeed");
    assert.ok(res.data);
    assert.equal(res.data.cityName, "Atlanta");
    assert.equal(res.data.cityState, "GA");
    assert.equal(res.data.email, "wayne.vipfan@example.com");
    assert.match(res.data.confirmationReference, /^REQ-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);

    recordPass("Service: Complete Membership Registration End-to-End Processing");
  } catch (err) {
    recordFail("Service: Complete Membership Registration End-to-End Processing", err);
  }

  // TEST 4: Standalone VIP Membership Registration Disconnected from Tour Stop
  try {
    resetRegistrationStorage();
    const standaloneSubmission = {
      cityId: "", // Tour stop city disconnected / omitted
      membershipTier: "DIAMOND_VIP",
      firstName: "Alexis",
      lastName: "VIPMember",
      email: "alexis.national@example.com",
      phone: "3105550199",
      dateOfBirth: "1995-08-15",
      addressLine1: "789 Sunset Blvd",
      state: "CA",
      city: "Los Angeles",
      postalCode: "90028",
      idType: "DRIVERS_LICENSE",
      idDocumentName: "alexis-dl.jpg",
      idDocumentUrl: "data:image/jpeg;base64,sample...",
    };

    const res = await processRegistration(standaloneSubmission);
    assert.equal(res.success, true, "Standalone VIP membership must succeed without tour stop cityId");
    assert.ok(res.data);
    assert.equal(res.data.cityName, "National VIP Member");
    assert.equal(res.data.cityState, "CA");
    assert.equal(res.data.tourDate, "2026/2027 VIP Tour Season");
    assert.equal(res.data.email, "alexis.national@example.com");

    recordPass("Service: Disconnected Tour Stop - Standalone National VIP Membership Registration");
  } catch (err) {
    recordFail("Service: Disconnected Tour Stop - Standalone National VIP Membership Registration", err);
  }

  console.log("\n===============================================================");
  console.log(`  MEMBERSHIP SUITE RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log("===============================================================");

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/membership-registration-suite.mjs")) {
  runMembershipRegistrationTestSuite().catch((e) => {
    console.error("FATAL ERROR IN MEMBERSHIP SUITE:", e);
    process.exit(1);
  });
}

export { runMembershipRegistrationTestSuite };
