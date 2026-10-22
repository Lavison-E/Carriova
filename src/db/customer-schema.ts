import { boolean, index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { leads } from "./schema";
export const customerUsers = pgTable("customer_users", {
 id: serial("id").primaryKey(), email: varchar("email",{length:255}).notNull().unique(),
 whatsapp: varchar("whatsapp",{length:16}),
 name: varchar("name",{length:120}).notNull(), passwordHash: varchar("password_hash",{length:255}).notNull(),
 enabled: boolean("enabled").notNull().default(true), consentPrivacy: boolean("consent_privacy").notNull(),
 consentMarketing: boolean("consent_marketing").notNull().default(false),
 consentVersion: varchar("consent_version",{length:40}).notNull(), createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const customerSessions = pgTable("customer_sessions", {
 tokenHash: varchar("token_hash",{length:64}).primaryKey(), userId: integer("user_id").notNull().references(()=>customerUsers.id,{onDelete:"cascade"}),
 expiresAt: timestamp("expires_at",{withTimezone:true}).notNull(), createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
}, t=>[index("customer_sessions_expiry_idx").on(t.expiresAt)]);
export const customerLeadClaims = pgTable("customer_lead_claims", {
 tokenHash: varchar("token_hash",{length:64}).primaryKey(), leadId: integer("lead_id").notNull().unique().references(()=>leads.id),
 expiresAt: timestamp("expires_at",{withTimezone:true}).notNull(), claimedAt: timestamp("claimed_at",{withTimezone:true}),
 customerId: integer("customer_id").references(()=>customerUsers.id),
}, t=>[index("customer_claims_expiry_idx").on(t.expiresAt)]);
export const customerResetTokens = pgTable("customer_reset_tokens", {
 tokenHash: varchar("token_hash",{length:64}).primaryKey(), userId: integer("user_id").notNull().references(()=>customerUsers.id,{onDelete:"cascade"}),
 expiresAt: timestamp("expires_at",{withTimezone:true}).notNull(), usedAt: timestamp("used_at",{withTimezone:true}),
}, t=>[index("customer_reset_expiry_idx").on(t.expiresAt)]);
