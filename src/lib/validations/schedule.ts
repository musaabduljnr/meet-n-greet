import { z } from "zod";

export const scheduleStatusEnum = z.enum([
  "PENDING",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

export const createScheduleSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD).")
    .refine((d) => !isNaN(Date.parse(d)), "Must be a valid calendar date."),
  startTime: z
    .string()
    .min(2, "Start / Call time is required (e.g. 5:30 PM or 17:30).")
    .max(20, "Time string too long."),
  endTime: z.string().max(20).optional().nullable(),
  location: z
    .string()
    .min(3, "Meeting venue location / entrance door is required.")
    .max(255, "Location too long."),
  instructions: z
    .string()
    .min(10, "Arrival instructions must be at least 10 characters.")
    .max(2000, "Instructions exceed maximum allowed length."),
  sendEmail: z.boolean().default(true),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD).")
    .optional(),
  startTime: z.string().min(2).max(20).optional(),
  endTime: z.string().max(20).optional().nullable(),
  location: z.string().min(3).max(255).optional(),
  instructions: z.string().min(10).max(2000).optional(),
  status: scheduleStatusEnum.optional(),
  changeReason: z.string().max(500).optional(),
  sendEmail: z.boolean().default(true),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const cancelScheduleSchema = z.object({
  cancellationReason: z
    .string()
    .min(3, "A valid reason for cancellation is required.")
    .max(500, "Reason exceeds 500 characters."),
  sendEmail: z.boolean().default(true),
});

export type CancelScheduleInput = z.infer<typeof cancelScheduleSchema>;
