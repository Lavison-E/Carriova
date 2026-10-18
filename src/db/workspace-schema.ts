import { customType, index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { customerUsers } from "./customer-schema";
import { leads } from "./schema";
import type { WorkspaceFileKind, WorkspaceStatus } from "@/lib/workspace";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() { return "bytea"; },
  toDriver(value) { return value; },
  fromDriver(value) { return Buffer.from(value); },
});
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id),
  leadId: integer("lead_id").references(() => leads.id),
  title: varchar("title", { length: 160 }).notNull(),
  service: varchar("service", { length: 40 }).notNull(),
  brief: text("brief").notNull(),
  status: varchar("status", { length: 40 }).$type<WorkspaceStatus>().notNull().default("received"),
  quotedAmount: integer("quoted_amount"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  version: integer("version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("service_requests_lead_idx").on(table.leadId),
  index("service_requests_customer_idx").on(table.customerId, table.createdAt),
  index("service_requests_status_idx").on(table.status, table.updatedAt),
]);
export const requestMessages = pgTable("request_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequests.id),
  authorType: varchar("author_type", { length: 20 }).$type<"customer" | "staff">().notNull(),
  authorId: integer("author_id").notNull(),
  authorName: varchar("author_name", { length: 160 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("request_messages_request_idx").on(table.requestId, table.createdAt)]);
export const requestEvents = pgTable("request_events", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequests.id),
  type: varchar("type", { length: 40 }).notNull(),
  actorName: varchar("actor_name", { length: 160 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 40 }).$type<WorkspaceStatus>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("request_events_request_idx").on(table.requestId, table.createdAt)]);
export const requestFiles = pgTable("request_files", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequests.id),
  filename: varchar("filename", { length: 160 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  kind: varchar("kind", { length: 20 }).$type<WorkspaceFileKind>().notNull(),
  content: bytea("content").notNull(),
  uploadedByType: varchar("uploaded_by_type", { length: 20 }).$type<"customer" | "staff">().notNull(),
  uploadedById: integer("uploaded_by_id").notNull(),
  uploadedByName: varchar("uploaded_by_name", { length: 160 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("request_files_request_idx").on(table.requestId, table.createdAt)]);
