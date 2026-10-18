"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { staffSessions, staffUsers } from "@/db/staff-schema";
import { SESSION_SECONDS, STAFF_COOKIE, tokenHash } from "@/lib/staff-auth";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/staff-password.mjs";
import { isEmail } from "@/lib/security";
import type { ActionState } from "@/lib/actions";

async function consumeLoginAttempt(key: string, limit: number) {
  const result = await getDb().execute(sql`
    INSERT INTO staff_login_attempts (key, attempts, reset_at)
    VALUES (${tokenHash(key)}, 1, now() + interval '15 minutes')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN staff_login_attempts.reset_at <= now() THEN 1 ELSE staff_login_attempts.attempts + 1 END,
      reset_at = CASE WHEN staff_login_attempts.reset_at <= now() THEN now() + interval '15 minutes' ELSE staff_login_attempts.reset_at END
    RETURNING attempts`);
  return Number(result.rows[0]?.attempts) <= limit;
}

export async function staffLogin(_previous: ActionState, data: FormData): Promise<ActionState> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = data.get("password");
  const invalid = { ok: false, message: "Adresse e-mail ou mot de passe incorrect." };
  if (!isEmail(email) || typeof password !== "string" || !password || password.length > 256) return invalid;
  if (!databaseConfigured) return { ok: false, message: "L’accès équipe est temporairement indisponible. Contactez votre administrateur." };
  try {
    const requestHeaders = await headers();
    const ip = (requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? requestHeaders.get("x-real-ip") ?? "unknown").trim().slice(0, 100);
    await getDb().execute(sql`DELETE FROM staff_login_attempts WHERE reset_at < now() - interval '1 day'`);
    if (!await consumeLoginAttempt("ip:" + ip, 40) || !await consumeLoginAttempt("email:" + email, 8))
      return { ok: false, message: "Trop de tentatives. Patientez quinze minutes avant de réessayer." };
    const [user] = await getDb().select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1);
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!valid || !user || !user.enabled || !["admin", "advisor"].includes(user.role)) return invalid;
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
    const jar = await cookies();
    const previous = jar.get(STAFF_COOKIE)?.value;
    await getDb().transaction(async (tx) => {
      if (previous) await tx.delete(staffSessions).where(eq(staffSessions.tokenHash, tokenHash(previous)));
      await tx.delete(staffSessions).where(sql`${staffSessions.expiresAt} <= now()`);
      await tx.insert(staffSessions).values({ tokenHash: tokenHash(token), userId: user.id, expiresAt });
    });
    jar.set(STAFF_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: SESSION_SECONDS, expires: expiresAt });
  } catch {
    console.error("[staff-auth] sign-in unavailable");
    return { ok: false, message: "L’accès équipe est temporairement indisponible. Réessayez plus tard." };
  }
  redirect("/admin/crm");
}

export async function staffLogout() {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  // A failed revocation must not masquerade as a successful logout.
  if (token && databaseConfigured) await getDb().delete(staffSessions).where(eq(staffSessions.tokenHash, tokenHash(token)));
  jar.set(STAFF_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 0 });
  redirect("/admin/connexion");
}
