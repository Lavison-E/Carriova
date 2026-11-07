"use client";

import Link from "next/link";
import { useState } from "react";
import { formatOfferPrice, offerRequestHref } from "@/lib/commercial-offers";
import { offerBudgets, offerSituations, recommendOffer, type OfferBudget, type OfferSituation } from "@/lib/offer-recommendations";

export function SolutionFinder() {
  const [situation, setSituation] = useState<OfferSituation | "">("");
  const [budget, setBudget] = useState<OfferBudget | "">("");
  const [showResult, setShowResult] = useState(false);
  const result = showResult ? recommendOffer(situation, budget) : null;
  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
    <form onSubmit={event => { event.preventDefault(); setShowResult(true); }} className="rounded-2xl border border-line bg-white p-5 sm:p-8">
      <fieldset><legend className="text-lg font-semibold text-night"><span className="mr-3 text-xs text-orange">01</span>Où en êtes-vous aujourd’hui ?</legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{offerSituations.map(item => <label key={item.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${situation === item.value ? "border-orange bg-orange/5" : "border-line hover:border-night/40"}`}>
          <input required type="radio" name="situation" value={item.value} checked={situation === item.value} onChange={() => { setSituation(item.value); setShowResult(false); }} className="mt-1 size-4 shrink-0 accent-orange" />
          <span><span className="block text-sm font-medium text-night">{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span></span>
        </label>)}</div>
      </fieldset>
      <fieldset className="mt-8 border-t border-line pt-7"><legend className="float-left mb-5 w-full text-lg font-semibold text-night"><span className="mr-3 text-xs text-orange">02</span>Quel budget envisagez-vous ?</legend>
        <div className="clear-both grid gap-3 sm:grid-cols-2">{offerBudgets.map(item => <label key={item.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${budget === item.value ? "border-orange bg-orange/5 text-night" : "border-line text-night hover:border-night/40"}`}><input required type="radio" name="budget" value={item.value} checked={budget === item.value} onChange={() => { setBudget(item.value); setShowResult(false); }} className="size-4 shrink-0 accent-orange" />{item.label}</label>)}</div>
      </fieldset>
      <button type="submit" className="mt-7 flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-orange px-5 py-3 text-sm font-semibold text-white hover:bg-orange-dark">Découvrir ma recommandation<span aria-hidden="true">→</span></button>
      <p className="mt-4 text-xs leading-6 text-muted">Une orientation gratuite. Vous pourrez modifier votre choix avant d’envoyer votre demande.</p>
    </form>
    <div aria-live="polite" aria-atomic="true" className="lg:sticky lg:top-28">
      {result ? <section className="rounded-2xl bg-night p-6 text-white sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#edab84]">{result.withinBudget ? "Notre recommandation" : "La première option pour ce besoin"}</p>
        <h2 className="mt-4 font-editorial text-4xl italic">{result.offer.name}</h2>
        <p className="mt-4 text-2xl font-semibold">{formatOfferPrice(result.offer)}</p>
        <p className="mt-4 text-sm leading-7 text-white/80">{result.reason}</p>
        {!result.withinBudget ? <p className="mt-4 rounded-lg border border-white/25 p-3 text-sm leading-6">Cette prestation dépasse le budget indiqué. Vous pouvez demander conseil sans vous engager ou consulter nos ressources gratuites.</p> : null}
        <ul className="mt-5 space-y-2 text-sm leading-6 text-white/80">{result.offer.benefits.map(item => <li key={item} className="flex gap-2"><span aria-hidden="true" className="text-[#edab84]">✓</span>{item}</li>)}</ul>
        <p className="mt-5 border-t border-white/20 pt-4 text-xs leading-6 text-white/70">Délai : {result.offer.delivery}. Le démarrage est confirmé avec l’équipe.</p>
        <Link href={offerRequestHref(result.offer)} className="mt-5 flex min-h-12 items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-night">Choisir cette offre<span aria-hidden="true">→</span></Link>
        {result.alternative ? <Link href={offerRequestHref(result.alternative)} className="mt-4 block py-2 text-xs leading-6 text-white/80 underline underline-offset-4">Autre option : {result.alternative.name} · {formatOfferPrice(result.alternative)}</Link> : null}
      </section> : <section className="rounded-2xl bg-night p-7 text-white sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#edab84]">Deux questions, un point de départ</p><h2 className="mt-5 font-editorial text-4xl italic leading-tight">La bonne solution<br />pour votre prochain pas.</h2><p className="mt-5 text-sm leading-7 text-white/75">Dites-nous où vous en êtes et le budget envisagé. Nous vous proposons une offre avec son contenu, son prix et son délai.</p><p className="mt-6 border-t border-white/20 pt-5 text-xs leading-6 text-white/70">Vous échangez ensuite avec l’équipe et retrouvez votre proposition dans votre espace.</p></section>}
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 pt-5 text-xs leading-6 text-night"><Link href="/qualification?direct=1" className="py-2 underline underline-offset-4">Décrire mon besoin directement</Link><Link href="/tarifs" className="py-2 underline underline-offset-4">Comparer toutes les offres</Link>{result && !result.withinBudget ? <Link href="/ressources" className="py-2 underline underline-offset-4">Ressources gratuites</Link> : null}</div>
    </div>
  </div>;
}
