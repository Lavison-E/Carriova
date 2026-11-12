import "server-only";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cookies } from "next/headers";
import { staffSessions, staffUsers } from "@/db/staff-schema";
import { staffInvites } from "@/db/staff-invite-schema";
import { teamAudit } from "@/db/team-schema";
import { requireStaff, STAFF_COOKIE, tokenHash, UnauthorizedError } from "@/lib/staff-auth";
import { DUMMY_PASSWORD_HASH } from "@/lib/staff-password.mjs";
import { serverEnv } from "@/lib/env";
import type { TeamManagementData, TeamRole } from "@/lib/team-management";

export async function getTeamManagementData(): Promise<TeamManagementData> {
  const identity = await requireStaff();
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (identity.role !== "admin" || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new UnauthorizedError();
  const sessionHash = tokenHash(token);
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(20261107)`);
    const [actor] = await tx.select().from(staffUsers).where(eq(staffUsers.id, identity.id)).for("share");
    if (!actor || !actor.enabled || actor.deletedAt || actor.role !== "admin") throw new UnauthorizedError();
    const [session] = await tx.select({ userId: staffSessions.userId }).from(staffSessions).where(and(
      eq(staffSessions.tokenHash, sessionHash), eq(staffSessions.userId, actor.id), gt(staffSessions.expiresAt, new Date()),
    )).limit(1);
    if (!session) throw new UnauthorizedError();
    const rows = await tx.select({
      id: staffUsers.id, email: staffUsers.email, name: staffUsers.name, role: staffUsers.role,
      enabled: staffUsers.enabled, deletedAt: staffUsers.deletedAt, version: staffUsers.version,
      createdAt: staffUsers.createdAt, invitationExpiresAt: staffInvites.expiresAt,
      hasPassword: sql<boolean>`${staffUsers.passwordHash} <> ${DUMMY_PASSWORD_HASH}`,
      activeSessions: sql<number>`(select count(*)::integer from staff_sessions s where s.user_id = ${staffUsers.id} and s.expires_at > now())`,
    }).from(staffUsers).leftJoin(staffInvites, eq(staffInvites.userId, staffUsers.id)).orderBy(asc(staffUsers.name), asc(staffUsers.id));
    const members = rows.map((row) => ({ ...row, role: row.role as TeamRole,
      deletedAt: row.deletedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(),
      invitationExpiresAt: row.invitationExpiresAt?.toISOString() ?? null, activeSessions: Number(row.activeSessions),
    }));
    const history = await tx.select({ id: teamAudit.id, actorName: teamAudit.actorName, targetName: teamAudit.targetName,
      action: teamAudit.action, details: teamAudit.details, createdAt: teamAudit.createdAt,
    }).from(teamAudit).orderBy(desc(teamAudit.createdAt), desc(teamAudit.id)).limit(100);
    const current = members.filter((member) => !member.deletedAt);
    return { members, audit: history.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })),
      stats: { total: current.length, active: current.filter((member) => member.enabled).length,
        admins: current.filter((member) => member.enabled && member.role === "admin").length,
        pending: current.filter((member) => !member.hasPassword).length, deleted: members.length - current.length },
      mailEnabled: serverEnv.email.transactionalEnabled,
    };
  });
}
