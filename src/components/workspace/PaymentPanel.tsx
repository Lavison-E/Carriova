"use client";
import { useEffect, useState } from "react";
import type { PaymentState, PaymentSummary } from "@/lib/payment-policy";
const money = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
const labels: Record<PaymentState, string> = { creating: "Initialisation à confirmer", pending: "En attente", processing: "Vérification en cours", completed: "Confirmé", failed: "Échoué", expired: "Expiré", cancelled: "Annulé", refunded: "Remboursé", review_required: "Vérification par l’équipe" };
const button = "inline-flex min-h-11 items-center justify-center rounded-lg bg-night px-5 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60";
async function paymentResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Le paiement est momentanément indisponible.");
  return data;
}
export function PaymentPanel({ requestId, version = 0, context = "customer" }: { requestId: number; version?: number; context?: "customer" | "team" }) {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const endpoint = context === "team" ? "/api/payments/geniuspay/admin" : "/api/payments/geniuspay";
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
  return <section id="paiement" aria-labelledby={`payment-heading-${requestId}`} aria-busy={busy} className="mb-6 rounded-xl border border-line bg-white p-5 sm:p-7">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange">Paiement sécurisé</p>
    <h2 id={`payment-heading-${requestId}`} className="mt-2 text-lg font-semibold text-night">{context === "team" ? "Encaissements de la demande" : "Votre règlement"}</h2>
    {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-xs leading-6 text-red-800">{error}</p> : null}
    {!summary && !error ? <p role="status" className="mt-4 text-xs leading-6 text-muted">Chargement du suivi de paiement…</p> : null}
    {summary ? <>
      {summary.isTest ? <p className="mt-4 rounded-lg bg-amber-50 p-4 text-xs font-semibold text-amber-900">Mode test Sandbox — ces transactions ne constituent pas un paiement réel.</p> : null}
      {summary.quoteAmount !== null ? <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div><dt className="text-[10px] uppercase tracking-wide text-muted">Proposition</dt><dd className="mt-2 text-lg font-semibold text-night">{money(summary.quoteAmount)}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-wide text-muted">{summary.isTest ? "Confirmé en test" : "Paiements confirmés"}</dt><dd className="mt-2 text-lg font-semibold text-night">{money(summary.paidAmount)}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-wide text-muted">Reste à régler</dt><dd className="mt-2 text-lg font-semibold text-night">{money(summary.remainingAmount)}</dd></div>
      </dl> : null}
      {!summary.enabled ? <p className="mt-4 text-xs leading-7 text-muted">Le paiement en ligne est en cours de configuration. L’équipe vous indiquera les modalités de règlement dans la conversation.</p>
        : !summary.accepted ? <p className="mt-4 text-xs leading-7 text-muted">Le règlement sera disponible après acceptation de la proposition.</p>
        : summary.needsReview ? <p className="mt-4 text-xs leading-7 text-muted">L’équipe doit vérifier ces transactions avant tout nouveau règlement. Écrivez dans la conversation de cette demande.</p>
        : unconfirmedCheckout ? <p className="mt-4 rounded-lg bg-paper p-4 text-xs leading-7 text-muted">Une transaction a été initiée et sa confirmation est attendue. Actualisez son état dans quelques instants. Si l’attente persiste, contactez l’équipe dans la conversation avant tout autre règlement.</p>
        : summary.awaitingDelivery ? <p className="mt-4 text-xs leading-7 text-muted">L’acompte est confirmé. Le solde sera disponible lorsque la réalisation sera finalisée pour la livraison.</p>
        : summary.remainingAmount === 0 ? <p className="mt-4 text-xs leading-7 text-[#285236]">{summary.quoteAmount === 0 ? "Cette prestation est offerte." : summary.isTest ? "Simulation de règlement terminée." : "Le règlement est confirmé en totalité."}</p>
        : <p className="mt-4 text-xs leading-7 text-muted">{summary.stage === "deposit" ? "Un acompte de 50 % est demandé au démarrage. Le solde est dû à la livraison." : summary.stage === "balance" ? "Votre réalisation est prête. Vous pouvez régler le solde de votre proposition." : "Le règlement intégral est demandé avant le démarrage de la prestation."} Les moyens disponibles sont présentés sur la page sécurisée GeniusPay.</p>}
      {summary.payments.length ? <ul className="mt-5 divide-y divide-line border-t border-line">{summary.payments.map(payment => <li key={payment.id} className="flex flex-wrap justify-between gap-3 py-3 text-xs leading-6"><div><p className="font-medium text-night">{payment.stage === "deposit" ? "Acompte" : payment.stage === "balance" ? "Solde" : "Règlement intégral"} · {money(payment.amount)}</p>{payment.reference ? <p className="break-all text-[10px] text-muted">{payment.reference}</p> : null}</div><span className={payment.status === "completed" ? "text-[#285236]" : "text-muted"}>{labels[payment.status]}</span></li>)}</ul> : null}
    </> : null}
    <div className="mt-5 flex flex-wrap gap-3">
      {context === "customer" && summary?.enabled && summary.accepted && !summary.needsReview && !unconfirmedCheckout && summary.dueAmount >= 200 ? <button type="button" disabled={busy} onClick={pay} className={button}>{busy ? "Un instant…" : reusableCheckout ? "Reprendre le paiement" : `${summary.isTest ? "Tester" : "Régler"} ${money(summary.dueAmount)}`}</button> : null}
      <button type="button" disabled={busy} onClick={refresh} className="min-h-11 rounded-lg border border-line px-4 text-xs font-semibold text-night disabled:opacity-60">{busy ? "Vérification…" : "Actualiser le paiement"}</button>
    </div>
  </section>;
}
