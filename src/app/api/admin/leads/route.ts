import { createHash, timingSafeEqual } from "node:crypto";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { serverEnv } from "@/lib/env";
import { rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const baseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

const COLUMNS = [
  "id",
  "createdAt",
  "type",
  "status",
  "firstName",
  "lastName",
  "email",
  "whatsapp",
  "objective",
  "interest",
  "source",
  "landingPage",
  "consentPrivacy",
  "consentMarketing",
  "message",
] as const;

function tokensMatch(provided: string, expected: string) {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Cellule CSV échappée et protégée contre l’injection de formules (Excel, Google Sheets). */
function csvCell(value: unknown) {
  let text = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Export CSV des leads pour l’équipe CARRIOVA.
 * Désactivé (404) tant que ADMIN_API_TOKEN n’est pas configuré.
 * Usage : curl -H "Authorization: Bearer $ADMIN_API_TOKEN" "https://…/api/admin/leads?limit=500" -o leads.csv
 */
export async function GET(request: Request) {
  const expected = serverEnv.adminApiToken;
  if (!expected) return new Response("Not found", { status: 404, headers: baseHeaders });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`admin-export:${ip}`, 30).ok) {
    return new Response("Too many requests", { status: 429, headers: baseHeaders });
  }

  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!provided || !tokensMatch(provided, expected)) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { ...baseHeaders, "WWW-Authenticate": 'Bearer realm="carriova-admin"' },
    });
  }

  const requested = Number.parseInt(new URL(request.url).searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 5000) : 1000;

  try {
    const rows = await getDb().select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
    const lines = [
      COLUMNS.join(","),
      ...rows.map((row) => COLUMNS.map((column) => csvCell(row[column])).join(",")),
    ];
    const date = new Date().toISOString().slice(0, 10);
    return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
      headers: {
        ...baseHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="carriova-leads-${date}.csv"`,
      },
    });
  } catch {
    return new Response("Export unavailable", { status: 500, headers: baseHeaders });
  }
}
