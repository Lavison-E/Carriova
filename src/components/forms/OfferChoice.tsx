"use client";

import { useId } from "react";
import { formatOfferPrice, getPublishedOffer, publishedOffers } from "@/lib/commercial-offers";

export function OfferChoice({ value, onChange, error, disabled = false }: { value: string; onChange: (slug: string) => void; error?: string; disabled?: boolean }) {
  const id = useId();
  const offer = getPublishedOffer(value);
  return <section className="mb-7 rounded-xl border border-line bg-paper p-4 sm:p-5" aria-label="Votre offre">
    <label htmlFor={id} className="text-xs font-semibold text-night">Votre offre Carriova</label>
    <select id={id} name="offer" value={value} disabled={disabled} onChange={event => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="mt-3 min-h-12 w-full rounded-lg border border-line bg-white px-3 py-3 text-sm text-night">
      <option value="">Demande personnalisée · être conseillé</option>
      {value && !offer ? <option value={value}>Offre indisponible · choisissez à nouveau</option> : null}
      {([['pack', 'Les packs'], ['service', 'À la carte'], ['organisation', 'Organisations']] as const).map(([kind, label]) => <optgroup key={kind} label={label}>{publishedOffers.filter(item => item.kind === kind).map(item => <option key={item.slug} value={item.slug}>{item.name} · {formatOfferPrice(item)}</option>)}</optgroup>)}
    </select>
    {offer ? <div className="mt-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-base font-semibold text-night">{offer.name}</h3><p className="text-sm font-semibold text-orange">{formatOfferPrice(offer)}</p></div><p className="mt-2 text-xs leading-6 text-muted">{offer.delivery}</p><ul className="mt-3 space-y-1 text-xs leading-6 text-night">{offer.benefits.map(benefit => <li key={benefit}>• {benefit}</li>)}</ul><p className="mt-3 text-[11px] leading-6 text-muted">Votre choix sera conservé dans votre demande. L’équipe confirmera la proposition et l’échéance dans votre espace.</p><button type="button" disabled={disabled} onClick={() => onChange("")} className="mt-2 min-h-9 text-xs font-medium text-night underline underline-offset-4">Retirer l’offre et être conseillé</button></div> : <p className="mt-3 text-xs leading-6 text-muted">Vous pouvez choisir une offre ou nous décrire librement votre besoin.</p>}
    {error ? <p id={`${id}-error`} className="mt-2 text-xs leading-6 text-orange">{error}</p> : null}
  </section>;
}
