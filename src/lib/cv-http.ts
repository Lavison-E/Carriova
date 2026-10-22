import "server-only";
import { CustomerUnauthorizedError } from "@/lib/customer-auth";
import { CvValidationError } from "@/lib/cv";
import { CvStoreError } from "@/lib/cv-store";

export const privateCvHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", Vary: "Cookie" };
export function assertCvOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next may reconstruct an internal hostname behind its production server/proxy.
  // Host is the browser's requested authority; never trust x-forwarded-host here.
  const host = request.headers.get("host") ?? url.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "https" || forwardedProtocol === "http" ? `${forwardedProtocol}:` : url.protocol;
  let valid = false;
  try {
    const parsed = new URL(origin ?? "");
    valid = parsed.origin === origin && parsed.host === host && parsed.protocol === protocol;
  } catch { /* Missing, null, or malformed origins are not browser mutations. */ }
  if (!valid || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new CvStoreError(403, "INVALID_ORIGIN", "Cette demande doit provenir du site Carriova.");
  }
}
export function parseCvId(raw: string): number {
  if (!/^[1-9][0-9]{0,9}$/.test(raw) || Number(raw) > 2147483647) throw new CvStoreError(404, "NOT_FOUND", "Ce CV est introuvable.");
  return Number(raw);
}
export async function readCvJson(request: Request, maxBytes = 131072): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) throw new CvStoreError(415, "INVALID_CONTENT_TYPE", "Envoyez les données au format JSON.");
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > maxBytes) throw new CvStoreError(413, "REQUEST_TOO_LARGE", "Les données envoyées sont trop volumineuses.");
  if (!request.body) throw new CvStoreError(400, "INVALID_JSON", "Les données envoyées sont invalides.");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new CvStoreError(413, "REQUEST_TOO_LARGE", "Les données envoyées sont trop volumineuses."); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  try {
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new CvStoreError(400, "INVALID_JSON", "Les données envoyées sont invalides."); }
}
export function cvErrorResponse(error: unknown): Response {
  if (error instanceof CustomerUnauthorizedError) return Response.json({ error: "Connectez-vous pour accéder à vos CV.", code: "UNAUTHORIZED" }, { status: 401, headers: privateCvHeaders });
  if (error instanceof CvValidationError) return Response.json({ error: error.message, code: "VALIDATION_ERROR", fieldErrors: error.fieldErrors }, { status: 400, headers: privateCvHeaders });
  if (error instanceof CvStoreError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: privateCvHeaders });
  return Response.json({ error: "L’espace CV est momentanément indisponible. Réessayez plus tard.", code: "UNAVAILABLE" }, { status: 503, headers: privateCvHeaders });
}
