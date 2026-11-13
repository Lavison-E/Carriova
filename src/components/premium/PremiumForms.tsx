"use client";

import { useActionState, useState } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import type { ActionState } from "@/lib/actions";
import { analyzePastedOffer, generateKitAction, generatePrepPlanAction, updateApplicationAction } from "@/lib/premium-actions";
import { applicationStatusOptions, type ApplicationStatus } from "@/lib/premium";

const initial: ActionState = { ok: false, message: "" };
const input = "w-full rounded-xl border border-night/12 bg-white px-4 py-3 text-sm text-night placeholder:text-muted/70 focus:border-night focus:outline-none";
function Notice({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={`rounded-xl px-4 py-3 text-xs leading-6 ${state.ok ? "bg-[#edf6f0] text-[#285236]" : "bg-[#fff4ea] text-orange"}`}>{state.message}</p>;
}

export function PasteOfferForm() {
  const [state, action, pending] = useActionState(analyzePastedOffer, initial);
  return <form action={action} className="space-y-4" aria-busy={pending}>
    <Notice state={state} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-xs font-semibold text-night">Intitulé du poste *<input name="title" required maxLength={200} placeholder="Ex. Assistant(e) comptable" className={`${input} mt-2`} />{state.fieldErrors?.title ? <span className="mt-1 block text-[11px] text-orange">{state.fieldErrors.title}</span> : null}</label>
      <label className="block text-xs font-semibold text-night">Entreprise<input name="company" maxLength={200} placeholder="Ex. Société X" className={`${input} mt-2`} /></label>
      <label className="block text-xs font-semibold text-night">Ville<input name="location" maxLength={160} placeholder="Ex. Abidjan, Plateau" className={`${input} mt-2`} /></label>
      <label className="block text-xs font-semibold text-night">Lien de l’annonce<input name="sourceUrl" type="url" maxLength={1000} placeholder="https://…" className={`${input} mt-2`} />{state.fieldErrors?.sourceUrl ? <span className="mt-1 block text-[11px] text-orange">{state.fieldErrors.sourceUrl}</span> : null}</label>
    </div>
    <label className="block text-xs font-semibold text-night">Texte complet de l’annonce *<textarea name="description" required rows={7} maxLength={12000} placeholder="Collez ici les missions, le profil recherché, les compétences et les conditions…" className={`${input} mt-2 resize-y leading-6`} />{state.fieldErrors?.description ? <span className="mt-1 block text-[11px] text-orange">{state.fieldErrors.description}</span> : null}</label>
    <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center gap-6 rounded-xl bg-orange px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(189,71,13,0.3)] transition hover:-translate-y-0.5 hover:bg-[#d4540f] disabled:cursor-wait disabled:opacity-60">{pending ? "Analyse en cours…" : "Analyser et préparer ma candidature"}<CareerIcon name="arrow" className="h-4 w-4" /></button>
  </form>;
}

export function KitGenerator({ applicationId, hasKit }: { applicationId: number; hasKit: boolean }) {
  const [state, action, pending] = useActionState(generateKitAction, initial);
  return <form action={action} className="space-y-3">
    <input type="hidden" name="applicationId" value={applicationId} />
    <Notice state={state} />
    <button type="submit" disabled={pending} className={hasKit ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-night/15 bg-white px-4 text-xs font-semibold text-night hover:border-night disabled:opacity-60" : "inline-flex min-h-14 w-full items-center justify-between gap-6 rounded-xl bg-night px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,18,82,0.25)] transition hover:-translate-y-0.5 hover:bg-royal disabled:cursor-wait disabled:opacity-70 sm:w-auto"}>
      {pending ? <span className="inline-flex items-center gap-3"><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Rédaction de votre dossier… (20 à 40 s)</span> : hasKit ? "Régénérer le dossier" : <>Générer mon dossier de candidature<CareerIcon name="spark" className="h-4 w-4" /></>}
    </button>
  </form>;
}

export function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copiez ce texte :", value); } }
  return <div className="rounded-2xl border border-night/[0.08] bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-night/[0.06] px-5 py-3"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</h3><button type="button" onClick={copy} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold text-night hover:bg-paper"><span aria-live="polite">{copied ? "Copié ✓" : "Copier"}</span></button></div>
    <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-7 text-night">{value}</p>
  </div>;
}

export function ApplicationTrackerForm({ applicationId, status, notes, followUpAt }: { applicationId: number; status: ApplicationStatus; notes: string; followUpAt: string | null }) {
  const [state, action, pending] = useActionState(updateApplicationAction, initial);
  return <form action={action} className="space-y-4">
    <input type="hidden" name="applicationId" value={applicationId} />
    <Notice state={state} />
    <fieldset className="space-y-2"><legend className="text-xs font-semibold text-night">Où en êtes-vous ?</legend>
      <div className="grid grid-cols-2 gap-2">{applicationStatusOptions.map((option) => <label key={option.value} className="relative"><input type="radio" name="status" value={option.value} defaultChecked={option.value === status} className="peer sr-only" /><span className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-night/10 bg-white px-2 text-center text-[11px] font-semibold text-[#4a5272] transition peer-checked:border-night peer-checked:bg-night peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-orange">{option.label}</span></label>)}</div>
    </fieldset>
    <label className="block text-xs font-semibold text-night">Date de relance<input type="date" name="followUpAt" defaultValue={followUpAt?.slice(0, 10) ?? ""} className={`${input} mt-2`} /></label>
    <label className="block text-xs font-semibold text-night">Notes personnelles<textarea name="notes" rows={4} maxLength={4000} defaultValue={notes} placeholder="Contact du recruteur, date d’entretien, impressions…" className={`${input} mt-2 resize-y leading-6`} /></label>
    <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-night px-5 text-sm font-semibold text-white hover:bg-royal disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer le suivi"}<CareerIcon name="check" className="h-4 w-4" /></button>
  </form>;
}

export function PrepPlanGenerator({ hasAiPlan }: { hasAiPlan: boolean }) {
  const [state, action, pending] = useActionState(generatePrepPlanAction, initial);
  return <form action={action} className="space-y-3">
    <Notice state={state} />
    <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-orange px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(189,71,13,0.3)] hover:bg-[#d4540f] disabled:cursor-wait disabled:opacity-60">
      {pending ? <><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Construction de votre plan…</> : <><CareerIcon name="spark" className="h-4 w-4" />{hasAiPlan ? "Actualiser mon plan personnalisé" : "Personnaliser mon plan avec l’IA"}</>}
    </button>
  </form>;
}
