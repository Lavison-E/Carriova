import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";
import { customerUsers } from "./customer-schema";
import type { CareerProfile } from "@/lib/career-profile";

export const customerCareerProfiles = pgTable("customer_career_profiles", {
  customerId: integer("customer_id").primaryKey().references(() => customerUsers.id, { onDelete: "cascade" }),
  content: jsonb("content").$type<CareerProfile>().notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
