import { z } from "zod";

// Phone sanitization helper (keeps digits, verifies minimum 10 digits for US/international)
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone.trim();
}

// Name title-casing helper
export function normalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const registrationInputSchema = z.object({
  cityId: z
    .string()
    .trim()
    .optional()
    .default(""),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(50, "First name must be under 50 characters.")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(50, "Last name must be under 50 characters.")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email address is required.")
    .email("Please enter a valid email address.")
    .max(100, "Email must be under 100 characters."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Please enter a valid 10-digit phone number."),
  membershipTier: z
    .string()
    .trim()
    .optional()
    .default("GOLD_VIP"),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  addressLine1: z
    .string()
    .trim()
    .optional()
    .default(""),
  addressLine2: z
    .string()
    .trim()
    .optional()
    .default(""),
  city: z
    .string()
    .trim()
    .optional()
    .default(""),
  state: z
    .string()
    .trim()
    .optional()
    .default(""),
  postalCode: z
    .string()
    .trim()
    .optional()
    .default(""),
  idType: z
    .string()
    .trim()
    .optional()
    .default(""),
  idNumber: z
    .string()
    .trim()
    .optional()
    .default(""),
  idDocumentUrl: z
    .string()
    .trim()
    .optional()
    .default(""),
  idDocumentName: z
    .string()
    .trim()
    .optional()
    .default(""),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
  // Anti-bot honeypot field (must remain empty)
  website_hp: z
    .string()
    .max(0, "Bot submission detected.")
    .optional()
    .or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

export interface RegistrationResult {
  success: boolean;
  code?:
    | "VALIDATION_ERROR"
    | "BOT_DETECTED"
    | "CITY_UNAVAILABLE"
    | "DUPLICATE_REGISTRATION"
    | "DATABASE_ERROR"
    | "EMAIL_FAILED";
  message: string;
  errors?: Record<string, string>;
  data?: {
    confirmationReference: string;
    cityName: string;
    cityState: string;
    tourDate: string;
    email: string;
    emailDispatched: boolean;
  };
}
