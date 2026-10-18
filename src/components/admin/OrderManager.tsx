"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import type { ActionState } from "@/lib/actions";
import { addRequestMessage, updateServiceRequest, uploadRequestFile } from "@/lib/workspace-actions";
import { staffRequestTransitions, WORKSPACE_FILE_ACCEPT, WORKSPACE_MAX_FILE_BYTES, WORKSPACE_MAX_FILES, workspaceStatusLabel, type WorkspaceMessage, type WorkspaceRequestDetail, type WorkspaceStatus } from "@/lib/workspace";

type ManagedRequest = Pick<WorkspaceRequestDetail, "id" | "version" | "status" | "quotedAmount" | "dueAt"> & { fileCount: number };

const initialState: ActionState = { ok: false, message: "" };
const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-night focus:border-night";
const submitClass = "inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-orange px-5 py-3 text-left text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60";

function Feedback({ state }: { state: ActionState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.message) ref.current?.focus(); }, [state]);
  return state.message ? <div ref={ref} tabIndex={-1} role={state.ok ? "status" : "alert"} className={`scroll-mt-6 rounded-lg border p-4 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div> : null;
}
function FieldError({ state, name }: { state: ActionState; name: string }) {
  return state.fieldErrors?.[name] ? <span id={`order-${name}-error`} className="mt-2 block text-xs font-normal leading-5 text-orange">{state.fieldErrors[name]}</span> : null;
}
function draftFrom(request: ManagedRequest) {
  return { version: request.version, status: request.status, amount: request.quotedAmount?.toString() ?? "", due: request.dueAt?.slice(0, 16) ?? "", note: "" };
}

export function OrderManager({ request }: { request: ManagedRequest }) {
  const [draft, setDraft] = useState(() => draftFrom(request));
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await updateServiceRequest(previous, data);
    if (result.ok) setDraft((current) => ({ ...current, version: Number(data.get("version")) + 1, note: "" }));
    return result;
  }, initialState);
  const closed = request.status === "completed" || request.status === "cancelled";
  const priceEditable = ["received", "reviewing", "quoted"].includes(request.status);
  const stale = draft.version !== request.version && !pending;
  const availableStatuses = Array.from(new Set([draft.status, request.status, ...staffRequestTransitions[request.status]]));
  const stageHelp: Record<WorkspaceStatus, string> = {
    received: "Commencez par étudier le besoin et les documents du client.",
    reviewing: "Précisez le montant et l’échéance, puis envoyez votre proposition au client.",
    quoted: "La proposition attend l’accord du client. Son acceptation fera passer la commande en cours.",
    in_progress: "Préparez les documents ci-dessous, puis rendez la livraison disponible au client.",
    delivered: "Le client peut valider la livraison ou demander des ajustements depuis son espace.",
    revision_requested: "Consultez les ajustements demandés et ajoutez une nouvelle version des livrables avant de livrer à nouveau.",
    completed: "Le client a validé la livraison. La conversation reste accessible pour les échanges de suivi.",
    cancelled: "Cette commande est annulée. La conversation et les documents existants restent consultables.",
  };

  return <div className="space-y-6">
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-management-title">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Traitement de la commande</p>
      <h2 id="order-management-title" className="mt-3 text-xl font-semibold tracking-tight">La prochaine étape</h2>
      <p className="mt-3 text-xs leading-6 text-muted">{stageHelp[request.status]}</p>
      {closed ? <p className="mt-5 rounded-lg bg-paper px-4 py-3 text-sm font-medium text-night">{workspaceStatusLabel(request.status)}</p> : <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-6 space-y-5">
        <input type="hidden" name="requestId" value={request.id} />
        <input type="hidden" name="version" value={draft.version} />
        <input type="hidden" name="dueAt" value={draft.due ? `${draft.due}:00.000Z` : ""} />
        <Feedback state={state} />
        {stale ? <div role="alert" className="rounded-lg border border-orange/30 bg-[#fff7f0] p-4 text-xs leading-6 text-night">Une autre mise à jour a été enregistrée. Vos choix et votre message restent affichés. Copiez votre texte avant de <a href={`/admin/commandes/${request.id}`} className="font-semibold underline underline-offset-4">recharger la commande</a>.</div> : null}
        <fieldset disabled={pending} className="min-w-0 space-y-5">
          <label className="block text-xs font-semibold">Étape de traitement<select name="status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as WorkspaceStatus }))} aria-invalid={state.fieldErrors?.status ? true : undefined} aria-describedby={state.fieldErrors?.status ? "order-status-error" : undefined} className={inputClass}>{availableStatuses.map((status) => <option key={status} value={status}>{workspaceStatusLabel(status)}</option>)}</select><FieldError state={state} name="status" /></label>
          <label className="block text-xs font-semibold">Montant proposé <span className="font-normal text-muted">(FCFA / XOF)</span><input name="quoteAmountXOF" type="number" inputMode="numeric" min={0} max={2147483647} step={1} value={draft.amount} readOnly={!priceEditable} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} aria-invalid={state.fieldErrors?.quoteAmountXOF ? true : undefined} aria-describedby={state.fieldErrors?.quoteAmountXOF ? "order-quoteAmountXOF-error" : "order-price-help"} className={`${inputClass} read-only:bg-paper read-only:text-muted`} /><span id="order-price-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">{priceEditable ? "Indiquez 0 pour une prestation offerte. L’envoi d’une proposition ne déclenche aucun paiement." : "Ce montant a été accepté par le client et reste inchangé."}</span><FieldError state={state} name="quoteAmountXOF" /></label>
          <label className="block text-xs font-semibold">Échéance proposée <span className="font-normal text-muted">(UTC / Abidjan)</span><input type="datetime-local" value={draft.due} onChange={(event) => setDraft((current) => ({ ...current, due: event.target.value }))} aria-invalid={state.fieldErrors?.dueAt ? true : undefined} aria-describedby={state.fieldErrors?.dueAt ? "order-dueAt-error" : undefined} className={inputClass} /><FieldError state={state} name="dueAt" /></label>
          {draft.due ? <button type="button" onClick={() => setDraft((current) => ({ ...current, due: "" }))} className="min-h-8 text-xs text-muted underline underline-offset-4">Retirer l’échéance</button> : null}
          <label className="block text-xs font-semibold">Message au client <span className="font-normal text-muted">{draft.status === "cancelled" ? "(motif requis)" : "(facultatif)"}</span><textarea name="note" rows={4} maxLength={5000} minLength={draft.status === "cancelled" ? 3 : undefined} required={draft.status === "cancelled"} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} aria-invalid={state.fieldErrors?.note ? true : undefined} aria-describedby={state.fieldErrors?.note ? "order-note-error order-note-help" : "order-note-help"} placeholder="Expliquez votre proposition ou la prochaine étape…" className={`${inputClass} resize-y leading-6`} /><span id="order-note-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">Ce message apparaît dans la conversation du client.</span><FieldError state={state} name="note" /></label>
        </fieldset>
        <button type="submit" disabled={pending || stale} className={submitClass}>{pending ? "Enregistrement…" : draft.status === "quoted" && request.status !== "quoted" ? "Envoyer la proposition" : draft.status === "delivered" && request.status !== "delivered" ? "Publier la livraison" : "Enregistrer les modifications"}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></button>
      </form>}
    </section>
    <OrderUpload request={request} />
  </div>;
}

function OrderUpload({ request }: { request: ManagedRequest }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const canDeliver = ["in_progress", "revision_requested"].includes(request.status);
  const [kind, setKind] = useState<"brief" | "delivery">(canDeliver ? "delivery" : "brief");
  const effectiveKind = canDeliver ? kind : "brief";
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await uploadRequestFile(previous, data);
    if (result.ok && fileRef.current) fileRef.current.value = "";
    return result;
  }, initialState);
  const closed = request.status === "completed" || request.status === "cancelled";
  const full = request.fileCount >= WORKSPACE_MAX_FILES;
  function checkFile(event: FormEvent<HTMLFormElement>) {
    const file = fileRef.current?.files?.[0];
    if (file && file.size > WORKSPACE_MAX_FILE_BYTES) {
      event.preventDefault();
      setLocalError("Ce fichier dépasse 3 Mo. Choisissez une version plus légère.");
      fileRef.current?.focus();
    } else setLocalError("");
  }
  return <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-upload-title">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Documents privés</p><h2 id="order-upload-title" className="mt-3 text-xl font-semibold tracking-tight">Ajouter un document</h2>
    {closed || full ? <p className="mt-4 text-xs leading-6 text-muted">{closed ? "La commande est clôturée. Les documents déjà déposés restent disponibles dans le dossier." : "La limite de 12 fichiers de cette commande est atteinte."}</p> : <form action={action} onSubmit={checkFile} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-5 space-y-4">
      <input type="hidden" name="context" value="team" /><input type="hidden" name="requestId" value={request.id} />
      <Feedback state={state} />
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        <label className="block text-xs font-semibold">Destination<select name="kind" value={effectiveKind} onChange={(event) => setKind(event.target.value as "brief" | "delivery")} className={inputClass}><option value="brief">Document du dossier</option>{canDeliver ? <option value="delivery">Fichier de livraison à préparer</option> : null}</select></label>
        <p className="text-xs leading-6 text-muted">{effectiveKind === "delivery" ? "Ce fichier restera en préparation jusqu’au passage à « Livraison disponible ». Vérifiez son contenu avant publication." : "Ce document sera immédiatement accessible au client dans son dossier."}</p>
        <label className="block text-xs font-semibold">Fichier<input ref={fileRef} name="file" type="file" required accept={WORKSPACE_FILE_ACCEPT} onChange={() => setLocalError("")} aria-invalid={localError || state.fieldErrors?.file ? true : undefined} aria-describedby="order-file-help order-file-error" className="mt-3 block w-full min-w-0 rounded-lg border border-line p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-3 file:text-xs file:font-semibold file:text-night" /></label>
        <p id="order-file-help" className="text-[11px] leading-6 text-muted">PDF, DOCX, JPG ou PNG · 3 Mo maximum par fichier.<br />{request.fileCount} / {WORKSPACE_MAX_FILES} fichiers dans cette commande.</p>
        <p id="order-file-error" role={localError ? "alert" : undefined} className="text-xs leading-5 text-orange">{localError || state.fieldErrors?.file}</p>
      </fieldset>
      <button type="submit" disabled={pending} className={submitClass}>{pending ? "Dépôt en cours…" : effectiveKind === "delivery" ? "Préparer ce livrable" : "Ajouter au dossier"}<CareerIcon name="document" className="h-4 w-4 shrink-0" /></button>
    </form>}
  </section>;
}

export function OrderConversation({ requestId, messages }: { requestId: number; messages: WorkspaceMessage[] }) {
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await addRequestMessage(previous, data);
    if (result.ok) setBody("");
    return result;
  }, initialState);
  return <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-conversation-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="order-conversation-title" className="text-xl font-semibold tracking-tight">La conversation</h2><span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Visible par le client</span></div>
    {messages.length ? <ol className="mt-6 space-y-5">{messages.map((message) => <li key={message.id} className={`rounded-lg border px-4 py-4 sm:px-5 ${message.authorType === "staff" ? "border-night/10 bg-paper sm:ml-8" : "border-line bg-white sm:mr-8"}`}><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="break-words text-xs font-semibold text-night">{message.authorName}<span className="ml-2 font-normal text-muted">{message.authorType === "staff" ? "Équipe Carriova" : "Client"}</span></p><time dateTime={message.createdAt} className="text-[10px] text-muted">{formatWorkspaceDate(message.createdAt, true)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-night">{message.body}</p></li>)}</ol> : <p className="mt-4 text-sm leading-7 text-muted">Commencez l’échange pour préciser le besoin ou partager une information avec le client.</p>}
    <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-7 space-y-4 border-t border-line pt-6">
      <input type="hidden" name="context" value="team" /><input type="hidden" name="requestId" value={requestId} />
      <Feedback state={state} />
      <label className="block text-xs font-semibold">Votre réponse<textarea name="body" required rows={4} maxLength={5000} disabled={pending} value={body} onChange={(event) => setBody(event.target.value)} aria-invalid={state.fieldErrors?.body ? true : undefined} aria-describedby={state.fieldErrors?.body ? "order-body-error" : undefined} placeholder="Écrivez un message au client…" className={`${inputClass} resize-y leading-7`} /><FieldError state={state} name="body" /></label>
      <button type="submit" disabled={pending || !body.trim()} className="inline-flex min-h-12 items-center gap-6 rounded-lg bg-night px-5 py-3 text-sm font-semibold text-white hover:bg-royal disabled:cursor-wait disabled:opacity-60">{pending ? "Envoi…" : "Envoyer le message"}<CareerIcon name="arrow" className="h-4 w-4" /></button>
    </form>
  </section>;
}
