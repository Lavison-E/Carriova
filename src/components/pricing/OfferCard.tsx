import Link from "next/link";
import { customerAuthHref } from "@/lib/customer-navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { formatOfferPrice, offerRequestHref, type PublishedOffer } from "@/lib/commercial-offers";

export function OfferCard({ offer, compact = false }: { offer: PublishedOffer; compact?: boolean }) {
  const featured = offer.featured;
  const savings = offer.referenceAmount && offer.priceAmount !== null ? offer.referenceAmount - offer.priceAmount : 0;
  return (
    <article className={`relative flex min-w-0 flex-col rounded-2xl border p-5 sm:p-6 ${featured ? "border-night bg-night text-white shadow-lift lg:-translate-y-2" : "border-line bg-white text-night"}`}>
      <div className="mb-4 flex min-h-6 flex-wrap items-center justify-between gap-2">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${featured ? "text-[#f7bd92]" : "text-orange"}`}>{offer.kind === "pack" ? "Le pack" : "À la carte"}</p>
        {offer.badge ? <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${featured ? "bg-[#f7bd92] text-night" : "bg-paper text-night"}`}>{offer.badge}</span> : null}
      </div>
      <h3 className={`text-xl font-semibold leading-tight tracking-tight ${compact ? "" : "sm:min-h-12"}`}>{offer.name}</h3>
      <p className={`mt-3 text-xs leading-6 ${featured ? "text-white/75" : "text-muted"}`}>{offer.audience}</p>
      <div className="my-6">
        <p className={`font-semibold tracking-tight ${compact ? "text-2xl" : "text-[1.7rem]"}`}>{formatOfferPrice(offer)}</p>
        {savings > 0 ? <p className={`mt-2 text-[11px] leading-5 ${featured ? "text-white/75" : "text-muted"}`}><span className="line-through decoration-current/40">{offer.referenceAmount!.toLocaleString("fr-FR")} FCFA</span> à la carte<br /><span className={`font-semibold ${featured ? "text-[#f7bd92]" : "text-orange"}`}>{savings.toLocaleString("fr-FR")} FCFA économisés</span></p> : null}
      </div>
      <ul className={`mb-6 space-y-3 border-t pt-5 ${featured ? "border-white/20" : "border-line"}`}>
        {offer.benefits.map((benefit) => <li key={benefit} className={`flex items-start gap-2 text-xs leading-6 ${featured ? "text-white/85" : "text-muted"}`}><CareerIcon name="check" className={`mt-1 h-4 w-4 shrink-0 ${featured ? "text-[#f7bd92]" : "text-orange"}`} /><span>{benefit}</span></li>)}
      </ul>
      <div className="mt-auto">
        <p className={`mb-4 text-[11px] font-medium leading-5 ${featured ? "text-white/75" : "text-muted"}`}>Délai : {offer.delivery}</p>
        <Link href={offerRequestHref(offer)} aria-label={`Choisir ${offer.name} à ${formatOfferPrice(offer)}`} className={`flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 py-3 text-xs font-semibold transition-colors ${featured ? "bg-[#f7bd92] text-night hover:bg-white" : "bg-night text-white hover:bg-royal"}`}>Choisir cette offre <CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></Link>
        <Link href={customerAuthHref(offerRequestHref(offer, "workspace"))} aria-label={`Demander ${offer.name} depuis mon espace`} className={`mt-2 inline-flex min-h-10 items-center text-[11px] leading-5 underline underline-offset-4 ${featured ? "text-white/75 decoration-white/30 hover:text-white" : "text-muted decoration-line hover:text-night"}`}>Déjà inscrit ? Depuis mon espace</Link>
      </div>
    </article>
  );
}
