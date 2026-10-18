import { index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { staffUsers } from "./staff-schema";

export const staffInvites = pgTable("staff_invites", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => staffUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("staff_invites_expiry_idx").on(table.expiresAt)]);
