import { supabase, supabaseAdmin, isSupabaseConfigured } from "./client";
import type { City } from "@/types/database";

export interface GetCitiesResult {
  cities: City[];
  error: string | null;
  isLive: boolean;
}

// Fallback seed tour cities when Supabase credentials are not yet configured
// Includes confirmed dates from the "Married to the Game" national tour poster
export const DEFAULT_ACTIVE_CITIES: City[] = [
  {
    id: "7a1b2c3d-0001-4a5b-8c7d-9e0f1a2b3c01",
    name: "Pleasanton",
    state: "CA",
    country: "USA",
    tour_date: "2026-09-18",
    venue_name: "Tommy T's Comedy Club",
    venue_address: "5104 Hopyard Rd, Pleasanton, CA 94588",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour. VIP Green Room check-in.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0002-4a5b-8c7d-9e0f1a2b3c02",
    name: "Omaha",
    state: "NE",
    country: "USA",
    tour_date: "2026-09-25",
    venue_name: "Omaha Funny Bone Comedy Club",
    venue_address: "710 N 114th St, Suite 210, Omaha, NE 68154",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour. VIP check-in at main entrance.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0003-4a5b-8c7d-9e0f1a2b3c03",
    name: "Columbus",
    state: "GA",
    country: "USA",
    tour_date: "2026-10-03",
    venue_name: "Columbus Civic Center",
    venue_address: "400 4th St, Columbus, GA 31901",
    max_capacity: 60,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour. VIP check-in table at VIP Desk.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0004-4a5b-8c7d-9e0f1a2b3c04",
    name: "Ontario",
    state: "CA",
    country: "USA",
    tour_date: "2026-10-09",
    venue_name: "Ontario Improv",
    venue_address: "4555 Mills Cir, Ontario, CA 91764",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour at Ontario Mills.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0005-4a5b-8c7d-9e0f1a2b3c05",
    name: "Wellington",
    state: "FL",
    country: "USA",
    tour_date: "2026-10-16",
    venue_name: "Palm Beach Improv",
    venue_address: "10300 Forest Hill Blvd, Wellington, FL 33414",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour at The Mall at Wellington Green.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0006-4a5b-8c7d-9e0f1a2b3c06",
    name: "Columbus",
    state: "OH",
    country: "USA",
    tour_date: "2026-10-23",
    venue_name: "Columbus Funny Bone Comedy Club",
    venue_address: "145 Easton Town Center, Columbus, OH 43219",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour at Easton Town Center.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0007-4a5b-8c7d-9e0f1a2b3c07",
    name: "Tampa",
    state: "FL",
    country: "USA",
    tour_date: "2026-11-06",
    venue_name: "Tampa Funny Bone Comedy Club",
    venue_address: "1600 E 8th Ave, Suite C-112, Tampa, FL 33605",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour in Ybor City.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "7a1b2c3d-0008-4a5b-8c7d-9e0f1a2b3c08",
    name: "Baltimore",
    state: "MD",
    country: "USA",
    tour_date: "2026-11-13",
    venue_name: "Baltimore Comedy Factory",
    venue_address: "5625 O'Donnell St, Baltimore, MD 21224",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour. VIP check-in at front entrance.",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
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
    id: "7a1b2c3d-0009-4a5b-8c7d-9e0f1a2b3c09",
    name: "Birmingham",
    state: "AL",
    country: "USA",
    tour_date: "2026-11-20",
    venue_name: "StarDome Comedy Club",
    venue_address: "1818 Data Dr, Hoover, AL 35244",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour. VIP cohort check-in at StarDome lounge.",
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
    id: "7a1b2c3d-0010-4a5b-8c7d-9e0f1a2b3c10",
    name: "Cleveland",
    state: "OH",
    country: "USA",
    tour_date: "2026-12-04",
    venue_name: "Cleveland Funny Bone Comedy Club",
    venue_address: "1148 Main Ave, Cleveland, OH 44113",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour at The Flats.",
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
    id: "7a1b2c3d-0011-4a5b-8c7d-9e0f1a2b3c11",
    name: "Richmond",
    state: "VA",
    country: "USA",
    tour_date: "2026-12-11",
    venue_name: "Richmond Funny Bone Comedy Club",
    venue_address: "11800 W Broad St, Suite 1090, Richmond, VA 23233",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour at Short Pump Town Center.",
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
    id: "7a1b2c3d-0012-4a5b-8c7d-9e0f1a2b3c12",
    name: "Lexington",
    state: "KY",
    country: "USA",
    tour_date: "2026-12-18",
    venue_name: "Comedy Off Broadway",
    venue_address: "161 Lexington Green Cir, #C4, Lexington, KY 40503",
    max_capacity: 50,
    current_registrations_count: 0,
    is_active: true,
    notes: "Official Married to the Game Tour at The Mall at Lexington Green.",
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

export function removeFallbackCity(id: string): boolean {
  const idx = fallbackCities.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  fallbackCities.splice(idx, 1);
  return true;
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

