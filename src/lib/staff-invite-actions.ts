"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { staffInvites } from "@/db/staff-invite-schema";
import { staffSessions, staffUsers } from "@/db/staff-schema";
import { STAFF_COOKIE, tokenHash } from "@/lib/staff-auth";
import { hashPassword } from "@/lib/staff-password.mjs";
import type { ActionState } from "@/lib/actions";

const invalid: ActionState = { ok: false, message: "Cette invitation est invalide, expirée ou déjà utilisée. Demandez un nouveau lien à votre administrateur." };
const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? data.get(key) as string : "";

export async function activateStaffInvitation(_previous: ActionState, data: FormData): Promise<ActionState> {
  const token = text(data, "token");
  const password = text(data, "password");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return invalid;
  const fieldErrors: Record<string, string> = {};
  if (password.length < 15 || password.length > 256) fieldErrors.password = "Choisissez un mot de passe de 15 à 256 caractères.";
  if (password !== text(data, "confirmPassword")) fieldErrors.confirmPassword = "Les mots de passe doivent être identiques.";
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors };
  if (!databaseConfigured) return { ok: false, message: "L’activation est temporairement indisponible. Réessayez dans un instant." };
  try {
    const db = getDb();
    const headerList = await headers();
    const ip = (headerList.get("x-forwarded-for")?.split(",")[0] ?? headerList.get("x-real-ip") ?? "unknown").trim().slice(0, 100);
    await db.execute(sql`DELETE FROM staff_login_attempts WHERE reset_at < now() - interval '1 day'`);
    const attempt = await db.execute(sql`INSERT INTO staff_login_attempts(key, attempts, reset_at)
      VALUES (${tokenHash("staff-activation:" + ip)}, 1, now() + interval '15 minutes')
      ON CONFLICT(key) DO UPDATE SET
        attempts = CASE WHEN staff_login_attempts.reset_at <= now() THEN 1 ELSE staff_login_attempts.attempts + 1 END,
        reset_at = CASE WHEN staff_login_attempts.reset_at <= now() THEN now() + interval '15 minutes' ELSE staff_login_attempts.reset_at END
      RETURNING attempts`);
    if (!Number.isSafeInteger(Number(attempt.rows[0]?.attempts)) || Number(attempt.rows[0]?.attempts) > 30) return { ok: false, message: "Trop de tentatives. Patientez quinze minutes avant de réessayer." };
    const activated = await db.transaction(async (tx) => {
      const hashedToken = tokenHash(token);
      const [candidate] = await tx.select({ userId: staffInvites.userId }).from(staffInvites).where(eq(staffInvites.tokenHash, hashedToken)).limit(1);
      if (!candidate) return false;
      // All invitation operations lock the staff user before its invitation or sessions.
      const [user] = await tx.select().from(staffUsers).where(eq(staffUsers.id, candidate.userId)).for("update");
      if (!user || user.enabled || !["admin", "advisor"].includes(user.role)) return false;
      const [invitation] = await tx.select({ tokenHash: staffInvites.tokenHash }).from(staffInvites)
        .where(and(eq(staffInvites.tokenHash, hashedToken), eq(staffInvites.userId, user.id), gt(staffInvites.expiresAt, new Date()))).for("update");
      if (!invitation) return false;
      const passwordHash = await hashPassword(password);
      await tx.update(staffUsers).set({ passwordHash, enabled: true }).where(eq(staffUsers.id, user.id));
      await tx.delete(staffInvites).where(eq(staffInvites.userId, user.id));
      await tx.delete(staffSessions).where(eq(staffSessions.userId, user.id));
      return true;
    });
    if (!activated) return invalid;
    (await cookies()).set(STAFF_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 0 });
  } catch {
    return { ok: false, message: "L’activation est temporairement indisponible. Réessayez dans un instant." };
  }
  redirect("/admin/connexion");
}
