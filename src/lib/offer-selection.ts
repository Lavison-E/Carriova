import { getPublishedOffer, type PublishedOffer } from "@/lib/commercial-offers";

// Stored at submission time, so a future catalogue edit cannot rewrite a customer's choice.
export type OfferSnapshot = Pick<PublishedOffer, "slug" | "name" | "kind" | "need" | "priceAmount" | "priceMode" | "delivery" | "benefits"> & {
  currency: "XOF";
  catalogueVersion: "2026-11-02";
};

export function selectOffer(value: unknown, need: string): { snapshot: OfferSnapshot | null; error?: string } {
  if (value === null || value === undefined || value === "") return { snapshot: null };
  if (typeof value !== "string") return { snapshot: null, error: "Choisissez une offre valide." };
  const offer = getPublishedOffer(value);
  if (!offer) return { snapshot: null, error: "Cette offre n’est pas disponible. Choisissez une offre du catalogue ou une demande personnalisée." };
  if (offer.need !== need) return { snapshot: null, error: "L’offre sélectionnée ne correspond pas à cet accompagnement. Modifiez votre choix." };
  return { snapshot: {
    slug: offer.slug, name: offer.name, kind: offer.kind, need: offer.need,
    priceAmount: offer.priceAmount, priceMode: offer.priceMode, currency: "XOF",
    delivery: offer.delivery, benefits: [...offer.benefits], catalogueVersion: "2026-11-02",
  } };
}
