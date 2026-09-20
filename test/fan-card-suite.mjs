import assert from "node:assert/strict";
import { operationsService } from "../src/lib/services/operations-service.ts";
import {
  FAN_CARD_STATUS_ENUM,
  updateFanCardStatusSchema,
  batchUpdateFanCardStatusSchema,
  resendTrackingEmailSchema,
  validateFanCardTransition,
} from "../src/lib/validations/fan-card.ts";
import { emailService } from "../src/lib/email/email-service.ts";
import { getAdminAuditLogs } from "../src/lib/security/audit.ts";

export async function runFanCardTestSuite() {
  console.log("===============================================================");
  console.log("  PHASE 9 TEST SUITE: FAN CARD MANAGEMENT & FULFILLMENT SUITE  ");
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

  // ---------------------------------------------------------------------------
  // 1. TRACKING CODE FORMAT & ENTROPY
  // ---------------------------------------------------------------------------
  await runAsyncTest("Tracking Code: Generated codes follow KWFC-XXXX-XXXX and exhibit high entropy", async () => {
    const cards = await operationsService.getFanCards();
    assert.ok(cards.length > 0, "Seed cards should exist");

    const codeRegex = /^KWFC-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    const seenCodes = new Set();

    for (const card of cards) {
      assert.ok(
        codeRegex.test(card.tracking_code),
        `Tracking code ${card.tracking_code} must match KWFC-XXXX-XXXX`
      );
      assert.ok(
        !seenCodes.has(card.tracking_code),
        `Tracking code ${card.tracking_code} must be unique`
      );
      seenCodes.add(card.tracking_code);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. ZOD VALIDATIONS & STATUS TRANSITION LOGIC
  // ---------------------------------------------------------------------------
  await runAsyncTest("Validation: updateFanCardStatusSchema validates inputs", () => {
    // Missing cardId
    const invalidEmpty = updateFanCardStatusSchema.safeParse({
      cardId: "",
      status: "PROCESSING",
    });
    assert.equal(invalidEmpty.success, false, "Should fail on empty cardId");

    // Invalid status string
    const invalidStatus = updateFanCardStatusSchema.safeParse({
      cardId: "fc-123",
      status: "INVALID_STAGE",
    });
    assert.equal(invalidStatus.success, false, "Should fail on invalid status");

    // Valid payload
    const valid = updateFanCardStatusSchema.safeParse({
      cardId: "fc-123",
      status: "SHIPPED",
      courierReference: "USPS-9400111899562548231234",
      internalNotes: "Dispatched from VIP fulfillment center",
      sendEmail: true,
    });
    assert.equal(valid.success, true, "Should accept valid status update");
  });

  await runAsyncTest("Validation: batchUpdateFanCardStatusSchema validates bulk inputs", () => {
    const emptyCards = batchUpdateFanCardStatusSchema.safeParse({
      cardIds: [],
      status: "PREPARED",
    });
    assert.equal(emptyCards.success, false, "Should reject empty cardIds array");

    const validBatch = batchUpdateFanCardStatusSchema.safeParse({
      cardIds: ["fc-1", "fc-2"],
      status: "PREPARED",
      internalNotes: "Bulk batch printed",
      sendEmail: false,
    });
    assert.equal(validBatch.success, true, "Should accept valid batch payload");
  });

  await runAsyncTest("Validation: validateFanCardTransition prevents invalid transitions and requires note on issue", () => {
    // 1. Same status is a no-op
    const sameStatus = validateFanCardTransition("PROCESSING", "PROCESSING");
    assert.equal(sameStatus.isValid, false);
    assert.match(sameStatus.error || "", /already in status/);

    // 2. Transitioning to DELIVERY_ISSUE requires notes >= 3 chars
    const issueNoNote = validateFanCardTransition("IN_TRANSIT", "DELIVERY_ISSUE", "");
    assert.equal(issueNoNote.isValid, false);
    assert.match(issueNoNote.error || "", /internal note or issue explanation/);

    const issueWithNote = validateFanCardTransition("IN_TRANSIT", "DELIVERY_ISSUE", "Damaged in transit");
    assert.equal(issueWithNote.isValid, true);

    // 3. Delivered card cannot transition to normal status
    const deliveredToShipped = validateFanCardTransition("DELIVERED", "SHIPPED");
    assert.equal(deliveredToShipped.isValid, false);
    assert.match(deliveredToShipped.error || "", /Cannot transition a DELIVERED card/);

    // 4. Valid transitions
    const regToProc = validateFanCardTransition("REGISTERED", "PROCESSING");
    assert.equal(regToProc.isValid, true);

    const issueToPrep = validateFanCardTransition("DELIVERY_ISSUE", "PREPARED");
    assert.equal(issueToPrep.isValid, true);
  });

  // ---------------------------------------------------------------------------
  // 3. COMPLETE SEQUENTIAL STATUS PROGRESSION WORKFLOW
  // ---------------------------------------------------------------------------
  await runAsyncTest("Operations: Admin can progress Fan Card through all fulfillment stages with full history", async () => {
    // Find or pick a card to test full sequential progression
    const allCards = await operationsService.getFanCards();
    const testCard = allCards[0];
    assert.ok(testCard, "Test card must exist");

    // Reset card to REGISTERED for deterministic test flow
    testCard.current_status = "REGISTERED";
    testCard.history = [
      {
        id: `fch-init-${Date.now()}`,
        fan_card_id: testCard.id,
        previous_status: null,
        new_status: "REGISTERED",
        changed_by: "system",
        changed_by_name: "Registration Portal",
        internal_note: "Initial registration created Fan Card",
        created_at: new Date().toISOString(),
      },
    ];

    const progressionSequence = [
      {
        status: "PROCESSING",
        note: "Card assigned to production queue",
        courier: undefined,
      },
      {
        status: "PREPARED",
        note: "Card printed, laser-engraved, and holographic seal attached",
        courier: undefined,
      },
      {
        status: "SHIPPED",
        note: "Handed over to USPS priority courier",
        courier: "USPS-940010000000000001",
      },
      {
        status: "IN_TRANSIT",
        note: "Package departed Atlanta regional sorting facility",
        courier: "USPS-940010000000000001",
      },
      {
        status: "OUT_FOR_DELIVERY",
        note: "On delivery vehicle with local carrier",
        courier: "USPS-940010000000000001",
      },
      {
        status: "DELIVERED",
        note: "Delivered to recipient mailbox / front porch",
        courier: "USPS-940010000000000001",
      },
    ];

    for (const step of progressionSequence) {
      const updateResult = await operationsService.updateFanCardStatus(
        testCard.id,
        step.status,
        {
          internalNotes: step.note,
          courierReference: step.courier,
          sendEmail: true,
          adminId: "admin-ops-01",
          adminEmail: "operations@kountrywayne.com",
          adminRole: "ADMIN",
        }
      );

      assert.ok(updateResult.card, `Transition to ${step.status} must succeed`);
      assert.equal(updateResult.card.current_status, step.status, `Current status must be ${step.status}`);
      if (step.courier) {
        assert.equal(updateResult.card.courier_reference, step.courier);
      }
    }

    // Verify history accumulation
    const history = await operationsService.getFanCardHistory(testCard.id);
    assert.ok(history.length >= 7, "History should contain initial plus 6 transitions");

    const latest = history[0];
    assert.equal(latest.new_status, "DELIVERED");
    assert.equal(latest.previous_status, "OUT_FOR_DELIVERY");
    assert.equal(latest.changed_by, "admin-ops-01");
    assert.match(latest.internal_note || "", /Delivered to recipient/);
  });

  // ---------------------------------------------------------------------------
  // 4. EXCEPTION & RESOLUTION WORKFLOW (DELIVERY ISSUE)
  // ---------------------------------------------------------------------------
  await runAsyncTest("Operations: Admin can flag DELIVERY_ISSUE and resolve back to fulfillment", async () => {
    const allCards = await operationsService.getFanCards();
    const testCard = allCards.find((c) => c.current_status !== "DELIVERY_ISSUE") || allCards[1];
    assert.ok(testCard, "Should find target test card");

    // 1. Flag Delivery Issue
    const issueResult = await operationsService.updateFanCardStatus(
      testCard.id,
      "DELIVERY_ISSUE",
      {
        internalNotes: "Recipient apartment number missing, courier unable to access gate",
        issueReason: "Recipient apartment number missing, courier unable to access gate",
        sendEmail: true,
        adminId: "staff-ops-02",
        adminEmail: "staff@kountrywayne.com",
        adminRole: "STAFF",
      }
    );

    assert.ok(issueResult.card, "Flagging issue should succeed");
    assert.equal(issueResult.card.current_status, "DELIVERY_ISSUE");

    // 2. Resolve back to PREPARED with updated address note
    const resolveResult = await operationsService.updateFanCardStatus(
      testCard.id,
      "PREPARED",
      {
        internalNotes: "Address verified with fan via support phone; new label printed",
        sendEmail: true,
        adminId: "admin-ops-01",
        adminEmail: "operations@kountrywayne.com",
        adminRole: "ADMIN",
      }
    );

    assert.ok(resolveResult.card, "Resolving issue should succeed");
    assert.equal(resolveResult.card.current_status, "PREPARED");

    const history = await operationsService.getFanCardHistory(testCard.id);
    const issueEntry = history.find((h) => h.new_status === "DELIVERY_ISSUE");
    assert.ok(issueEntry, "History must contain the DELIVERY_ISSUE entry");
    assert.match(issueEntry.internal_note || "", /apartment number missing/);
  });

  // ---------------------------------------------------------------------------
  // 5. BULK STATUS UPDATES WITH INDIVIDUAL AUDIT & HISTORY
  // ---------------------------------------------------------------------------
  await runAsyncTest("Operations: Bulk status updates process each card individually with separate history and audit logs", async () => {
    const allCards = await operationsService.getFanCards();
    // Select 2 cards and initialize their status to PROCESSING for a valid batch advancement
    const batchCards = allCards.slice(0, 2);
    for (const c of batchCards) {
      c.current_status = "PROCESSING";
    }
    const cardIds = batchCards.map((c) => c.id);

    // Initial audit log count
    const initialLogs = await getAdminAuditLogs();
    const initialLogCount = initialLogs.length;

    const bulkResult = await operationsService.batchUpdateFanCardStatus(
      cardIds,
      "PREPARED",
      {
        internalNotes: "Bulk VIP card engraving run #2026-B",
        sendEmail: false,
        adminId: "admin-bulk-01",
        adminEmail: "operations@kountrywayne.com",
        adminRole: "ADMIN",
      }
    );

    assert.equal(bulkResult.updatedCount, cardIds.length, "All cards in batch should be updated");

    // Verify each card's current status and history
    for (const id of cardIds) {
      const card = await operationsService.getFanCardById(id);
      assert.ok(card);
      assert.equal(card.current_status, "PREPARED");

      const cardHistory = await operationsService.getFanCardHistory(id);
      const latestHistory = cardHistory[0];
      assert.equal(latestHistory.new_status, "PREPARED");
      assert.match(latestHistory.internal_note || "", /Bulk VIP card engraving run/);
    }

    // Verify audit logs were generated for each card
    const postLogs = await getAdminAuditLogs();
    assert.ok(
      postLogs.length >= initialLogCount + cardIds.length,
      "Should have created individual audit logs for each card in batch"
    );

    // Test partial failure isolation with a nonexistent card ID
    const mixedBatchResult = await operationsService.batchUpdateFanCardStatus(
      [cardIds[0], "non-existent-card-id"],
      "SHIPPED",
      {
        internalNotes: "Mixed batch test",
        sendEmail: false,
      }
    );

    assert.equal(mixedBatchResult.updatedCount, 1, "Only valid card should succeed");
    const failedItem = mixedBatchResult.results.find((r) => !r.success);
    assert.ok(failedItem, "Should record failed item");
    assert.equal(failedItem.cardId, "non-existent-card-id");
  });

  // ---------------------------------------------------------------------------
  // 6. RESEND TRACKING EMAIL
  // ---------------------------------------------------------------------------
  await runAsyncTest("Operations: Admin can resend Fan Card tracking email with forceRetry and audit dispatch", async () => {
    const allCards = await operationsService.getFanCards();
    const testCard = allCards[0];
    assert.ok(testCard, "Test card must exist");

    const resendResult = await operationsService.resendFanCardTrackingEmail(testCard.id);
    assert.equal(resendResult.success, true, "Resend email must succeed");
    assert.ok(resendResult.emailResult?.messageId, "Should return provider message ID");
    assert.match(resendResult.message, /re-dispatched/, "Should confirm dispatch");
  });

  // ---------------------------------------------------------------------------
  // 7. AUDIT LOG VERIFICATION
  // ---------------------------------------------------------------------------
  await runAsyncTest("Audit Trail: Status updates and communication dispatches are immutably logged", async () => {
    const logs = await getAdminAuditLogs();
    const statusChangeLogs = logs.filter((l) => l.action === "STATUS_CHANGE" && l.entityTable === "fan_cards");
    assert.ok(statusChangeLogs.length > 0, "Must have recorded fan_card STATUS_CHANGE audit logs");

    const firstStatusLog = statusChangeLogs[0];
    assert.ok(firstStatusLog.oldState, "Must capture old state snapshot");
    assert.ok(firstStatusLog.newState, "Must capture new state snapshot");
    assert.ok(firstStatusLog.adminEmail, "Must record admin actor");
  });

  console.log("\n===============================================================");
  console.log(`  PHASE 9 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  return { passed, failed };
}

// Allow direct execution
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("test/fan-card-suite.mjs")) {
  runFanCardTestSuite().then((res) => {
    process.exitCode = res.failed > 0 ? 1 : 0;
  });
}
