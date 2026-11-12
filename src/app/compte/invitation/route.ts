import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { databaseConfigured, getDb } from "@/db";
import { customerLeadClaims } from "@/db/customer-schema";
import { CLAIM_COOKIE, customerTokenHash, getCustomerSession } from "@/lib/customer-auth";
import { claimPendingLead } from "@/lib/customer-claims";
import { scheduleWorkspaceNotifications } from "@/lib/workspace-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" };

function go(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), { status: 303, headers: noStore });
  return response;
}

/**
 * Invitation link sent by the team. Opening it never consumes the link by itself:
 * a signed-in client claims it immediately, anyone else keeps it in a cookie until signup or login.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(code) || !databaseConfigured) return go(request, "/compte/creer?invitation=invalide");
  try {
    const [claim] = await getDb().select({ leadId: customerLeadClaims.leadId }).from(customerLeadClaims)
      .where(and(eq(customerLeadClaims.tokenHash, customerTokenHash(code)), gt(customerLeadClaims.expiresAt, new Date()), isNull(customerLeadClaims.claimedAt))).limit(1);
    if (!claim) return go(request, "/compte/creer?invitation=invalide");
    const customer = await getCustomerSession();
    if (customer) {
      const requestId = await getDb().transaction((tx) => claimPendingLead(tx, code, customer));
      if (requestId) scheduleWorkspaceNotifications({ requestId });
      return go(request, requestId ? `/espace/demandes/${requestId}` : "/espace");
    }
    const response = go(request, "/compte/creer?invitation=1");
    response.cookies.set(CLAIM_COOKIE, code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
    return response;
  } catch {
    return go(request, "/compte/connexion?invitation=indisponible");
  }
}
