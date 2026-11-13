"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { premiumApplications, premiumPrepPlans } from "@/db/premium-schema";
import type { ActionState } from "@/lib/actions";
import { getCustomerCareerProfile } from "@/lib/career-profile-queries";
import { CustomerUnauthorizedError, requireCustomer } from "@/lib/customer-auth";
import { getJobBySlug } from "@/lib/job-catalog";
import { analyzeApplication, isApplicationStatus, PREMIUM_AD_MAX, type ApplicationKit } from "@/lib/premium";
import { generateApplicationKit, generatePrepPlan, PremiumAiError } from "@/lib/premium-ai";
import { assertAiQuota, ensurePassRequest, PremiumError, requirePremium } from "@/lib/premium-store";

const text = (fd: FormData, key: string) => typeof fd.get(key) === "string" ? (fd.get(key) as string).trim() : "";
const id = (value: string) => /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
async function guarded<T extends ActionState>(work: () => Promise<T>): Promise<T | ActionState> {
  try { return await work(); }
  catch (error) {
    if (error instanceof CustomerUnauthorizedError) redirect("/compte/connexion?returnTo=/espace/premium");
    if (error instanceof PremiumError || error instanceof PremiumAiError) return { ok: false, message: error.message };
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { ok: false, message: "L’opération n’a pas pu aboutir. Réessayez dans un instant." };
  }
}
function invalidate(applicationId?: number) {
  revalidatePath("/espace/premium");
  revalidatePath("/espace/premium/candidatures");
  if (applicationId) revalidatePath(`/espace/premium/candidatures/${applicationId}`);
}

/** Opens (or reuses) the pass request, then sends the client to its payment block. */
export async function startPremiumPass(): Promise<void> {
  let customer;
  try { customer = await requireCustomer(); } catch { redirect("/compte/connexion?returnTo=/espace/premium"); }
  const requestId = await ensurePassRequest(customer);
  redirect(`/espace/demandes/${requestId}`);
}

async function createApplication(values: { jobSlug?: string | null; title: string; company: string; location: string; sourceUrl: string | null; description: string }) {
  const customer = await requireCustomer();
  await requirePremium(customer.id);
  const { profile } = await getCustomerCareerProfile();
  const analysis = analyzeApplication(profile, values);
  if (values.jobSlug) {
    const [existing] = await getDb().select({ id: premiumApplications.id }).from(premiumApplications).where(and(eq(premiumApplications.customerId, customer.id), eq(premiumApplications.jobSlug, values.jobSlug)));
    if (existing) return existing.id;
  }
  const [row] = await getDb().insert(premiumApplications).values({ customerId: customer.id, ...values, jobSlug: values.jobSlug ?? null, matchScore: analysis.score, analysis }).returning({ id: premiumApplications.id });
  return row.id;
}

export async function prepareFromCatalog(fd: FormData): Promise<void> {
  const slug = text(fd, "slug");
  let target = "/espace/premium";
  try {
    const job = slug ? await getJobBySlug(slug) : null;
    if (job) {
      const applicationId = await createApplication({ jobSlug: job.slug, title: job.title.slice(0, 200), company: (job.company ?? "").slice(0, 200), location: [job.location, job.country].filter(Boolean).join(", ").slice(0, 160),
        sourceUrl: job.sourceUrl ?? null, description: [...new Set([job.description, job.matchingText])].filter(Boolean).join("\n\n").slice(0, PREMIUM_AD_MAX) });
      invalidate(applicationId);
      target = `/espace/premium/candidatures/${applicationId}`;
    }
  } catch (error) {
    if (error instanceof CustomerUnauthorizedError) target = "/compte/connexion?returnTo=/espace/premium";
    else if (!(error instanceof PremiumError)) throw error;
  }
  redirect(target);
}

export async function analyzePastedOffer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const title = text(fd, "title"), company = text(fd, "company"), location = text(fd, "location"), url = text(fd, "sourceUrl"), description = text(fd, "description");
  const fieldErrors: Record<string, string> = {};
  if (title.length < 3 || title.length > 200) fieldErrors.title = "Indiquez l’intitulé du poste (3 à 200 caractères).";
  if (description.length < 120) fieldErrors.description = "Collez le texte complet de l’annonce (au moins quelques lignes).";
  if (description.length > PREMIUM_AD_MAX) fieldErrors.description = `L’annonce dépasse ${PREMIUM_AD_MAX} caractères : gardez les missions et le profil recherché.`;
  let sourceUrl: string | null = null;
  if (url) { try { const parsed = new URL(url); if (!["https:", "http:"].includes(parsed.protocol) || url.length > 1000) throw new Error(); sourceUrl = parsed.href; } catch { fieldErrors.sourceUrl = "Saisissez un lien valide commençant par https://"; } }
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors };
  let applicationId = 0;
  const result = await guarded(async () => {
    applicationId = await createApplication({ title, company: company.slice(0, 200), location: location.slice(0, 160), sourceUrl, description });
    invalidate(applicationId);
    return { ok: true, message: "Annonce analysée." };
  });
  if (result.ok) redirect(`/espace/premium/candidatures/${applicationId}`);
  return result;
}

export async function generateKitAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const applicationId = id(text(fd, "applicationId"));
  if (!applicationId) return { ok: false, message: "Candidature introuvable." };
  return guarded(async () => {
    const customer = await requireCustomer();
    await requirePremium(customer.id);
    await assertAiQuota(customer.id);
    const [application] = await getDb().select().from(premiumApplications).where(and(eq(premiumApplications.id, applicationId), eq(premiumApplications.customerId, customer.id)));
    if (!application) throw new PremiumError("NOT_FOUND", "Candidature introuvable.");
    const { profile } = await getCustomerCareerProfile();
    if (!profile.targetRoles.length && !profile.skills.length && !profile.professionalSummary.trim()) throw new PremiumError("PROFILE_EMPTY", "Complétez d’abord votre profil (métiers, compétences, parcours) : l’assistant n’invente jamais votre expérience.");
    const analysis = analyzeApplication(profile, application);
    const kit: ApplicationKit = await generateApplicationKit(profile, application, analysis);
    await getDb().update(premiumApplications).set({ kit, analysis, matchScore: analysis.score, kitGeneratedAt: new Date(), updatedAt: new Date() }).where(eq(premiumApplications.id, applicationId));
    invalidate(applicationId);
    return { ok: true, message: "Votre dossier de candidature est prêt. Relisez-le et complétez les éléments entre crochets avant l’envoi." };
  });
}

export async function updateApplicationAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const applicationId = id(text(fd, "applicationId"));
  const status = text(fd, "status"), notes = text(fd, "notes"), followUp = text(fd, "followUpAt");
  if (!applicationId || !isApplicationStatus(status)) return { ok: false, message: "Choisissez un statut valide." };
  if (notes.length > 4000) return { ok: false, message: "Vos notes dépassent 4 000 caractères.", fieldErrors: { notes: "4 000 caractères maximum." } };
  const followUpAt = followUp ? new Date(`${followUp}T09:00:00Z`) : null;
  if (followUp && (!/^\d{4}-\d{2}-\d{2}$/.test(followUp) || Number.isNaN(followUpAt!.getTime()))) return { ok: false, message: "Date de relance invalide.", fieldErrors: { followUpAt: "Date invalide." } };
  return guarded(async () => {
    const customer = await requireCustomer();
    await requirePremium(customer.id);
    const [current] = await getDb().select({ appliedAt: premiumApplications.appliedAt }).from(premiumApplications).where(and(eq(premiumApplications.id, applicationId), eq(premiumApplications.customerId, customer.id)));
    if (!current) throw new PremiumError("NOT_FOUND", "Candidature introuvable.");
    const appliedAt = current.appliedAt ?? (["applied", "interview", "offer", "rejected"].includes(status) ? new Date() : null);
    const defaultFollowUp = !followUp && status === "applied" && !current.appliedAt ? new Date(Date.now() + 7 * 86400000) : followUpAt;
    await getDb().update(premiumApplications).set({ status, notes, appliedAt, followUpAt: defaultFollowUp, updatedAt: new Date() }).where(eq(premiumApplications.id, applicationId));
    invalidate(applicationId);
    return { ok: true, message: status === "applied" && !current.appliedAt ? "Candidature marquée comme envoyée. Une relance est prévue dans 7 jours." : "Suivi enregistré." };
  });
}

export async function deleteApplicationAction(fd: FormData): Promise<void> {
  const applicationId = id(text(fd, "applicationId"));
  try {
    const customer = await requireCustomer();
    if (applicationId) await getDb().delete(premiumApplications).where(and(eq(premiumApplications.id, applicationId), eq(premiumApplications.customerId, customer.id)));
  } catch (error) { if (!(error instanceof CustomerUnauthorizedError)) throw error; }
  invalidate();
  redirect("/espace/premium/candidatures");
}

export async function generatePrepPlanAction(_prev: ActionState): Promise<ActionState> {
  return guarded(async () => {
    const customer = await requireCustomer();
    await requirePremium(customer.id);
    await assertAiQuota(customer.id);
    const { profile } = await getCustomerCareerProfile();
    if (!profile.targetRoles.length) throw new PremiumError("PROFILE_EMPTY", "Indiquez au moins un métier recherché dans votre profil pour personnaliser le plan.");
    const plan = await generatePrepPlan(profile);
    await getDb().insert(premiumPrepPlans).values({ customerId: customer.id, plan, generatedAt: new Date() })
      .onConflictDoUpdate({ target: premiumPrepPlans.customerId, set: { plan, generatedAt: new Date() } });
    revalidatePath("/espace/premium/preparation");
    return { ok: true, message: "Votre plan personnalisé est prêt." };
  });
}
