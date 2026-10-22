import { index, integer, jsonb, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { customerUsers } from "./customer-schema";
import type { CvAccent, CvContent, CvTemplateId } from "@/lib/cv";

export const cvDocuments = pgTable("cv_documents", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  content: jsonb("content").$type<CvContent>().notNull(),
  schemaVersion: integer("schema_version").notNull().default(1),
  templateId: varchar("template_id", { length: 24 }).$type<CvTemplateId>().notNull().default("essentiel"),
  accent: varchar("accent", { length: 24 }).$type<CvAccent>().notNull().default("terracotta"),
  version: integer("version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("cv_documents_customer_updated_idx").on(table.customerId, table.updatedAt)]);

// Only operational metadata: never store a prompt, generated text or CV snapshot here.
export const cvAiRuns = pgTable("cv_ai_runs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id, { onDelete: "cascade" }),
  documentId: integer("document_id").references(() => cvDocuments.id, { onDelete: "set null" }),
  documentVersion: integer("document_version").notNull(),
  requestId: varchar("request_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 16 }).$type<"running" | "succeeded" | "failed">().notNull(),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  model: varchar("model", { length: 160 }),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  errorCode: varchar("error_code", { length: 80 }),
}, table => [
  uniqueIndex("cv_ai_runs_customer_request_idx").on(table.customerId, table.requestId),
  index("cv_ai_runs_customer_created_idx").on(table.customerId, table.createdAt),
  index("cv_ai_runs_created_idx").on(table.createdAt),
]);
