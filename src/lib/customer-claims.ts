import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { qualifications } from "@/db/crm-schema";
import { customerLeadClaims } from "@/db/customer-schema";
import { requestEvents, serviceRequests } from "@/db/workspace-schema";
import { customerTokenHash, type CustomerIdentity } from "@/lib/customer-auth";
import { qualificationLabel } from "@/lib/qualification";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export async function attachLeadToCustomer(tx:Tx,leadId:number,user:CustomerIdentity){
 const [row]=await tx.select({lead:leads,qualification:qualifications}).from(leads).innerJoin(qualifications,eq(qualifications.leadId,leads.id)).where(eq(leads.id,leadId)).limit(1);
 if(!row)return;
 const q=row.qualification;
 const brief=[
  "Demande transmise depuis le formulaire de qualification.",
  "Profil : "+qualificationLabel("profile",q.profile),
  "Besoin : "+qualificationLabel("need",q.need),
  "État du CV : "+qualificationLabel("cvStatus",q.cvStatus),
  "Délai souhaité : "+qualificationLabel("timeline",q.timeline),
  "Budget envisagé : "+qualificationLabel("budget",q.budget),
  ...(row.lead.message?["Précisions : "+row.lead.message]:[]),
 ].join("\n");
 const [request]=await tx.insert(serviceRequests).values({customerId:user.id,leadId,title:qualificationLabel("need",q.need),service:q.need,brief}).onConflictDoNothing({target:serviceRequests.leadId}).returning({id:serviceRequests.id});
 if(request)await tx.insert(requestEvents).values({requestId:request.id,type:"created",actorName:user.name,body:"Votre demande de qualification a été rattachée à votre espace.",status:"received"});
}
export async function claimPendingLead(tx:Tx,token:string|undefined,user:CustomerIdentity){
 if(!token || !/^[A-Za-z0-9_-]{43}$/.test(token))return;
 const [claim]=await tx.select().from(customerLeadClaims).where(and(eq(customerLeadClaims.tokenHash,customerTokenHash(token)),gt(customerLeadClaims.expiresAt,new Date()),isNull(customerLeadClaims.claimedAt))).for("update");
 if(!claim)return;
 await attachLeadToCustomer(tx,claim.leadId,user);
 await tx.update(customerLeadClaims).set({claimedAt:new Date(),customerId:user.id}).where(eq(customerLeadClaims.tokenHash,claim.tokenHash));
}
