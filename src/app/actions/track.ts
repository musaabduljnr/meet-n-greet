"use server";

import { headers } from "next/headers";
import { lookupFanCardStatus, TrackingResult } from "@/lib/services/tracking-service";

/**
 * Server Action for looking up Fan Card delivery and milestone status
 * Guarantees zero client-side direct database access and zero PII disclosure.
 */
export async function trackFanCardAction(code: string): Promise<TrackingResult> {
  let clientIp = "127.0.0.1";

  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
  } catch {
    // Header access fallback
    clientIp = "client-default";
  }

  return await lookupFanCardStatus(code, clientIp);
}
