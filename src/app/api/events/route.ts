import { NextResponse } from "next/server";
import { databaseConfigured, getDb } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { ALLOWED_EVENTS, clip, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`api-event:${ip}`, 60, 60 * 1000).ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.eventName !== "string" ||
    (body.path != null && typeof body.path !== "string")
  ) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const eventName = clip(body.eventName, 80);
  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const metadata = body.metadata == null ? null : JSON.stringify(body.metadata);
  if (metadata && metadata.length > 1000) {
    return NextResponse.json({ ok: false, error: "metadata_too_large" }, { status: 400 });
  }
  if (!databaseConfigured) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  try {
    await getDb().insert(analyticsEvents).values({
      eventName,
      path: clip(typeof body.path === "string" ? body.path : "", 200) || null,
      metadata,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
}
