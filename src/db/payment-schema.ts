import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { customerUsers } from "./customer-schema";
import { serviceRequests } from "./workspace-schema";
import type { PaymentStage, PaymentState } from "@/lib/payment-policy";
export const requestPayments = pgTable("request_payments", {
  id: uuid("id").primaryKey(), requestId: integer("request_id").notNull().references(() => serviceRequests.id),
  customerId: integer("customer_id").notNull().references(() => customerUsers.id),
  environment: varchar("environment", { length: 10 }).$type<"sandbox" | "live">().notNull(),
  stage: varchar("stage", { length: 10 }).$type<PaymentStage>().notNull(), amount: integer("amount").notNull(),
  quoteAmount: integer("quote_amount").notNull(), currency: varchar("currency", { length: 3 }).notNull().default("XOF"),
  status: varchar("status", { length: 20 }).$type<PaymentState>().notNull().default("creating"),
  providerReference: varchar("provider_reference", { length: 100 }), checkoutUrl: text("checkout_url"),
  expiresAt: timestamp("expires_at", { withTimezone: true }), paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("request_payments_reference_idx").on(table.providerReference), index("request_payments_request_idx").on(table.requestId, table.environment)]);
export const paymentWebhookEvents = pgTable("payment_webhook_events", {
  id: varchar("id", { length: 100 }).primaryKey(), environment: varchar("environment", { length: 10 }).notNull(),
  reference: varchar("reference", { length: 100 }).notNull(), event: varchar("event", { length: 60 }).notNull(),
  payloadHash: varchar("payload_hash", { length: 64 }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
