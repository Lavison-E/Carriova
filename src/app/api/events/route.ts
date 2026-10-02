import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { ALLOWED_EVENTS, clip, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(`api-event:${ip}`, 60, 60 * 1000).ok) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = (await request.json()) as {
      eventName?: string;
      path?: string;
      metadata?: unknown;
    };
    const eventName = clip(body.eventName ?? "", 80);
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await db.insert(analyticsEvents).values({
      eventName,
      path: clip(body.path ?? "", 200) || null,
      metadata: body.metadata ? clip(JSON.stringify(body.metadata), 1000) : null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
