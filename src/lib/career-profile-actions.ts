"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { customerCareerProfiles } from "@/db/career-profile-schema";
import { customerUsers } from "@/db/customer-schema";
import { cvDocuments } from "@/db/cv-schema";
import { requireCustomer, CustomerUnauthorizedError } from "@/lib/customer-auth";
import { CAREER_PROFILE_LIMITS, CareerProfileValidationError, parseCareerProfile, parseCareerProfileVersion, type CareerProfileActionState, type CareerProfileRecord } from "@/lib/career-profile";
class ProfileConflict extends Error {}

export async function saveCareerProfile(_previous: CareerProfileActionState, form: FormData): Promise<CareerProfileActionState> {
  try {
    const customer = await requireCustomer();
    const raw = form.get("content");
    if (typeof raw !== "string" || raw.length > CAREER_PROFILE_LIMITS.contentBytes) return { ok: false, message: "Le profil est trop volumineux ou invalide." };
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return { ok: false, message: "Les données du profil sont invalides." }; }
    const versionText = form.get("version");
    const version = parseCareerProfileVersion(typeof versionText === "string" && /^(0|[1-9]\d*)$/.test(versionText) ? Number(versionText) : null);
    const profile = parseCareerProfile(input);
    const record = await getDb().transaction(async (tx): Promise<CareerProfileRecord> => {
      // Serialize first creation too; only the authenticated owner's row is locked.
      const [owner] = await tx.select({ id: customerUsers.id }).from(customerUsers).where(and(eq(customerUsers.id, customer.id), eq(customerUsers.enabled, true))).for("update");
      if (!owner) throw new CustomerUnauthorizedError();
      if (profile.cvDocumentId !== null) {
        const [cv] = await tx.select({ id: cvDocuments.id }).from(cvDocuments).where(and(eq(cvDocuments.id, profile.cvDocumentId), eq(cvDocuments.customerId, customer.id))).for("share");
        if (!cv) throw new CareerProfileValidationError({ cvDocumentId: "Ce CV n’est pas disponible dans votre espace. Choisissez un autre CV ou aucun CV." });
      }
      const [current] = await tx.select({ version: customerCareerProfiles.version }).from(customerCareerProfiles).where(eq(customerCareerProfiles.customerId, customer.id));
      if ((current?.version ?? 0) !== version) throw new ProfileConflict();
      const updatedAt = new Date();
      if (!current) await tx.insert(customerCareerProfiles).values({ customerId: customer.id, content: profile, version: 1, updatedAt });
      else await tx.update(customerCareerProfiles).set({ content: profile, version: version + 1, updatedAt }).where(and(eq(customerCareerProfiles.customerId, customer.id), eq(customerCareerProfiles.version, version)));
      return { profile, version: version + 1, updatedAt: updatedAt.toISOString() };
    });
    revalidatePath("/espace"); revalidatePath("/espace/profil"); revalidatePath("/espace/opportunites");
    return { ok: true, message: "Votre profil professionnel est enregistré.", record };
  } catch (error) {
    if (error instanceof CustomerUnauthorizedError) redirect("/compte/connexion");
    if (error instanceof CareerProfileValidationError) return { ok: false, message: "Vérifiez les informations indiquées.", fieldErrors: error.fieldErrors };
    if (error instanceof ProfileConflict) return { ok: false, conflict: true, message: "Votre profil a changé dans une autre fenêtre. Vos réponses restent affichées ; rechargez la version enregistrée avant de poursuivre." };
    return { ok: false, message: "Le profil n’a pas pu être enregistré. Vos réponses restent affichées. Réessayez dans un instant." };
  }
}
