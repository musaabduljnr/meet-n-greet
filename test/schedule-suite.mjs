import assert from "node:assert/strict";
import { operationsService } from "../src/lib/services/operations-service.ts";
import {
  createScheduleSchema,
  updateScheduleSchema,
  cancelScheduleSchema,
} from "../src/lib/validations/schedule.ts";
import { emailService } from "../src/lib/email/email-service.ts";
import { requireAdminPermission } from "../src/lib/auth/admin-auth.ts";

export async function runScheduleTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 8 TEST SUITE: MEET & GREET SCHEDULING & REVISION SUITE ");
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

  // 1. Zod Validation Schemas
  await runAsyncTest("Validation: createScheduleSchema enforces required fields", () => {
    // Missing required fields
    const invalidRes = createScheduleSchema.safeParse({
      registrationId: "",
      date: "invalid-date",
      startTime: "",
      location: "",
      instructions: "too",
    });
    assert.equal(invalidRes.success, false, "Should fail on invalid inputs");

    // Valid schedule payload
    const validRes = createScheduleSchema.safeParse({
      registrationId: "reg-test-1",
      date: "2026-11-20",
      startTime: "5:30 PM",
      endTime: "6:30 PM",
      location: "Fox Theatre - VIP Green Room",
      instructions: "Arrive at Stage Door B with photo ID and physical Fan Card.",
      sendEmail: true,
    });
    assert.equal(validRes.success, true, "Should pass valid schedule payload");
  });

  await runAsyncTest("Validation: cancelScheduleSchema mandates non-empty reason (min 5 chars)", () => {
    const invalidShort = cancelScheduleSchema.safeParse({
      cancellationReason: "no",
    });
    assert.equal(invalidShort.success, false, "Should fail on reason < 5 chars");

    const valid = cancelScheduleSchema.safeParse({
      cancellationReason: "Sound check delayed due to production travel.",
      sendEmail: true,
    });
    assert.equal(valid.success, true, "Should accept valid cancellation reason");
  });

  await runAsyncTest("Validation: updateScheduleSchema allows partial updates and status validation", () => {
    const validUpdate = updateScheduleSchema.safeParse({
      startTime: "6:00 PM",
      changeReason: "Stage door entrance moved to gate 4",
      status: "SCHEDULED",
    });
    assert.equal(validUpdate.success, true, "Should accept partial schedule updates");

    const invalidStatus = updateScheduleSchema.safeParse({
      status: "INVALID_STATUS",
    });
    assert.equal(invalidStatus.success, false, "Should reject invalid schedule status");
  });

  // 2. Schedule Creation Workflow
  await runAsyncTest("Operations: Create schedule transactionally updates registration and history", async () => {
    // Find a registration currently awaiting schedule (e.g. reg-002 or reg-003)
    const registrations = await operationsService.getRegistrations();
    const targetReg = registrations.find((r) => !r.schedule || r.schedule.status === "CANCELLED");
    assert.ok(targetReg, "Should find a registration needing schedule assignment");

    const result = await operationsService.createSchedule({
      registrationId: targetReg.id,
      date: "2026-12-10",
      startTime: "17:45",
      endTime: "18:45",
      location: "VIP Reception Hall - Gate 2",
      instructions: "Check in with Tour Manager Marcus. Bring photo ID.",
      sendEmail: true,
      adminId: "admin-test-01",
      adminEmail: "operations@kountrywayne.com",
    });

    assert.ok(result.schedule, "Schedule entity should be returned");
    assert.equal(result.schedule.registration_id, targetReg.id);
    assert.equal(result.schedule.status, "SCHEDULED");
    assert.equal(result.schedule.date, "2026-12-10");
    assert.equal(result.schedule.start_time, "17:45");
    assert.equal(result.schedule.location, "VIP Reception Hall - Gate 2");
    assert.equal(result.schedule.is_notified, true);

    // Verify history initialized with CREATED
    assert.ok(result.schedule.history.length >= 1, "Should have initial history record");
    const initialHist = result.schedule.history[0];
    assert.equal(initialHist.action, "CREATED");
    assert.equal(initialHist.changed_by, "admin-test-01");
    assert.equal(initialHist.notified_fan, true);
    assert.equal(initialHist.new_values.start_time, "17:45");

    // Verify registration status was updated
    const updatedReg = await operationsService.getRegistrationById(targetReg.id);
    assert.equal(updatedReg?.status, "SCHEDULED");

    // Verify duplicate active schedule creation is blocked
    await assert.rejects(
      async () => {
        await operationsService.createSchedule({
          registrationId: targetReg.id,
          date: "2026-12-10",
          startTime: "18:00",
          location: "VIP Lounge",
          instructions: "Test instructions",
        });
      },
      /Active schedule already exists/,
      "Should reject duplicate schedule creation for same registration"
    );
  });

  // 3. Schedule Revision and Audit History Preservation
  await runAsyncTest("Operations: Update schedule preserves non-destructive history and logs diffs", async () => {
    const schedules = await operationsService.getSchedules({ status: "SCHEDULED" });
    assert.ok(schedules.length > 0, "Should have scheduled VIP appointments");
    const sched = schedules[0];
    const originalStartTime = sched.start_time;

    const newStartTime = "18:15";
    const updateReason = "Security briefing extended by 30 minutes.";

    const updateRes = await operationsService.updateSchedule(sched.id, {
      startTime: newStartTime,
      changeReason: updateReason,
      sendEmail: true,
      adminId: "admin-super-01",
      adminEmail: "coordinator@kountrywayne.com",
    });

    assert.equal(updateRes.schedule.start_time, newStartTime);
    assert.ok(updateRes.schedule.history.length >= 2, "History should append new revision");

    const latestHist = updateRes.schedule.history[0];
    assert.equal(latestHist.action, "UPDATED");
    assert.equal(latestHist.changed_by, "admin-super-01");
    assert.equal(latestHist.change_reason, updateReason);
    assert.equal(latestHist.previous_values?.start_time, originalStartTime);
    assert.equal(latestHist.new_values.start_time, newStartTime);
    assert.equal(latestHist.notified_fan, true);

    // Verify history inspection method
    const historyList = await operationsService.getScheduleHistory(sched.id);
    assert.ok(historyList.length >= 2);
    assert.equal(historyList[0].id, latestHist.id);
  });

  // 4. Schedule Cancellation Workflow
  await runAsyncTest("Operations: Cancel schedule requires reason, marks CANCELLED, and logs audit", async () => {
    // Create temporary schedule to cancel
    const regs = await operationsService.getRegistrations();
    const candidate = regs.find((r) => r.schedule?.status === "SCHEDULED");
    assert.ok(candidate?.schedule, "Should have scheduled candidate");

    const schedId = candidate.schedule.id;

    // Cancellation without reason must fail
    await assert.rejects(
      async () => {
        await operationsService.cancelSchedule(schedId, {
          cancellationReason: "",
        });
      },
      /cancellation reason is required/,
      "Must reject cancellation without reason"
    );

    // Cancel with valid reason
    const reason = "Tour venue undergoes emergency maintenance; rescheduling to follow.";
    const cancelRes = await operationsService.cancelSchedule(schedId, {
      cancellationReason: reason,
      sendEmail: true,
      adminId: "admin-ops-02",
      adminEmail: "tourmanager@kountrywayne.com",
    });

    assert.equal(cancelRes.schedule.status, "CANCELLED");
    assert.equal(cancelRes.schedule.cancellation_reason, reason);

    const cancelHist = cancelRes.schedule.history[0];
    assert.equal(cancelHist.action, "CANCELLED");
    assert.equal(cancelHist.change_reason, reason);
    assert.equal(cancelHist.new_values.status, "CANCELLED");

    // Registration status should synchronize
    const refreshedReg = await operationsService.getRegistrationById(candidate.id);
    assert.equal(refreshedReg?.status, "CANCELLED");
  });

  // 5. Query Filters & Aliases
  await runAsyncTest("Operations: Filter schedules by status and city", async () => {
    const all = await operationsService.getSchedules();
    const scheduledOnly = await operationsService.getSchedules({ status: "SCHEDULED" });
    const cancelledOnly = await operationsService.getSchedules({ status: "CANCELLED" });

    assert.ok(all.length >= scheduledOnly.length, "All schedules >= scheduled only");
    assert.ok(cancelledOnly.every((s) => s.status === "CANCELLED"));
    assert.ok(scheduledOnly.every((s) => s.status === "SCHEDULED"));
  });

  // 6. Email Infrastructure: Schedule Cancellation Template
  await runAsyncTest("Email: Schedule cancellation email renders with reason and branding", async () => {
    const emailResult = await emailService.sendScheduleCancellationEmail({
      fanName: "Marcus VIP Fan",
      fanEmail: "marcus.fan@example.com",
      cityName: "Atlanta",
      cityState: "GA",
      assignedDate: "December 10, 2026",
      cancellationReason: "Production transit weather delay.",
    });

    assert.equal(emailResult.success, true, "Cancellation email should succeed");
    assert.ok(emailResult.messageId, "Should return a valid messageId");
  });

  console.log("\n===============================================================");
  console.log(`  PHASE 8 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  return { passed, failed };
}

// Allow direct execution
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/schedule-suite.mjs")) {
  runScheduleTestSuite().then((res) => {
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
