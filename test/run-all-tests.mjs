try { process.loadEnvFile?.('.env.local'); } catch {}
import { runRegistrationTestSuite } from "./registration-suite.mjs";
import { runTrackingTestSuite } from "./tracking-suite.mjs";
import { runEmailTestSuite } from "./email-suite.mjs";
import { runAdminAuthTestSuite } from "./admin-auth-suite.mjs";
import { runAdminOperationsTestSuite } from "./admin-operations-suite.mjs";
import { runScheduleTestSuite } from "./schedule-suite.mjs";
import { runFanCardTestSuite } from "./fan-card-suite.mjs";
import { runProductionReadinessTestSuite } from "./production-readiness-suite.mjs";

async function main() {
  console.log("===============================================================================");
  console.log("  KOUNTRY WAYNE VIP PLATFORM: UNIFIED PRODUCTION TEST RUNNER                   ");
  console.log("===============================================================================\n");

  const startTime = Date.now();

  const regResults = await runRegistrationTestSuite();
  console.log("\n");

  const trackResults = await runTrackingTestSuite();
  console.log("\n");

  const emailResults = await runEmailTestSuite();
  console.log("\n");

  const authResults = await runAdminAuthTestSuite();
  console.log("\n");

  const opsResults = await runAdminOperationsTestSuite();
  console.log("\n");

  const schedResults = await runScheduleTestSuite();
  console.log("\n");

  const fanCardResults = await runFanCardTestSuite();
  console.log("\n");

  const auditResults = await runProductionReadinessTestSuite();
  console.log("\n");

  const totalPassed =
    regResults.passed +
    trackResults.passed +
    emailResults.passed +
    authResults.passed +
    opsResults.passed +
    schedResults.passed +
    fanCardResults.passed +
    auditResults.passed;
  const totalFailed =
    regResults.failed +
    trackResults.failed +
    emailResults.failed +
    authResults.failed +
    opsResults.failed +
    schedResults.failed +
    fanCardResults.failed +
    auditResults.failed;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("===============================================================================");
  console.log("  OVERALL TEST SUITE SUMMARY                                                   ");
  console.log("===============================================================================");
  console.log(`  Phase 3 (Registration Flow):       ${regResults.passed} passed, ${regResults.failed} failed`);
  console.log(`  Phase 4 (Fan Card Tracking):       ${trackResults.passed} passed, ${trackResults.failed} failed`);
  console.log(`  Phase 5 (Email Infrastructure):    ${emailResults.passed} passed, ${emailResults.failed} failed`);
  console.log(`  Phase 6 (Admin Auth & RBAC):       ${authResults.passed} passed, ${authResults.failed} failed`);
  console.log(`  Phase 7 (Admin Operations Suite):  ${opsResults.passed} passed, ${opsResults.failed} failed`);
  console.log(`  Phase 8 (VIP Scheduling Suite):    ${schedResults.passed} passed, ${schedResults.failed} failed`);
  console.log(`  Phase 9 (Fan Card Fulfillment):    ${fanCardResults.passed} passed, ${fanCardResults.failed} failed`);
  console.log(`  Phase 10 (Production Readiness):   ${auditResults.passed} passed, ${auditResults.failed} failed`);
  console.log("-------------------------------------------------------------------------------");
  console.log(`  TOTAL:                             ${totalPassed} PASSED, ${totalFailed} FAILED (${elapsed}s)`);
  console.log("===============================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL RUNNER EXCEPTION:", err);
  process.exit(1);
});
