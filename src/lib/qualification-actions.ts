"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { lt, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customerLeadClaims } from "@/db/customer-schema";
import { CLAIM_COOKIE, customerTokenHash, getCustomerSession } from "@/lib/customer-auth";
import { attachLeadToCustomer } from "@/lib/customer-claims";
import { leads } from "@/db/schema";
import { crmHistory, crmLeadState, crmSubmissionLimits, qualifications } from "@/db/crm-schema";
import { scheduleWorkspaceNotifications } from "@/lib/workspace-mail";
import type { ActionState } from "@/lib/actions";
import { QUALIFICATION_CONSENT_VERSION, QUALIFICATION_PRIVACY_NOTICE, qualificationLabel, validateQualification } from "@/lib/qualification";

export async function submitQualification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const honeypot = formData.get("companyWebsite");
  if (typeof honeypot === "string" && honeypot.trim()) {
    return { ok: false, message: "La demande n’a pas pu être traitée. Vérifiez le formulaire." };
  }
  const validation = validateQualification(formData);
  if (!validation.ok || !validation.data) {
    return { ok: false, message: "Merci de vérifier les champs indiqués.", fieldErrors: validation.fieldErrors };
  }
  const data = validation.data;
  try {
    const customer = await getCustomerSession();
    const claimToken = customer ? null : randomBytes(32).toString("base64url");
    const headerList = await headers();
    const address = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
    const key = `qualification:${createHash("sha256").update(address).digest("hex")}`;
    const now = new Date();
    const expired = new Date(now.getTime() - 10 * 60 * 1000);
    const db = getDb();
    // Purge les empreintes des fenêtres anciennes sans toucher aux limites actives.
    const retentionCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await db.delete(crmSubmissionLimits).where(lt(crmSubmissionLimits.windowStart, retentionCutoff));
    // Une seule mise à jour atomique par IP, partagée entre toutes les instances.
    const [allowed] = await db.insert(crmSubmissionLimits)
      .values({ key, windowStart: now, count: 1 })
      .onConflictDoUpdate({
        target: crmSubmissionLimits.key,
        set: {
          count: sql`case when ${crmSubmissionLimits.windowStart} <= ${expired} then 1 else ${crmSubmissionLimits.count} + 1 end`,
          windowStart: sql`case when ${crmSubmissionLimits.windowStart} <= ${expired} then ${now} else ${crmSubmissionLimits.windowStart} end`,
        },
        setWhere: or(lte(crmSubmissionLimits.windowStart, expired), lt(crmSubmissionLimits.count, 8)),
      }).returning({ key: crmSubmissionLimits.key });
    if (!allowed) return { ok: false, message: "Trop de demandes. Merci de patienter dix minutes avant de réessayer." };

    await db.transaction(async (tx) => {
      const [lead] = await tx.insert(leads).values({
        firstName: data.fullName,
        // Le questionnaire ne demande pas d’e-mail : chaîne vide = absence, jamais une adresse fictive.
        email: "",
        whatsapp: data.whatsapp,
        objective: qualificationLabel("need", data.need),
        interest: data.need,
        type: "qualification",
        status: "lead",
        source: "qualification_form",
        landingPage: "/qualification",
        message: data.message || null,
        consentPrivacy: data.consentPrivacy,
        consentMarketing: data.consentMarketing,
      }).returning({ id: leads.id });
      await tx.insert(qualifications).values({
        leadId: lead.id, country: data.country, profile: data.profile,
        discoverySource: data.discoverySource, need: data.need, cvStatus: data.cvStatus,
        timeline: data.timeline, targetOffer: data.targetOffer, difficulty: data.difficulty,
        budget: data.budget, paymentReadiness: data.paymentReadiness,
        contactWhatsApp: data.contactWhatsApp === "yes",
        consentVersion: QUALIFICATION_CONSENT_VERSION,
        privacyNotice: QUALIFICATION_PRIVACY_NOTICE,
        sourceForm: "/qualification",
      });
      await tx.insert(crmLeadState).values({ leadId: lead.id });
      await tx.insert(crmHistory).values({
        leadId: lead.id, action: "qualification_submitted", status: "new",
        changes: { source: "/qualification", consentVersion: QUALIFICATION_CONSENT_VERSION },
      });
      if (customer) await attachLeadToCustomer(tx, lead.id, customer);
      else if (claimToken) await tx.insert(customerLeadClaims).values({ tokenHash: customerTokenHash(claimToken), leadId: lead.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    });
    if (claimToken) (await cookies()).set(CLAIM_COOKIE, claimToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
    // Seul le compte déjà authentifié reçoit les notifications de son espace ; aucun WhatsApp ni webhook CRM tiers.
    if (customer) scheduleWorkspaceNotifications({ customerId: customer.id });
    return { ok: true, message: "Votre demande a bien été enregistrée. L’équipe CARRIOVA l’étudiera en respectant vos préférences de contact." };
  } catch {
    return { ok: false, message: "Le service est temporairement indisponible. Votre demande n’a pas pu être enregistrée. Réessayez dans un instant." };
  }
}
