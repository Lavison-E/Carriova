"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { crmPriorityOptions, crmStatusOptions, type CrmLeadDetail } from "@/lib/crm";
import { updateCrmLead } from "@/lib/crm-actions";
import { normalizeQualificationPhone } from "@/lib/qualification";
import type { ActionState } from "@/lib/actions";

const initialState: ActionState = { ok: false, message: "" };
const inputClass = "mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 text-sm text-night focus:border-night";

function initialDraft(lead: CrmLeadDetail) {
  return { version: lead.version, status: lead.status, priority: lead.priority, followUp: lead.followUpAt?.slice(0, 16) ?? "", note: "" };
}

export function CrmLeadEditor({ lead }: { lead: CrmLeadDetail }) {
  const [state, action, pending] = useActionState(updateCrmLead, initialState);
  const [draft, setDraft] = useState(() => initialDraft(lead));
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Successful mutations revalidate the dossier; failures leave the draft untouched.
  if (draft.version !== lead.version) setDraft(initialDraft(lead));

  useEffect(() => {
    if (state.message) feedbackRef.current?.focus();
  }, [state]);

  const followUpIso = draft.followUp ? `${draft.followUp}:00.000Z` : "";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="crm-editor-title">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Actions de suivi</p>
        <h2 id="crm-editor-title" className="mt-3 text-xl font-semibold tracking-tight">Faire avancer ce dossier</h2>
        <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-6 space-y-5">
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="version" value={draft.version} />
          <input type="hidden" name="followUpAt" value={followUpIso} />
          {state.message ? <div ref={feedbackRef} tabIndex={-1} role="status" className={`scroll-mt-6 rounded-lg border p-4 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}><p>{state.message}</p>{!state.ok ? <p className="mt-2 text-muted">Votre note et vos choix sont conservés. <a href={`/admin/crm/${lead.id}`} className="font-medium text-night underline underline-offset-4">Recharger le dossier</a> réinitialisera les modifications non enregistrées.</p> : null}</div> : null}
          <fieldset disabled={pending} className="min-w-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="block text-xs font-semibold text-night">Statut<select name="status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as CrmLeadDetail["status"] }))} aria-invalid={state.fieldErrors?.status ? true : undefined} aria-describedby={state.fieldErrors?.status ? "crm-status-error" : undefined} className={inputClass}>{crmStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{state.fieldErrors?.status ? <span id="crm-status-error" className="mt-2 block text-xs font-normal text-orange">{state.fieldErrors.status}</span> : null}</label>
              <label className="block text-xs font-semibold text-night">Priorité<select name="priority" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as CrmLeadDetail["priority"] }))} aria-invalid={state.fieldErrors?.priority ? true : undefined} aria-describedby={state.fieldErrors?.priority ? "crm-priority-error" : undefined} className={inputClass}>{crmPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{state.fieldErrors?.priority ? <span id="crm-priority-error" className="mt-2 block text-xs font-normal text-orange">{state.fieldErrors.priority}</span> : null}</label>
            </div>
            <label className="block text-xs font-semibold text-night">Prochaine relance <span className="font-normal text-muted">(UTC / Abidjan)</span><input type="datetime-local" value={draft.followUp} onChange={(event) => setDraft((current) => ({ ...current, followUp: event.target.value }))} aria-invalid={state.fieldErrors?.followUpAt ? true : undefined} aria-describedby={state.fieldErrors?.followUpAt ? "crm-followup-error" : "crm-followup-help"} className={`${inputClass} min-w-0`} /><span id="crm-followup-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">Horaire UTC, identique à l’heure d’Abidjan. Cette date sert au suivi interne.</span>{state.fieldErrors?.followUpAt ? <span id="crm-followup-error" className="mt-2 block text-xs font-normal text-orange">{state.fieldErrors.followUpAt}</span> : null}</label>
            {draft.followUp ? <button type="button" onClick={() => setDraft((current) => ({ ...current, followUp: "" }))} className="min-h-8 text-xs text-muted underline underline-offset-4 hover:text-night">Retirer la relance</button> : null}
            <label className="block text-xs font-semibold text-night">Ajouter une note interne <span className="font-normal text-muted">(facultatif)</span><textarea name="note" rows={5} maxLength={4000} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} aria-invalid={state.fieldErrors?.note ? true : undefined} aria-describedby={state.fieldErrors?.note ? "crm-note-error" : "crm-note-help"} placeholder="Contexte de l’échange, décision, prochaine étape…" className="mt-2 w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm font-normal leading-6 text-night placeholder:text-muted/75 focus:border-night" /><span id="crm-note-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">La note sera ajoutée à l’historique et visible par l’équipe.</span>{state.fieldErrors?.note ? <span id="crm-note-error" className="mt-2 block text-xs font-normal text-orange">{state.fieldErrors.note}</span> : null}</label>
          </fieldset>
          <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-orange px-5 py-3 text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer le suivi"}<CareerIcon name="arrow" className="h-4 w-4" /></button>
        </form>
      </section>
      <WhatsAppComposer lead={lead} />
    </div>
  );
}

function WhatsAppComposer({ lead }: { lead: CrmLeadDetail }) {
  const [message, setMessage] = useState(`Bonjour ${lead.fullName}, merci pour votre demande auprès de CARRIOVA. Je vous propose d’échanger sur votre besoin. Quel moment vous conviendrait ?`);
  const phone = normalizeQualificationPhone(lead.whatsapp ?? "");
  const canContact = lead.canContactWhatsApp && Boolean(phone);
  const url = canContact && phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` : null;

  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="crm-whatsapp-title">
      <h2 id="crm-whatsapp-title" className="text-lg font-semibold tracking-tight">Préparer un échange WhatsApp</h2>
      {url ? <><p className="mt-3 text-xs leading-6 text-muted">Ce prospect a demandé un échange individuel sur WhatsApp.</p><label className="mt-5 block text-xs font-semibold text-night">Message à vérifier<textarea rows={5} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-line px-3 py-3 text-sm font-normal leading-6 text-night focus:border-night" /></label><a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-12 items-center justify-between gap-4 rounded-lg border border-night px-4 py-3 text-sm font-semibold text-night hover:bg-paper">Ouvrir WhatsApp <span aria-hidden="true">↗</span><span className="sr-only">(nouvel onglet)</span></a><p className="mt-3 text-[11px] leading-6 text-muted">Vérifiez le destinataire et le texte dans WhatsApp avant d’envoyer. L’envoi reste manuel.</p></> : <p className="mt-3 text-xs leading-6 text-muted">Contact WhatsApp désactivé : l’accord pour un échange individuel ou un numéro valide n’est pas disponible pour ce dossier.</p>}
    </section>
  );
}
