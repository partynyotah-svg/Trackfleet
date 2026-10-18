import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function normalizePhone(value: string) {
  const digits = value.replace(/[\s()-]/g, "");
  if (/^07\d{8}$/.test(digits)) return "+254" + digits.slice(1);
  if (/^01\d{8}$/.test(digits)) return "+254" + digits.slice(1);
  if (/^254[17]\d{8}$/.test(digits)) return "+" + digits;
  return digits;
}
async function sendSms(to: string, message: string) {
  const username = process.env.AT_USERNAME;
  const apiKey = process.env.AT_API_KEY;
  if (!username || !apiKey) return;
  const body = new URLSearchParams({ username, to, message });
  if (process.env.AT_SENDER_ID) body.set("from", process.env.AT_SENDER_ID);
  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { "apiKey": apiKey, "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Africa's Talking SMS send failed");
}
export async function GET() {
  return NextResponse.json({ service: "TrackFleet Africa's Talking SMS webhook", status: "ready" });
}
export async function POST(request: NextRequest) {
  const configuredToken = process.env.AT_WEBHOOK_TOKEN;
  const suppliedToken = request.nextUrl.searchParams.get("token") ?? "";
  if (!configuredToken || !safeEqual(suppliedToken, configuredToken)) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }
  const form = await request.formData().catch(() => null);
  const fromRaw = String(form?.get("from") ?? "");
  const text = String(form?.get("text") ?? "").trim();
  if (!fromRaw || !text) return NextResponse.json({ error: "Missing SMS fields" }, { status: 400 });

  // Only this server route uses the service-role key; never expose it in NEXT_PUBLIC variables.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Server is not configured" }, { status: 503 });
  const db = createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const sender = normalizePhone(fromRaw);
  const parts = text.split(/\s+/);
  if (parts.length !== 4 || parts[0].toUpperCase() !== "INIT") {
    await sendSms(sender, "TrackFleet: Invalid format. Use INIT TRACKER_CODE VEHICLE_PLATE ONE_TIME_CODE.");
    return NextResponse.json({ accepted: true });
  }
  const [, trackerCode, plateRaw, oneTimeCode] = parts;
  if (!/^[A-Z0-9_-]{3,40}$/i.test(trackerCode) || !/^[A-Z0-9 -]{3,20}$/i.test(plateRaw) || oneTimeCode.length < 8 || oneTimeCode.length > 128) {
    await sendSms(sender, "TrackFleet: Invalid tracker initialization details.");
    return NextResponse.json({ accepted: true });
  }
  const { data: vehicle, error } = await db.from("vehicles")
    .select("id,plate_number,tracker_code,tracker_phone,tracker_init_pin_hash,tracker_initialized_at")
    .eq("tracker_code", trackerCode).maybeSingle();
  if (error) return NextResponse.json({ error: "Tracker lookup failed" }, { status: 500 });
  const plate = plateRaw.replace(/\s+/g,"").toUpperCase();
  if (!vehicle || vehicle.plate_number.replace(/\s+/g,"").toUpperCase() !== plate ||
      !vehicle.tracker_phone || normalizePhone(vehicle.tracker_phone) !== sender ||
      !vehicle.tracker_init_pin_hash || !safeEqual(vehicle.tracker_init_pin_hash, hash(oneTimeCode)) ||
      vehicle.tracker_initialized_at) {
    await sendSms(sender, "TrackFleet: Initialization denied. Check tracker, vehicle, registered SIM, and unused code.");
    return NextResponse.json({ accepted: true });
  }
  const now = new Date().toISOString();
  const { error: updateError } = await db.from("vehicles").update({
    tracker_initialized_at: now,
    tracker_init_pin_hash: null,
    tracker_last_seen_at: now,
    tracker_status: "initialized",
    status: "active"
  }).eq("id", vehicle.id).is("tracker_initialized_at", null).eq("tracker_init_pin_hash", hash(oneTimeCode));
  if (updateError) return NextResponse.json({ error: "Tracker initialization failed" }, { status: 500 });
  await db.from("tracker_events").insert({ vehicle_id: vehicle.id, sender_phone: sender, event_type: "initialized", message: "Tracker initialized by authorized SMS command" });
  await sendSms(sender, `TrackFleet: ${trackerCode} initialized for ${vehicle.plate_number}.`);
  return NextResponse.json({ accepted: true });
}
