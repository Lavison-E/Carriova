"use client";
import { useActionState, useEffect, useId, useRef } from "react";
import { customerUpdateWhatsApp } from "@/lib/customer-actions";
import { whatsappCountryOptions, whatsAppCountryFor, type WhatsAppActionState } from "@/lib/whatsapp";

export function WhatsAppField({ initialValue = null, error }: { initialValue?: string | null; error?: string }) {
  const id = useId();
  return <div><label htmlFor={`${id}-number`} className="text-xs font-semibold text-night">Numéro WhatsApp <span aria-hidden="true" className="text-orange">*</span></label><div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"><div><label htmlFor={`${id}-country`} className="sr-only">Pays de l’indicatif WhatsApp</label><select id={`${id}-country`} name="whatsappCountry" defaultValue={whatsAppCountryFor(initialValue)} required className="h-12 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-xs text-night">{whatsappCountryOptions.map((country) => <option key={country.value} value={country.value}>{country.label} ({country.dialCode})</option>)}</select></div><input id={`${id}-number`} name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={40} defaultValue={initialValue ?? ""} placeholder="07 00 00 00 00" aria-invalid={error ? true : undefined} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} className="h-12 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-sm text-night focus:border-night" /></div><p id={`${id}-help`} className="mt-2 text-[11px] leading-6 text-muted">Choisissez l’indicatif du numéro, ou saisissez le numéro complet, par exemple +225 07 00 00 00 00. Il sert au suivi de votre compte ; il ne vous inscrit pas aux communications commerciales.</p>{error ? <p id={`${id}-error`} className="mt-2 text-xs leading-6 text-orange">{error}</p> : null}</div>;
}
const initial: WhatsAppActionState = { ok: false, message: "" };
export function CustomerWhatsAppForm({ whatsapp }: { whatsapp: string | null }) {
  const [state, action, pending] = useActionState(customerUpdateWhatsApp, initial);
  const feedback = useRef<HTMLDivElement>(null);
  const saved = state.ok && state.whatsapp ? state.whatsapp : whatsapp;
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  return <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="space-y-4"><input type="hidden" name="expectedWhatsApp" value={saved ?? ""} />{state.message ? <div ref={feedback} tabIndex={-1} role="status" className={`rounded-lg border p-4 text-xs leading-6 ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div> : null}<fieldset disabled={pending}><WhatsAppField key={saved ?? "empty"} initialValue={saved} error={state.fieldErrors?.whatsapp} /></fieldset><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-night px-4 py-3 text-xs font-semibold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer mon numéro"}</button></form>;
}
