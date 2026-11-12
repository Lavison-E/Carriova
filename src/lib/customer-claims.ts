import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { qualifications } from "@/db/crm-schema";
import { customerLeadClaims } from "@/db/customer-schema";
import { requestEvents, serviceRequests } from "@/db/workspace-schema";
import { customerTokenHash, type CustomerIdentity } from "@/lib/customer-auth";
import { qualificationLabel, qualificationOptions } from "@/lib/qualification";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
const sourceLabels:Record<string,string>={qualification_form:"le formulaire de qualification",contact_page:"le formulaire de contact",account_creation:"la préinscription",resource_gate:"une demande de ressource",newsletter:"l’inscription à la newsletter"};
/** Creates the private workspace request of a prospect. Returns the request id, or undefined when it already exists. */
export async function attachLeadToCustomer(tx:Tx,leadId:number,user:CustomerIdentity){
 const [row]=await tx.select({lead:leads,qualification:qualifications}).from(leads).leftJoin(qualifications,eq(qualifications.leadId,leads.id)).where(eq(leads.id,leadId)).limit(1);
 if(!row)return;
 const q=row.qualification,lead=row.lead;
 const fallbackService=qualificationOptions.need.some(option=>option.value===lead.interest)?lead.interest as string:"special_file";
 const brief=q?[
  "Demande transmise depuis le formulaire de qualification.",
  "Profil : "+qualificationLabel("profile",q.profile),
  "Besoin : "+qualificationLabel("need",q.need),
  "État du CV : "+qualificationLabel("cvStatus",q.cvStatus),
  "Délai souhaité : "+qualificationLabel("timeline",q.timeline),
  "Budget envisagé : "+qualificationLabel("budget",q.budget),
  ...(lead.message?["Précisions : "+lead.message]:[]),
 ].join("\n"):[
  "Demande transmise depuis "+(sourceLabels[lead.source??""]??"le site CARRIOVA")+".",
  ...(lead.objective?["Objectif : "+lead.objective]:[]),
  ...(lead.message?["Précisions : "+lead.message]:[]),
 ].join("\n");
 const title=(q?q.offerSnapshot?.name ?? qualificationLabel("need",q.need):lead.objective || qualificationLabel("need",fallbackService)).slice(0,160);
 const [request]=await tx.insert(serviceRequests).values({customerId:user.id,leadId,title,service:q?.need ?? fallbackService,brief,offerSnapshot:q?.offerSnapshot ?? null}).onConflictDoNothing({target:serviceRequests.leadId}).returning({id:serviceRequests.id});
 if(request)await tx.insert(requestEvents).values({requestId:request.id,type:"created",actorName:user.name,body:"Votre demande a été rattachée à votre espace.",status:"received"});
 return request?.id;
}
export async function claimPendingLead(tx:Tx,token:string|undefined,user:CustomerIdentity){
 if(!token || !/^[A-Za-z0-9_-]{43}$/.test(token))return;
 const [claim]=await tx.select().from(customerLeadClaims).where(and(eq(customerLeadClaims.tokenHash,customerTokenHash(token)),gt(customerLeadClaims.expiresAt,new Date()),isNull(customerLeadClaims.claimedAt))).for("update");
 if(!claim)return;
 const requestId=await attachLeadToCustomer(tx,claim.leadId,user);
 await tx.update(customerLeadClaims).set({claimedAt:new Date(),customerId:user.id}).where(eq(customerLeadClaims.tokenHash,claim.tokenHash));
 return requestId;
}
