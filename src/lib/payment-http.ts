import "server-only";
import { CustomerUnauthorizedError } from "@/lib/customer-auth";
import { UnauthorizedError } from "@/lib/staff-auth";
import { PaymentError } from "@/lib/geniuspay";
export const privatePaymentHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", Vary: "Cookie" };
export function assertPaymentOrigin(request: Request): void {
  const origin = request.headers.get("origin"); const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const forwarded = request.headers.get("x-forwarded-proto");
  const protocol = forwarded === "https" || forwarded === "http" ? `${forwarded}:` : url.protocol;
  let valid = false;
  try { const parsed = new URL(origin ?? ""); valid = parsed.origin === origin && parsed.host === host && parsed.protocol === protocol; } catch { /* Reject malformed origins. */ }
  if (!valid || request.headers.get("sec-fetch-site") === "cross-site") throw new PaymentError(403, "INVALID_ORIGIN", "Cette demande doit provenir du site Carriova.");
}
export async function readPaymentBody(request: Request, maxBytes = 32768): Promise<string> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) throw new PaymentError(415, "INVALID_CONTENT_TYPE", "Le format JSON est requis.");
  if (Number(request.headers.get("content-length")) > maxBytes || !request.body) throw new PaymentError(413, "INVALID_BODY", "Requête invalide ou trop volumineuse.");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new PaymentError(413, "INVALID_BODY", "Requête trop volumineuse."); } chunks.push(next.value); }
  } finally { reader.releaseLock(); }
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)); }
  catch { throw new PaymentError(400, "INVALID_BODY", "Requête invalide."); }
}
export async function readPaymentJson(request: Request): Promise<Record<string, unknown>> {
  const raw = await readPaymentBody(request, 2048);
  try { const value: unknown = JSON.parse(raw); if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>; } catch { /* Invalid JSON. */ }
  throw new PaymentError(400, "INVALID_BODY", "Requête invalide.");
}
export function paymentErrorResponse(error: unknown): Response {
  if (error instanceof CustomerUnauthorizedError || error instanceof UnauthorizedError) return Response.json({ error: "Connectez-vous pour consulter vos paiements.", code: "UNAUTHORIZED" }, { status: 401, headers: privatePaymentHeaders });
  if (error instanceof PaymentError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: privatePaymentHeaders });
  return Response.json({ error: "Le suivi du paiement est momentanément indisponible. Réessayez dans quelques instants.", code: "UNAVAILABLE" }, { status: 503, headers: privatePaymentHeaders });
}
