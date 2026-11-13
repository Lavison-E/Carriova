import { index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { customerUsers } from "./customer-schema";
import { serviceRequests } from "./workspace-schema";
import type { ApplicationAnalysis, ApplicationKit, ApplicationStatus, PrepPlan } from "@/lib/premium";

export const customerPremiumPasses = pgTable("customer_premium_passes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id, { onDelete: "cascade" }),
  requestId: integer("request_id").unique().references(() => serviceRequests.id, { onDelete: "set null" }),
  environment: varchar("environment", { length: 16 }).$type<"live" | "sandbox">().notNull().default("live"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("customer_premium_passes_customer_idx").on(table.customerId, table.endsAt)]);

export const premiumApplications = pgTable("premium_applications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id, { onDelete: "cascade" }),
  jobSlug: varchar("job_slug", { length: 200 }),
  title: varchar("title", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }).notNull().default(""),
  location: varchar("location", { length: 160 }).notNull().default(""),
  sourceUrl: varchar("source_url", { length: 1000 }),
  description: text("description").notNull().default(""),
  status: varchar("status", { length: 20 }).$type<ApplicationStatus>().notNull().default("to_apply"),
  matchScore: integer("match_score"),
  analysis: jsonb("analysis").$type<ApplicationAnalysis>(),
  kit: jsonb("kit").$type<ApplicationKit>(),
  kitGeneratedAt: timestamp("kit_generated_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("premium_applications_customer_idx").on(table.customerId, table.updatedAt)]);

export const premiumPrepPlans = pgTable("premium_prep_plans", {
  customerId: integer("customer_id").primaryKey().references(() => customerUsers.id, { onDelete: "cascade" }),
  plan: jsonb("plan").$type<PrepPlan>().notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});
