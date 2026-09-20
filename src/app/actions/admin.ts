"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/auth/admin-auth";
import { recordAdminAuditLog, getAdminAuditLogs } from "@/lib/security/audit";
import type { AuditAction, StoredAuditLog } from "@/lib/security/audit";
import { operationsService } from "@/lib/services/operations-service";
import type {
  EnrichedRegistration,
  StoredFanCardEntity,
  StoredScheduleEntity,
  DashboardKPIs,
} from "@/lib/services/operations-service";
import type { City, FanCardStatus, FanCardHistoryEntry, RegistrationStatus, ScheduleHistoryEntry, ScheduleStatus } from "@/types/database";
import {
  createScheduleSchema,
  updateScheduleSchema,
  cancelScheduleSchema,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type CancelScheduleInput,
} from "@/lib/validations/schedule";
import {
  updateFanCardStatusSchema,
  batchUpdateFanCardStatusSchema,
  resendTrackingEmailSchema,
} from "@/lib/validations/fan-card";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// -----------------------------------------------------------------------------
// Dashboard Actions
// -----------------------------------------------------------------------------
export async function getDashboardDataAction(): Promise<
  ActionResult<{ kpis: DashboardKPIs; recentRegistrations: EnrichedRegistration[] }>
> {
  try {
    await requireAdminPermission("registrations:view");
    const kpis = await operationsService.getDashboardMetrics();
    const recentRegistrations = await operationsService.getRegistrations({ limit: 6 });

    return {
      success: true,
      data: { kpis, recentRegistrations },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard metrics";
    return { success: false, error: errorMsg };
  }
}

// -----------------------------------------------------------------------------
// Tour Cities Actions
// -----------------------------------------------------------------------------
export async function getAdminCitiesAction(): Promise<ActionResult<City[]>> {
  try {
    await requireAdminPermission("cities:view");
    const cities = await operationsService.getAllCities();
    return { success: true, data: cities };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch cities",
    };
  }
}

export async function createCityAction(input: {
  name: string;
  state: string;
  country?: string;
  tour_date: string;
  venue_name?: string;
  venue_address?: string;
  max_capacity?: number;
  notes?: string;
  is_active?: boolean;
}): Promise<ActionResult<City>> {
  try {
    const session = await requireAdminPermission("cities:manage");

    if (!input.name || !input.state || !input.tour_date) {
      return { success: false, error: "City name, state, and tour date are required." };
    }

    const city = await operationsService.createCity(input);

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "CITY_CHANGE",
      entityTable: "cities",
      entityId: city.id,
      newState: city as unknown as Record<string, unknown>,
      details: `Created new tour stop: ${city.name}, ${city.state} on ${city.tour_date}`,
    });

    revalidatePath("/admin/cities");
    revalidatePath("/admin");
    revalidatePath("/register");

    return {
      success: true,
      message: `Tour city '${city.name}, ${city.state}' successfully added.`,
      data: city,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create city",
    };
  }
}

export async function updateCityAction(
  id: string,
  updates: Partial<Omit<City, "id" | "created_at">>
): Promise<ActionResult<City>> {
  try {
    const session = await requireAdminPermission("cities:manage");
    const oldCity = await operationsService.getCityById(id);
    const updated = await operationsService.updateCity(id, updates);

    if (!updated) {
      return { success: false, error: "City not found." };
    }

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "CITY_CHANGE",
      entityTable: "cities",
      entityId: id,
      oldState: oldCity as unknown as Record<string, unknown>,
      newState: updated as unknown as Record<string, unknown>,
      details: `Updated tour stop ${updated.name}, ${updated.state}`,
    });

    revalidatePath("/admin/cities");
    revalidatePath("/admin");
    revalidatePath("/register");

    return {
      success: true,
      message: "City details updated successfully.",
      data: updated,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update city",
    };
  }
}

export async function toggleCityActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<City>> {
  try {
    const session = await requireAdminPermission("cities:manage");
    const updated = await operationsService.toggleCityActive(id, isActive);

    if (!updated) {
      return { success: false, error: "City not found." };
    }

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "CITY_CHANGE",
      entityTable: "cities",
      entityId: id,
      details: `Toggled city active state to ${isActive ? "ACTIVE" : "INACTIVE"} for ${updated.name}`,
    });

    revalidatePath("/admin/cities");
    revalidatePath("/admin");
    revalidatePath("/register");

    return {
      success: true,
      message: `City is now ${isActive ? "open" : "closed"} for VIP registration.`,
      data: updated,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle city status",
    };
  }
}

// -----------------------------------------------------------------------------
// Fan Registrations Actions
// -----------------------------------------------------------------------------
export async function getAdminRegistrationsAction(filter?: {
  search?: string;
  cityId?: string;
  status?: RegistrationStatus;
  limit?: number;
}): Promise<ActionResult<EnrichedRegistration[]>> {
  try {
    await requireAdminPermission("registrations:view");
    const regs = await operationsService.getRegistrations(filter);
    return { success: true, data: regs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch registrations",
    };
  }
}

export async function updateRegistrationStatusAction(
  id: string,
  newStatus: RegistrationStatus
): Promise<ActionResult<EnrichedRegistration>> {
  try {
    const session = await requireAdminPermission("registrations:manage");
    const updated = await operationsService.updateRegistrationStatus(id, newStatus);

    if (!updated) {
      return { success: false, error: "Registration not found." };
    }

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "STATUS_CHANGE",
      entityTable: "registrations",
      entityId: id,
      newState: { status: newStatus },
      details: `Updated registration for ${updated.fan.first_name} ${updated.fan.last_name} to ${newStatus}`,
    });

    revalidatePath("/admin/registrations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Registration status updated to ${newStatus}.`,
      data: updated,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update registration status",
    };
  }
}

// -----------------------------------------------------------------------------
// Meet & Greet Schedules Actions
// -----------------------------------------------------------------------------
export async function getAdminSchedulesAction(filter?: {
  status?: ScheduleStatus;
  cityId?: string;
}): Promise<ActionResult<StoredScheduleEntity[]>> {
  try {
    await requireAdminPermission("schedules:view");
    const schedules = await operationsService.getSchedules(filter);
    return { success: true, data: schedules };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch schedules",
    };
  }
}

export async function getScheduleHistoryAction(
  scheduleId: string
): Promise<ActionResult<ScheduleHistoryEntry[]>> {
  try {
    await requireAdminPermission("schedules:view");
    const history = await operationsService.getScheduleHistory(scheduleId);
    return { success: true, data: history };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch schedule history",
    };
  }
}

export async function createScheduleAction(
  input: CreateScheduleInput
): Promise<ActionResult<StoredScheduleEntity>> {
  try {
    const session = await requireAdminPermission("schedules:manage");

    const parsed = createScheduleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid schedule data",
      };
    }

    const result = await operationsService.createSchedule({
      ...parsed.data,
      adminId: session.id,
      adminEmail: session.email,
    });

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "SCHEDULE_CHANGE",
      entityTable: "meet_and_greet_schedules",
      entityId: result.schedule.id,
      newState: result.schedule as unknown as Record<string, unknown>,
      details: `Created M&G schedule on ${result.schedule.date} at ${result.schedule.start_time} for registration ${input.registrationId} (Email sent: ${!!result.emailResult?.success})`,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `VIP schedule confirmed.${result.emailResult?.success ? " Confirmation email dispatched to fan." : ""}`,
      data: result.schedule,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create schedule",
    };
  }
}

export async function updateScheduleAction(
  scheduleId: string,
  input: UpdateScheduleInput
): Promise<ActionResult<StoredScheduleEntity>> {
  try {
    const session = await requireAdminPermission("schedules:manage");

    const parsed = updateScheduleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid schedule update data",
      };
    }

    const result = await operationsService.updateSchedule(scheduleId, {
      ...parsed.data,
      adminId: session.id,
      adminEmail: session.email,
    });

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "SCHEDULE_CHANGE",
      entityTable: "meet_and_greet_schedules",
      entityId: result.schedule.id,
      newState: result.schedule as unknown as Record<string, unknown>,
      details: `Updated M&G schedule: ${parsed.data.changeReason || "operational update"} (Status: ${result.schedule.status}, Email sent: ${!!result.emailResult?.success})`,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Schedule revised successfully.${result.emailResult?.success ? " Update notification emailed to fan." : ""}`,
      data: result.schedule,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update schedule",
    };
  }
}

export async function cancelScheduleAction(
  scheduleId: string,
  input: CancelScheduleInput
): Promise<ActionResult<StoredScheduleEntity>> {
  try {
    const session = await requireAdminPermission("schedules:manage");

    const parsed = cancelScheduleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid cancellation data",
      };
    }

    const result = await operationsService.cancelSchedule(scheduleId, {
      cancellationReason: parsed.data.cancellationReason,
      sendEmail: parsed.data.sendEmail,
      adminId: session.id,
      adminEmail: session.email,
    });

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "SCHEDULE_CHANGE",
      entityTable: "meet_and_greet_schedules",
      entityId: result.schedule.id,
      newState: result.schedule as unknown as Record<string, unknown>,
      details: `Cancelled M&G schedule: "${parsed.data.cancellationReason}" (Email sent: ${!!result.emailResult?.success})`,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Schedule has been cancelled.${result.emailResult?.success ? " Cancellation notice emailed to fan." : ""}`,
      data: result.schedule,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel schedule",
    };
  }
}

export async function assignScheduleAction(input: {
  registrationId: string;
  assignedDate: string;
  arrivalTime: string;
  venueName: string;
  venueAddress: string;
  arrivalInstructions: string;
  sendEmail?: boolean;
}): Promise<ActionResult<StoredScheduleEntity>> {
  try {
    const session = await requireAdminPermission("schedules:manage");

    const result = await operationsService.assignSchedule({
      ...input,
      adminId: session.id,
    });

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "SCHEDULE_CHANGE",
      entityTable: "meet_and_greet_schedules",
      entityId: result.schedule.id,
      newState: result.schedule as unknown as Record<string, unknown>,
      details: `Assigned M&G call time ${input.arrivalTime} at ${input.venueName} (Email sent: ${!!result.emailResult?.success})`,
    });

    revalidatePath("/admin/schedules");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin");

    return {
      success: true,
      message: `VIP schedule confirmed.${result.emailResult?.success ? " Confirmation email dispatched to fan." : ""}`,
      data: result.schedule,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to assign schedule",
    };
  }
}

// -----------------------------------------------------------------------------
// Fan Card Fulfillment Pipeline Actions
// -----------------------------------------------------------------------------
export async function getAdminFanCardsAction(filter?: {
  status?: FanCardStatus;
  cityId?: string;
}): Promise<ActionResult<StoredFanCardEntity[]>> {
  try {
    await requireAdminPermission("fan_cards:view");
    const cards = await operationsService.getFanCards(filter);
    return { success: true, data: cards };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch fan cards",
    };
  }
}

export async function updateFanCardStatusAction(
  cardId: string,
  newStatus: FanCardStatus,
  options?: {
    courierReference?: string;
    internalNotes?: string;
    sendEmail?: boolean;
    issueReason?: string;
  }
): Promise<ActionResult<StoredFanCardEntity>> {
  try {
    const session = await requireAdminPermission("fan_cards:manage_status");

    const parsed = updateFanCardStatusSchema.safeParse({
      cardId,
      status: newStatus,
      courierReference: options?.courierReference,
      internalNotes: options?.internalNotes,
      issueReason: options?.issueReason,
      sendEmail: options?.sendEmail,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid status update payload.",
      };
    }

    const result = await operationsService.updateFanCardStatus(cardId, newStatus, {
      ...options,
      adminId: session.id,
      adminEmail: session.email,
    });

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "STATUS_CHANGE",
      entityTable: "fan_cards",
      entityId: cardId,
      newState: { status: newStatus, courierReference: options?.courierReference },
      details: `Advanced Fan Card ${result.card.tracking_code} to ${newStatus} (Email sent: ${!!result.emailResult?.success})`,
    });

    revalidatePath("/admin/fan-cards");
    revalidatePath("/admin");
    revalidatePath("/track");

    return {
      success: true,
      message: `Fan Card status updated to ${newStatus}.${result.emailResult?.success ? " Status notification dispatched." : ""}`,
      data: result.card,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update fan card status",
    };
  }
}

export async function batchUpdateFanCardStatusAction(
  cardIds: string[],
  newStatus: FanCardStatus,
  options?: {
    courierReference?: string;
    internalNotes?: string;
    sendEmail?: boolean;
  }
): Promise<ActionResult<{ updatedCount: number; failedCount: number }>> {
  try {
    const session = await requireAdminPermission("fan_cards:manage_status");

    const parsed = batchUpdateFanCardStatusSchema.safeParse({
      cardIds,
      status: newStatus,
      courierReference: options?.courierReference,
      internalNotes: options?.internalNotes,
      sendEmail: options?.sendEmail,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid bulk update payload.",
      };
    }

    const result = await operationsService.batchUpdateFanCardStatus(cardIds, newStatus, {
      ...options,
      adminId: session.id,
      adminEmail: session.email,
    });

    // Ensure bulk operation never bypasses audit logging: log each successfully updated card
    for (const item of result.results) {
      if (item.success) {
        await recordAdminAuditLog({
          adminId: session.id,
          adminEmail: session.email,
          adminRole: session.role,
          action: "STATUS_CHANGE",
          entityTable: "fan_cards",
          entityId: item.cardId,
          newState: { status: newStatus, courierReference: options?.courierReference },
          details: `Bulk advancement to ${newStatus} (Batch of ${cardIds.length})`,
        });
      }
    }

    // Summary audit record
    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "STATUS_CHANGE",
      entityTable: "fan_cards",
      entityId: `batch-${cardIds.length}`,
      details: `Batch updated ${result.updatedCount} of ${cardIds.length} fan cards to status ${newStatus}`,
    });

    revalidatePath("/admin/fan-cards");
    revalidatePath("/admin");
    revalidatePath("/track");

    const failedCount = cardIds.length - result.updatedCount;

    return {
      success: true,
      message: `Successfully advanced ${result.updatedCount} Fan Cards to ${newStatus}.${failedCount > 0 ? ` (${failedCount} skipped due to transition constraints)` : ""}`,
      data: { updatedCount: result.updatedCount, failedCount },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to batch update fan cards",
    };
  }
}

export async function resendFanCardTrackingEmailAction(
  cardId: string
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const session = await requireAdminPermission("fan_cards:view");

    const parsed = resendTrackingEmailSchema.safeParse({ cardId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid card ID",
      };
    }

    const res = await operationsService.resendFanCardTrackingEmail(cardId, {
      adminId: session.id,
      adminEmail: session.email,
    });

    if (res.success) {
      await recordAdminAuditLog({
        adminId: session.id,
        adminEmail: session.email,
        adminRole: session.role,
        action: "COMMUNICATION_DISPATCH",
        entityTable: "fan_cards",
        entityId: cardId,
        details: `Resent Fan Card tracking information email to recipient`,
      });

      return {
        success: true,
        message: res.message || "Tracking email successfully re-sent to fan.",
        data: { sent: true },
      };
    } else {
      return {
        success: false,
        error: res.message || "Failed to dispatch tracking email.",
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to resend tracking email",
    };
  }
}

export async function getFanCardHistoryAction(
  cardId: string
): Promise<ActionResult<FanCardHistoryEntry[]>> {
  try {
    await requireAdminPermission("fan_cards:view");
    const history = await operationsService.getFanCardHistory(cardId);
    return { success: true, data: history };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch fan card history",
    };
  }
}

// -----------------------------------------------------------------------------
// Data Export (CSV) Actions
// -----------------------------------------------------------------------------
export async function exportRegistrationsCsvAction(filter?: {
  cityId?: string;
  status?: RegistrationStatus;
}): Promise<ActionResult<{ csvContent: string; filename: string }>> {
  try {
    const session = await requireAdminPermission("data:export");
    const csvContent = await operationsService.exportRegistrationsCsv(filter);

    await recordAdminAuditLog({
      adminId: session.id,
      adminEmail: session.email,
      adminRole: session.role,
      action: "DATA_EXPORT",
      entityTable: "registrations",
      entityId: "csv-export",
      details: `Exported registrations CSV report`,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `kw-vip-registrations-${timestamp}.csv`;

    return {
      success: true,
      data: { csvContent, filename },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to export CSV",
    };
  }
}

// -----------------------------------------------------------------------------
// Audit Logs Actions
// -----------------------------------------------------------------------------
export async function getAuditLogsAction(filter?: {
  action?: AuditAction;
  adminEmail?: string;
  entityTable?: string;
  limit?: number;
}): Promise<ActionResult<StoredAuditLog[]>> {
  try {
    await requireAdminPermission("audit_logs:view");
    const logs = getAdminAuditLogs(filter);
    return { success: true, data: logs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch audit logs",
    };
  }
}
