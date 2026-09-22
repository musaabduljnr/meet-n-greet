import { NextResponse } from "next/server";
import { getActiveCities } from "@/lib/supabase/cities";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const result = await getActiveCities();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { cities: [], error: "Failed to fetch cities", isLive: false },
      { status: 500 }
    );
  }
}
