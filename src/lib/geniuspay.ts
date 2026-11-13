import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type GeniusPayEnvironment = "sandbox" | "live";
export type GeniusPayConfig = { environment: GeniusPayEnvironment; apiKey: string; apiSecret: string; webhookSecret: string; siteUrl: string };
export class PaymentError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); this.name = "PaymentError"; }
}
export function getGeniusPayConfig(env: NodeJS.ProcessEnv = process.env): GeniusPayConfig | null {
  const environment = env.GENIUSPAY_ENVIRONMENT;
  if (env.VERCEL_ENV === "production" && environment === "sandbox") return null;
  const apiKey = env.GENIUSPAY_API_KEY?.trim(); const apiSecret = env.GENIUSPAY_API_SECRET?.trim();
  const webhookSecret = env.GENIUSPAY_WEBHOOK_SECRET?.trim();
  if ((environment !== "sandbox" && environment !== "live") || !apiKey || !apiSecret || !webhookSecret) return null;
  if (!apiKey.startsWith(`pk_${environment}_`) || !apiSecret.startsWith(`sk_${environment}_`) || !webhookSecret.startsWith("whsec_")) return null;
  try {
    const site = new URL(env.NEXT_PUBLIC_SITE_URL ?? "");
    if (site.username || site.password || site.search || site.hash || site.pathname !== "/") return null;
    if (site.protocol !== "https:" && !(environment === "sandbox" && site.protocol === "http:" && ["localhost", "127.0.0.1"].includes(site.hostname))) return null;
    return { environment, apiKey, apiSecret, webhookSecret, siteUrl: site.origin };
  } catch { return null; }
}
/** Why payments are disabled, for staff only. Never returns or logs a secret value. */
export function geniusPayConfigIssue(env: NodeJS.ProcessEnv = process.env): string | null {
  if (getGeniusPayConfig(env)) return null;
  const raw = env.GENIUSPAY_ENVIRONMENT;
  const environment = raw?.trim();
  if (!environment) return "GENIUSPAY_ENVIRONMENT est absente : indiquez « live » en production.";
  if (raw !== environment) return "GENIUSPAY_ENVIRONMENT contient des espaces ou un retour à la ligne : saisissez exactement « live ».";
  if (environment !== "sandbox" && environment !== "live") return "GENIUSPAY_ENVIRONMENT doit valoir exactement « live » ou « sandbox » (en minuscules).";
  if (env.VERCEL_ENV === "production" && environment === "sandbox") return "GENIUSPAY_ENVIRONMENT vaut « sandbox » sur la production : le paiement de test est volontairement bloqué. Passez-la à « live » avec les clés live.";
  const apiKey = env.GENIUSPAY_API_KEY?.trim(), apiSecret = env.GENIUSPAY_API_SECRET?.trim(), webhookSecret = env.GENIUSPAY_WEBHOOK_SECRET?.trim();
  if (!apiKey) return "GENIUSPAY_API_KEY est absente de cet environnement Vercel.";
  if (!apiSecret) return "GENIUSPAY_API_SECRET est absente de cet environnement Vercel.";
  if (!webhookSecret) return "GENIUSPAY_WEBHOOK_SECRET est absente de cet environnement Vercel.";
  if (!apiKey.startsWith(`pk_${environment}_`)) return `GENIUSPAY_API_KEY ne commence pas par « pk_${environment}_ » : vérifiez qu’il s’agit de la clé publique ${environment}.`;
  if (!apiSecret.startsWith(`sk_${environment}_`)) return `GENIUSPAY_API_SECRET ne commence pas par « sk_${environment}_ » : vérifiez qu’il s’agit de la clé secrète ${environment}.`;
  if (!webhookSecret.startsWith("whsec_")) return "GENIUSPAY_WEBHOOK_SECRET ne commence pas par « whsec_ » : copiez le secret de signature du webhook GeniusPay.";
  return "NEXT_PUBLIC_SITE_URL doit être exactement https://www.carriovaci.com (https, sans chemin, sans paramètre).";
}
export function requireGeniusPayConfig(): GeniusPayConfig {
  const config = getGeniusPayConfig();
  if (!config) throw new PaymentError(503, "PAYMENTS_DISABLED", "Le paiement en ligne n’est pas encore disponible. Contactez l’équipe depuis votre demande.");
  return config;
}
export type GeniusPayTransaction = {
  reference: string; amount: number; currency: string; status: string; environment: GeniusPayEnvironment;
  metadata: Record<string, unknown>; checkout_url?: string; expires_at?: string;
};
export function isProviderReference(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9_-]{3,100}$/.test(value); }
export function safeCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://geniuspay.ci" && !url.username && !url.password && url.pathname.startsWith("/checkout/") ? url.href : null;
  } catch { return null; }
}
export function parseGeniusPayTransaction(value: unknown): GeniusPayTransaction {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PaymentError(502, "PROVIDER_RESPONSE", "La réponse du service de paiement n’a pas pu être vérifiée.");
  const data = value as Record<string, unknown>;
  if (!isProviderReference(data.reference) || !Number.isSafeInteger(data.amount) || (data.amount as number) < 200 || typeof data.currency !== "string" ||
    !["pending", "processing", "completed", "failed", "expired", "cancelled", "refunded"].includes(String(data.status)) ||
    !["sandbox", "live"].includes(String(data.environment)) || !data.metadata || typeof data.metadata !== "object" || Array.isArray(data.metadata)) {
    throw new PaymentError(502, "PROVIDER_RESPONSE", "La réponse du service de paiement n’a pas pu être vérifiée.");
  }
  return data as GeniusPayTransaction;
}
async function providerRequest(config: GeniusPayConfig, path: string, body?: Record<string, unknown>): Promise<GeniusPayTransaction> {
  let response: Response;
  try {
    response = await fetch(`https://geniuspay.ci/api/v1/merchant/payments${path}`, {
      method: body ? "POST" : "GET", headers: { "X-API-Key": config.apiKey, "X-API-Secret": config.apiSecret, "Content-Type": "application/json", Accept: "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
  } catch { throw new PaymentError(503, "PROVIDER_UNAVAILABLE", "La confirmation du service de paiement est indisponible. Ne recommencez pas le paiement ; vérifiez son état dans quelques instants."); }
  if (!response.ok) throw new PaymentError(502, "PROVIDER_UNAVAILABLE", "Le service de paiement n’a pas confirmé l’opération. Contactez l’équipe si la situation persiste.");
  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object" || !("success" in payload) || payload.success !== true || !("data" in payload)) throw new PaymentError(502, "PROVIDER_RESPONSE", "La réponse du service de paiement n’a pas pu être vérifiée.");
  return parseGeniusPayTransaction(payload.data);
}
export async function createGeniusPayCheckout(config: GeniusPayConfig, input: { id: string; requestId: number; customerId: number; customerName: string; customerEmail: string; amount: number; quoteAmount: number; stage: string }): Promise<GeniusPayTransaction> {
  const returnUrl = `${config.siteUrl}/espace/demandes/${input.requestId}?payment=${encodeURIComponent(input.id)}`;
  return providerRequest(config, "", {
    amount: input.amount, currency: "XOF", description: `Carriova — demande ${input.requestId} — ${input.stage}`,
    customer: { name: input.customerName, email: input.customerEmail }, success_url: returnUrl, error_url: returnUrl,
    metadata: { payment_id: input.id, order_id: String(input.requestId), customer_id: String(input.customerId), quote_amount: String(input.quoteAmount), stage: input.stage },
  });
}
export function fetchGeniusPayTransaction(config: GeniusPayConfig, reference: string): Promise<GeniusPayTransaction> {
  if (!isProviderReference(reference)) throw new PaymentError(400, "INVALID_REFERENCE", "Référence de paiement invalide.");
  return providerRequest(config, `/${encodeURIComponent(reference)}`);
}
export type GeniusPayWebhook = { id: string; event: string; environment: GeniusPayEnvironment; data: Record<string, unknown> };
export function verifyGeniusPayWebhook(raw: string, headers: Headers, config: GeniusPayConfig, now = Date.now()): GeniusPayWebhook {
  const timestamp = headers.get("x-webhook-timestamp") ?? "";
  const signature = headers.get("x-webhook-signature") ?? "";
  if (!/^\d{10,11}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 || !/^[a-f0-9]{64}$/i.test(signature)) throw new PaymentError(401, "INVALID_SIGNATURE", "Signature invalide.");
  const expected = createHmac("sha256", config.webhookSecret).update(`${timestamp}.${raw}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw new PaymentError(401, "INVALID_SIGNATURE", "Signature invalide.");
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { throw new PaymentError(400, "INVALID_WEBHOOK", "Notification invalide."); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new PaymentError(400, "INVALID_WEBHOOK", "Notification invalide.");
  const value = payload as Record<string, unknown>;
  if (typeof value.id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(value.id) || typeof value.event !== "string" || value.event !== headers.get("x-webhook-event") ||
    value.environment !== config.environment || headers.get("x-webhook-environment") !== config.environment || !value.data || typeof value.data !== "object" || Array.isArray(value.data)) {
    throw new PaymentError(400, "INVALID_WEBHOOK", "Notification invalide.");
  }
  return value as GeniusPayWebhook;
}
