"use client";
import { useEffect, useState } from "react";
import type { PaymentState, PaymentSummary } from "@/lib/payment-policy";
const money = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
const labels: Record<PaymentState, string> = { creating: "Initialisation à confirmer", pending: "En attente", processing: "Vérification en cours", completed: "Confirmé", failed: "Échoué", expired: "Expiré", cancelled: "Annulé", refunded: "Remboursé", review_required: "Vérification par l’équipe" };
async function paymentResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Le paiement est momentanément indisponible.");
  return data;
}
export function PaymentPanel({ requestId, version = 0, context = "customer" }: { requestId: number; version?: number; context?: "customer" | "team" }) {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const endpoint = context === "team" ? "/admin/api/payments/geniuspay" : "/api/payments/geniuspay";
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let data: PaymentSummary = await paymentResponse(await fetch(`${endpoint}?requestId=${requestId}`, { cache: "no-store" }));
        const paymentId = new URL(window.location.href).searchParams.get("payment");
        if (context === "customer" && data.enabled && paymentId && /^[0-9a-f-]{36}$/i.test(paymentId)) {
          data = await paymentResponse(await fetch("/api/payments/geniuspay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, paymentId }) }));
        }
        if (active) { setSummary(data); setError(""); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Le suivi du paiement est indisponible."); }
    }
    void load(); return () => { active = false; };
  }, [requestId, version, context, endpoint]);
  async function refresh() {
    setBusy(true); setError("");
    try {
      const response = context === "customer" && summary?.enabled
        ? await fetch("/api/payments/geniuspay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) })
        : await fetch(`${endpoint}?requestId=${requestId}`, { cache: "no-store" });
      setSummary(await paymentResponse(response));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "La vérification a échoué."); } finally { setBusy(false); }
  }
  async function pay() {
    setBusy(true); setError("");
    try {
      const data = await paymentResponse(await fetch("/api/payments/geniuspay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) }));
      const destination = new URL(data.checkoutUrl);
      if (destination.origin !== "https://geniuspay.ci" || !destination.pathname.startsWith("/checkout/") || destination.username || destination.password) throw new Error("Le lien de paiement est invalide.");
      window.location.assign(destination.href);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Le paiement n’a pas pu être ouvert."); setBusy(false); }
  }
  const unconfirmedCheckout = summary?.payments.some(payment => ["creating", "pending", "processing"].includes(payment.status) && !payment.checkoutUrl);
  const reusableCheckout = summary?.payments.some(payment => payment.stage === summary.stage && ["pending", "processing"].includes(payment.status) && payment.checkoutUrl);
  const progress = summary?.quoteAmount ? Math.min(100, Math.round((summary.paidAmount / summary.quoteAmount) * 100)) : 0;
  const canPay = context === "customer" && summary?.enabled && summary.accepted && !summary.needsReview && !unconfirmedCheckout && summary.dueAmount >= 200;
  const done = summary?.enabled && summary.accepted && summary.quoteAmount !== null && summary.remainingAmount === 0;
  const message = !summary ? null
    : !summary.enabled ? "Le paiement en ligne est en cours de configuration. L’équipe vous indiquera les modalités de règlement dans la conversation."
    : !summary.accepted ? "Le règlement sera disponible après acceptation de la proposition."
    : summary.needsReview ? "L’équipe doit vérifier ces transactions avant tout nouveau règlement. Écrivez dans la conversation de cette demande."
    : unconfirmedCheckout ? "Une transaction a été initiée et sa confirmation est attendue. Actualisez son état dans quelques instants. Si l’attente persiste, contactez l’équipe dans la conversation avant tout autre règlement."
    : summary.awaitingDelivery ? "L’acompte est confirmé. Le solde sera disponible lorsque la réalisation sera finalisée pour la livraison."
    : summary.remainingAmount === 0 ? (summary.quoteAmount === 0 ? "Cette prestation est offerte." : summary.isTest ? "Simulation de règlement terminée." : "Le règlement est confirmé en totalité.")
    : `${summary.stage === "deposit" ? "Un acompte de 50 % est demandé au démarrage. Le solde est dû à la livraison." : summary.stage === "balance" ? "Votre réalisation est prête. Vous pouvez régler le solde de votre proposition." : "Le règlement intégral est demandé avant le démarrage de la prestation."} Les moyens disponibles sont présentés sur la page sécurisée GeniusPay.`;
  return <section id="paiement" aria-labelledby={`payment-heading-${requestId}`} aria-busy={busy} className="mb-6 overflow-hidden ws-card">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-night/[0.06] bg-[linear-gradient(135deg,#fffaf4,#fff)] px-5 py-5 sm:px-7">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-night text-gold shadow-[0_8px_20px_rgba(0,18,82,0.2)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm6 4v2" /></svg></span>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Paiement sécurisé</p><h2 id={`payment-heading-${requestId}`} className="mt-1 text-lg font-semibold tracking-tight text-night">{context === "team" ? "Encaissements de la demande" : "Votre règlement"}</h2></div>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-1.5 text-[10px] font-semibold text-night"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${summary?.enabled ? "bg-[#2f8a4f]" : "bg-[#b9bccb]"}`} />Via GeniusPay</span>
    </div>
    <div className="px-5 py-6 sm:px-7">
      {error ? <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-xs leading-6 text-red-800">{error}</p> : null}
      {!summary && !error ? <div role="status" className="space-y-3" aria-label="Chargement du suivi de paiement"><div className="h-4 w-40 animate-pulse rounded bg-paper" /><div className="h-10 w-64 animate-pulse rounded bg-paper" /><span className="sr-only">Chargement du suivi de paiement…</span></div> : null}
      {summary ? <>
        {summary.isTest ? <p className="mb-5 rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-900">Mode test Sandbox — ces transactions ne constituent pas un paiement réel.</p> : null}
        {summary.quoteAmount !== null ? <div className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{done ? "Montant réglé" : canPay ? "À régler maintenant" : "Reste à régler"}</p><p className="mt-1 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-night sm:text-[2.4rem]">{money(done ? summary.paidAmount : canPay ? summary.dueAmount : summary.remainingAmount)}</p></div>
            <dl className="flex gap-6 text-right"><div><dt className="text-[10px] uppercase tracking-wide text-muted">Proposition</dt><dd className="mt-1 text-sm font-semibold text-night">{money(summary.quoteAmount)}</dd></div><div><dt className="text-[10px] uppercase tracking-wide text-muted">{summary.isTest ? "Confirmé en test" : "Déjà réglé"}</dt><dd className="mt-1 text-sm font-semibold text-[#285236]">{money(summary.paidAmount)}</dd></div></dl>
          </div>
          <div className="mt-5" aria-hidden="true"><div className="h-2 overflow-hidden rounded-full bg-[#eeebe3]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#2f8a4f,#5cb07a)] transition-[width] duration-700" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-muted"><span>{progress} % réglé</span>{summary.quoteAmount > 25000 ? <span>Acompte 50 % · Solde à la livraison</span> : <span>Règlement en une fois</span>}</div></div>
        </div> : null}
        {message ? <p className={`rounded-xl px-4 py-3.5 text-xs leading-6 ${done ? "bg-[#edf6f0] font-medium text-[#285236]" : "bg-[#f8f6f1] text-[#4a5272]"}`}>{message}</p> : null}
        {summary.payments.length ? <div className="mt-6"><h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Historique des règlements</h3><ul className="mt-3 divide-y divide-night/[0.06] rounded-xl border border-night/[0.07]">{summary.payments.map(payment => <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs leading-6"><div className="min-w-0"><p className="font-semibold text-night">{payment.stage === "deposit" ? "Acompte" : payment.stage === "balance" ? "Solde" : "Règlement intégral"} · {money(payment.amount)}</p>{payment.reference ? <p className="break-all text-[10px] text-muted">{payment.reference}</p> : null}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${payment.status === "completed" ? "bg-[#edf6f0] text-[#285236]" : ["failed", "expired", "cancelled"].includes(payment.status) ? "bg-[#f7eeee] text-[#7c4440]" : "bg-[#f1efe9] text-[#5d6276]"}`}>{labels[payment.status]}</span></li>)}</ul></div> : null}
      </> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {canPay && summary ? <button type="button" disabled={busy} onClick={pay} className="group inline-flex min-h-14 items-center justify-between gap-6 rounded-xl bg-orange px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(189,71,13,0.32)] transition hover:-translate-y-0.5 hover:bg-[#d4540f] disabled:cursor-wait disabled:opacity-60 sm:min-w-[18rem]">{busy ? "Un instant…" : reusableCheckout ? "Reprendre le paiement" : `${summary.isTest ? "Tester" : "Régler"} ${money(summary.dueAmount)}`}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button> : null}
        <button type="button" disabled={busy} onClick={refresh} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-night/12 bg-white px-4 text-xs font-semibold text-night transition hover:border-night disabled:opacity-60"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" /></svg>{busy ? "Vérification…" : "Actualiser le paiement"}</button>
      </div>
      {canPay ? <p className="mt-4 flex items-center gap-2 text-[11px] text-muted"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6l-7-3Z" /></svg>Vous serez redirigé vers la page de paiement sécurisée GeniusPay. Vos coordonnées de paiement sont saisies uniquement chez GeniusPay.</p> : null}
    </div>
  </section>;
}
