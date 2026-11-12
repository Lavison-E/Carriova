import { index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Actor snapshots preserve the audit trail when an account is renamed or archived.
export const teamAudit = pgTable("staff_team_audit", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").notNull(),
  targetId: integer("target_id").notNull(),
  actorName: varchar("actor_name", { length: 120 }).notNull(),
  targetName: varchar("target_name", { length: 120 }).notNull(),
  action: varchar("action", { length: 40 }).notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("staff_team_audit_created_idx").on(table.createdAt),
  index("staff_team_audit_target_idx").on(table.targetId, table.createdAt),
  index("staff_team_audit_actor_idx").on(table.actorId, table.createdAt),
]);
