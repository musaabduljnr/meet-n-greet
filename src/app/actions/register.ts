"use server";

import {
  RegistrationInput,
  RegistrationResult,
} from "@/lib/validations/registration";
import { processRegistration } from "@/lib/services/registration-service";

/**
 * Server Action for submitting a VIP Meet & Greet registration
 * Executes securely on the server, enforcing Zod validation, normalization, duplicate checks, and email dispatch.
 */
export async function registerFanAction(
  input: RegistrationInput
): Promise<RegistrationResult> {
  return await processRegistration(input);
}
