import { supabase, supabaseAdmin, isSupabaseConfigured } from "./client";
import type { City } from "@/types/database";

export interface GetCitiesResult {
  cities: City[];
  error: string | null;
  isLive: boolean;
}

// Fallback seed tour cities when Supabase credentials are not yet configured
export const DEFAULT_ACTIVE_CITIES: City[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    name: "Atlanta",
    state: "GA",
    country: "USA",
    tour_date: "2026-11-14",
    venue_name: "Fox Theatre",
    venue_address: "660 Peachtree St NE, Atlanta, GA 30308",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "VIP Green Room Entrance via Stage Door B.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "b2c3d4e5-f6a7-4b6c-9d8e-0f1a2b3c4d5e",
    name: "Houston",
    state: "TX",
    country: "USA",
    tour_date: "2026-11-20",
    venue_name: "Bayou Music Center",
    venue_address: "520 Texas Ave, Houston, TX 77002",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "VIP check-in table located at West VIP Lounge.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-4c7d-0e1f-1a2b3c4d5e6f",
    name: "Chicago",
    state: "IL",
    country: "USA",
    tour_date: "2026-12-05",
    venue_name: "The Chicago Theatre",
    venue_address: "175 N State St, Chicago, IL 60601",
    max_capacity: 40,
    current_registrations_count: 0,
    is_active: true,
    notes: "Check-in at State Street VIP Entrance.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "d4e5f6a7-b8c9-4d8e-1f2a-2b3c4d5e6f7a",
    name: "Los Angeles",
    state: "CA",
    country: "USA",
    tour_date: "2026-12-12",
    venue_name: "The Wiltern",
    venue_address: "3790 Wilshire Blvd, Los Angeles, CA 90010",
    max_capacity: 40,
    current_registrations_count: 0,
    is_active: true,
    notes: "Wilshire VIP entrance next to Box Office.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "e5f6a7b8-c9d0-4e9f-2a3b-3c4d5e6f7a8b",
    name: "Detroit",
    state: "MI",
    country: "USA",
    tour_date: "2026-12-19",
    venue_name: "Fox Theatre Detroit",
    venue_address: "2211 Woodward Ave, Detroit, MI 48201",
    max_capacity: 35,
    current_registrations_count: 0,
    is_active: true,
    notes: "Main Plaza VIP Entrance.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "f6a7b8c9-d0e1-4f0a-3b4c-4d5e6f7a8b9c",
    name: "Miami",
    state: "FL",
    country: "USA",
    tour_date: "2027-01-09",
    venue_name: "The Fillmore Miami Beach",
    venue_address: "1700 Washington Ave, Miami Beach, FL 33139",
    max_capacity: 30,
    current_registrations_count: 0,
    is_active: true,
    notes: "Fillmore VIP Gate entrance.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
];

// Dynamic fallback store for offline/unconfigured runtime
const fallbackCities: City[] = [...DEFAULT_ACTIVE_CITIES];

export function getFallbackCities(): City[] {
  return fallbackCities;
}

export function addFallbackCity(city: City): void {
  const idx = fallbackCities.findIndex((c) => c.id === city.id);
  if (idx >= 0) {
    fallbackCities[idx] = city;
  } else {
    fallbackCities.push(city);
  }
}

export function updateFallbackCity(
  id: string,
  updates: Partial<Omit<City, "id" | "created_at">>
): City | null {
  const idx = fallbackCities.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  fallbackCities[idx] = {
    ...fallbackCities[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return fallbackCities[idx];
}

export function resetFallbackCities(): void {
  fallbackCities.length = 0;
  fallbackCities.push(...DEFAULT_ACTIVE_CITIES);
}

/**
 * Sanitizes city records for public consumption, preserving capacity and registration counts
 * so fans can select active tour stops.
 */
export function sanitizePublicCity(city: City): City {
  return {
    id: city.id,
    name: city.name,
    state: city.state,
    country: city.country,
    tour_date: city.tour_date,
    venue_name: city.venue_name,
    venue_address: city.venue_address,
    is_active: city.is_active,
    created_at: city.created_at,
    updated_at: city.updated_at,
    // Sensitive operational fields stripped for public consumers
    notes: null,
    max_capacity: 0,
    current_registrations_count: 0,
  };
}

/**
 * Fetches all active public tour cities from Supabase.
 * Falls back to default tour schedule if Supabase is offline or unconfigured.
 */
export async function getActiveCities(): Promise<GetCitiesResult> {
  const client = supabaseAdmin || supabase;

  if (!isSupabaseConfigured || !client) {
    return {
      cities: fallbackCities
        .filter((c) => c.is_active)
        .sort((a, b) => new Date(a.tour_date).getTime() - new Date(b.tour_date).getTime())
        .map(sanitizePublicCity),
      error: null,
      isLive: false,
    };
  }

  try {
    const { data, error } = await client
      .from("cities")
      .select("*")
      .eq("is_active", true)
      .order("tour_date", { ascending: true });

    if (error) {
      console.error("Error fetching cities from Supabase:", error.message);
      return {
        cities: fallbackCities
          .filter((c) => c.is_active)
          .sort((a, b) => new Date(a.tour_date).getTime() - new Date(b.tour_date).getTime())
          .map(sanitizePublicCity),
        error: error.message,
        isLive: false,
      };
    }

    const publicCities = ((data as City[]) || []).map(sanitizePublicCity);
    return {
      cities: publicCities,
      error: null,
      isLive: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load cities";
    console.error("Exception fetching cities:", errorMsg);
    return {
      cities: fallbackCities
        .filter((c) => c.is_active)
        .sort((a, b) => new Date(a.tour_date).getTime() - new Date(b.tour_date).getTime())
        .map(sanitizePublicCity),
      error: errorMsg,
      isLive: false,
    };
  }
}

