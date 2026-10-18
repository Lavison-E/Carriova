import { boolean, index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const staffUsers = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("advisor"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const staffSessions = pgTable("staff_sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => staffUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("staff_sessions_expiry_idx").on(table.expiresAt)]);
export const staffLoginAttempts = pgTable("staff_login_attempts", {
  key: varchar("key", { length: 64 }).primaryKey(),
  attempts: integer("attempts").notNull().default(1),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
}, (table) => [index("staff_login_attempts_expiry_idx").on(table.resetAt)]);
