import { NextRequest, NextResponse } from "next/server";
import { lookupFanCardStatus } from "@/lib/services/tracking-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code") || "";

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  const result = await lookupFanCardStatus(code, clientIp);

  if (!result.success) {
    if (result.code === "RATE_LIMITED") {
      return NextResponse.json(result, { status: 429 });
    }
    if (result.code === "INVALID_FORMAT") {
      return NextResponse.json(result, { status: 400 });
    }
    if (result.code === "NOT_FOUND") {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
