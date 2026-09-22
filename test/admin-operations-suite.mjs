import assert from "node:assert/strict";
import { operationsService } from "../src/lib/services/operations-service.ts";
import { processRegistration } from "../src/lib/services/registration-service.ts";
import { lookupFanCardStatus } from "../src/lib/services/tracking-service.ts";
import { recordAdminAuditLog, getAdminAuditLogs, clearAuditLogs } from "../src/lib/security/audit.ts";

export async function runAdminOperationsTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 7 TEST SUITE: TOUR OPERATIONS & ADMINISTRATIVE SUITE   ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  async function runAsyncTest(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  ${err.message}`);
      failed++;
    }
  }

  // 1. Tour Cities Management
  await runAsyncTest("Cities: List default active tour cities", async () => {
    const cities = await operationsService.getAllCities();
    assert.ok(cities.length >= 5, "Should have default seed tour cities");
    const atlanta = cities.find((c) => c.name.toLowerCase() === "atlanta");
    assert.ok(atlanta, "Atlanta tour stop should exist");
    assert.equal(atlanta.state, "GA");
    assert.equal(atlanta.is_active, true);
  });

  await runAsyncTest("Cities: Create new tour stop, update, and toggle active state", async () => {
    const newCity = await operationsService.createCity({
      name: "Nashville",
      state: "TN",
      tour_date: "2026-12-28",
      venue_name: "Ryman Auditorium",
      venue_address: "116 5th Ave N, Nashville, TN 37219",
      max_capacity: 40,
      notes: "VIP check-in at Artist Entrance.",
      is_active: true,
    });

    assert.ok(newCity.id, "New city should receive an ID");
    assert.equal(newCity.name, "Nashville");
    assert.equal(newCity.max_capacity, 40);

    // Update
    const updated = await operationsService.updateCity(newCity.id, {
      max_capacity: 55,
      notes: "Updated check-in to Stage Door C.",
    });
    assert.equal(updated?.max_capacity, 55);
    assert.equal(updated?.notes, "Updated check-in to Stage Door C.");

    // Toggle inactive
    const toggled = await operationsService.toggleCityActive(newCity.id, false);
    assert.equal(toggled?.is_active, false);

    // Delete city (Super Admin capability)
    const deleted = await operationsService.deleteCity(newCity.id);
    assert.equal(deleted, true, "City should be successfully deleted");
    const afterDelete = await operationsService.getCityById(newCity.id);
    assert.equal(afterDelete, null, "Deleted city should no longer be found");
  });

  // 2. Fan Registrations Triage & CSV Export
  await runAsyncTest("Registrations: List, filter, and inspect VIP attendees", async () => {
    const allRegs = await operationsService.getRegistrations();
    assert.ok(allRegs.length >= 5, "Should return seed registrations");

    // Search filter
    const marcusSearch = await operationsService.getRegistrations({ search: "Marcus" });
    assert.ok(marcusSearch.length >= 1, "Should find at least 1 Marcus registration");
    assert.equal(marcusSearch[0].fan.first_name, "Marcus");
    assert.equal(marcusSearch[0].fan.last_name, "Sterling");

    // Status update
    const updatedReg = await operationsService.updateRegistrationStatus(
      marcusSearch[0].id,
      "COMPLETED"
    );
    assert.equal(updatedReg?.status, "COMPLETED");
  });

  await runAsyncTest("Registrations: Export formatted CSV report", async () => {
    const csv = await operationsService.exportRegistrationsCsv();
    assert.ok(csv.includes("Registration ID"), "CSV should contain header");
    assert.ok(csv.includes("Fan First Name"), "CSV should contain fan first name");
    assert.ok(csv.includes("Marcus"), "CSV should include fan row Marcus");
    assert.ok(csv.includes("Atlanta"), "CSV should include tour city");
  });

  // 3. Meet & Greet Scheduling Tool
  await runAsyncTest("Schedules: Assign call time and entrance door directions with email dispatch", async () => {
    const regs = await operationsService.getRegistrations();
    const pendingReg = regs.find((r) => r.fan.first_name === "Keisha");
    assert.ok(pendingReg, "Keisha registration should exist");

    const result = await operationsService.assignSchedule({
      registrationId: pendingReg.id,
      assignedDate: "2026-11-20",
      arrivalTime: "18:15",
      venueName: "Bayou Music Center",
      venueAddress: "520 Texas Ave, Houston, TX 77002",
      arrivalInstructions: "Check in with Tour Manager at West VIP Lounge entrance. Present photo ID.",
      sendEmail: true,
    });

    assert.ok(result.schedule.id, "Schedule record should be generated");
    assert.equal(result.schedule.arrival_time, "18:15");
    assert.equal(result.schedule.is_notified, true);
    assert.equal(result.emailResult?.success, true);

    const refreshedReg = await operationsService.getRegistrationById(pendingReg.id);
    assert.equal(refreshedReg?.status, "SCHEDULED");
  });

  // 4. Fan Card Fulfillment Pipeline
  await runAsyncTest("Fan Cards: Single status advancement with courier reference and history tracking", async () => {
    const cards = await operationsService.getFanCards();
    const targetCard = cards.find((c) => c.tracking_code === "KWFC-3V8P-92L4");
    assert.ok(targetCard, "Target card should exist");

    const advanceResult = await operationsService.updateFanCardStatus(
      targetCard.id,
      "PREPARED",
      {
        courierReference: "BATCH-HOU-9921",
        internalNotes: "Commemorative card embossed and packaged.",
        sendEmail: true,
      }
    );

    assert.equal(advanceResult.card.current_status, "PREPARED");
    assert.equal(advanceResult.card.courier_reference, "BATCH-HOU-9921");
    assert.ok(advanceResult.card.history.some((h) => h.status === "PREPARED"));
  });

  await runAsyncTest("Fan Cards: Batch advancement across multiple cards", async () => {
    const cards = await operationsService.getFanCards();
    const cardIds = [cards[1].id, cards[2].id];

    const batchResult = await operationsService.batchUpdateFanCardStatus(
      cardIds,
      "PREPARED",
      {
        internalNotes: "Batch manufacturing batch #2",
        sendEmail: false,
      }
    );

    assert.equal(batchResult.updatedCount, 2);
    const updated1 = await operationsService.getFanCardById(cardIds[0]);
    const updated2 = await operationsService.getFanCardById(cardIds[1]);
    assert.equal(updated1?.current_status, "PREPARED");
    assert.equal(updated2?.current_status, "PREPARED");
  });

  await runAsyncTest("Fan Cards: Delivery exception flagging and resolution", async () => {
    const cards = await operationsService.getFanCards();
    const card = cards[0];

    const flagged = await operationsService.updateFanCardStatus(
      card.id,
      "DELIVERY_ISSUE",
      {
        issueReason: "Incorrect apartment number reported by courier.",
        sendEmail: true,
      }
    );

    assert.equal(flagged.card.current_status, "DELIVERY_ISSUE");

    const resolved = await operationsService.updateFanCardStatus(
      card.id,
      "IN_TRANSIT",
      {
        courierReference: "USPS-RESOLVED-1029",
        internalNotes: "Address verified with fan, out on redelivery route.",
        sendEmail: true,
      }
    );

    assert.equal(resolved.card.current_status, "IN_TRANSIT");
  });

  // 5. End-to-End Operational Smoke Test
  await runAsyncTest("End-to-End Smoke Test: Fan registers -> Admin schedules & ships card -> Fan tracks live", async () => {
    const regResult = await processRegistration({
      firstName: "Elijah",
      lastName: "Vance",
      email: "elijah.vance@example.org",
      phone: "(404) 555-8822",
      cityId: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", // Atlanta
      notes: "Wayne fan since day one!",
    });

    assert.equal(regResult.success, true);
    assert.ok(regResult.data?.confirmationReference);

    const adminRegs = await operationsService.getRegistrations({ search: "Elijah" });
    assert.equal(adminRegs.length, 1);
    const elijahReg = adminRegs[0];
    assert.equal(elijahReg.fan.first_name, "Elijah");
    assert.ok(elijahReg.fanCard?.tracking_code, "Should have a generated tracking code");
    const elijahTrackingCode = elijahReg.fanCard.tracking_code;

    const schedResult = await operationsService.assignSchedule({
      registrationId: elijahReg.id,
      assignedDate: "2026-11-14",
      arrivalTime: "17:45",
      venueName: "Fox Theatre",
      venueAddress: "660 Peachtree St NE, Atlanta, GA",
      arrivalInstructions: "Stage Door B check-in. Wayne VIP host will guide you to VIP suite.",
      sendEmail: true,
    });

    assert.equal(schedResult.schedule.arrival_time, "17:45");
    assert.equal(schedResult.schedule.is_notified, true);

    const shipResult = await operationsService.updateFanCardStatus(
      elijahReg.fanCard.id,
      "SHIPPED",
      {
        courierReference: "FEDEX-VIP-EXP-9921",
        internalNotes: "VIP Commemorative Card shipped via express carrier",
        sendEmail: true,
      }
    );
    assert.equal(shipResult.card.current_status, "SHIPPED");

    const trackResult = await lookupFanCardStatus(elijahTrackingCode, "127.0.0.1");
    assert.equal(trackResult.success, true);
    assert.ok(trackResult.data);
    assert.equal(trackResult.data.currentStatus, "SHIPPED");
    assert.equal(trackResult.data.cityName, "Atlanta");
    assert.equal(trackResult.data.fanInitial, "E.");
    assert.equal("email" in trackResult.data, false);
    assert.equal("phone" in trackResult.data, false);
    assert.equal("address" in trackResult.data, false);

    const shippedStep = trackResult.data.timeline.find((t) => t.id === "SHIPPED");
    assert.ok(shippedStep);
    assert.equal(shippedStep.state, "current");
  });

  // 6. Audit Logging Verification
  await runAsyncTest("Audit Trail: Verify administrative actions record immutable audit logs", async () => {
    clearAuditLogs();

    const session = {
      id: "admin-super-01",
      email: "superadmin@kountrywayne.com",
      role: "SUPER_ADMIN",
    };

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "CITY_CHANGE",
      entityTable: "cities",
      entityId: "city-test-123",
      details: "Created test tour stop",
    });

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "SCHEDULE_CHANGE",
      entityTable: "meet_and_greet_schedules",
      entityId: "sched-test-456",
      details: "Assigned call time 17:30",
    });

    const logs = getAdminAuditLogs();
    assert.equal(logs.length, 2);
    assert.equal(logs[0].action, "SCHEDULE_CHANGE");
    assert.equal(logs[1].action, "CITY_CHANGE");
  });

  return { passed, failed };
}

if (process.argv[1]?.endsWith("admin-operations-suite.mjs")) {
  runAdminOperationsTestSuite().then(({ failed }) => {
    process.exitCode = failed > 0 ? 1 : 0;
  });
}
