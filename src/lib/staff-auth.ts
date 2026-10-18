import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, inArray } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { staffSessions, staffUsers } from "@/db/staff-schema";

export const STAFF_COOKIE = "carriova_staff";
export const SESSION_SECONDS = 8 * 60 * 60;
export type StaffIdentity = { id: number; email: string; name: string; role: "admin" | "advisor" };
export class UnauthorizedError extends Error {
  constructor() { super("Authentication required"); this.name = "UnauthorizedError"; }
}
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

// Every request checks both the session and current account permissions.
// Neither public pre-registrations nor values from a browser grant staff access.
export async function getStaffSession(): Promise<StaffIdentity | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token) || !databaseConfigured) return null;
  const [row] = await getDb().select({ id: staffUsers.id, email: staffUsers.email, name: staffUsers.name, role: staffUsers.role })
    .from(staffSessions).innerJoin(staffUsers, eq(staffUsers.id, staffSessions.userId))
    .where(and(eq(staffSessions.tokenHash, tokenHash(token)), gt(staffSessions.expiresAt, new Date()),
      eq(staffUsers.enabled, true), inArray(staffUsers.role, ["admin", "advisor"]))).limit(1);
  return row ? { ...row, role: row.role as StaffIdentity["role"] } : null;
}
export async function requireStaff(): Promise<StaffIdentity> {
  const user = await getStaffSession();
  if (!user) throw new UnauthorizedError();
  return user;
}
