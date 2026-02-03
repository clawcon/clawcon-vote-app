import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import crypto from "crypto";

// Simple in-memory rate limiting (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // 3 requests per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  entry.count++;
  return false;
}

export async function GET() {
  return NextResponse.json({
    message: "POST your email to get a bot key",
    usage: 'curl -X POST https://www.claw-con.com/api/bot-key -H "Content-Type: application/json" -d \'{"email": "you@example.com"}\''
  });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || request.headers.get("x-real-ip") 
      || "unknown";
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const payload = await request.json();
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    // Check if key already exists - DO NOT return existing keys (security fix)
    const { data: existing } = await supabaseAdmin
      .from("bot_keys")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Don't reveal the existing key - tell user to contact support or use existing key
      return NextResponse.json({ 
        error: "A bot key already exists for this email. Check your records or contact support to reset it.",
        exists: true 
      }, { status: 409 });
    }

    const apiKey = crypto.randomBytes(24).toString("hex");

    const { error } = await supabaseAdmin.from("bot_keys").insert({
      email,
      api_key: apiKey
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return new key only on first creation - user must save it
    return NextResponse.json({ 
      api_key: apiKey,
      warning: "Save this key securely. It will NOT be shown again."
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("bot-key error:", message, err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
