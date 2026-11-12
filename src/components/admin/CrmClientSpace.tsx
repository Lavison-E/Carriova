"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { FileList, RequestStatusBadge, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import type { ActionState } from "@/lib/actions";
import type { CrmInvitationState, CrmLeadWorkspace } from "@/lib/crm";
import { createCrmLeadInvitation, linkCrmLeadToCustomer } from "@/lib/crm-workspace-actions";
import { addRequestMessage, uploadRequestFile } from "@/lib/workspace-actions";
import { WORKSPACE_FILE_ACCEPT, WORKSPACE_MAX_FILE_BYTES, WORKSPACE_MAX_FILES } from "@/lib/workspace";

type LinkedRequest = NonNullable<CrmLeadWorkspace["request"]>;
const initialState: ActionState = { ok: false, message: "" };
const initialInvitation: CrmInvitationState = { ok: false, message: "" };
const cardClass = "rounded-xl border border-line bg-white p-5 sm:p-7";

function Feedback({ state }: { state: { ok: boolean; message: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.message) ref.current?.focus(); }, [state]);
  if (!state.message) return null;
  return <div ref={ref} tabIndex={-1} role={state.ok ? "status" : "alert"} className={`scroll-mt-6 rounded-lg border p-4 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div>;
}

function CopyButton({ value, label, copiedLabel = "Copié" }: { value: string; label: string; copiedLabel?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
    catch { setCopied(false); window.prompt("Copiez ce texte :", value); }
  }
  return <button type="button" onClick={copy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-night px-4 text-xs font-semibold text-night hover:bg-paper"><span aria-live="polite">{copied ? `${copiedLabel} ✓` : label}</span></button>;
}

export function CrmClientSpace({ leadId, fullName, canContactWhatsApp, phone, workspace }: { leadId: number; fullName: string; canContactWhatsApp: boolean; phone: string | null; workspace: CrmLeadWorkspace }) {
  return workspace.request
    ? <LinkedClientSpace request={workspace.request} />
    : <ClientSpaceInvitation leadId={leadId} fullName={fullName} canContactWhatsApp={canContactWhatsApp} phone={phone} workspace={workspace} />;
}

/* ---------- Dossier rattaché : messages et documents ---------- */

function LinkedClientSpace({ request }: { request: LinkedRequest }) {
  const [tab, setTab] = useState<"messages" | "documents">("messages");
  const sharedDocuments = request.files.filter((file) => file.kind === "brief").length;
  const tabClass = (active: boolean) => `inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-semibold transition-colors ${active ? "bg-white text-night shadow-sm" : "text-muted hover:text-night"}`;
  return <section id="crm-client-space" className={`${cardClass} scroll-mt-6`} aria-labelledby="crm-space-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Espace client · Commande #{request.id}</p>
        <h2 id="crm-space-title" className="mt-3 text-xl font-semibold tracking-tight">Messages et documents</h2>
        <p className="mt-2 break-words text-xs leading-6 text-muted">Échanges avec <span className="font-semibold text-night">{request.customerName}</span> · <span className="break-all">{request.customerEmail}</span>. Tout ce que vous envoyez ici apparaît dans son espace client.</p>
      </div>
      <RequestStatusBadge status={request.status} />
    </div>
    <div role="tablist" aria-label="Échanges avec le client" className="mt-6 inline-flex flex-wrap gap-1 rounded-lg bg-paper p-1">
      <button type="button" role="tab" id="crm-tab-messages" aria-controls="crm-panel-messages" aria-selected={tab === "messages"} onClick={() => setTab("messages")} className={tabClass(tab === "messages")}>Messages<span className="rounded bg-soft px-1.5 text-[10px]">{request.messages.length}</span></button>
      <button type="button" role="tab" id="crm-tab-documents" aria-controls="crm-panel-documents" aria-selected={tab === "documents"} onClick={() => setTab("documents")} className={tabClass(tab === "documents")}>Documents<span className="rounded bg-soft px-1.5 text-[10px]">{request.files.length}</span></button>
    </div>
    <div id="crm-panel-messages" role="tabpanel" aria-labelledby="crm-tab-messages" hidden={tab !== "messages"} className="mt-6"><Conversation request={request} /></div>
    <div id="crm-panel-documents" role="tabpanel" aria-labelledby="crm-tab-documents" hidden={tab !== "documents"} className="mt-6"><Documents request={request} count={sharedDocuments} /></div>
    <a href={`/admin/commandes/${request.id}`} className="mt-7 flex min-h-12 items-center justify-between gap-4 border-t border-line pt-5 text-xs font-semibold text-night hover:text-orange">Ouvrir la commande complète : proposition, réalisation et livraison<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></a>
  </section>;
}

function Conversation({ request }: { request: LinkedRequest }) {
  const firstName = request.customerName.split(/\s+/)[0] || request.customerName;
  const suggestions = [
    `Bonjour ${firstName}, merci pour votre demande. Pouvez-vous nous transmettre votre CV actuel dans l’onglet Documents de votre espace ?`,
    `Bonjour ${firstName}, nous avons bien reçu votre document. Nous revenons vers vous très vite avec une proposition.`,
    `Bonjour ${firstName}, pouvez-vous nous préciser l’offre ou le poste visé, avec son lien si possible ?`,
  ];
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const threadRef = useRef<HTMLOListElement>(null);
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await addRequestMessage(previous, data);
    if (result.ok) setBody("");
    return result;
  }, initialState);
  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }); }, [request.messages.length]);
  function shortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && body.trim() && !pending) { event.preventDefault(); formRef.current?.requestSubmit(); }
  }
  return <div>
    {request.messages.length ? <ol ref={threadRef} className="max-h-[30rem] space-y-4 overflow-y-auto rounded-lg border border-line bg-paper/60 p-3 sm:p-4" aria-label="Fil de la conversation">{request.messages.map((message) => {
      const staff = message.authorType === "staff";
      return <li key={message.id} className={`flex ${staff ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-xl px-4 py-3 ${staff ? "rounded-br-sm bg-night text-white" : "rounded-bl-sm border border-line bg-white text-night"}`}><p className={`flex flex-wrap items-baseline gap-x-2 text-[11px] font-semibold ${staff ? "text-white/80" : "text-night"}`}>{message.authorName}<span className={`font-normal ${staff ? "text-white/60" : "text-muted"}`}>{staff ? "Équipe" : "Client"} · <time dateTime={message.createdAt}>{formatWorkspaceDate(message.createdAt, true)}</time></span></p><p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p></div></li>;
    })}</ol> : <div className="rounded-lg border border-dashed border-line bg-paper px-5 py-6"><p className="text-sm font-semibold text-night">Aucun message pour le moment.</p><p className="mt-1 text-xs leading-6 text-muted">Écrivez le premier message : le client le retrouvera dans son espace et pourra vous répondre.</p></div>}
    <form ref={formRef} action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-5 space-y-3">
      <input type="hidden" name="context" value="team" /><input type="hidden" name="requestId" value={request.id} />
      <Feedback state={state} />
      {!body ? <div className="flex flex-wrap gap-2" aria-label="Réponses rapides">{suggestions.map((suggestion, index) => <button key={suggestion} type="button" onClick={() => setBody(suggestion)} className="min-h-9 rounded-full border border-line bg-white px-3 text-[11px] text-night hover:border-night">{["Demander le CV", "Accuser réception", "Préciser l’offre visée"][index]}</button>)}</div> : null}
      <label className="block text-xs font-semibold text-night"><span className="sr-only">Votre message au client</span><textarea name="body" required rows={4} maxLength={5000} disabled={pending} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={shortcut} aria-invalid={state.fieldErrors?.body ? true : undefined} aria-describedby="crm-message-help" placeholder={`Écrire à ${firstName}…`} className="w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm font-normal leading-7 text-night placeholder:text-muted/75 focus:border-night" /></label>
      <div className="flex flex-wrap items-center justify-between gap-3"><p id="crm-message-help" className="text-[11px] leading-5 text-muted">{state.fieldErrors?.body ?? "Visible par le client · Ctrl + Entrée pour envoyer"}</p><button type="submit" disabled={pending || !body.trim()} className="inline-flex min-h-12 items-center gap-6 rounded-lg bg-orange px-5 text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Envoi…" : "Envoyer au client"}<CareerIcon name="arrow" className="h-4 w-4" /></button></div>
    </form>
  </div>;
}

function Documents({ request, count }: { request: LinkedRequest; count: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState("");
  const [localError, setLocalError] = useState("");
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await uploadRequestFile(previous, data);
    if (result.ok) { if (fileRef.current) fileRef.current.value = ""; setChosen(""); }
    return result;
  }, initialState);
  const closed = request.status === "completed" || request.status === "cancelled";
  const full = count >= WORKSPACE_MAX_FILES;
  function check(event: FormEvent<HTMLFormElement>) {
    const file = fileRef.current?.files?.[0];
    if (file && file.size > WORKSPACE_MAX_FILE_BYTES) { event.preventDefault(); setLocalError("Ce fichier dépasse 3 Mo. Choisissez une version plus légère."); }
    else setLocalError("");
  }
  return <div className="space-y-6">
    {closed || full ? <p className="rounded-lg bg-paper px-4 py-3 text-xs leading-6 text-muted">{closed ? "La commande est clôturée : les documents existants restent disponibles." : "La limite de 12 documents partagés est atteinte pour cette commande."}</p> : <form action={action} onSubmit={check} onReset={(event) => event.preventDefault()} aria-busy={pending} className="space-y-3">
      <input type="hidden" name="context" value="team" /><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="kind" value="brief" />
      <Feedback state={state} />
      <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-5 py-7 text-center transition-colors ${chosen ? "border-night bg-paper" : "border-line hover:border-night hover:bg-paper"}`}>
        <CareerIcon name="document" className="h-6 w-6 text-night" />
        <span className="break-all text-sm font-semibold text-night">{chosen || "Choisir un document à envoyer"}</span>
        <span className="text-[11px] leading-5 text-muted">PDF, DOCX, JPG ou PNG · 3 Mo maximum · {count} / {WORKSPACE_MAX_FILES} documents partagés</span>
        <input ref={fileRef} name="file" type="file" required accept={WORKSPACE_FILE_ACCEPT} disabled={pending} onChange={(event) => { setLocalError(""); setChosen(event.target.files?.[0]?.name ?? ""); }} aria-invalid={localError || state.fieldErrors?.file ? true : undefined} aria-describedby="crm-file-error" className="sr-only" />
      </label>
      <p id="crm-file-error" role={localError ? "alert" : undefined} className="text-xs leading-5 text-orange">{localError || state.fieldErrors?.file}</p>
      <button type="submit" disabled={pending || !chosen} className="inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-night px-5 text-sm font-semibold text-white hover:bg-royal disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Envoi du document…" : "Partager avec le client"}<CareerIcon name="document" className="h-4 w-4 shrink-0" /></button>
      <p className="text-[11px] leading-5 text-muted">Le document est immédiatement visible dans l’espace du client. Pour une version à faire valider ou une livraison finale, passez par la commande complète.</p>
    </form>}
    <div><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Documents visibles par le client</h3><FileList files={[...request.files].reverse()} context="team" emptyText="Aucun document partagé pour le moment." /></div>
  </div>;
}

/* ---------- Aucun espace client : invitation ou rattachement ---------- */

function ClientSpaceInvitation({ leadId, fullName, canContactWhatsApp, phone, workspace }: { leadId: number; fullName: string; canContactWhatsApp: boolean; phone: string | null; workspace: CrmLeadWorkspace }) {
  const [invitation, invite, inviting] = useActionState(createCrmLeadInvitation, initialInvitation);
  const [link, linkAction, linking] = useActionState(linkCrmLeadToCustomer, initialState);
  const [confirming, setConfirming] = useState<number | null>(null);
  const url = invitation.ok ? invitation.invitationUrl : undefined;
  const expiry = invitation.expiresAt ?? workspace.invitation?.expiresAt;
  const busy = inviting || linking;

  return <section id="crm-client-space" className={`${cardClass} scroll-mt-6`} aria-labelledby="crm-space-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Espace client</p>
        <h2 id="crm-space-title" className="mt-3 text-xl font-semibold tracking-tight">Messages et documents</h2>
        <p className="mt-2 text-xs leading-6 text-muted">Les messages et les documents passent par l’espace client sécurisé. <span className="font-semibold text-night">{fullName}</span> n’en a pas encore : dès qu’il ou elle aura créé son compte, ce dossier y sera ajouté et vous pourrez échanger directement depuis cette fiche.</p>
      </div>
      <span className="rounded-md border border-line bg-paper px-2.5 py-1 text-[11px] font-medium text-muted">Pas encore d’espace</span>
    </div>
    <div className="mt-6 space-y-5"><Feedback state={link} /></div>

    {workspace.matchingAccounts.length ? <div className="mt-6 rounded-lg border border-[#c4d6c8] bg-[#f4f8f5] p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-night">Un compte client utilise déjà ce numéro WhatsApp</h3>
      <p className="mt-1 text-xs leading-6 text-muted">Vérifiez qu’il s’agit bien de la même personne, puis rattachez le dossier : la conversation s’ouvrira immédiatement.</p>
      <ul className="mt-4 space-y-3">{workspace.matchingAccounts.map((account) => <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3">
        <div className="min-w-0"><p className="break-words text-sm font-semibold text-night">{account.name}</p><p className="break-all text-xs text-muted">{account.email}</p></div>
        {confirming === account.id ? <form action={linkAction} className="flex flex-wrap items-center gap-2"><input type="hidden" name="leadId" value={leadId} /><input type="hidden" name="customerId" value={account.id} /><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center rounded-lg bg-[#285236] px-4 text-xs font-semibold text-white disabled:opacity-60">{linking ? "Rattachement…" : "Confirmer le rattachement"}</button><button type="button" disabled={linking} onClick={() => setConfirming(null)} className="min-h-10 px-2 text-xs text-muted underline underline-offset-4">Annuler</button></form>
          : <button type="button" disabled={busy} onClick={() => setConfirming(account.id)} className="inline-flex min-h-10 items-center rounded-lg border border-[#285236] px-4 text-xs font-semibold text-[#285236] hover:bg-[#edf4ee] disabled:opacity-60">Rattacher à ce compte</button>}
      </li>)}</ul>
    </div> : null}

    <ol className="mt-6 space-y-6">
      <li className="flex gap-4">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-xs font-semibold text-white">1</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-night">Envoyer un lien d’invitation personnel</h3>
          <p className="mt-1 text-xs leading-6 text-muted">Le lien permet de créer un compte ou de se connecter ; la demande est alors ajoutée à son espace. Valable 7 jours, utilisable une seule fois.</p>
          {!url && workspace.invitation ? <p className="mt-2 text-[11px] leading-5 text-muted">{workspace.invitation.active ? `Un lien est actif jusqu’au ${formatWorkspaceDate(workspace.invitation.expiresAt, true)}. En créer un nouveau désactive le précédent.` : `Le dernier lien a expiré le ${formatWorkspaceDate(workspace.invitation.expiresAt, true)}.`}</p> : null}
          {!invitation.ok ? <div className="mt-3"><Feedback state={invitation} /></div> : null}
          {url ? <InvitationShare key={url} url={url} expiry={expiry} fullName={fullName} canContactWhatsApp={canContactWhatsApp} phone={phone} /> : null}
          <form action={invite} className="mt-4"><input type="hidden" name="leadId" value={leadId} /><button type="submit" disabled={busy} className={url ? "min-h-10 text-xs font-medium text-muted underline underline-offset-4 hover:text-night disabled:opacity-60" : "inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-orange px-5 text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60 sm:w-auto"}>{inviting ? "Création du lien…" : url ? "Créer un autre lien" : workspace.invitation ? "Créer un nouveau lien d’invitation" : "Créer le lien d’invitation"}{url ? null : <CareerIcon name="arrow" className="h-4 w-4 shrink-0" />}</button></form>
        </div>
      </li>
      <li className="flex gap-4">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-semibold text-night">2</span>
        <div className="min-w-0"><h3 className="text-sm font-semibold text-night">Échanger depuis cette fiche</h3><p className="mt-1 text-xs leading-6 text-muted">Une fois le compte créé, la conversation et le partage de documents apparaissent ici, et la commande complète devient disponible dans « Commandes ».</p></div>
      </li>
    </ol>
  </section>;
}

function InvitationShare({ url, expiry, fullName, canContactWhatsApp, phone }: { url: string; expiry?: string; fullName: string; canContactWhatsApp: boolean; phone: string | null }) {
  const [message, setMessage] = useState(`Bonjour ${fullName}, merci pour votre demande auprès de CARRIOVA. Pour échanger avec notre équipe et recevoir vos documents, créez votre espace client (ou connectez-vous) avec ce lien personnel, valable 7 jours : ${url}`);
  const whatsappUrl = canContactWhatsApp && phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` : null;
  return <div className="mt-4 space-y-4 rounded-lg border border-night/15 bg-paper p-4">
    <p role="status" className="text-xs font-semibold leading-6 text-[#285236]">Lien créé{expiry ? ` · valable jusqu’au ${formatWorkspaceDate(expiry, true)}` : ""}. Il ne sera plus affiché après rechargement : copiez-le maintenant.</p>
    <div className="flex flex-col gap-2 sm:flex-row"><input readOnly value={url} onFocus={(event) => event.currentTarget.select()} aria-label="Lien d’invitation" className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-xs text-night" /><CopyButton value={url} label="Copier le lien" /></div>
    <label className="block text-xs font-semibold text-night">Message à transmettre<textarea rows={4} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-line bg-white px-3 py-3 text-sm font-normal leading-6 text-night focus:border-night" /></label>
    <div className="flex flex-wrap gap-2"><CopyButton value={message} label="Copier le message" />{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#285236] px-4 text-xs font-semibold text-white hover:bg-[#1f4029]">Envoyer par WhatsApp <span aria-hidden="true">↗</span><span className="sr-only">(nouvel onglet)</span></a> : null}</div>
    {!whatsappUrl ? <p className="text-[11px] leading-5 text-muted">Ce prospect n’a pas demandé d’échange individuel sur WhatsApp : transmettez le lien par un canal qu’il a accepté.</p> : null}
  </div>;
}
