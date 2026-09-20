import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

import { getActiveCities } from "@/lib/supabase/cities";
import type {
  RegistrationInput,
  RegistrationResult,
} from "@/lib/validations/registration";
import {
  registrationInputSchema,
  normalizeName,
  normalizePhoneNumber,
} from "@/lib/validations/registration";
import {
  generateFanCardTrackingCode,
  generateRequestReference,
} from "@/lib/security/tracking-code";
import { emailService } from "@/lib/email/email-service";
import { renderRegistrationConfirmationEmail } from "@/lib/email/templates/registration-confirmation";
import { operationsService } from "@/lib/services/operations-service";

// In-memory relational storage for testing & fallback execution
interface StoredFan {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface StoredRegistration {
  id: string;
  fan_id: string;
  city_id: string;
  status: string;
  special_notes?: string;
  created_at: string;
}

interface StoredFanCard {
  id: string;
  registration_id: string;
  fan_id: string;
  tracking_code: string;
  current_status: string;
  created_at: string;
}

interface StoredEmailEvent {
  id: string;
  recipient_email: string;
  email_type: string;
  status: "SENT" | "FAILED";
  tracking_code?: string;
  created_at: string;
}

const inMemoryFans: StoredFan[] = [];
const inMemoryRegistrations: StoredRegistration[] = [];
const inMemoryFanCards: StoredFanCard[] = [];
const inMemoryEmailEvents: StoredEmailEvent[] = [];

/**
 * Resets in-memory storage (useful for isolated unit testing)
 */
export function resetRegistrationStorage() {
  inMemoryFans.length = 0;
  inMemoryRegistrations.length = 0;
  inMemoryFanCards.length = 0;
  inMemoryEmailEvents.length = 0;
}

/**
 * Process a fan registration request end-to-end
 */
export async function processRegistration(
  rawInput: RegistrationInput
): Promise<RegistrationResult> {
  // 1. Validate input schema
  const validation = registrationInputSchema.safeParse(rawInput);
  if (!validation.success) {
    const errors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    }
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Please correct the highlighted errors.",
      errors,
    };
  }

  const data = validation.data;

  // 2. Honeypot check
  if (data.website_hp && data.website_hp.length > 0) {
    return {
      success: false,
      code: "BOT_DETECTED",
      message: "Submission flagged by security filters.",
    };
  }

  // 3. Normalize data
  const normalizedFirstName = normalizeName(data.firstName);
  const normalizedLastName = normalizeName(data.lastName);
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(data.phone);
  const notes = data.notes?.trim() || "";

  // 4. Verify city exists & is active
  const { cities } = await getActiveCities();
  const targetCity = cities.find(
    (c) => c.id === data.cityId || c.name.toLowerCase() === data.cityId.toLowerCase()
  );

  if (!targetCity || !targetCity.is_active) {
    return {
      success: false,
      code: "CITY_UNAVAILABLE",
      message: "The selected tour city is not currently available for registration.",
    };
  }

  const confirmationRef = generateRequestReference();
  const trackingCode = generateFanCardTrackingCode();

  // 5. Database execution (Supabase or In-Memory test engine)
  const client = supabaseAdmin || supabase;
  if (isSupabaseConfigured && client) {
    try {
      // Check for duplicate registration in this city
      const { data: existingFan } = await client
        .from("fans")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingFan) {
        const { data: existingReg } = await client
          .from("registrations")
          .select("id")
          .eq("fan_id", existingFan.id)
          .eq("city_id", targetCity.id)
          .maybeSingle();

        if (existingReg) {
          return {
            success: false,
            code: "DUPLICATE_REGISTRATION",
            message:
              "You have already submitted a VIP Meet & Greet request for this tour stop with this email.",
          };
        }
      }

      // Upsert fan
      let fanId = existingFan?.id;
      if (!fanId) {
        const { data: newFan, error: fanError } = await client
          .from("fans")
          .insert({
            first_name: normalizedFirstName,
            last_name: normalizedLastName,
            email: normalizedEmail,
            phone_number: normalizedPhone,
            shipping_address_line1: "Provided at verification",
            shipping_city: targetCity.name,
            shipping_state: targetCity.state,
            shipping_postal_code: "00000",
          })
          .select("id")
          .single();

        if (fanError || !newFan) {
          throw new Error(fanError?.message || "Failed to record fan profile");
        }
        fanId = newFan.id;
      }

      // Insert registration
      const { data: reg, error: regError } = await client
        .from("registrations")
        .insert({
          fan_id: fanId,
          city_id: targetCity.id,
          status: "REGISTERED",
          special_notes: notes || null,
        })
        .select("id")
        .single();

      if (regError || !reg) {
        throw new Error(regError?.message || "Failed to create registration record");
      }

      // Insert Fan Card record
      const { error: cardError } = await client.from("fan_cards").insert({
        registration_id: reg.id,
        fan_id: fanId,
        tracking_code: trackingCode,
        current_status: "REGISTERED",
      });

      if (cardError) {
        console.error("Warning: Fan Card creation error:", cardError.message);
      }

    } catch (dbError: unknown) {
      const msg = dbError instanceof Error ? dbError.message : "Database error";
      console.error("[Registration DB Failure]", msg);
      return {
        success: false,
        code: "DATABASE_ERROR",
        message: "An unexpected error occurred while saving your registration. Please try again.",
      };
    }
  } else {
    // In-memory relational storage
    let fan = inMemoryFans.find((f) => f.email === normalizedEmail);
    if (!fan) {
      fan = {
        id: `fan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        phone_number: normalizedPhone,
      };
      inMemoryFans.push(fan);
    }

    // Check duplicate
    const duplicate = inMemoryRegistrations.find(
      (r) => r.fan_id === fan!.id && r.city_id === targetCity.id
    );

    if (duplicate) {
      return {
        success: false,
        code: "DUPLICATE_REGISTRATION",
        message:
          "You have already submitted a VIP Meet & Greet request for this tour stop with this email.",
      };
    }

    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    inMemoryRegistrations.push({
      id: regId,
      fan_id: fan.id,
      city_id: targetCity.id,
      status: "REGISTERED",
      special_notes: notes,
      created_at: new Date().toISOString(),
    });

    inMemoryFanCards.push({
      id: `card-${Date.now()}`,
      registration_id: regId,
      fan_id: fan.id,
      tracking_code: trackingCode,
      current_status: "REGISTERED",
      created_at: new Date().toISOString(),
    });

    // Record into live operations service store
    operationsService.recordPublicRegistration({
      fan: {
        id: fan.id,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        shipping_address_line1: "Provided at verification",
        shipping_city: targetCity.name,
        shipping_state: targetCity.state,
        shipping_postal_code: "00000",
        shipping_country: "USA",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      cityId: targetCity.id,
      specialNotes: notes,
      trackingCode,
    });
  }

  // 6. Trigger confirmation email
  let emailDispatched = false;
  try {
    const formattedDate = new Date(`${targetCity.tour_date}T12:00:00`).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );

    const emailContent = renderRegistrationConfirmationEmail({
      recipientName: `${normalizedFirstName} ${normalizedLastName}`,
      cityName: targetCity.name,
      cityState: targetCity.state,
      tourDate: formattedDate,
      trackingCode,
      requestReference: confirmationRef,
    });

    const sendResult = await emailService.send({
      to: {
        email: normalizedEmail,
        name: `${normalizedFirstName} ${normalizedLastName}`,
      },
      type: "REGISTRATION_CONFIRMATION",
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      metadata: {
        trackingCode,
        confirmationRef,
        cityId: targetCity.id,
      },
    });

    emailDispatched = sendResult.success;

    // Log to inMemory or DB email_events
    inMemoryEmailEvents.push({
      id: `evt-${Date.now()}`,
      recipient_email: normalizedEmail,
      email_type: "REGISTRATION_CONFIRMATION",
      status: sendResult.success ? "SENT" : "FAILED",
      tracking_code: trackingCode,
      created_at: new Date().toISOString(),
    });
  } catch (emailErr) {
    console.error("[Registration Email Failure]", emailErr);
    // Note: Registration is still valid and saved; email is marked as failed for administrative re-dispatch
    emailDispatched = false;
  }

  // 7. Return confirmation data
  return {
    success: true,
    message: "Registration submitted successfully.",
    data: {
      confirmationReference: confirmationRef,
      cityName: targetCity.name,
      cityState: targetCity.state,
      tourDate: targetCity.tour_date,
      email: normalizedEmail,
      emailDispatched,
    },
  };
}
