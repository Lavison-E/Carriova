import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerCareerProfiles } from "@/db/career-profile-schema";
import { customerUsers } from "@/db/customer-schema";
import { requireCustomer, CustomerUnauthorizedError } from "@/lib/customer-auth";
import { createEmptyCareerProfile, parseCareerProfile, type CareerProfileRecord } from "@/lib/career-profile";

export async function getCustomerCareerProfile(): Promise<CareerProfileRecord> {
  const customer = await requireCustomer();
  const [row] = await getDb().select().from(customerCareerProfiles).where(eq(customerCareerProfiles.customerId, customer.id)).limit(1);
  return row ? { profile: parseCareerProfile(row.content), version: row.version, updatedAt: row.updatedAt.toISOString() } : { profile: createEmptyCareerProfile(), version: 0, updatedAt: null };
}
export async function getCustomerWhatsApp(): Promise<string | null> {
  const customer = await requireCustomer();
  const [row] = await getDb().select({ whatsapp: customerUsers.whatsapp }).from(customerUsers).where(and(eq(customerUsers.id, customer.id), eq(customerUsers.enabled, true))).limit(1);
  if (!row) throw new CustomerUnauthorizedError();
  return row.whatsapp;
}
