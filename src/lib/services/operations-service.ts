import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEFAULT_ACTIVE_CITIES,
  getFallbackCities,
  addFallbackCity,
  updateFallbackCity,
  removeFallbackCity,
  resetFallbackCities,
} from "@/lib/supabase/cities";

import type {
  City,
  FanCardStatus,
  FanCardHistoryEntry,
  RegistrationStatus,
  ScheduleStatus,
  ScheduleHistoryEntry,
} from "@/types/database";
import { validateFanCardTransition } from "@/lib/validations/fan-card";
import { emailService } from "@/lib/email/email-service";
import type { EmailSendResult } from "@/lib/email/types";
import { recordAdminAuditLog } from "@/lib/security/audit";

export interface StoredFanEntity {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  shipping_address_line1: string;
  shipping_address_line2?: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
  updated_at: string;
}

export interface StoredRegistrationEntity {
  id: string;
  fan_id: string;
  city_id?: string | null;
  status: RegistrationStatus;
  special_notes?: string | null;
  check_in_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredScheduleEntity {
  id: string;
  registration_id: string;
  fan_id: string;
  city_id: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  location: string;
  instructions: string;
  status: ScheduleStatus;
  cancellation_reason?: string | null;
  is_notified: boolean;
  notified_at?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  updated_by?: string | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
  history: ScheduleHistoryEntry[];
  // Backwards-compatible aliases
  assigned_date: string;
  arrival_time: string;
  venue_name: string;
  venue_address: string;
  arrival_instructions: string;
}

export interface StoredFanCardEntity {
  id: string;
  registration_id: string;
  fan_id: string;
  tracking_code: string;
  current_status: FanCardStatus;
  internal_fulfillment_notes?: string | null;
  courier_reference?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
  history: FanCardHistoryEntry[];
}

export interface EnrichedRegistration {
  id: string;
  fan: StoredFanEntity;
  city: City;
  status: RegistrationStatus;
  special_notes?: string | null;
  created_at: string;
  updated_at: string;
  schedule?: StoredScheduleEntity | null;
  fanCard?: StoredFanCardEntity | null;
}

export interface DashboardKPIs {
  totalRegistrations: number;
  pendingScheduling: number;
  fanCardsInTransit: number;
  completedVIPs: number;
  cityBreakdown: Array<{
    id: string;
    name: string;
    state: string;
    tour_date: string;
    registrations_count: number;
    max_capacity: number;
    is_active: boolean;
  }>;
}

// -----------------------------------------------------------------------------
// In-Memory Shared Store (Seed Data for Standalone Testing & Dev)
// -----------------------------------------------------------------------------
const inMemoryCities = getFallbackCities();

const inMemoryFans: StoredFanEntity[] = [
  {
    id: "fan-001",
    first_name: "Marcus",
    last_name: "Sterling",
    email: "marcus.s@example.com",
    phone_number: "(404) 555-0192",
    shipping_address_line1: "428 Piedmont Ave NE",
    shipping_city: "Atlanta",
    shipping_state: "GA",
    shipping_postal_code: "30308",
    shipping_country: "USA",
    created_at: "2026-09-10T14:20:00Z",
    updated_at: "2026-09-10T14:20:00Z",
  },
  {
    id: "fan-002",
    first_name: "Keisha",
    last_name: "Thompson",
    email: "keisha.t@example.com",
    phone_number: "(713) 555-4821",
    shipping_address_line1: "1902 Heights Blvd",
    shipping_city: "Houston",
    shipping_state: "TX",
    shipping_postal_code: "77008",
    shipping_country: "USA",
    created_at: "2026-09-11T09:15:00Z",
    updated_at: "2026-09-11T09:15:00Z",
  },
  {
    id: "fan-003",
    first_name: "David",
    last_name: "Reynolds",
    email: "dreynolds@example.com",
    phone_number: "(312) 555-8392",
    shipping_address_line1: "840 Michigan Ave",
    shipping_city: "Chicago",
    shipping_state: "IL",
    shipping_postal_code: "60611",
    shipping_country: "USA",
    created_at: "2026-09-12T16:45:00Z",
    updated_at: "2026-09-12T16:45:00Z",
  },
  {
    id: "fan-004",
    first_name: "Angela",
    last_name: "Davis",
    email: "angela.d@example.com",
    phone_number: "(213) 555-9104",
    shipping_address_line1: "1120 Wilshire Blvd",
    shipping_city: "Los Angeles",
    shipping_state: "CA",
    shipping_postal_code: "90017",
    shipping_country: "USA",
    created_at: "2026-09-13T11:00:00Z",
    updated_at: "2026-09-13T11:00:00Z",
  },
  {
    id: "fan-005",
    first_name: "James",
    last_name: "Wilson",
    email: "jwilson@example.com",
    phone_number: "(404) 555-3298",
    shipping_address_line1: "750 Peachtree St",
    shipping_city: "Atlanta",
    shipping_state: "GA",
    shipping_postal_code: "30308",
    shipping_country: "USA",
    created_at: "2026-09-08T18:30:00Z",
    updated_at: "2026-09-08T18:30:00Z",
  },
];

const inMemoryRegistrations: StoredRegistrationEntity[] = [
  {
    id: "reg-001",
    fan_id: "fan-001",
    city_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", // Atlanta
    status: "SCHEDULED",
    special_notes: "VIP guest, wants photo with personal customized jacket",
    created_at: "2026-09-10T14:20:00Z",
    updated_at: "2026-09-15T10:00:00Z",
  },
  {
    id: "reg-002",
    fan_id: "fan-002",
    city_id: "b2c3d4e5-f6a7-4b6c-9d8e-0f1a2b3c4d5e", // Houston
    status: "SCHEDULE_PENDING",
    special_notes: "First time VIP attendee",
    created_at: "2026-09-11T09:15:00Z",
    updated_at: "2026-09-11T09:15:00Z",
  },
  {
    id: "reg-003",
    fan_id: "fan-003",
    city_id: "c3d4e5f6-a7b8-4c7d-0e1f-1a2b3c4d5e6f", // Chicago
    status: "REGISTERED",
    special_notes: null,
    created_at: "2026-09-12T16:45:00Z",
    updated_at: "2026-09-12T16:45:00Z",
  },
  {
    id: "reg-004",
    fan_id: "fan-004",
    city_id: "d4e5f6a7-b8c9-4d8e-1f2a-2b3c4d5e6f7a", // LA
    status: "SCHEDULED",
    special_notes: "Attending with sibling",
    created_at: "2026-09-13T11:00:00Z",
    updated_at: "2026-09-16T14:30:00Z",
  },
  {
    id: "reg-005",
    fan_id: "fan-005",
    city_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d", // Atlanta
    status: "COMPLETED",
    special_notes: null,
    created_at: "2026-09-08T18:30:00Z",
    updated_at: "2026-09-18T20:00:00Z",
  },
];

const inMemorySchedules: StoredScheduleEntity[] = [
  {
    id: "sched-001",
    registration_id: "reg-001",
    fan_id: "fan-001",
    city_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    date: "2026-11-14",
    start_time: "17:30",
    end_time: "18:15",
    location: "Fox Theatre — Stage Door B on Ponce de Leon Ave",
    instructions:
      "Arrive at Stage Door B on Ponce de Leon Ave. Present photo ID and Fan Card to VIP coordinator.",
    status: "SCHEDULED",
    is_notified: true,
    notified_at: "2026-09-15T10:05:00Z",
    created_by: "admin-super-01",
    created_by_name: "superadmin@kountrywayne.com",
    created_at: "2026-09-15T10:00:00Z",
    updated_at: "2026-09-15T10:00:00Z",
    history: [
      {
        id: "hist-sched-001-1",
        schedule_id: "sched-001",
        changed_by: "admin-super-01",
        changed_by_name: "superadmin@kountrywayne.com",
        action: "CREATED",
        new_values: {
          date: "2026-11-14",
          start_time: "17:30",
          end_time: "18:15",
          location: "Fox Theatre — Stage Door B on Ponce de Leon Ave",
          instructions:
            "Arrive at Stage Door B on Ponce de Leon Ave. Present photo ID and Fan Card to VIP coordinator.",
          status: "SCHEDULED",
        },
        notified_fan: true,
        created_at: "2026-09-15T10:00:00Z",
      },
    ],
    // Aliases
    assigned_date: "2026-11-14",
    arrival_time: "17:30",
    venue_name: "Fox Theatre",
    venue_address: "660 Peachtree St NE, Atlanta, GA 30308",
    arrival_instructions:
      "Arrive at Stage Door B on Ponce de Leon Ave. Present photo ID and Fan Card to VIP coordinator.",
  },
  {
    id: "sched-004",
    registration_id: "reg-004",
    fan_id: "fan-004",
    city_id: "d4e5f6a7-b8c9-4d8e-1f2a-2b3c4d5e6f7a",
    date: "2026-12-12",
    start_time: "18:00",
    end_time: "18:45",
    location: "The Wiltern — Historic Lobby VIP Check-In Entrance",
    instructions:
      "VIP check-in table at the historic lobby entrance. Please arrive promptly at 6:00 PM.",
    status: "SCHEDULED",
    is_notified: true,
    notified_at: "2026-09-16T14:35:00Z",
    created_by: "admin-ops-02",
    created_by_name: "admin@kountrywayne.com",
    created_at: "2026-09-16T14:30:00Z",
    updated_at: "2026-09-16T14:30:00Z",
    history: [
      {
        id: "hist-sched-004-1",
        schedule_id: "sched-004",
        changed_by: "admin-ops-02",
        changed_by_name: "admin@kountrywayne.com",
        action: "CREATED",
        new_values: {
          date: "2026-12-12",
          start_time: "18:00",
          end_time: "18:45",
          location: "The Wiltern — Historic Lobby VIP Check-In Entrance",
          instructions:
            "VIP check-in table at the historic lobby entrance. Please arrive promptly at 6:00 PM.",
          status: "SCHEDULED",
        },
        notified_fan: true,
        created_at: "2026-09-16T14:30:00Z",
      },
    ],
    // Aliases
    assigned_date: "2026-12-12",
    arrival_time: "18:00",
    venue_name: "The Wiltern",
    venue_address: "3790 Wilshire Blvd, Los Angeles, CA 90010",
    arrival_instructions:
      "VIP check-in table at the historic lobby entrance. Please arrive promptly at 6:00 PM.",
  },
  {
    id: "sched-005",
    registration_id: "reg-005",
    fan_id: "fan-005",
    city_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    date: "2026-11-14",
    start_time: "17:00",
    end_time: "17:30",
    location: "Fox Theatre — Stage Door B",
    instructions: "Stage Door B check-in completed.",
    status: "COMPLETED",
    is_notified: true,
    notified_at: "2026-09-09T11:00:00Z",
    created_by: "admin-super-01",
    created_by_name: "superadmin@kountrywayne.com",
    created_at: "2026-09-09T10:00:00Z",
    updated_at: "2026-09-09T10:00:00Z",
    history: [
      {
        id: "hist-sched-005-1",
        schedule_id: "sched-005",
        changed_by: "admin-super-01",
        changed_by_name: "superadmin@kountrywayne.com",
        action: "CREATED",
        new_values: {
          date: "2026-11-14",
          start_time: "17:00",
          end_time: "17:30",
          location: "Fox Theatre — Stage Door B",
          instructions: "Stage Door B check-in completed.",
          status: "COMPLETED",
        },
        notified_fan: true,
        created_at: "2026-09-09T10:00:00Z",
      },
    ],
    // Aliases
    assigned_date: "2026-11-14",
    arrival_time: "17:00",
    venue_name: "Fox Theatre",
    venue_address: "660 Peachtree St NE, Atlanta, GA 30308",
    arrival_instructions: "Stage Door B check-in completed.",
  },
];

const inMemoryFanCards: StoredFanCardEntity[] = [
  {
    id: "card-001",
    registration_id: "reg-001",
    fan_id: "fan-001",
    tracking_code: "KWFC-7X9K-42MA",
    current_status: "IN_TRANSIT",
    internal_fulfillment_notes: "Embossed VIP Gold Edition",
    courier_reference: "USPS-PRIORITY-ATL-9921",
    shipped_at: "2026-09-15T12:00:00Z",
    delivered_at: null,
    created_at: "2026-09-10T14:20:00Z",
    updated_at: "2026-09-16T12:00:00Z",
    history: [
      {
        id: "hist-fc-001-5",
        fan_card_id: "card-001",
        previous_status: "SHIPPED",
        new_status: "IN_TRANSIT",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "Departed Atlanta sorting hub",
        created_at: "2026-09-16T12:00:00Z",
      },
      {
        id: "hist-fc-001-4",
        fan_card_id: "card-001",
        previous_status: "PREPARED",
        new_status: "SHIPPED",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "USPS Priority tracking assigned",
        created_at: "2026-09-15T12:00:00Z",
      },
      {
        id: "hist-fc-001-3",
        fan_card_id: "card-001",
        previous_status: "PROCESSING",
        new_status: "PREPARED",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Card printed, laser engraved, and boxed",
        created_at: "2026-09-14T10:00:00Z",
      },
      {
        id: "hist-fc-001-2",
        fan_card_id: "card-001",
        previous_status: "REGISTERED",
        new_status: "PROCESSING",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Batch manufacturing queued",
        created_at: "2026-09-12T09:00:00Z",
      },
      {
        id: "hist-fc-001-1",
        fan_card_id: "card-001",
        previous_status: null,
        new_status: "REGISTERED",
        changed_by: "system",
        changed_by_name: "Fan Registration Portal",
        internal_note: "Initial commemorative Fan Card order placed",
        created_at: "2026-09-10T14:20:00Z",
      },
    ],
  },
  {
    id: "card-002",
    registration_id: "reg-002",
    fan_id: "fan-002",
    tracking_code: "KWFC-3V8P-92L4",
    current_status: "PROCESSING",
    internal_fulfillment_notes: "Queued for batch engraving",
    courier_reference: null,
    shipped_at: null,
    delivered_at: null,
    created_at: "2026-09-11T09:15:00Z",
    updated_at: "2026-09-13T10:00:00Z",
    history: [
      {
        id: "hist-fc-002-2",
        fan_card_id: "card-002",
        previous_status: "REGISTERED",
        new_status: "PROCESSING",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Queued for batch engraving",
        created_at: "2026-09-13T10:00:00Z",
      },
      {
        id: "hist-fc-002-1",
        fan_card_id: "card-002",
        previous_status: null,
        new_status: "REGISTERED",
        changed_by: "system",
        changed_by_name: "Fan Registration Portal",
        internal_note: "Initial registration order placed",
        created_at: "2026-09-11T09:15:00Z",
      },
    ],
  },
  {
    id: "card-003",
    registration_id: "reg-003",
    fan_id: "fan-003",
    tracking_code: "KWFC-9N2X-55Q8",
    current_status: "REGISTERED",
    internal_fulfillment_notes: null,
    courier_reference: null,
    shipped_at: null,
    delivered_at: null,
    created_at: "2026-09-12T16:45:00Z",
    updated_at: "2026-09-12T16:45:00Z",
    history: [
      {
        id: "hist-fc-003-1",
        fan_card_id: "card-003",
        previous_status: null,
        new_status: "REGISTERED",
        changed_by: "system",
        changed_by_name: "Fan Registration Portal",
        internal_note: "Initial registration order placed",
        created_at: "2026-09-12T16:45:00Z",
      },
    ],
  },
  {
    id: "card-004",
    registration_id: "reg-004",
    fan_id: "fan-004",
    tracking_code: "KWFC-4M6Y-88K2",
    current_status: "SHIPPED",
    internal_fulfillment_notes: "Dispatched from LA center",
    courier_reference: "FEDEX-2DAY-LA-3819",
    shipped_at: "2026-09-17T15:00:00Z",
    delivered_at: null,
    created_at: "2026-09-13T11:00:00Z",
    updated_at: "2026-09-17T15:00:00Z",
    history: [
      {
        id: "hist-fc-004-4",
        fan_card_id: "card-004",
        previous_status: "PREPARED",
        new_status: "SHIPPED",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "Dispatched from LA center via FedEx 2-Day",
        created_at: "2026-09-17T15:00:00Z",
      },
      {
        id: "hist-fc-004-3",
        fan_card_id: "card-004",
        previous_status: "PROCESSING",
        new_status: "PREPARED",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Quality check passed",
        created_at: "2026-09-16T11:00:00Z",
      },
      {
        id: "hist-fc-004-2",
        fan_card_id: "card-004",
        previous_status: "REGISTERED",
        new_status: "PROCESSING",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Manufacturing started",
        created_at: "2026-09-14T09:00:00Z",
      },
      {
        id: "hist-fc-004-1",
        fan_card_id: "card-004",
        previous_status: null,
        new_status: "REGISTERED",
        changed_by: "system",
        changed_by_name: "Fan Registration Portal",
        internal_note: "Initial registration order placed",
        created_at: "2026-09-13T11:00:00Z",
      },
    ],
  },
  {
    id: "card-005",
    registration_id: "reg-005",
    fan_id: "fan-005",
    tracking_code: "KWFC-2R5T-77P9",
    current_status: "DELIVERED",
    internal_fulfillment_notes: "Delivered to recipient mailbox",
    courier_reference: "USPS-PRIORITY-ATL-1102",
    shipped_at: "2026-09-11T10:00:00Z",
    delivered_at: "2026-09-14T14:30:00Z",
    created_at: "2026-09-08T18:30:00Z",
    updated_at: "2026-09-14T14:30:00Z",
    history: [
      {
        id: "hist-fc-005-7",
        fan_card_id: "card-005",
        previous_status: "OUT_FOR_DELIVERY",
        new_status: "DELIVERED",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "Delivered to recipient mailbox",
        created_at: "2026-09-14T14:30:00Z",
      },
      {
        id: "hist-fc-005-6",
        fan_card_id: "card-005",
        previous_status: "IN_TRANSIT",
        new_status: "OUT_FOR_DELIVERY",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "Out for delivery on local postal carrier route",
        created_at: "2026-09-14T08:00:00Z",
      },
      {
        id: "hist-fc-005-5",
        fan_card_id: "card-005",
        previous_status: "SHIPPED",
        new_status: "IN_TRANSIT",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "In transit through Atlanta regional distribution center",
        created_at: "2026-09-12T13:00:00Z",
      },
      {
        id: "hist-fc-005-4",
        fan_card_id: "card-005",
        previous_status: "PREPARED",
        new_status: "SHIPPED",
        changed_by: "admin-ops-02",
        changed_by_name: "Operations Desk",
        internal_note: "Package handed off to courier",
        created_at: "2026-09-11T10:00:00Z",
      },
      {
        id: "hist-fc-005-3",
        fan_card_id: "card-005",
        previous_status: "PROCESSING",
        new_status: "PREPARED",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Card printed, packaged with VIP lanyard",
        created_at: "2026-09-10T10:00:00Z",
      },
      {
        id: "hist-fc-005-2",
        fan_card_id: "card-005",
        previous_status: "REGISTERED",
        new_status: "PROCESSING",
        changed_by: "admin-super-01",
        changed_by_name: "Fulfillment Supervisor",
        internal_note: "Card production batch started",
        created_at: "2026-09-09T09:00:00Z",
      },
      {
        id: "hist-fc-005-1",
        fan_card_id: "card-005",
        previous_status: null,
        new_status: "REGISTERED",
        changed_by: "system",
        changed_by_name: "Fan Registration Portal",
        internal_note: "Initial registration order placed",
        created_at: "2026-09-08T18:30:00Z",
      },
    ],
  },
];

export class OperationsService {
  // ---------------------------------------------------------------------------
  // Dashboard & Metrics
  // ---------------------------------------------------------------------------
  public async getDashboardMetrics(): Promise<DashboardKPIs> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const [regRes, cardRes, cityRes] = await Promise.all([
          client.from("registrations").select("id, status, city_id"),
          client.from("fan_cards").select("id, current_status"),
          client.from("cities").select("id, name, state, tour_date, max_capacity, is_active, current_registrations_count").order("tour_date", { ascending: true }),
        ]);

        if (!regRes.error && !cardRes.error && !cityRes.error && regRes.data && cardRes.data && cityRes.data) {
          const regs = regRes.data;
          const cards = cardRes.data;
          const cities = cityRes.data;

          const totalRegistrations = regs.length;
          const pendingScheduling = regs.filter(
            (r: { status: string }) => r.status === "REGISTERED" || r.status === "SCHEDULE_PENDING"
          ).length;
          const fanCardsInTransit = cards.filter((c: { current_status: string }) =>
            ["PREPARED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(c.current_status)
          ).length;
          const completedVIPs = regs.filter((r: { status: string }) => r.status === "COMPLETED").length;

          const cityBreakdown = cities.map((city: { id: string; name: string; state: string; tour_date: string; max_capacity: number; is_active: boolean; current_registrations_count: number }) => {
            const count = regs.filter((r: { city_id: string }) => r.city_id === city.id).length;
            return {
              id: city.id,
              name: city.name,
              state: city.state,
              tour_date: city.tour_date,
              registrations_count: count || city.current_registrations_count || 0,
              max_capacity: city.max_capacity,
              is_active: city.is_active,
            };
          });

          return {
            totalRegistrations,
            pendingScheduling,
            fanCardsInTransit,
            completedVIPs,
            cityBreakdown,
          };
        }
      } catch (err) {
        console.error("[OperationsService getDashboardMetrics DB Failure]", err);
      }
    }

    const registrations = inMemoryRegistrations;
    const fanCards = inMemoryFanCards;
    const cities = inMemoryCities;

    const totalRegistrations = registrations.length;
    const pendingScheduling = registrations.filter(
      (r) => r.status === "REGISTERED" || r.status === "SCHEDULE_PENDING"
    ).length;

    const fanCardsInTransit = fanCards.filter((c) =>
      ["PREPARED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
        c.current_status
      )
    ).length;

    const completedVIPs = registrations.filter(
      (r) => r.status === "COMPLETED"
    ).length;

    const cityBreakdown = cities.map((city) => {
      const cityRegs = registrations.filter((r) => r.city_id === city.id);
      return {
        id: city.id,
        name: city.name,
        state: city.state,
        tour_date: city.tour_date,
        registrations_count: cityRegs.length,
        max_capacity: city.max_capacity,
        is_active: city.is_active,
      };
    });

    return {
      totalRegistrations,
      pendingScheduling,
      fanCardsInTransit,
      completedVIPs,
      cityBreakdown,
    };
  }

  // ---------------------------------------------------------------------------
  // Tour Cities CRUD
  // ---------------------------------------------------------------------------
  public async getAllCities(): Promise<City[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from("cities")
          .select("*")
          .order("tour_date", { ascending: true });
        if (!error && data) return data as City[];
      } catch (err) {
        console.error("[OperationsService getAllCities DB Failure]", err);
      }
    }
    return [...getFallbackCities()].sort(
      (a, b) => new Date(a.tour_date).getTime() - new Date(b.tour_date).getTime()
    );
  }

  public async getCityById(id: string): Promise<City | null> {
    const cities = await this.getAllCities();
    return cities.find((c) => c.id === id) || null;
  }

  public async createCity(input: {
    name: string;
    state: string;
    country?: string;
    tour_date: string;
    venue_name?: string;
    venue_address?: string;
    max_capacity?: number;
    notes?: string;
    is_active?: boolean;
  }): Promise<City> {
    const cityId = crypto.randomUUID();
    const newCity: City = {
      id: cityId,
      name: input.name.trim(),
      state: input.state.trim().toUpperCase(),
      country: input.country || "USA",
      tour_date: input.tour_date,
      venue_name: input.venue_name || null,
      venue_address: input.venue_address || null,
      max_capacity: input.max_capacity ?? 50,
      current_registrations_count: 0,
      is_active: input.is_active ?? true,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from("cities")
          .insert(newCity)
          .select("*")
          .single();
        if (error) {
          console.error("[OperationsService createCity DB Failure]", error.message);
          throw new Error(`Database error: ${error.message}`);
        }
        if (data) {
          addFallbackCity(data as City);
          return data as City;
        }
      } catch (err) {
        console.error("[OperationsService createCity DB Failure]", err);
        throw err;
      }
    }

    addFallbackCity(newCity);
    return newCity;
  }

  public async updateCity(
    id: string,
    updates: Partial<Omit<City, "id" | "created_at">>
  ): Promise<City | null> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from("cities")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("*")
          .single();
        if (error) {
          console.error("[OperationsService updateCity DB Failure]", error.message);
          throw new Error(`Database error: ${error.message}`);
        }
        if (data) {
          updateFallbackCity(id, data as City);
          return data as City;
        }
      } catch (err) {
        console.error("[OperationsService updateCity DB Failure]", err);
        throw err;
      }
    }

    return updateFallbackCity(id, updates);
  }

  public async toggleCityActive(id: string, isActive: boolean): Promise<City | null> {
    return this.updateCity(id, { is_active: isActive });
  }

  public async deleteCity(id: string): Promise<boolean> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        // Safely unlink any existing registrations from this city first
        // (converting them into Nationwide VIP All-Access passes)
        const { error: unlinkError } = await client
          .from("registrations")
          .update({ city_id: null })
          .eq("city_id", id);

        if (unlinkError) {
          console.warn("[OperationsService deleteCity unlinking registrations]", unlinkError.message);
        }

        const { error } = await client
          .from("cities")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("[OperationsService deleteCity DB Failure]", error.message);
          throw new Error(`Database error: ${error.message}`);
        }

        removeFallbackCity(id);
        return true;
      } catch (err) {
        console.error("[OperationsService deleteCity DB Failure]", err);
        throw err;
      }
    }

    // In-memory fallback: unlink registrations and remove city
    for (const reg of inMemoryRegistrations) {
      if (reg.city_id === id) {
        reg.city_id = null;
      }
    }
    return removeFallbackCity(id);
  }

  // ---------------------------------------------------------------------------
  // Fan Registrations Triage
  // ---------------------------------------------------------------------------
  public async getRegistrations(filter?: {
    search?: string;
    cityId?: string;
    status?: RegistrationStatus;
    limit?: number;
  }): Promise<EnrichedRegistration[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        let query = client
          .from("registrations")
          .select(`
            id,
            fan_id,
            city_id,
            status,
            special_notes,
            check_in_at,
            created_at,
            updated_at,
            fans (*),
            cities (*),
            meet_and_greet_schedules (*),
            fan_cards (*, fan_card_status_history(*))
          `)
          .order("created_at", { ascending: false });

        if (filter?.cityId && filter.cityId !== "all") {
          query = query.eq("city_id", filter.cityId);
        }

        if (filter?.status) {
          query = query.eq("status", filter.status);
        }

        if (filter?.limit) {
          query = query.limit(filter.limit);
        }

        const { data, error } = await query;
        if (!error && data) {
          let list: EnrichedRegistration[] = data.map((r: any) => {
            const fanObj = Array.isArray(r.fans) ? r.fans[0] : r.fans;
            const cityObj = Array.isArray(r.cities) ? r.cities[0] : r.cities;
            const rawSched = Array.isArray(r.meet_and_greet_schedules)
              ? r.meet_and_greet_schedules[0]
              : r.meet_and_greet_schedules;
            const rawCard = Array.isArray(r.fan_cards)
              ? r.fan_cards[0]
              : r.fan_cards;

            const schedule: StoredScheduleEntity | null = rawSched
              ? {
                  id: rawSched.id,
                  registration_id: rawSched.registration_id,
                  fan_id: r.fan_id,
                  city_id: r.city_id,
                  date: rawSched.assigned_date,
                  start_time: rawSched.arrival_time,
                  end_time: null,
                  location: rawSched.venue_name || cityObj?.venue_name || "",
                  instructions: rawSched.arrival_instructions,
                  status: (r.status as ScheduleStatus) || "SCHEDULED",
                  is_notified: rawSched.is_notified,
                  notified_at: rawSched.notified_at,
                  created_by: rawSched.created_by,
                  created_at: rawSched.created_at,
                  updated_at: rawSched.updated_at,
                  history: [],
                  assigned_date: rawSched.assigned_date,
                  arrival_time: rawSched.arrival_time,
                  venue_name: rawSched.venue_name || cityObj?.venue_name || "",
                  venue_address: rawSched.venue_address || cityObj?.venue_address || "",
                  arrival_instructions: rawSched.arrival_instructions,
                }
              : null;

            const fanCard: StoredFanCardEntity | null = rawCard
              ? {
                  id: rawCard.id,
                  registration_id: rawCard.registration_id,
                  fan_id: rawCard.fan_id,
                  tracking_code: rawCard.tracking_code,
                  current_status: rawCard.current_status,
                  internal_fulfillment_notes: rawCard.internal_fulfillment_notes,
                  courier_reference: rawCard.courier_reference,
                  shipped_at: rawCard.shipped_at,
                  delivered_at: rawCard.delivered_at,
                  created_at: rawCard.created_at,
                  updated_at: rawCard.updated_at,
                  history: rawCard.fan_card_status_history || [],
                }
              : null;

            return {
              id: r.id,
              fan: fanObj,
              city: cityObj,
              status: r.status,
              special_notes: r.special_notes,
              created_at: r.created_at,
              updated_at: r.updated_at,
              schedule,
              fanCard,
            };
          });

          if (filter?.search) {
            const q = filter.search.toLowerCase().trim();
            list = list.filter((r) => {
              const fullName = `${r.fan?.first_name || ""} ${r.fan?.last_name || ""}`.toLowerCase();
              const email = (r.fan?.email || "").toLowerCase();
              const tracking = (r.fanCard?.tracking_code || "").toLowerCase();
              const city = (r.city?.name || "").toLowerCase();
              return (
                fullName.includes(q) ||
                email.includes(q) ||
                tracking.includes(q) ||
                city.includes(q)
              );
            });
          }

          return list;
        }
      } catch (err) {
        console.error("[OperationsService getRegistrations DB Failure]", err);
      }
    }

    let list = inMemoryRegistrations.map((reg) => {
      const fan = inMemoryFans.find((f) => f.id === reg.fan_id)!;
      const matchedCity = inMemoryCities.find((c) => c.id === reg.city_id);
      const city: City = matchedCity || {
        id: reg.city_id || "national-vip-pass",
        name: "National VIP Member",
        state: "USA",
        country: "USA",
        venue_name: "VIP Guest Experience",
        venue_address: "Nationwide Tour Appearance",
        tour_date: "2026/2027 VIP Tour Season",
        is_active: true,
        max_capacity: 1000,
        current_registrations_count: 0,
        notes: "Nationwide VIP Pass (No specific tour stop required)",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const schedule = inMemorySchedules.find((s) => s.registration_id === reg.id) || null;
      const fanCard = inMemoryFanCards.find((c) => c.registration_id === reg.id) || null;

      return {
        id: reg.id,
        fan,
        city,
        status: reg.status,
        special_notes: reg.special_notes,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        schedule,
        fanCard,
      };
    });

    if (filter?.cityId && filter.cityId !== "all") {
      list = list.filter((r) => r.city?.id === filter.cityId);
    }

    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter((r) => {
        const fullName = `${r.fan?.first_name || ""} ${r.fan?.last_name || ""}`.toLowerCase();
        const email = (r.fan?.email || "").toLowerCase();
        const tracking = (r.fanCard?.tracking_code || "").toLowerCase();
        const city = (r.city?.name || "").toLowerCase();
        return (
          fullName.includes(q) ||
          email.includes(q) ||
          tracking.includes(q) ||
          city.includes(q)
        );
      });
    }

    // Sort newest first
    list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (filter?.limit) {
      list = list.slice(0, filter.limit);
    }

    return list;
  }

  public async getRegistrationById(id: string): Promise<EnrichedRegistration | null> {
    const list = await this.getRegistrations();
    return list.find((r) => r.id === id) || null;
  }

  public async updateRegistrationStatus(
    id: string,
    newStatus: RegistrationStatus
  ): Promise<EnrichedRegistration | null> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        await client
          .from("registrations")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch (err) {
        console.error("[OperationsService updateRegistrationStatus DB Failure]", err);
      }
    }

    const regIndex = inMemoryRegistrations.findIndex((r) => r.id === id);
    if (regIndex !== -1) {
      inMemoryRegistrations[regIndex].status = newStatus;
      inMemoryRegistrations[regIndex].updated_at = new Date().toISOString();
    }

    return this.getRegistrationById(id);
  }

  // ---------------------------------------------------------------------------
  // Meet & Greet VIP Schedules Tool
  // ---------------------------------------------------------------------------
  public async getSchedules(filter?: {
    status?: ScheduleStatus;
    cityId?: string;
  }): Promise<StoredScheduleEntity[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { data, error } = await client
          .from("meet_and_greet_schedules")
          .select(`
            *,
            registrations (*, fans (*), cities (*))
          `)
          .order("updated_at", { ascending: false });

        if (!error && data) {
          let list: StoredScheduleEntity[] = data.map((s: any) => {
            const regObj = Array.isArray(s.registrations) ? s.registrations[0] : s.registrations;
            const fanObj = regObj ? (Array.isArray(regObj.fans) ? regObj.fans[0] : regObj.fans) : null;
            const cityObj = regObj ? (Array.isArray(regObj.cities) ? regObj.cities[0] : regObj.cities) : null;

            return {
              id: s.id,
              registration_id: s.registration_id,
              fan_id: regObj?.fan_id || fanObj?.id || "",
              city_id: regObj?.city_id || cityObj?.id || "",
              date: s.assigned_date,
              start_time: s.arrival_time,
              end_time: null,
              location: s.venue_name,
              instructions: s.arrival_instructions,
              status: (regObj?.status as ScheduleStatus) || "SCHEDULED",
              is_notified: s.is_notified,
              notified_at: s.notified_at,
              created_by: s.created_by,
              created_at: s.created_at,
              updated_at: s.updated_at,
              history: [],
              assigned_date: s.assigned_date,
              arrival_time: s.arrival_time,
              venue_name: s.venue_name,
              venue_address: s.venue_address,
              arrival_instructions: s.arrival_instructions,
            };
          });

          if (filter?.status) {
            list = list.filter((s) => s.status === filter.status);
          }

          if (filter?.cityId && filter.cityId !== "all") {
            list = list.filter((s) => s.city_id === filter.cityId);
          }

          return list;
        }
      } catch (err) {
        console.error("[OperationsService getSchedules DB Failure]", err);
      }
    }

    let list = [...inMemorySchedules];

    if (filter?.status) {
      list = list.filter((s) => s.status === filter.status);
    }

    if (filter?.cityId && filter.cityId !== "all") {
      list = list.filter((s) => s.city_id === filter.cityId);
    }

    return list.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }


  public async getScheduleById(id: string): Promise<StoredScheduleEntity | null> {
    return inMemorySchedules.find((s) => s.id === id) || null;
  }

  public async getScheduleByRegistrationId(
    registrationId: string
  ): Promise<StoredScheduleEntity | null> {
    return inMemorySchedules.find((s) => s.registration_id === registrationId) || null;
  }

  public async getScheduleHistory(
    scheduleId: string
  ): Promise<ScheduleHistoryEntry[]> {
    const sched = await this.getScheduleById(scheduleId);
    if (!sched) return [];
    return [...sched.history].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async createSchedule(input: {
    registrationId: string;
    date: string;
    startTime: string;
    endTime?: string | null;
    location: string;
    instructions: string;
    sendEmail?: boolean;
    adminId?: string;
    adminEmail?: string;
  }): Promise<{
    schedule: StoredScheduleEntity;
    emailResult?: EmailSendResult;
  }> {
    const reg = await this.getRegistrationById(input.registrationId);
    if (!reg) {
      throw new Error(`Registration '${input.registrationId}' not found.`);
    }

    const existingSched = inMemorySchedules.find(
      (s) => s.registration_id === input.registrationId && s.status !== "CANCELLED"
    );
    if (existingSched) {
      throw new Error(
        `Active schedule already exists for this registration. Please edit the existing appointment.`
      );
    }

    const now = new Date().toISOString();
    const schedId = `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const historyId = `hist-${schedId}-1`;

    const initialHistory: ScheduleHistoryEntry = {
      id: historyId,
      schedule_id: schedId,
      changed_by: input.adminId || "admin",
      changed_by_name: input.adminEmail || "Tour Coordinator",
      action: "CREATED",
      previous_values: null,
      new_values: {
        date: input.date,
        start_time: input.startTime,
        end_time: input.endTime || null,
        location: input.location,
        instructions: input.instructions,
        status: "SCHEDULED",
      },
      change_reason: "Initial schedule assignment",
      notified_fan: input.sendEmail !== false,
      created_at: now,
    };

    const newSchedule: StoredScheduleEntity = {
      id: schedId,
      registration_id: input.registrationId,
      fan_id: reg.fan.id,
      city_id: reg.city.id,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime || null,
      location: input.location,
      instructions: input.instructions,
      status: "SCHEDULED",
      is_notified: false,
      created_by: input.adminId || null,
      created_by_name: input.adminEmail || null,
      created_at: now,
      updated_at: now,
      history: [initialHistory],
      // Aliases
      assigned_date: input.date,
      arrival_time: input.startTime,
      venue_name: reg.city.venue_name || input.location,
      venue_address: reg.city.venue_address || input.location,
      arrival_instructions: input.instructions,
    };

    inMemorySchedules.unshift(newSchedule);

    // Transactionally update registration status
    await this.updateRegistrationStatus(input.registrationId, "SCHEDULED");

    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        await client
          .from("meet_and_greet_schedules")
          .insert({
            id: schedId,
            registration_id: input.registrationId,
            assigned_date: input.date,
            arrival_time: input.startTime,
            venue_name: reg.city.venue_name || input.location,
            venue_address: reg.city.venue_address || input.location,
            arrival_instructions: input.instructions,
            is_notified: false,
            created_by: input.adminId && !input.adminId.startsWith("admin-") ? input.adminId : null,
            created_at: now,
            updated_at: now,
          });
      } catch (err) {
        console.error("[OperationsService createSchedule DB Failure]", err);
      }
    }

    // Dispatch email if requested
    let emailResult: EmailSendResult | undefined;
    if (input.sendEmail !== false) {
      const formattedDate = new Date(`${input.date}T12:00:00`).toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      );
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetkountrywayne.vip";
      const trackingUrl = reg.fanCard?.tracking_code
        ? `${baseUrl}/track?code=${reg.fanCard.tracking_code}`
        : `${baseUrl}/track`;

      emailResult = await emailService.sendScheduleEmail({
        fanName: `${reg.fan.first_name} ${reg.fan.last_name}`,
        fanEmail: reg.fan.email,
        cityName: reg.city.name,
        cityState: reg.city.state,
        assignedDate: formattedDate,
        arrivalTime: input.startTime,
        venueName: reg.city.venue_name || input.location,
        venueAddress: reg.city.venue_address || input.location,
        arrivalInstructions: input.instructions,
        fanId: reg.fan.id,
        registrationId: reg.id,
        trackingCode: reg.fanCard?.tracking_code,
        trackingUrl,
      });

      if (emailResult.success) {
        newSchedule.is_notified = true;
        newSchedule.notified_at = new Date().toISOString();
      }
    }

    return { schedule: newSchedule, emailResult };
  }

  public async updateSchedule(
    scheduleId: string,
    updates: {
      date?: string;
      startTime?: string;
      endTime?: string | null;
      location?: string;
      instructions?: string;
      status?: ScheduleStatus;
      changeReason?: string;
      sendEmail?: boolean;
      adminId?: string;
      adminEmail?: string;
    }
  ): Promise<{
    schedule: StoredScheduleEntity;
    emailResult?: EmailSendResult;
  }> {
    const schedIndex = inMemorySchedules.findIndex((s) => s.id === scheduleId);
    const current = inMemorySchedules[schedIndex] || (await this.getScheduleById(scheduleId));
    if (!current) {
      throw new Error(`Schedule '${scheduleId}' not found.`);
    }

    const now = new Date().toISOString();

    const previousValues = {
      date: current.date,
      start_time: current.start_time,
      end_time: current.end_time,
      location: current.location,
      instructions: current.instructions,
      status: current.status,
    };

    const newDate = updates.date ?? current.date;
    const newStartTime = updates.startTime ?? current.start_time;
    const newEndTime = updates.endTime !== undefined ? updates.endTime : current.end_time;
    const newLocation = updates.location ?? current.location;
    const newInstructions = updates.instructions ?? current.instructions;
    const newStatus = updates.status ?? current.status;

    const actionType: ScheduleHistoryEntry["action"] =
      updates.status && updates.status !== current.status ? "STATUS_CHANGE" : "UPDATED";

    const historyEntry: ScheduleHistoryEntry = {
      id: `hist-${scheduleId}-${Date.now()}`,
      schedule_id: scheduleId,
      changed_by: updates.adminId || "admin",
      changed_by_name: updates.adminEmail || "Tour Coordinator",
      action: actionType,
      previous_values: previousValues,
      new_values: {
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        location: newLocation,
        instructions: newInstructions,
        status: newStatus,
      },
      change_reason: updates.changeReason || "Operational schedule revision",
      notified_fan: updates.sendEmail !== false,
      created_at: now,
    };

    current.date = newDate;
    current.start_time = newStartTime;
    current.end_time = newEndTime;
    current.location = newLocation;
    current.instructions = newInstructions;
    current.status = newStatus;
    current.updated_at = now;
    current.updated_by = updates.adminId || null;
    current.updated_by_name = updates.adminEmail || null;
    current.history.unshift(historyEntry);

    // Update aliases
    current.assigned_date = newDate;
    current.arrival_time = newStartTime;
    current.arrival_instructions = newInstructions;

    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        await client
          .from("meet_and_greet_schedules")
          .update({
            assigned_date: newDate,
            arrival_time: newStartTime,
            venue_name: newLocation,
            arrival_instructions: newInstructions,
            updated_at: now,
          })
          .eq("id", scheduleId);
      } catch (err) {
        console.error("[OperationsService updateSchedule DB Failure]", err);
      }
    }

    // Synchronize registration status if schedule status changed
    if (newStatus === "COMPLETED") {
      await this.updateRegistrationStatus(current.registration_id, "COMPLETED");
    } else if (newStatus === "SCHEDULED") {
      await this.updateRegistrationStatus(current.registration_id, "SCHEDULED");
    } else if (newStatus === "PENDING") {
      await this.updateRegistrationStatus(current.registration_id, "SCHEDULE_PENDING");
    }

    let emailResult: EmailSendResult | undefined;
    if (updates.sendEmail !== false) {
      const reg = await this.getRegistrationById(current.registration_id);
      if (reg) {
        const formattedDate = new Date(`${newDate}T12:00:00`).toLocaleDateString(
          "en-US",
          { month: "long", day: "numeric", year: "numeric" }
        );
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetkountrywayne.vip";
        const trackingUrl = reg.fanCard?.tracking_code
          ? `${baseUrl}/track?code=${reg.fanCard.tracking_code}`
          : `${baseUrl}/track`;

        emailResult = await emailService.sendScheduleUpdateEmail({
          fanName: `${reg.fan.first_name} ${reg.fan.last_name}`,
          fanEmail: reg.fan.email,
          cityName: reg.city.name,
          cityState: reg.city.state,
          assignedDate: formattedDate,
          arrivalTime: newStartTime,
          venueName: reg.city.venue_name || newLocation,
          venueAddress: reg.city.venue_address || newLocation,
          arrivalInstructions: newInstructions,
          updateReason: updates.changeReason,
          fanId: reg.fan.id,
          registrationId: reg.id,
          trackingCode: reg.fanCard?.tracking_code,
          trackingUrl,
        });

        if (emailResult.success) {
          current.is_notified = true;
          current.notified_at = now;
        }
      }
    }

    return { schedule: current, emailResult };
  }

  public async cancelSchedule(
    scheduleId: string,
    options: {
      cancellationReason: string;
      sendEmail?: boolean;
      adminId?: string;
      adminEmail?: string;
    }
  ): Promise<{
    schedule: StoredScheduleEntity;
    emailResult?: EmailSendResult;
  }> {
    if (!options.cancellationReason || options.cancellationReason.trim().length === 0) {
      throw new Error("A cancellation reason is required to cancel a schedule.");
    }

    const schedIndex = inMemorySchedules.findIndex((s) => s.id === scheduleId);
    const current = inMemorySchedules[schedIndex] || (await this.getScheduleById(scheduleId));
    if (!current) {
      throw new Error(`Schedule '${scheduleId}' not found.`);
    }

    const now = new Date().toISOString();

    const previousValues = {
      date: current.date,
      start_time: current.start_time,
      end_time: current.end_time,
      location: current.location,
      instructions: current.instructions,
      status: current.status,
    };

    const historyEntry: ScheduleHistoryEntry = {
      id: `hist-${scheduleId}-${Date.now()}`,
      schedule_id: scheduleId,
      changed_by: options.adminId || "admin",
      changed_by_name: options.adminEmail || "Tour Coordinator",
      action: "CANCELLED",
      previous_values: previousValues,
      new_values: {
        date: current.date,
        start_time: current.start_time,
        end_time: current.end_time,
        location: current.location,
        instructions: current.instructions,
        status: "CANCELLED",
      },
      change_reason: options.cancellationReason,
      notified_fan: options.sendEmail !== false,
      created_at: now,
    };

    current.status = "CANCELLED";
    current.cancellation_reason = options.cancellationReason;
    current.updated_at = now;
    current.updated_by = options.adminId || null;
    current.updated_by_name = options.adminEmail || null;
    current.history.unshift(historyEntry);

    // Update registration status to CANCELLED
    await this.updateRegistrationStatus(current.registration_id, "CANCELLED");

    let emailResult: EmailSendResult | undefined;
    if (options.sendEmail !== false) {
      const reg = await this.getRegistrationById(current.registration_id);
      if (reg) {
        const formattedDate = new Date(`${current.date}T12:00:00`).toLocaleDateString(
          "en-US",
          { month: "long", day: "numeric", year: "numeric" }
        );
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetkountrywayne.vip";
        const trackingUrl = reg.fanCard?.tracking_code
          ? `${baseUrl}/track?code=${reg.fanCard.tracking_code}`
          : `${baseUrl}/track`;

        emailResult = await emailService.sendScheduleCancellationEmail({
          fanName: `${reg.fan.first_name} ${reg.fan.last_name}`,
          fanEmail: reg.fan.email,
          cityName: reg.city.name,
          cityState: reg.city.state,
          originalDate: formattedDate,
          cancellationReason: options.cancellationReason,
          trackingCode: reg.fanCard?.tracking_code,
          trackingUrl,
          fanId: reg.fan.id,
          registrationId: reg.id,
        });
      }
    }

    return { schedule: current, emailResult };
  }

  public async assignSchedule(input: {
    registrationId: string;
    assignedDate: string;
    arrivalTime: string;
    venueName: string;
    venueAddress: string;
    arrivalInstructions: string;
    sendEmail?: boolean;
    adminId?: string;
    adminEmail?: string;
  }): Promise<{
    schedule: StoredScheduleEntity;
    emailResult?: EmailSendResult;
  }> {
    const existing = await this.getScheduleByRegistrationId(input.registrationId);
    const location = `${input.venueName}${input.venueAddress ? ` — ${input.venueAddress}` : ""}`;

    if (existing && existing.status !== "CANCELLED") {
      return this.updateSchedule(existing.id, {
        date: input.assignedDate,
        startTime: input.arrivalTime,
        location,
        instructions: input.arrivalInstructions,
        sendEmail: input.sendEmail,
        adminId: input.adminId,
        adminEmail: input.adminEmail,
      });
    }

    return this.createSchedule({
      registrationId: input.registrationId,
      date: input.assignedDate,
      startTime: input.arrivalTime,
      location,
      instructions: input.arrivalInstructions,
      sendEmail: input.sendEmail,
      adminId: input.adminId,
      adminEmail: input.adminEmail,
    });
  }

  // ---------------------------------------------------------------------------
  // Physical Fan Card Fulfillment Pipeline
  // ---------------------------------------------------------------------------
  public async getFanCards(filter?: {
    status?: FanCardStatus;
    cityId?: string;
  }): Promise<StoredFanCardEntity[]> {
    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        let query = client
          .from("fan_cards")
          .select(`
            id,
            registration_id,
            fan_id,
            tracking_code,
            current_status,
            internal_fulfillment_notes,
            courier_reference,
            shipped_at,
            delivered_at,
            created_at,
            updated_at,
            fan:fans(*),
            registration:registrations(*, city:cities(*)),
            history:fan_card_status_history(*)
          `)
          .order("updated_at", { ascending: false });

        if (filter?.status) {
          query = query.eq("current_status", filter.status);
        }

        const { data, error } = await query;
        if (!error && data) {
          let cards: StoredFanCardEntity[] = data.map((c: any) => {
            const histList = (c.history || []).map((h: any) => ({
              id: h.id,
              fan_card_id: h.fan_card_id,
              previous_status: h.previous_status,
              new_status: h.new_status,
              status: h.new_status,
              changed_by: h.changed_by,
              changed_by_name: h.changed_by || "Admin Desk",
              internal_note: h.status_notes,
              created_at: h.created_at,
            }));

            return {
              id: c.id,
              registration_id: c.registration_id,
              fan_id: c.fan_id,
              tracking_code: c.tracking_code,
              current_status: c.current_status,
              internal_fulfillment_notes: c.internal_fulfillment_notes,
              courier_reference: c.courier_reference,
              shipped_at: c.shipped_at,
              delivered_at: c.delivered_at,
              created_at: c.created_at,
              updated_at: c.updated_at,
              history: histList,
              registration: c.registration,
            };
          });

          if (filter?.cityId && filter.cityId !== "all") {
            const cityFilterId = filter.cityId;
            cards = cards.filter((c: any) => {
              const reg = c.registration;
              return reg?.city_id === cityFilterId || reg?.city?.id === cityFilterId;
            });
          }

          return cards;
        }
      } catch (err) {
        console.error("[OperationsService getFanCards DB Failure]", err);
      }
    }

    let cards = [...inMemoryFanCards];

    if (filter?.status) {
      cards = cards.filter((c) => c.current_status === filter.status);
    }

    if (filter?.cityId && filter.cityId !== "all") {
      const regIdsInCity = inMemoryRegistrations
        .filter((r) => r.city_id === filter.cityId)
        .map((r) => r.id);
      cards = cards.filter((c) => regIdsInCity.includes(c.registration_id));
    }

    // Sort newest updated first
    return cards.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  public async getFanCardById(cardId: string): Promise<StoredFanCardEntity | null> {
    const list = await this.getFanCards();
    return list.find((c) => c.id === cardId) || null;
  }

  public async getFanCardByTrackingCode(
    trackingCode: string
  ): Promise<StoredFanCardEntity | null> {
    const clean = trackingCode.trim().toUpperCase();
    const list = await this.getFanCards();
    return list.find((c) => c.tracking_code === clean) || null;
  }

  public async updateFanCardStatus(
    cardId: string,
    newStatus: FanCardStatus,
    options?: {
      courierReference?: string;
      internalNotes?: string;
      sendEmail?: boolean;
      issueReason?: string;
      adminId?: string;
      adminEmail?: string;
      adminRole?: "SUPER_ADMIN" | "ADMIN" | "STAFF";
    }
  ): Promise<{
    card: StoredFanCardEntity;
    emailResult?: EmailSendResult;
  }> {
    const card = (await this.getFanCardById(cardId)) || inMemoryFanCards.find((c) => c.id === cardId);
    if (!card) {
      throw new Error(`Fan Card '${cardId}' not found.`);
    }

    const previousStatus = card.current_status;
    const note = options?.internalNotes || options?.issueReason;

    // 1. Validate status transition
    const validation = validateFanCardTransition(previousStatus, newStatus, note);
    if (!validation.isValid) {
      throw new Error(validation.error || `Invalid status transition from '${previousStatus}' to '${newStatus}'.`);
    }

    const now = new Date().toISOString();

    card.current_status = newStatus;
    card.updated_at = now;

    if (options?.courierReference !== undefined) {
      card.courier_reference = options.courierReference;
    }

    if (options?.internalNotes !== undefined) {
      card.internal_fulfillment_notes = options.internalNotes;
    }

    if (newStatus === "SHIPPED" && !card.shipped_at) {
      card.shipped_at = now;
    }

    if (newStatus === "DELIVERED" && !card.delivered_at) {
      card.delivered_at = now;
    }

    const historyEntry: FanCardHistoryEntry = {
      id: `hist-fc-${card.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fan_card_id: card.id,
      previous_status: previousStatus,
      new_status: newStatus,
      status: newStatus,
      changed_by: options?.adminId || "admin",
      changed_by_name: options?.adminEmail || "Tour Fulfillment Desk",
      internal_note: note || null,
      created_at: now,
    };

    card.history.unshift(historyEntry);

    const client = supabaseAdmin || supabase;
    if (isSupabaseConfigured && client) {
      try {
        const updatePayload: Record<string, any> = {
          current_status: newStatus,
          updated_at: now,
        };
        if (options?.courierReference !== undefined) updatePayload.courier_reference = options.courierReference;
        if (options?.internalNotes !== undefined) updatePayload.internal_fulfillment_notes = options.internalNotes;
        if (newStatus === "SHIPPED") updatePayload.shipped_at = now;
        if (newStatus === "DELIVERED") updatePayload.delivered_at = now;

        await client
          .from("fan_cards")
          .update(updatePayload)
          .eq("id", cardId);

        await client
          .from("fan_card_status_history")
          .insert({
            fan_card_id: cardId,
            previous_status: previousStatus,
            new_status: newStatus,
            status_notes: note || null,
            changed_by: options?.adminId && !options.adminId.startsWith("admin-") && !options.adminId.startsWith("mock-") ? options.adminId : null,
            created_at: now,
          });
      } catch (err) {
        console.error("[OperationsService updateFanCardStatus DB Failure]", err);
      }
    }


    // 4. Create immutable administrative audit log
    await recordAdminAuditLog({
      adminId: options?.adminId || "admin-system",
      adminEmail: options?.adminEmail || "fulfillment@kountrywayne.vip",
      adminRole: options?.adminRole || "ADMIN",
      action: "STATUS_CHANGE",
      entityTable: "fan_cards",
      entityId: card.id,
      oldState: { status: previousStatus },
      newState: { status: newStatus, courierReference: card.courier_reference },
      details: `Fan Card ${card.tracking_code} status transitioned from ${previousStatus} to ${newStatus}${note ? ` (${note})` : ""}`,
    });

    // Dispatch automated fan status update email if requested
    let emailResult: EmailSendResult | undefined;
    if (
      options?.sendEmail !== false &&
      newStatus !== "REGISTERED" &&
      newStatus !== "CANCELLED"
    ) {
      try {
        const reg = await this.getRegistrationById(card.registration_id);
        if (reg) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetkountrywayne.vip";
          const trackingUrl = `${baseUrl}/track?code=${card.tracking_code}`;
          const lastUpdated = new Date(now).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          emailResult = await emailService.sendStatusUpdateEmail({
            fanName: `${reg.fan.first_name} ${reg.fan.last_name}`,
            fanEmail: reg.fan.email,
            trackingCode: card.tracking_code,
            status: newStatus as
              | "PROCESSING"
              | "PREPARED"
              | "SHIPPED"
              | "IN_TRANSIT"
              | "OUT_FOR_DELIVERY"
              | "DELIVERED"
              | "DELIVERY_ISSUE",
            statusLabel: newStatus.replace(/_/g, " "),
            cityName: reg.city.name,
            cityState: reg.city.state,
            lastUpdated,
            trackingUrl,
            courierReference: card.courier_reference || undefined,
            deliveryIssueNote: options?.issueReason || options?.internalNotes,
            fanId: reg.fan.id,
            registrationId: reg.id,
            fanCardId: card.id,
          });
        }
      } catch (err) {
        console.error("[OperationsService updateFanCardStatus email error]", err);
      }
    }

    return { card, emailResult };
  }

  public async batchUpdateFanCardStatus(
    cardIds: string[],
    newStatus: FanCardStatus,
    options?: {
      courierReference?: string;
      internalNotes?: string;
      sendEmail?: boolean;
      adminId?: string;
      adminEmail?: string;
      adminRole?: "SUPER_ADMIN" | "ADMIN" | "STAFF";
    }
  ): Promise<{ updatedCount: number; results: Array<{ cardId: string; success: boolean; error?: string }> }> {
    const results: Array<{ cardId: string; success: boolean; error?: string }> = [];
    let updatedCount = 0;

    for (const id of cardIds) {
      try {
        await this.updateFanCardStatus(id, newStatus, options);
        results.push({ cardId: id, success: true });
        updatedCount++;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to update card";
        console.error(`Failed to update card ${id}:`, errMsg);
        results.push({ cardId: id, success: false, error: errMsg });
      }
    }

    return { updatedCount, results };
  }

  public async resendFanCardTrackingEmail(
    cardId: string,
    options?: {
      adminId?: string;
      adminEmail?: string;
    }
  ): Promise<{ success: boolean; emailResult?: EmailSendResult; message?: string }> {
    const card = await this.getFanCardById(cardId);
    if (!card) {
      throw new Error(`Fan Card '${cardId}' not found.`);
    }

    const reg = await this.getRegistrationById(card.registration_id);
    if (!reg) {
      throw new Error(`Registration record for Fan Card '${cardId}' not found.`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetkountrywayne.vip";
    const trackingUrl = `${baseUrl}/track?code=${card.tracking_code}`;
    const addressSummary = `${reg.fan.shipping_address_line1}, ${reg.fan.shipping_city}, ${reg.fan.shipping_state} ${reg.fan.shipping_postal_code}`;

    const emailResult = await emailService.sendFanCardTrackingEmail(
      {
        fanName: `${reg.fan.first_name} ${reg.fan.last_name}`,
        fanEmail: reg.fan.email,
        fanId: reg.fan.id,
        fanCardId: card.id,
        registrationId: reg.id,
        trackingCode: card.tracking_code,
        currentStatus: card.current_status,
        statusLabel: card.current_status.replace(/_/g, " "),
        cityName: reg.city.name,
        cityState: reg.city.state,
        trackingUrl,
      },
      { forceRetry: true }
    );

    return {
      success: emailResult.success,
      emailResult,
      message: emailResult.success
        ? `Tracking information email re-dispatched to ${reg.fan.email}.`
        : `Email delivery failed: ${emailResult.error}`,
    };
  }

  public async getFanCardHistory(cardId: string): Promise<FanCardHistoryEntry[]> {
    const card = await this.getFanCardById(cardId);
    if (!card) return [];
    return [...card.history].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // ---------------------------------------------------------------------------
  // Synchronous Injection for Public Registrations
  // ---------------------------------------------------------------------------
  public recordPublicRegistration(payload: {
    fan: StoredFanEntity;
    cityId: string;
    specialNotes?: string;
    trackingCode: string;
  }): { registration: StoredRegistrationEntity; fanCard: StoredFanCardEntity } {
    let fan = inMemoryFans.find((f) => f.email === payload.fan.email);
    if (!fan) {
      fan = payload.fan;
      inMemoryFans.push(fan);
    }

    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newReg: StoredRegistrationEntity = {
      id: regId,
      fan_id: fan.id,
      city_id: payload.cityId,
      status: "REGISTERED",
      special_notes: payload.specialNotes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryRegistrations.unshift(newReg);

    const cardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newCard: StoredFanCardEntity = {
      id: cardId,
      registration_id: regId,
      fan_id: fan.id,
      tracking_code: payload.trackingCode,
      current_status: "REGISTERED",
      created_at: now,
      updated_at: now,
      history: [
        {
          id: `hist-fc-${cardId}-1`,
          fan_card_id: cardId,
          previous_status: null,
          new_status: "REGISTERED",
          status: "REGISTERED",
          changed_by: "system",
          changed_by_name: "Fan Registration Portal",
          internal_note: "Initial registration order placed",
          created_at: now,
        },
      ],
    };
    inMemoryFanCards.unshift(newCard);

    return { registration: newReg, fanCard: newCard };
  }

  // ---------------------------------------------------------------------------
  // Data Export (CSV)
  // ---------------------------------------------------------------------------
  public async exportRegistrationsCsv(filter?: {
    cityId?: string;
    status?: RegistrationStatus;
  }): Promise<string> {
    const registrations = await this.getRegistrations(filter);

    const headers = [
      "Registration ID",
      "Fan First Name",
      "Fan Last Name",
      "Email",
      "Phone",
      "Shipping Address",
      "City",
      "State",
      "Postal Code",
      "Tour Stop",
      "Tour Date",
      "Registration Status",
      "Tracking Code",
      "Fan Card Status",
      "Scheduled Arrival Time",
      "Registered At",
    ];

    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = registrations.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.fan.first_name),
      escapeCsv(r.fan.last_name),
      escapeCsv(r.fan.email),
      escapeCsv(r.fan.phone_number),
      escapeCsv(r.fan.shipping_address_line1),
      escapeCsv(r.fan.shipping_city),
      escapeCsv(r.fan.shipping_state),
      escapeCsv(r.fan.shipping_postal_code),
      escapeCsv(r.city?.name || "National VIP Member"),
      escapeCsv(r.city?.tour_date || "2026/2027 VIP Tour Season"),
      escapeCsv(r.status),
      escapeCsv(r.fanCard?.tracking_code),
      escapeCsv(r.fanCard?.current_status),
      escapeCsv(r.schedule?.arrival_time),
      escapeCsv(r.created_at),
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }

  /**
   * Reset store (useful for clean unit testing)
   */
  public resetStore(): void {
    resetFallbackCities();

    inMemoryFans.length = 0;
    inMemoryRegistrations.length = 0;
    inMemorySchedules.length = 0;
    inMemoryFanCards.length = 0;
  }
}

export const operationsService = new OperationsService();
