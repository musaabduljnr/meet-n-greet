import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

import { isValidTrackingCodeFormat } from "@/lib/security/tracking-code";
import { checkTrackingRateLimit } from "@/lib/security/rate-limiter";
import { FanCardStatus } from "@/types/database";
import { operationsService } from "@/lib/services/operations-service";

export interface PublicTimelineStep {
  id: string;
  title: string;
  description: string;
  date?: string;
  state: "completed" | "current" | "upcoming" | "error";
}

export interface SafeTrackingData {
  trackingCode: string;
  fanInitial: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  formattedAddress: string;
  cityName: string;
  cityState: string;
  tourDate: string;
  currentStatus: FanCardStatus;
  statusLabel: string;
  lastUpdated: string;
  timeline: PublicTimelineStep[];
  hasIssue: boolean;
  issueMessage?: string;
  courierReference?: string | null;
  phone?: string;
  address?: string;
}

export interface TrackingResult {
  success: boolean;
  code?:
    | "INVALID_FORMAT"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "SERVER_ERROR";
  message: string;
  data?: SafeTrackingData;
}

// Milestone stages in sequential delivery order
const STAGE_ORDER: FanCardStatus[] = [
  "REGISTERED",
  "PROCESSING",
  "PREPARED",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const STAGE_METADATA: Record<
  FanCardStatus,
  { title: string; description: string }
> = {
  REGISTERED: {
    title: "Registration Received",
    description: "Fan registration submitted and verified for physical card fulfillment.",
  },
  PROCESSING: {
    title: "Processing",
    description: "Fan Card identity queued for personalized metal embossing.",
  },
  PREPARED: {
    title: "Prepared",
    description: "Commemorative card manufactured and packaged in protective sleeve.",
  },
  SHIPPED: {
    title: "Shipped",
    description: "Dispatched from tour operations distribution center.",
  },
  IN_TRANSIT: {
    title: "In Transit",
    description: "Package en route through regional courier network.",
  },
  OUT_FOR_DELIVERY: {
    title: "Out for Delivery",
    description: "On vehicle for final delivery to your destination address.",
  },
  DELIVERED: {
    title: "Delivered",
    description: "Package safely delivered to your registered address.",
  },
  DELIVERY_ISSUE: {
    title: "Delivery Issue",
    description: "A courier or address exception was noted by fulfillment operations.",
  },
  CANCELLED: {
    title: "Cancelled",
    description: "Fulfillment order was cancelled by tour operations.",
  },
};

/**
 * Builds the safe public milestone timeline for a given current status
 */
export function buildPublicTimeline(
  currentStatus: FanCardStatus,
  updatedAt: string,
  historyEvents?: Array<{ status: FanCardStatus; created_at: string }>
): { timeline: PublicTimelineStep[]; hasIssue: boolean; issueMessage?: string } {
  const isIssue = currentStatus === "DELIVERY_ISSUE";
  const currentIndex = isIssue
    ? STAGE_ORDER.indexOf("IN_TRANSIT") // default anchor stage during issue
    : STAGE_ORDER.indexOf(currentStatus);

  const historyMap = new Map<FanCardStatus, string>();
  if (historyEvents) {
    for (const event of historyEvents) {
      historyMap.set(event.status, event.created_at);
    }
  }

  const timeline: PublicTimelineStep[] = STAGE_ORDER.map((stage, idx) => {
    let state: "completed" | "current" | "upcoming" | "error" = "upcoming";

    if (isIssue && idx === currentIndex) {
      state = "error";
    } else if (idx < currentIndex) {
      state = "completed";
    } else if (idx === currentIndex) {
      state = "current";
    }

    const stageMeta = STAGE_METADATA[stage];
    const eventTime = historyMap.get(stage);

    let formattedDate: string | undefined;
    if (eventTime) {
      formattedDate = new Date(eventTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (idx === currentIndex) {
      formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return {
      id: stage,
      title: stageMeta.title,
      description: isIssue && idx === currentIndex
        ? "Courier reported an address or delivery exception. Tour operations is reviewing."
        : stageMeta.description,
      date: formattedDate,
      state,
    };
  });

  return {
    timeline,
    hasIssue: isIssue,
    issueMessage: isIssue
      ? "Our tour fulfillment team has noted a delivery exception for this card. Please contact guest support with your tracking code to confirm your delivery details."
      : undefined,
  };
}

export interface DemoCardRecord {
  initial: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  cityName: string;
  cityState: string;
  tourDate: string;
  status: FanCardStatus;
  updatedAt: string;
  courierReference?: string | null;
}

// Fallback demo registry for testing and development
const DEMO_CARDS: Record<string, DemoCardRecord> = {
  "KWFC-7X9K-42MA": {
    initial: "M.",
    firstName: "Marcus",
    lastName: "Sterling",
    email: "marcus.s@example.com",
    phoneNumber: "(404) 555-0192",
    shippingAddressLine1: "428 Piedmont Ave NE",
    shippingAddressLine2: null,
    shippingCity: "Atlanta",
    shippingState: "GA",
    shippingPostalCode: "30308",
    shippingCountry: "USA",
    cityName: "Atlanta",
    cityState: "GA",
    tourDate: "2026-11-14",
    status: "IN_TRANSIT",
    updatedAt: "2026-09-20T10:30:00Z",
    courierReference: "FEDEX-EXP-ATL-9921",
  },
  "KWFC-3V8P-92L4": {
    initial: "K.",
    firstName: "Keisha",
    lastName: "Thompson",
    email: "keisha.t@example.com",
    phoneNumber: "(713) 555-4821",
    shippingAddressLine1: "1902 Heights Blvd",
    shippingAddressLine2: null,
    shippingCity: "Houston",
    shippingState: "TX",
    shippingPostalCode: "77008",
    shippingCountry: "USA",
    cityName: "Houston",
    cityState: "TX",
    tourDate: "2026-11-20",
    status: "PROCESSING",
    updatedAt: "2026-09-20T08:15:00Z",
    courierReference: null,
  },
  "KWFC-9N2X-55Q8": {
    initial: "D.",
    firstName: "David",
    lastName: "Reynolds",
    email: "dreynolds@example.com",
    phoneNumber: "(312) 555-8392",
    shippingAddressLine1: "840 Michigan Ave",
    shippingAddressLine2: null,
    shippingCity: "Chicago",
    shippingState: "IL",
    shippingPostalCode: "60611",
    shippingCountry: "USA",
    cityName: "Chicago",
    cityState: "IL",
    tourDate: "2026-12-05",
    status: "DELIVERED",
    updatedAt: "2026-09-18T14:45:00Z",
    courierReference: "USPS-DELIV-ORD-7712",
  },
  "KWFC-8S9U-2ARD": {
    initial: "A.",
    firstName: "Angela",
    lastName: "Davis",
    email: "angela.d@example.com",
    phoneNumber: "(213) 555-9104",
    shippingAddressLine1: "1120 Wilshire Blvd",
    shippingAddressLine2: null,
    shippingCity: "Los Angeles",
    shippingState: "CA",
    shippingPostalCode: "90017",
    shippingCountry: "USA",
    cityName: "Los Angeles",
    cityState: "CA",
    tourDate: "2026-12-12",
    status: "DELIVERY_ISSUE",
    updatedAt: "2026-09-19T16:20:00Z",
    courierReference: "UPS-EXC-LA-0012",
  },
};

/**
 * Formats multi-part physical address into a clean single string
 */
function formatAddress(
  line1: string,
  line2: string | null | undefined,
  city: string,
  state: string,
  postal: string,
  country: string
): string {
  const parts = [
    line1,
    line2,
    [city, state].filter(Boolean).join(", "),
    postal,
    country,
  ].filter(Boolean);
  return parts.join(", ") || "Address on file";
}

/**
 * Server-side lookup for a Fan Card by tracking code.
 * Fetches associated VIP user identity, contact details, shipping destination,
 * and delivery milestone progress.
 */
export async function lookupFanCardStatus(
  rawCode: string,
  clientIp = "client"
): Promise<TrackingResult> {
  // 1. Rate Limiting Check
  const rateLimit = checkTrackingRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: `Too many tracking lookups. Please wait ${rateLimit.resetInSeconds} seconds and try again.`,
    };
  }

  // 2. Validate format
  const cleaned = rawCode ? rawCode.trim().toUpperCase() : "";
  if (!cleaned || !isValidTrackingCodeFormat(cleaned)) {
    return {
      success: false,
      code: "INVALID_FORMAT",
      message: "Please enter a valid tracking code in the format KWFC-XXXX-XXXX or KW-XXXX-XXXX.",
    };
  }

  // 3. Query Database (Supabase)
  const client = supabaseAdmin || supabase;
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client
        .from("fan_cards")
        .select(`
          tracking_code,
          current_status,
          courier_reference,
          updated_at,
          created_at,
          fans:fan_id (
            first_name,
            last_name,
            email,
            phone_number,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country
          ),
          registrations:registration_id (
            cities:city_id (name, state, tour_date)
          ),
          fan_card_status_history (
            new_status,
            created_at
          )
        `)
        .eq("tracking_code", cleaned)
        .maybeSingle();

      if (error) {
        console.error("[Tracking DB Error]", error.message);
        return {
          success: false,
          code: "SERVER_ERROR",
          message: "Unable to retrieve tracking information. Please try again shortly.",
        };
      }

      if (!data) {
        return {
          success: false,
          code: "NOT_FOUND",
          message: "No Fan Card record found matching this code. Please check your confirmation email and try again.",
        };
      }

      // Extract user information
      const fanObj = Array.isArray(data.fans) ? data.fans[0] : data.fans;
      const firstName = fanObj?.first_name || "";
      const lastName = fanObj?.last_name || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "VIP Guest";
      const fanInitial = firstName ? `${firstName.charAt(0).toUpperCase()}.` : "G.";
      const email = fanObj?.email || "";
      const phoneNumber = fanObj?.phone_number || "";
      const shippingAddressLine1 = fanObj?.shipping_address_line1 || "";
      const shippingAddressLine2 = fanObj?.shipping_address_line2 || null;
      const shippingCity = fanObj?.shipping_city || "";
      const shippingState = fanObj?.shipping_state || "";
      const shippingPostalCode = fanObj?.shipping_postal_code || "";
      const shippingCountry = fanObj?.shipping_country || "USA";
      const formattedAddress = formatAddress(
        shippingAddressLine1,
        shippingAddressLine2,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry
      );

      const regObj = Array.isArray(data.registrations) ? data.registrations[0] : data.registrations;
      const cityObj = Array.isArray(regObj?.cities) ? regObj?.cities[0] : regObj?.cities;
      const cityName = cityObj?.name || (shippingCity ? `${shippingCity} Stop` : "Tour Stop");
      const cityState = cityObj?.state || shippingState || "";
      const tourDate = cityObj?.tour_date || "";

      const currentStatus = data.current_status as FanCardStatus;
      const updatedAt = data.updated_at || data.created_at;

      const historyEvents = (data.fan_card_status_history || []).map((h: { new_status: string; created_at: string }) => ({
        status: h.new_status as FanCardStatus,
        created_at: h.created_at,
      }));

      const { timeline, hasIssue, issueMessage } = buildPublicTimeline(
        currentStatus,
        updatedAt,
        historyEvents
      );

      return {
        success: true,
        message: "Fan Card located.",
        data: {
          trackingCode: data.tracking_code,
          fanInitial,
          fullName,
          firstName,
          lastName,
          email,
          phoneNumber,
          shippingAddressLine1,
          shippingAddressLine2,
          shippingCity,
          shippingState,
          shippingPostalCode,
          shippingCountry,
          formattedAddress,
          cityName,
          cityState,
          tourDate,
          currentStatus,
          statusLabel: STAGE_METADATA[currentStatus]?.title || currentStatus,
          lastUpdated: updatedAt,
          timeline,
          hasIssue,
          issueMessage,
          courierReference: data.courier_reference || null,
          phone: phoneNumber,
          address: formattedAddress,
        },
      };
    } catch (err: unknown) {
      console.error("[Tracking Server Exception]", err);
      return {
        success: false,
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again.",
      };
    }
  }

  // 4. Check live operations store
  const liveCard = await operationsService.getFanCardByTrackingCode(cleaned);
  if (liveCard) {
    const reg = await operationsService.getRegistrationById(liveCard.registration_id);
    const firstName = reg?.fan?.first_name || "";
    const lastName = reg?.fan?.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "VIP Guest";
    const fanInitial = firstName ? `${firstName.charAt(0).toUpperCase()}.` : "G.";
    const email = reg?.fan?.email || "";
    const phoneNumber = reg?.fan?.phone_number || "";
    const shippingAddressLine1 = reg?.fan?.shipping_address_line1 || "";
    const shippingAddressLine2 = reg?.fan?.shipping_address_line2 || null;
    const shippingCity = reg?.fan?.shipping_city || "";
    const shippingState = reg?.fan?.shipping_state || "";
    const shippingPostalCode = reg?.fan?.shipping_postal_code || "";
    const shippingCountry = reg?.fan?.shipping_country || "USA";
    const formattedAddress = formatAddress(
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry
    );

    const cityName = reg?.city?.name || (shippingCity ? `${shippingCity} Stop` : "Tour Stop");
    const cityState = reg?.city?.state || shippingState || "";
    const tourDate = reg?.city?.tour_date || "";

    const { timeline, hasIssue, issueMessage } = buildPublicTimeline(
      liveCard.current_status,
      liveCard.updated_at,
      liveCard.history.map((h) => ({
        status: h.new_status || h.status || liveCard.current_status,
        created_at: h.created_at,
      }))
    );

    return {
      success: true,
      message: "Fan Card located.",
      data: {
        trackingCode: cleaned,
        fanInitial,
        fullName,
        firstName,
        lastName,
        email,
        phoneNumber,
        shippingAddressLine1,
        shippingAddressLine2,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        formattedAddress,
        cityName,
        cityState,
        tourDate,
        currentStatus: liveCard.current_status,
        statusLabel: STAGE_METADATA[liveCard.current_status]?.title || liveCard.current_status,
        lastUpdated: liveCard.updated_at,
        timeline,
        hasIssue,
        issueMessage,
        courierReference: liveCard.courier_reference || null,
        phone: phoneNumber,
        address: formattedAddress,
      },
    };
  }

  // 5. Fallback demo store lookup
  const demoRecord = DEMO_CARDS[cleaned];
  if (!demoRecord) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "No Fan Card record found matching this code. Please check your confirmation email and try again.",
    };
  }

  const { timeline, hasIssue, issueMessage } = buildPublicTimeline(
    demoRecord.status,
    demoRecord.updatedAt
  );

  const fullName = [demoRecord.firstName, demoRecord.lastName].filter(Boolean).join(" ") || `${demoRecord.initial} (VIP Guest)`;
  const formattedAddress = formatAddress(
    demoRecord.shippingAddressLine1,
    demoRecord.shippingAddressLine2,
    demoRecord.shippingCity,
    demoRecord.shippingState,
    demoRecord.shippingPostalCode,
    demoRecord.shippingCountry
  );

  return {
    success: true,
    message: "Fan Card located.",
    data: {
      trackingCode: cleaned,
      fanInitial: demoRecord.initial,
      fullName,
      firstName: demoRecord.firstName,
      lastName: demoRecord.lastName,
      email: demoRecord.email,
      phoneNumber: demoRecord.phoneNumber,
      shippingAddressLine1: demoRecord.shippingAddressLine1,
      shippingAddressLine2: demoRecord.shippingAddressLine2 || null,
      shippingCity: demoRecord.shippingCity,
      shippingState: demoRecord.shippingState,
      shippingPostalCode: demoRecord.shippingPostalCode,
      shippingCountry: demoRecord.shippingCountry,
      formattedAddress,
      cityName: demoRecord.cityName,
      cityState: demoRecord.cityState,
      tourDate: demoRecord.tourDate,
      currentStatus: demoRecord.status,
      statusLabel: STAGE_METADATA[demoRecord.status]?.title || demoRecord.status,
      lastUpdated: demoRecord.updatedAt,
      timeline,
      hasIssue,
      issueMessage,
      courierReference: demoRecord.courierReference || null,
      phone: demoRecord.phoneNumber,
      address: formattedAddress,
    },
  };
}

/**
 * Register a card in the demo registry (useful for unit tests)
 */
export function registerDemoCard(
  code: string,
  data: Partial<DemoCardRecord> & {
    initial: string;
    cityName: string;
    cityState: string;
    tourDate: string;
    status: FanCardStatus;
    updatedAt: string;
  }
) {
  const firstName = data.firstName || "VIP";
  const lastName = data.lastName || "Guest";
  DEMO_CARDS[code] = {
    initial: data.initial,
    firstName,
    lastName,
    email: data.email || "guest@meetkountrywayne.vip",
    phoneNumber: data.phoneNumber || "(555) 000-0000",
    shippingAddressLine1: data.shippingAddressLine1 || "Fulfillment Center Dispatch",
    shippingAddressLine2: data.shippingAddressLine2 || null,
    shippingCity: data.shippingCity || data.cityName,
    shippingState: data.shippingState || data.cityState,
    shippingPostalCode: data.shippingPostalCode || "00000",
    shippingCountry: data.shippingCountry || "USA",
    cityName: data.cityName,
    cityState: data.cityState,
    tourDate: data.tourDate,
    status: data.status,
    updatedAt: data.updatedAt,
    courierReference: data.courierReference || null,
  };
}
