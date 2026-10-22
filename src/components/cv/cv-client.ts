export class CvRequestError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}, public code = "") { super(message); }
}
export async function cvRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new CvRequestError(payload?.error || "Le service est temporairement indisponible. Vos modifications restent dans cet écran.", response.status, payload?.fieldErrors || {}, payload?.code || "");
  if (!payload) throw new CvRequestError("La réponse n’a pas pu être lue. Réessayez.", 502);
  return payload as T;
}
export function cvUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Abidjan" }).format(new Date(value));
}
