import { index, integer, jsonb, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { customerUsers } from "./customer-schema";
import { requestEvents, requestMessages, serviceRequests } from "./workspace-schema";

export type WorkspaceMailPayload = { from: string; to: string[]; reply_to: string; subject: string; text: string; html: string };
export const workspaceNotifications = pgTable("workspace_notifications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id),
  requestId: integer("request_id").references(() => serviceRequests.id),
  eventId: integer("event_id").references(() => requestEvents.id),
  messageId: integer("message_id").references(() => requestMessages.id),
  dedupeKey: varchar("dedupe_key", { length: 120 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  audience: varchar("audience", { length: 20 }).$type<"customer" | "team">().notNull(),
  status: varchar("status", { length: 20 }).$type<"pending" | "sending" | "sent">().notNull().default("pending"),
  payload: jsonb("payload").$type<WorkspaceMailPayload>(),
  attempts: integer("attempts").notNull().default(0),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  leaseToken: varchar("lease_token", { length: 36 }),
  firstAttemptAt: timestamp("first_attempt_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastError: varchar("last_error", { length: 80 }),
  providerId: varchar("provider_id", { length: 128 }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("workspace_notifications_dedupe_idx").on(table.dedupeKey), index("workspace_notifications_pending_idx").on(table.status, table.availableAt), index("workspace_notifications_customer_idx").on(table.customerId)]);
