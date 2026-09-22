export type AdminRole = 'SUPER_ADMIN' | 'TOUR_COORDINATOR' | 'FULFILLMENT_MANAGER' | 'READ_ONLY';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'SCHEDULE_PENDING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED';

export type FanCardStatus =
  | 'REGISTERED'
  | 'PROCESSING'
  | 'PREPARED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_ISSUE'
  | 'CANCELLED';

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  tour_date: string;
  venue_name: string | null;
  venue_address: string | null;
  max_capacity: number;
  current_registrations_count: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MembershipTier = 'GOLD_VIP' | 'DIAMOND_VIP' | 'SILVER_MEMBER';

export interface Fan {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  phone_number: string;
  date_of_birth?: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  id_type?: string | null;
  id_number?: string | null;
  id_document_name?: string | null;
  id_document_url?: string | null;
  id_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FanCardHistoryEntry {
  id: string;
  fan_card_id: string;
  previous_status: FanCardStatus | null;
  new_status: FanCardStatus;
  status?: FanCardStatus;
  changed_by: string;
  changed_by_name?: string;
  internal_note?: string | null;
  created_at: string;
}

export interface FanCard {
  id: string;
  registration_id: string;
  fan_id: string;
  tracking_code: string;
  current_status: FanCardStatus;
  internal_fulfillment_notes: string | null;
  courier_reference: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  history?: FanCardHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface PublicTrackingData {
  tracking_code: string;
  fan_first_initial: string;
  city_name: string;
  city_state: string;
  tour_date: string;
  registration_status: RegistrationStatus;
  fan_card_status: FanCardStatus;
  fan_card_created_at: string;
  fan_card_shipped_at: string | null;
  fan_card_delivered_at: string | null;
  schedule_assigned_date: string | null;
  schedule_arrival_time: string | null;
  schedule_is_notified: boolean;
  history?: Array<{
    status: FanCardStatus;
    created_at: string;
  }>;
}

export type ScheduleStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ScheduleHistoryEntry {
  id: string;
  schedule_id: string;
  changed_by: string;
  changed_by_name?: string;
  action: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'STATUS_CHANGE';
  previous_values?: {
    date?: string;
    start_time?: string;
    end_time?: string | null;
    location?: string;
    instructions?: string;
    status?: ScheduleStatus;
  } | null;
  new_values: {
    date: string;
    start_time: string;
    end_time?: string | null;
    location: string;
    instructions: string;
    status: ScheduleStatus;
  };
  change_reason?: string | null;
  notified_fan: boolean;
  created_at: string;
}

export interface MeetAndGreetSchedule {
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
  created_by: string;
  created_by_name?: string;
  updated_by?: string | null;
  updated_by_name?: string | null;
  created_at: string;
  updated_at: string;
  history?: ScheduleHistoryEntry[];
}

