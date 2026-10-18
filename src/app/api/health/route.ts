import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, app: "TrackFleet", timestamp: new Date().toISOString() });
}
