import { z } from "zod";
import type { FanCardStatus } from "@/types/database";

export const FAN_CARD_STATUS_ENUM = [
  "REGISTERED",
  "PROCESSING",
  "PREPARED",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_ISSUE",
] as const;

export const updateFanCardStatusSchema = z.object({
  cardId: z.string().min(1, "Fan Card ID is required"),
  status: z.enum(FAN_CARD_STATUS_ENUM),
  courierReference: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  issueReason: z.string().trim().optional(),
  sendEmail: z.boolean().default(true),
});

export type UpdateFanCardStatusInput = z.infer<typeof updateFanCardStatusSchema>;

export const batchUpdateFanCardStatusSchema = z.object({
  cardIds: z
    .array(z.string().min(1, "Card ID cannot be empty"))
    .min(1, "Please select at least one Fan Card for bulk processing."),
  status: z.enum(FAN_CARD_STATUS_ENUM),
  courierReference: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  sendEmail: z.boolean().default(true),
});

export type BatchUpdateFanCardStatusInput = z.infer<typeof batchUpdateFanCardStatusSchema>;

export const resendTrackingEmailSchema = z.object({
  cardId: z.string().min(1, "Fan Card ID is required to resend tracking email"),
});

export type ResendTrackingEmailInput = z.infer<typeof resendTrackingEmailSchema>;

/**
 * Validates whether a requested transition between Fan Card statuses is permissible.
 */
export function validateFanCardTransition(
  currentStatus: FanCardStatus,
  newStatus: FanCardStatus,
  notes?: string
): { isValid: boolean; error?: string } {
  // 1. Same status is a no-op
  if (currentStatus === newStatus) {
    return {
      isValid: false,
      error: `Fan Card is already in status '${newStatus}'.`,
    };
  }

  // 2. Transitioning to DELIVERY_ISSUE requires a documented reason
  if (newStatus === "DELIVERY_ISSUE") {
    if (!notes || notes.trim().length < 3) {
      return {
        isValid: false,
        error: "An internal note or issue explanation (at least 3 characters) is required when flagging a Delivery Issue.",
      };
    }
    return { isValid: true };
  }

  // 3. If currently DELIVERED, cannot transition to any status except DELIVERY_ISSUE (which was handled above)
  if (currentStatus === "DELIVERED") {
    return {
      isValid: false,
      error: `Cannot transition a DELIVERED card to '${newStatus}'. Flag a DELIVERY_ISSUE first if package was disputed.`,
    };
  }

  return { isValid: true };
}
