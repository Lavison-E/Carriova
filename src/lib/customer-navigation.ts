import { getPublishedOffer, publishedOffers } from "@/lib/commercial-offers";

/** Only the new-request screen can be resumed; never trust an arbitrary return URL. */
export function normalizeCustomerReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 512 || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return null;
  let url: URL;
  try { url = new URL(value, "https://carriova.invalid"); } catch { return null; }
  if (url.origin !== "https://carriova.invalid" || url.pathname !== "/espace/nouvelle-demande" || url.hash) return null;
  if ([...url.searchParams.keys()].some((key) => key !== "service" && key !== "offer")) return null;
  if (url.searchParams.getAll("service").length > 1 || url.searchParams.getAll("offer").length > 1) return null;
  const slug = url.searchParams.get("offer");
  const service = url.searchParams.get("service");
  const offer = slug === null ? undefined : getPublishedOffer(slug);
  if (slug !== null && !offer) return null;
  if (service !== null && !publishedOffers.some((item) => item.need === service)) return null;
  if (offer && service !== null && offer.need !== service) return null;
  const params = new URLSearchParams();
  if (offer) { params.set("service", offer.need); params.set("offer", offer.slug); }
  else if (service) params.set("service", service);
  return `/espace/nouvelle-demande${params.size ? `?${params.toString()}` : ""}`;
}

export function customerAuthHref(returnTo: unknown, mode: "login" | "signup" = "login"): string {
  const destination = normalizeCustomerReturnTo(returnTo);
  const base = mode === "signup" ? "/compte/creer" : "/compte/connexion";
  return destination ? `${base}?${new URLSearchParams({ returnTo: destination }).toString()}` : base;
}
