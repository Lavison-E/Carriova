export type PaymentStage = "full" | "deposit" | "balance";
export type PaymentState = "creating" | "pending" | "processing" | "completed" | "failed" | "expired" | "cancelled" | "refunded" | "review_required";
export const acceptedPaymentStatuses = ["in_progress", "awaiting_validation", "finalized", "delivered", "revision_requested", "completed"];
export function paymentSchedule(quoteAmount: number | null, paidAmount: number, deliveryReady: boolean): { stage: PaymentStage | null; dueAmount: number; remainingAmount: number; awaitingDelivery: boolean } {
  if (quoteAmount === null || !Number.isSafeInteger(quoteAmount) || quoteAmount < 0 || !Number.isSafeInteger(paidAmount) || paidAmount < 0 || paidAmount > quoteAmount) return { stage: null, dueAmount: 0, remainingAmount: 0, awaitingDelivery: false };
  const remainingAmount = quoteAmount - paidAmount;
  if (!remainingAmount) return { stage: null, dueAmount: 0, remainingAmount, awaitingDelivery: false };
  if (quoteAmount <= 25000) return { stage: "full", dueAmount: remainingAmount, remainingAmount, awaitingDelivery: false };
  const deposit = Math.ceil(quoteAmount / 2);
  if (paidAmount < deposit) return { stage: "deposit", dueAmount: deposit - paidAmount, remainingAmount, awaitingDelivery: false };
  return { stage: deliveryReady ? "balance" : null, dueAmount: deliveryReady ? remainingAmount : 0, remainingAmount, awaitingDelivery: !deliveryReady };
}
export type PaymentSummary = {
  enabled: boolean; environment: "sandbox" | "live" | null; isTest: boolean; accepted: boolean;
  quoteAmount: number | null; paidAmount: number; remainingAmount: number; dueAmount: number;
  stage: PaymentStage | null; awaitingDelivery: boolean; needsReview: boolean;
  payments: { id: string; amount: number; stage: PaymentStage; status: PaymentState; reference: string | null; checkoutUrl: string | null; createdAt: string; paidAt: string | null }[];
};
