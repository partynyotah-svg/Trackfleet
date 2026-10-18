import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  
  // Look for a 'next' param to redirect user where they intended to go (defaulting to /dashboard)
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Fallback redirect if code is missing or token exchange failed
  return NextResponse.redirect(new URL("/auth/auth-error", url.origin));
}