import { NextResponse, after } from "next/server";
import { db } from "@/db";
import { analyticsEvents, leads } from "@/db/schema";
import { dispatchLeadEvent, type LeadPayload } from "@/lib/integrations";
import { clip, isEmail, rateLimit, sanitizePhone } from "@/lib/security";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["api", "contact", "resource"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? clip(value, max) : "";
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`api-lead:${ip}`, 8).ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const firstName = text(body.firstName, 80);
  const email = text(body.email, 255).toLowerCase();
  if (!firstName || !isEmail(email) || body.consentPrivacy !== true) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const requestedType = text(body.type, 40);
  const lead: LeadPayload = {
    type: ALLOWED_TYPES.has(requestedType) ? requestedType : "api",
    status: "lead",
    firstName,
    lastName: text(body.lastName, 80) || null,
    email,
    whatsapp: sanitizePhone(text(body.whatsapp, 40)) || null,
    objective: text(body.objective, 160) || null,
    interest: text(body.interest, 160) || null,
    message: text(body.message, 4000) || null,
    source: "api",
    landingPage: "/api/leads",
    consentPrivacy: true,
    consentMarketing: body.consentMarketing === true,
  };

  try {
    const [row] = await db.insert(leads).values(lead).returning({ id: leads.id });
    await db.insert(analyticsEvents).values({
      eventName: "lead_form_submit",
      path: "/api/leads",
    });
    // E-mails, WhatsApp et CRM après la réponse : n’échoue jamais la requête.
    after(() => dispatchLeadEvent({ name: "lead.created", leadId: row?.id ?? null, lead }));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
