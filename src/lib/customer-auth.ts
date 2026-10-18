import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { customerSessions, customerUsers } from "@/db/customer-schema";
export const CUSTOMER_COOKIE = "carriova_customer";
export const CUSTOMER_SESSION_SECONDS = 7 * 24 * 60 * 60;
export const CLAIM_COOKIE = "carriova_pending_request";
export type CustomerIdentity = { id:number; email:string; name:string };
export class CustomerUnauthorizedError extends Error { constructor(){super("Customer authentication required");this.name="CustomerUnauthorizedError";} }
export function customerTokenHash(token:string){return createHash("sha256").update(token).digest("hex");}
export async function getCustomerSession():Promise<CustomerIdentity|null>{
 const token=(await cookies()).get(CUSTOMER_COOKIE)?.value;
 if(!token || !/^[A-Za-z0-9_-]{43}$/.test(token) || !databaseConfigured) return null;
 const [user]=await getDb().select({id:customerUsers.id,email:customerUsers.email,name:customerUsers.name})
  .from(customerSessions).innerJoin(customerUsers,eq(customerUsers.id,customerSessions.userId))
  .where(and(eq(customerSessions.tokenHash,customerTokenHash(token)),gt(customerSessions.expiresAt,new Date()),eq(customerUsers.enabled,true))).limit(1);
 return user??null;
}
export async function requireCustomer(){const user=await getCustomerSession();if(!user)throw new CustomerUnauthorizedError();return user;}
