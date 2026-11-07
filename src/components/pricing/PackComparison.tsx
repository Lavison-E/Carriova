import { formatOfferPrice, type PublishedOffer } from "@/lib/commercial-offers";

const inclusions: { label: string; values: Record<string, string> }[] = [
  { label: "CV professionnel", values: { "premier-pas": "Cleaning", "candidature-signature": "Signature", "visibilite-professionnelle": "Signature", "objectif-recrutement": "Signature", "cap-reconversion": "Signature repositionné", executive: "Executive" } },
  { label: "Lettre de motivation", values: { "candidature-signature": "Ciblée", "objectif-recrutement": "Ciblée", executive: "Premium" } },
  { label: "Profil LinkedIn", values: { "visibilite-professionnelle": "Complet", "cap-reconversion": "Essentiel", executive: "Complet" } },
  { label: "Préparation entretien", values: { "objectif-recrutement": "1 simulation + pitch et fiche entreprise", executive: "2 simulations" } },
  { label: "Échange carrière", values: { "visibilite-professionnelle": "Positionnement · 30 min", "cap-reconversion": "Bilan · 1 h 30 + suivi" } },
  { label: "Supports et suivi", values: { "premier-pas": "Fiche compétences, checklist et email", "candidature-signature": "Conseils de personnalisation", "objectif-recrutement": "Retour écrit personnalisé", "cap-reconversion": "Plan d’action 90 jours", executive: "WhatsApp · 30 jours" } },
];

export function PackComparison({ packs }: { packs: PublishedOffer[] }) {
  return <div className="mt-14">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><h3 className="text-2xl font-semibold tracking-tight text-night">Les packs, en un regard.</h3><p id="comparison-hint" className="text-xs text-muted">Sur mobile, faites défiler le tableau horizontalement.</p></div>
    <div role="region" aria-label="Comparaison des six packs" aria-describedby="comparison-hint" tabIndex={0} className="relative max-w-full overflow-x-auto rounded-xl border border-line overscroll-x-contain">
      <table className="w-full min-w-[1050px] border-collapse text-left text-xs leading-6">
        <caption className="sr-only">Prix, prestations et délais des six packs Carriova</caption>
        <thead><tr className="bg-paper"><th scope="col" className="sticky left-0 z-10 min-w-40 bg-paper p-5 font-semibold text-night">Votre accompagnement</th>{packs.map((offer) => <th key={offer.slug} scope="col" className={`min-w-36 p-5 align-top font-semibold ${offer.featured ? "bg-night text-white" : "text-night"}`}>{offer.name}<span className={`mt-2 block whitespace-nowrap text-[11px] ${offer.featured ? "text-[#f7bd92]" : "text-orange"}`}>{formatOfferPrice(offer)}</span></th>)}</tr></thead>
        <tbody>{inclusions.map((row) => <tr key={row.label} className="border-t border-line"><th scope="row" className="sticky left-0 z-10 bg-white p-5 font-medium text-night">{row.label}</th>{packs.map((offer) => <td key={offer.slug} className={`p-5 align-top ${offer.featured ? "bg-paper" : "bg-white"}`}>{row.values[offer.slug] ? <><span aria-hidden="true" className="mr-1.5 font-semibold text-orange">✓</span>{row.values[offer.slug]}</> : <><span aria-hidden="true" className="text-muted">—</span><span className="sr-only">Non inclus</span></>}</td>)}</tr>)}<tr className="border-t border-line"><th scope="row" className="sticky left-0 z-10 bg-white p-5 font-medium text-night">Délai annoncé</th>{packs.map((offer) => <td key={offer.slug} className={`p-5 align-top ${offer.featured ? "bg-paper" : "bg-white"}`}>{offer.delivery}</td>)}</tr></tbody>
      </table>
    </div>
  </div>;
}
