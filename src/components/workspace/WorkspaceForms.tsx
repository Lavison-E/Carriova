"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ActionState } from "@/lib/actions";
import { addRequestMessage, createServiceRequest, customerRequestAction, uploadRequestFile } from "@/lib/workspace-actions";
import { WORKSPACE_FILE_ACCEPT, WORKSPACE_MAX_FILE_BYTES, WORKSPACE_MAX_FILES, workspaceServiceOptions, type WorkspaceRequestSummary } from "@/lib/workspace";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { formatAmount } from "@/components/workspace/WorkspaceUi";

const initial: ActionState = { ok: false, message: "" };
const inputStyle = "mt-2 w-full rounded-lg border border-line bg-white px-3.5 py-3 text-sm leading-6 text-night focus:border-night";
const buttonStyle = "inline-flex min-h-12 items-center justify-between gap-6 rounded-lg bg-orange px-5 py-3 text-xs font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60";

function useSubmission(serverAction: (previous: ActionState, formData: FormData) => Promise<ActionState>) {
  const [state, action, pending] = useActionState(serverAction, initial);
  const [response, setResponse] = useState({ state, revision: 0 });
  const feedbackRef = useRef<HTMLDivElement>(null);
  if (response.state !== state) setResponse({ state, revision: response.revision + (state.ok ? 1 : 0) });
  useEffect(() => { if (state.message) feedbackRef.current?.focus(); }, [state]);
  return { state, action, pending, revision: response.revision, feedbackRef };
}

function Feedback({ submission }: { submission: ReturnType<typeof useSubmission> }) {
  const { state, feedbackRef } = submission;
  return state.message ? <div ref={feedbackRef} tabIndex={-1} role="status" className={`mb-5 scroll-mt-28 rounded-lg border p-4 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div> : null;
}

function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: (props: { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode }) {
  const id = useId();
  return <div><label htmlFor={id} className="text-xs font-semibold text-night">{label} <span aria-hidden="true" className="text-orange">*</span></label>{children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined })}{hint ? <p id={`${id}-hint`} className="mt-2 text-[11px] leading-6 text-muted">{hint}</p> : null}{error ? <p id={`${id}-error`} className="mt-2 text-xs leading-6 text-orange">{error}</p> : null}</div>;
}

export function NewRequestForm({ defaultService = "" }: { defaultService?: string }) {
  const submission = useSubmission(createServiceRequest);
  const { state, action, pending, revision } = submission;
  const router = useRouter();
  useEffect(() => { if (state.ok && state.requestId) router.push(`/espace/demandes/${state.requestId}`); }, [state, router]);
  return <div><Feedback submission={submission} />{state.ok && state.requestId ? <Link href={`/espace/demandes/${state.requestId}`} className={buttonStyle}>Ouvrir ma demande <CareerIcon name="arrow" className="h-4 w-4" /></Link> : <form key={revision} action={action} onReset={(event) => event.preventDefault()} aria-busy={pending}>
    <fieldset disabled={pending} className="min-w-0 space-y-6">
      <Field name="service" label="Comment pouvons-nous vous accompagner ?" error={state.fieldErrors?.service}>{(props) => <select {...props} required defaultValue={defaultService} className={inputStyle}><option value="" disabled>Choisir un accompagnement</option>{workspaceServiceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</Field>
      <Field name="title" label="Donnez un titre à votre demande" error={state.fieldErrors?.title} hint="Par exemple : adapter mon CV à un poste de responsable commercial.">{(props) => <input {...props} required minLength={3} maxLength={160} autoComplete="off" className={inputStyle} />}</Field>
      <Field name="brief" label="Parlez-nous de votre objectif" error={state.fieldErrors?.brief} hint="Votre situation, le poste visé, vos attentes et vos délais : ces éléments nous aideront à vous proposer un accompagnement adapté.">{(props) => <textarea {...props} required minLength={10} maxLength={10000} rows={7} className={`${inputStyle} resize-y`} />}</Field>
    </fieldset>
    <div className="mt-7 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xs text-[11px] leading-6 text-muted">Vous pourrez ajouter votre CV et vos documents juste après la création.</p><button type="submit" disabled={pending} className={`${buttonStyle} shrink-0`}>{pending ? "Envoi en cours…" : "Envoyer ma demande"}<CareerIcon name="arrow" className="h-4 w-4" /></button></div>
  </form>}</div>;
}

export function MessageForm({ requestId }: { requestId: number }) {
  const submission = useSubmission(addRequestMessage);
  const { state, action, pending, revision } = submission;
  return <div><Feedback submission={submission} /><form key={revision} action={action} onReset={(event) => event.preventDefault()} aria-busy={pending}>
    <input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="context" value="customer" />
    <fieldset disabled={pending} className="min-w-0"><Field name="body" label="Votre message à l’équipe" error={state.fieldErrors?.body}>{(props) => <textarea {...props} required minLength={1} maxLength={5000} rows={4} className={`${inputStyle} resize-y`} placeholder="Une précision, une question ou un retour sur votre demande…" />}</Field></fieldset>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xs text-[10px] leading-5 text-muted">Le message restera dans cette conversation, accessible à l’équipe CARRIOVA.</p><button type="submit" disabled={pending} className={buttonStyle}>{pending ? "Envoi en cours…" : "Envoyer le message"}<CareerIcon name="arrow" className="h-4 w-4" /></button></div>
  </form></div>;
}

export function UploadForm({ requestId, fileCount }: { requestId: number; fileCount: number }) {
  const submission = useSubmission(uploadRequestFile);
  const { state, action, pending, revision } = submission;
  if (fileCount >= WORKSPACE_MAX_FILES) return <p className="mt-5 rounded-lg bg-paper p-4 text-xs leading-6 text-muted">Cette demande a atteint sa limite de {WORKSPACE_MAX_FILES} documents de travail. Écrivez à l’équipe si vous devez transmettre un complément.</p>;
  return <div className="mt-6 border-t border-line pt-6"><Feedback submission={submission} /><form key={revision} action={action} onReset={(event) => event.preventDefault()} aria-busy={pending}>
    <input type="hidden" name="requestId" value={requestId} /><input type="hidden" name="context" value="customer" /><input type="hidden" name="kind" value="brief" />
    <fieldset disabled={pending} className="min-w-0"><Field name="file" label="Ajouter un document" error={state.fieldErrors?.file} hint="PDF, Word (.docx), JPG ou PNG · 3 Mo maximum par fichier. Les documents restent privés dans votre espace.">{(props) => <input {...props} type="file" required accept={WORKSPACE_FILE_ACCEPT} onChange={(event) => event.currentTarget.setCustomValidity((event.currentTarget.files?.[0]?.size ?? 0) > WORKSPACE_MAX_FILE_BYTES ? "Ce fichier dépasse 3 Mo. Choisissez un fichier plus léger." : "")} className="mt-3 block w-full min-w-0 rounded-lg border border-dashed border-line bg-paper p-3 text-[11px] leading-6 text-muted file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-night" />}</Field></fieldset>
    <button type="submit" disabled={pending} className="mt-4 inline-flex min-h-11 items-center gap-5 rounded-lg bg-night px-4 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60">{pending ? "Dépôt en cours…" : "Déposer le document"}<CareerIcon name="arrow" className="h-3.5 w-3.5" /></button>
  </form></div>;
}

export function CustomerDecisionForm({ request }: { request: WorkspaceRequestSummary }) {
  const submission = useSubmission(customerRequestAction);
  const { state, action, pending, revision } = submission;
  const [adjustments, setAdjustments] = useState(false);
  const quote = request.status === "quoted" && request.quotedAmount !== null;
  const delivered = request.status === "delivered";
  if (!quote && !delivered) return null;
  return <section className="rounded-xl border border-[#e2c7ae] bg-[#fff8f0] p-5 sm:p-7" aria-labelledby="decision-title"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">À vous de jouer</p><h2 id="decision-title" className="mt-3 text-xl font-semibold tracking-tight text-night">{quote ? "Votre proposition est prête." : "Votre livraison vous attend."}</h2><p className="mt-3 max-w-2xl text-xs leading-7 text-muted">{quote ? "Consultez les échanges avec l’équipe, puis confirmez si la proposition vous convient. Son acceptation permettra de démarrer votre accompagnement." : "Téléchargez les fichiers de votre produit ci-dessous. Vous pouvez valider la livraison ou préciser les ajustements souhaités à l’équipe."}</p>{quote ? <p className="mt-5 text-3xl font-semibold tracking-tight text-night">{formatAmount(request.quotedAmount)}<span className="ml-2 text-[10px] font-normal text-muted">{request.quotedAmount !== 0 ? "XOF" : ""}</span></p> : <a href="#livrables" className="mt-4 inline-flex min-h-10 items-center gap-3 text-xs font-semibold text-night underline underline-offset-4">Télécharger mon produit <CareerIcon name="arrow" className="h-3.5 w-3.5" /></a>}
    <div className="mt-5"><Feedback submission={submission} /><form key={revision} action={action} onReset={(event) => event.preventDefault()} aria-busy={pending}>
      <input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="version" value={request.version} /><input type="hidden" name="action" value={quote ? "accept_quote" : adjustments ? "request_revision" : "complete"} />
      {delivered && adjustments ? <fieldset disabled={pending} className="mb-5 min-w-0"><Field name="note" label="Quels ajustements souhaitez-vous ?" error={state.fieldErrors?.note}>{(props) => <textarea {...props} required minLength={3} maxLength={5000} rows={4} className={`${inputStyle} resize-y`} />}</Field></fieldset> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button type="submit" disabled={pending} className={buttonStyle}>{pending ? "Enregistrement…" : quote ? "Accepter la proposition" : adjustments ? "Envoyer ma demande de retouche" : "Valider la livraison"}<CareerIcon name={quote || adjustments ? "arrow" : "check"} className="h-4 w-4" /></button>{delivered ? <button type="button" disabled={pending} onClick={() => setAdjustments((value) => !value)} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-night/20 px-5 text-xs font-semibold text-night disabled:opacity-60">{adjustments ? "Revenir à la validation" : "Demander une retouche"}</button> : null}</div>
      {quote ? <p className="mt-4 text-[10px] leading-6 text-muted">Cette confirmation accepte le devis. Aucun paiement n’est effectué sur cette page.</p> : null}
    </form></div>
  </section>;
}
