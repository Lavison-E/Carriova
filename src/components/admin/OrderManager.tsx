"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import type { ActionState } from "@/lib/actions";
import { addRequestMessage, publishRequestDelivery, removeDraftDelivery, updateServiceRequest, uploadRequestFile } from "@/lib/workspace-actions";
import { staffRequestTransitions, WORKSPACE_FILE_ACCEPT, WORKSPACE_MAX_FILE_BYTES, WORKSPACE_MAX_FILES, workspaceStatusLabel, type WorkspaceMessage, type WorkspaceRequestDetail, type WorkspaceStatus } from "@/lib/workspace";

type ManagedRequest = Pick<WorkspaceRequestDetail, "id" | "version" | "status" | "quotedAmount" | "dueAt"> & {
  briefCount: number;
  deliveryCount: number;
  unpublishedCount: number;
  publishableCount: number;
};
type OrderMutation = {
  busy: boolean;
  start: () => void;
  finish: () => void;
  committed: (version: number, result: ActionState, status?: WorkspaceStatus) => void;
};
const OrderMutationContext = createContext<OrderMutation | null>(null);
function useOrderMutation() {
  const context = useContext(OrderMutationContext);
  if (!context) throw new Error("Order actions must be inside OrderManager.");
  return context;
}

const initialState: ActionState = { ok: false, message: "" };
const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-night focus:border-night";
const submitClass = "inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-orange px-5 py-3 text-left text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-not-allowed disabled:opacity-60";

function Feedback({ state }: { state: ActionState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.message) ref.current?.focus(); }, [state]);
  return state.message ? <div ref={ref} tabIndex={-1} role={state.ok ? "status" : "alert"} className={`scroll-mt-6 rounded-lg border p-4 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div> : null;
}
function FieldError({ state, name, prefix = "order" }: { state: ActionState; name: string; prefix?: string }) {
  return state.fieldErrors?.[name] ? <span id={`${prefix}-${name}-error`} className="mt-2 block text-xs font-normal leading-5 text-orange">{state.fieldErrors[name]}</span> : null;
}
function draftFrom(request: ManagedRequest) {
  return { version: request.version, status: request.status, amount: request.quotedAmount?.toString() ?? "", due: request.dueAt?.slice(0, 16) ?? "", note: "" };
}

export function OrderManager({ request, children }: { request: ManagedRequest; children: ReactNode }) {
  const [draft, setDraft] = useState(() => draftFrom(request));
  const [mutating, setMutating] = useState(false);
  const [notice, setNotice] = useState(initialState);
  const start = () => { setMutating(true); setNotice(initialState); };
  const finish = () => setMutating(false);
  const committed: OrderMutation["committed"] = (version, result, status) => {
    // Advance only the known baseline; a genuinely external update remains a conflict.
    setDraft((current) => current.version === version ? { ...current, version: version + 1, status: status ?? current.status } : current);
    setNotice(result);
  };
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    start();
    try {
      const result = await updateServiceRequest(previous, data);
      if (result.ok) setDraft((current) => ({ ...current, version: Number(data.get("version")) + 1, note: "" }));
      return result;
    } finally { finish(); }
  }, initialState);
  const busy = mutating || pending;
  const closed = request.status === "completed" || request.status === "cancelled";
  const priceEditable = ["received", "reviewing", "quoted"].includes(request.status);
  const stale = draft.version !== request.version && !busy;
  const availableStatuses = Array.from(new Set([draft.status, request.status, ...staffRequestTransitions[request.status]]))
    .filter((status) => status !== "delivered" || request.status === "delivered");
  const stageHelp: Record<WorkspaceStatus, string> = {
    received: "Commencez par étudier le besoin et les documents du client.",
    reviewing: "Précisez le montant et l’échéance, puis envoyez votre proposition au client.",
    quoted: "La proposition attend l’accord du client. Son acceptation fera passer la commande en cours.",
    in_progress: "Utilisez le bloc de livraison en haut du dossier pour joindre et publier le produit final.",
    delivered: "Le client peut valider la livraison ou demander des ajustements depuis son espace.",
    revision_requested: "Consultez les ajustements demandés et ajoutez une nouvelle version du produit avant de livrer à nouveau.",
    completed: "Le client a validé la livraison. La conversation reste accessible pour les échanges de suivi.",
    cancelled: "Cette commande est annulée. La conversation et les documents existants restent consultables.",
  };

  return <OrderMutationContext.Provider value={{ busy, start, finish, committed }}>
    <div className="mt-8 space-y-7">
      <Feedback state={notice} />
      <OrderDelivery request={request} />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-7">{children}</div>
        <div className="min-w-0 space-y-7">
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
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <label className="block text-xs font-semibold">Étape de traitement<select name="status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as WorkspaceStatus }))} aria-invalid={state.fieldErrors?.status ? true : undefined} aria-describedby={state.fieldErrors?.status ? "order-status-error" : undefined} className={inputClass}>{availableStatuses.map((status) => <option key={status} value={status}>{workspaceStatusLabel(status)}</option>)}</select><FieldError state={state} name="status" /></label>
          <label className="block text-xs font-semibold">Montant proposé <span className="font-normal text-muted">(FCFA / XOF)</span><input name="quoteAmountXOF" type="number" inputMode="numeric" min={0} max={2147483647} step={1} value={draft.amount} readOnly={!priceEditable} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} aria-invalid={state.fieldErrors?.quoteAmountXOF ? true : undefined} aria-describedby={state.fieldErrors?.quoteAmountXOF ? "order-quoteAmountXOF-error" : "order-price-help"} className={`${inputClass} read-only:bg-paper read-only:text-muted`} /><span id="order-price-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">{priceEditable ? "Indiquez 0 pour une prestation offerte. L’envoi d’une proposition ne déclenche aucun paiement." : "Ce montant a été accepté par le client et reste inchangé."}</span><FieldError state={state} name="quoteAmountXOF" /></label>
          <label className="block text-xs font-semibold">Échéance proposée <span className="font-normal text-muted">(UTC / Abidjan)</span><input type="datetime-local" value={draft.due} onChange={(event) => setDraft((current) => ({ ...current, due: event.target.value }))} aria-invalid={state.fieldErrors?.dueAt ? true : undefined} aria-describedby={state.fieldErrors?.dueAt ? "order-dueAt-error" : undefined} className={inputClass} /><FieldError state={state} name="dueAt" /></label>
          {draft.due ? <button type="button" onClick={() => setDraft((current) => ({ ...current, due: "" }))} className="min-h-8 text-xs text-muted underline underline-offset-4">Retirer l’échéance</button> : null}
          <label className="block text-xs font-semibold">Message au client <span className="font-normal text-muted">{draft.status === "cancelled" ? "(motif requis)" : "(facultatif)"}</span><textarea name="note" rows={4} maxLength={5000} minLength={draft.status === "cancelled" ? 3 : undefined} required={draft.status === "cancelled"} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} aria-invalid={state.fieldErrors?.note ? true : undefined} aria-describedby={state.fieldErrors?.note ? "order-note-error order-note-help" : "order-note-help"} placeholder="Expliquez votre proposition ou la prochaine étape…" className={`${inputClass} resize-y leading-6`} /><span id="order-note-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">Ce message apparaît dans la conversation du client.</span><FieldError state={state} name="note" /></label>
        </fieldset>
        <button type="submit" disabled={busy || stale} className={submitClass}>{pending ? "Enregistrement…" : draft.status === "quoted" && request.status !== "quoted" ? "Envoyer la proposition" : "Enregistrer les modifications"}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></button>
      </form>}
    </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-upload-title">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Pièces du dossier</p>
            <h2 id="order-upload-title" className="mt-3 text-xl font-semibold tracking-tight">Ajouter un document de travail</h2>
            <p className="mt-3 text-xs leading-6 text-muted">Pour les références et documents utiles au suivi. Ce document sera immédiatement accessible au client ; il ne constitue pas une livraison.</p>
            <div className="mt-5"><OrderFileUpload requestId={request.id} kind="brief" version={request.version} count={request.briefCount} closed={closed} /></div>
          </section>
        </div>
      </div>
    </div>
  </OrderMutationContext.Provider>;
}

function OrderDelivery({ request }: { request: ManagedRequest }) {
  const mutation = useOrderMutation();
  const [note, setNote] = useState("");
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    mutation.start();
    try {
      const result = await publishRequestDelivery(previous, data);
      if (result.ok) {
        setNote("");
        mutation.committed(Number(data.get("version")), result, "delivered");
      }
      return result;
    } finally { mutation.finish(); }
  }, initialState);
  const canDeliver = request.status === "in_progress" || request.status === "revision_requested";
  if (!canDeliver) return null;
  const canPublish = request.publishableCount > 0;
  const busy = mutation.busy || pending;

  return <section className="overflow-hidden rounded-xl border border-night/15 bg-white" aria-labelledby="order-delivery-title">
    <div className="bg-night px-5 py-6 text-white sm:px-7 sm:py-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffc7a1]">La livraison, en deux étapes</p><h2 id="order-delivery-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Livrer le produit au client</h2><p className="mt-3 text-sm leading-7 text-white/75">Joignez les fichiers terminés, vérifiez-les, puis publiez la livraison. Le client pourra les télécharger, les valider ou demander une retouche.</p></div>
        <a href="#order-deliverables" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-white/25 px-4 text-xs font-semibold hover:bg-white/10">Vérifier les fichiers préparés <span aria-hidden="true" className="ml-3">↓</span></a>
      </div>
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-5 text-xs"><div className="flex items-baseline gap-2"><dt className="text-white/70">En préparation</dt><dd className="text-lg font-semibold">{request.unpublishedCount}</dd></div><div className="flex items-baseline gap-2"><dt className="text-white/70">Déjà publiés</dt><dd className="text-lg font-semibold">{request.deliveryCount - request.unpublishedCount}</dd></div></dl>
    </div>
    <div className="grid lg:grid-cols-2">
      <div className="min-w-0 border-b border-line p-5 sm:p-7 lg:border-b-0 lg:border-r">
        <h3 className="flex items-center gap-3 text-base font-semibold"><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-sm">1</span>Joindre le produit</h3>
        <p className="mt-3 text-xs leading-6 text-muted">Ajoutez un fichier à la fois. Les produits restent visibles uniquement par l’équipe jusqu’à leur publication.</p>
        <div className="mt-5"><OrderFileUpload requestId={request.id} kind="delivery" version={request.version} count={request.deliveryCount} /></div>
      </div>
      <div className="min-w-0 p-5 sm:p-7">
        <h3 className="flex items-center gap-3 text-base font-semibold"><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-sm">2</span>Publier la livraison au client</h3>
        <p className="mt-3 text-xs leading-6 text-muted">La publication rend les produits préparés accessibles dans son espace. Une notification par e-mail est prévue ; son suivi est disponible dans Notifications.</p>
        <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-5 space-y-4">
          <input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="version" value={request.version} />
          {!state.ok ? <Feedback state={state} /> : null}
          <label className="block text-xs font-semibold">Note de livraison <span className="font-normal text-muted">(facultatif)</span><textarea name="note" rows={3} maxLength={5000} disabled={busy} value={note} onChange={(event) => setNote(event.target.value)} aria-invalid={state.fieldErrors?.note ? true : undefined} aria-describedby={state.fieldErrors?.note ? "delivery-note-help delivery-note-error" : "delivery-note-help"} placeholder="Présentez les fichiers ou indiquez comment les utiliser…" className={`${inputClass} resize-y leading-6`} /><span id="delivery-note-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">Cette note sera visible dans la conversation du client.</span><FieldError state={state} name="note" prefix="delivery" /></label>
          {!canPublish ? <p className="rounded-lg bg-paper px-4 py-3 text-xs leading-6 text-muted">{request.status === "revision_requested" ? "Ajoutez une nouvelle version du produit après la dernière demande de retouche pour pouvoir publier." : "Joignez d’abord au moins un produit à livrer."}</p> : <p className="text-xs leading-6 text-muted">{request.unpublishedCount} fichier{request.unpublishedCount > 1 ? "s" : ""} en préparation. Vérifiez leur contenu avant de publier.</p>}
          <button type="submit" disabled={busy || !canPublish} className={submitClass}>{pending ? "Publication en cours…" : "Publier la livraison au client"}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></button>
        </form>
      </div>
    </div>
  </section>;
}

function OrderFileUpload({ requestId, version, kind, count, closed = false }: { requestId: number; version: number; kind: "brief" | "delivery"; count: number; closed?: boolean }) {
  const mutation = useOrderMutation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    mutation.start();
    try {
      const result = await uploadRequestFile(previous, data);
      if (result.ok) {
        if (fileRef.current) fileRef.current.value = "";
        if (kind === "delivery") mutation.committed(Number(data.get("version")), result);
      }
      return result;
    } finally { mutation.finish(); }
  }, initialState);
  const full = count >= WORKSPACE_MAX_FILES;
  const prefix = `order-${kind}-file`;
  function checkFile(event: FormEvent<HTMLFormElement>) {
    const file = fileRef.current?.files?.[0];
    if (file && file.size > WORKSPACE_MAX_FILE_BYTES) {
      event.preventDefault();
      setLocalError("Ce fichier dépasse 3 Mo. Choisissez une version plus légère.");
      fileRef.current?.focus();
    } else setLocalError("");
  }
  return <div className="space-y-4">
    {kind === "brief" || !state.ok ? <Feedback state={state} /> : null}
    {closed || full ? <p className="rounded-lg bg-paper px-4 py-3 text-xs leading-6 text-muted">{closed ? "La commande est clôturée. Les documents déjà déposés restent disponibles." : kind === "delivery" ? "Les 12 emplacements de produits sont utilisés. Vous pouvez retirer un fichier en préparation pour en joindre un autre. Les produits déjà publiés restent conservés." : "La limite de 12 documents de travail est atteinte. Les emplacements des produits à livrer restent indépendants."}</p> : <form action={action} onSubmit={checkFile} onReset={(event) => event.preventDefault()} aria-busy={pending} className="space-y-4">
      <input type="hidden" name="context" value="team" /><input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="version" value={version} />
      <fieldset disabled={mutation.busy || pending} className="min-w-0 space-y-3">
        <label className="block text-xs font-semibold">{kind === "delivery" ? "Fichier du produit" : "Document de travail"}<input ref={fileRef} name="file" type="file" required accept={WORKSPACE_FILE_ACCEPT} onChange={() => setLocalError("")} aria-invalid={localError || state.fieldErrors?.file ? true : undefined} aria-describedby={`${prefix}-help ${prefix}-error`} className="mt-3 block w-full min-w-0 rounded-lg border border-line p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-3 file:text-xs file:font-semibold file:text-night" /></label>
        <p id={`${prefix}-help`} className="text-[11px] leading-6 text-muted">PDF, DOCX, JPG ou PNG · 3 Mo maximum par fichier.<br />{count} / {WORKSPACE_MAX_FILES} {kind === "delivery" ? "produits joints, préparés et publiés" : "documents de travail"}.</p>
        <p id={`${prefix}-error`} role={localError ? "alert" : undefined} className="text-xs leading-5 text-orange">{localError || state.fieldErrors?.file}</p>
      </fieldset>
      <button type="submit" disabled={mutation.busy || pending} className="inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-night px-5 py-3 text-left text-sm font-semibold text-white hover:bg-royal disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Dépôt en cours…" : kind === "delivery" ? "Joindre à la préparation" : "Ajouter au dossier"}<CareerIcon name="document" className="h-4 w-4 shrink-0" /></button>
    </form>}
  </div>;
}

export function DraftDeliveryRemoveButton({ requestId, fileId, version, filename }: { requestId: number; fileId: number; version: number; filename: string }) {
  const mutation = useOrderMutation();
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    mutation.start();
    try {
      const result = await removeDraftDelivery(previous, data);
      if (result.ok) mutation.committed(Number(data.get("version")), result);
      return result;
    } finally { mutation.finish(); }
  }, initialState);
  return <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-2 space-y-3">
    <input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="fileId" value={fileId} /><input type="hidden" name="version" value={version} />
    {!state.ok ? <Feedback state={state} /> : null}
    <button type="submit" disabled={mutation.busy || pending} aria-label={`Retirer ${filename} de la préparation`} className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium text-orange underline decoration-orange/40 underline-offset-4 hover:bg-[#fff0e5] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Retrait en cours…" : "Retirer de la préparation"}</button>
  </form>;
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
