import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { leads } from "./schema";
import type { CrmPriority, CrmStatus } from "@/lib/crm";

export const qualifications = pgTable("lead_qualifications", {
  leadId: integer("lead_id").primaryKey().references(() => leads.id),
  country: varchar("country", { length: 40 }).notNull(),
  profile: varchar("profile", { length: 40 }).notNull(),
  discoverySource: varchar("discovery_source", { length: 40 }).notNull(),
  need: varchar("need", { length: 40 }).notNull(),
  cvStatus: varchar("cv_status", { length: 40 }).notNull(),
  timeline: varchar("timeline", { length: 40 }).notNull(),
  targetOffer: varchar("target_offer", { length: 40 }),
  difficulty: varchar("difficulty", { length: 40 }),
  budget: varchar("budget", { length: 40 }).notNull(),
  paymentReadiness: varchar("payment_readiness", { length: 40 }).notNull(),
  contactWhatsApp: boolean("contact_whatsapp").notNull(),
  consentVersion: varchar("consent_version", { length: 40 }).notNull(),
  privacyNotice: text("privacy_notice").notNull(),
  sourceForm: varchar("source_form", { length: 80 }).notNull().default("/qualification"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("lead_qualifications_need_idx").on(table.need)]);

export const crmLeadState = pgTable("crm_lead_state", {
  leadId: integer("lead_id").primaryKey().references(() => leads.id),
  status: varchar("status", { length: 40 }).$type<CrmStatus>().notNull().default("new"),
  priority: varchar("priority", { length: 20 }).$type<CrmPriority>().notNull().default("normal"),
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  version: integer("version").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("crm_lead_state_status_idx").on(table.status), index("crm_lead_state_follow_up_idx").on(table.followUpAt)]);

export const crmHistory = pgTable("crm_history", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  action: varchar("action", { length: 40 }).notNull(),
  actorId: integer("actor_id"),
  actorName: varchar("actor_name", { length: 160 }),
  note: text("note"),
  previousStatus: varchar("previous_status", { length: 40 }),
  status: varchar("status", { length: 40 }),
  changes: jsonb("changes").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("crm_history_lead_idx").on(table.leadId, table.createdAt)]);

export const crmSubmissionLimits = pgTable("crm_submission_limits", {
  key: varchar("key", { length: 80 }).primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
}, (table) => [index("crm_submission_limits_window_start_idx").on(table.windowStart)]);
