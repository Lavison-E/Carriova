"use server";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { renderTransactionalEmail } from "@/lib/transactional-email.mjs";
import { scheduleWorkspaceNotifications } from "@/lib/workspace-mail";
import { serverEnv } from "@/lib/env";
import { customerResetTokens, customerSessions, customerUsers } from "@/db/customer-schema";
import { CLAIM_COOKIE, CUSTOMER_COOKIE, CUSTOMER_SESSION_SECONDS, customerTokenHash, requireCustomer, CustomerUnauthorizedError, type CustomerIdentity } from "@/lib/customer-auth";
import { claimPendingLead } from "@/lib/customer-claims";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/lib/staff-password.mjs";
import { isEmail } from "@/lib/security";
import type { ActionState } from "@/lib/actions";
const unavailable={ok:false,message:"Votre espace est temporairement indisponible. Réessayez dans un instant."};
const invalid={ok:false,message:"Adresse e-mail ou mot de passe incorrect."};
const value=(fd:FormData,key:string)=>typeof fd.get(key)==="string" ? fd.get(key) as string:"";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function allowed(email:string,scope:string){
 const h=await headers();const ip=(h.get("x-forwarded-for")?.split(",")[0]??h.get("x-real-ip")??"unknown").trim().slice(0,100);
 await getDb().execute(sql`DELETE FROM staff_login_attempts WHERE reset_at < now() - interval '1 day'`);
 for(const [key,limit] of [["customer:"+scope+":ip:"+ip,30],["customer:"+scope+":email:"+email,8]] as const){
  const result=await getDb().execute(sql`INSERT INTO staff_login_attempts(key,attempts,reset_at) VALUES(${customerTokenHash(key)},1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN staff_login_attempts.reset_at<=now() THEN 1 ELSE staff_login_attempts.attempts+1 END,reset_at=CASE WHEN staff_login_attempts.reset_at<=now() THEN now()+interval '15 minutes' ELSE staff_login_attempts.reset_at END RETURNING attempts`);
  if(Number(result.rows[0]?.attempts)>limit)return false;
 }
 return true;
}
function cookieOptions(){return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge:CUSTOMER_SESSION_SECONDS};}
async function makeSession(tx:Tx,user:CustomerIdentity,previous:string|undefined,pending:string|undefined){
 if(previous)await tx.delete(customerSessions).where(eq(customerSessions.tokenHash,customerTokenHash(previous)));
 await tx.delete(customerSessions).where(sql`${customerSessions.expiresAt} <= now()`);
 const token=randomBytes(32).toString("base64url");
 await tx.insert(customerSessions).values({tokenHash:customerTokenHash(token),userId:user.id,expiresAt:new Date(Date.now()+CUSTOMER_SESSION_SECONDS*1000)});
 await claimPendingLead(tx,pending,user);
 return token;
}
export async function customerSignup(_prev:ActionState,fd:FormData):Promise<ActionState>{
 const name=value(fd,"name").trim(),email=value(fd,"email").trim().toLowerCase(),password=value(fd,"password");
 const errors:Record<string,string>={};
 if(name.length<2||name.length>120)errors.name="Indiquez votre nom (2 à 120 caractères).";
 if(!isEmail(email)||email.length>255)errors.email="Indiquez une adresse e-mail valide.";
 if(password.length<8||password.length>256)errors.password="Choisissez un mot de passe de 8 à 256 caractères.";
 if(password!==value(fd,"confirmPassword"))errors.confirmPassword="Les mots de passe doivent être identiques.";
 if(!["on","true"].includes(value(fd,"consentPrivacy")))errors.consentPrivacy="Votre accord est nécessaire pour créer votre espace.";
 if(Object.keys(errors).length)return {ok:false,message:"Vérifiez les champs indiqués.",fieldErrors:errors};
 if(!databaseConfigured)return unavailable;
 try{
  if(!await allowed(email,"signup"))return {ok:false,message:"Trop de tentatives. Réessayez dans quinze minutes."};
  const passwordHash=await hashPassword(password,{minLength:8}),jar=await cookies();
  const token=await getDb().transaction(async tx=>{
   const [user]=await tx.insert(customerUsers).values({name,email,passwordHash,consentPrivacy:true,consentMarketing:["on","true"].includes(value(fd,"consentMarketing")),consentVersion:"2026-10-18"}).onConflictDoNothing({target:customerUsers.email}).returning({id:customerUsers.id,email:customerUsers.email,name:customerUsers.name});
   if(!user)return null;
   return makeSession(tx,user,jar.get(CUSTOMER_COOKIE)?.value,jar.get(CLAIM_COOKIE)?.value);
  });
  if(!token)return {ok:false,message:"La création n’a pas abouti. Si vous avez déjà un compte, connectez-vous ou utilisez la récupération du mot de passe."};
  jar.set(CUSTOMER_COOKIE,token,cookieOptions());jar.set(CLAIM_COOKIE,"",{...cookieOptions(),maxAge:0});
 }catch{return unavailable;}
 scheduleWorkspaceNotifications();
 redirect("/espace");
}
export async function customerLogin(_prev:ActionState,fd:FormData):Promise<ActionState>{
 const email=value(fd,"email").trim().toLowerCase(),password=value(fd,"password");
 if(!isEmail(email)||email.length>255||!password||password.length>256)return invalid;
 if(!databaseConfigured)return unavailable;
 try{
  if(!await allowed(email,"login"))return {ok:false,message:"Trop de tentatives. Réessayez dans quinze minutes."};
  const [user]=await getDb().select().from(customerUsers).where(eq(customerUsers.email,email)).limit(1);
  const valid=await verifyPassword(password,user?.passwordHash??DUMMY_PASSWORD_HASH);
  if(!user||!valid||!user.enabled)return invalid;
  const jar=await cookies();
  const token=await getDb().transaction(async tx=>{
   // Serialize session creation with password changes and recovery on the user row.
   const [current]=await tx.select().from(customerUsers).where(eq(customerUsers.id,user.id)).for("update");
   if(!current||!current.enabled||current.passwordHash!==user.passwordHash)return null;
   return makeSession(tx,current,jar.get(CUSTOMER_COOKIE)?.value,jar.get(CLAIM_COOKIE)?.value);
  });
  if(!token)return invalid;
  jar.set(CUSTOMER_COOKIE,token,cookieOptions());jar.set(CLAIM_COOKIE,"",{...cookieOptions(),maxAge:0});
 }catch{return unavailable;}
 scheduleWorkspaceNotifications();
 redirect("/espace");
}
export async function customerLogout(){
 const jar=await cookies(),token=jar.get(CUSTOMER_COOKIE)?.value;
 if(token&&databaseConfigured)await getDb().delete(customerSessions).where(eq(customerSessions.tokenHash,customerTokenHash(token)));
 jar.set(CUSTOMER_COOKIE,"",{...cookieOptions(),maxAge:0});redirect("/compte/connexion");
}
export async function customerChangePassword(_prev:ActionState,fd:FormData):Promise<ActionState>{
 try{
  const user=await requireCustomer(),current=value(fd,"currentPassword"),password=value(fd,"newPassword");
  if(password.length<8||password.length>256||password!==value(fd,"confirmPassword"))return {ok:false,message:"Le nouveau mot de passe doit contenir au moins 8 caractères et être confirmé à l’identique."};
  if(!await allowed(user.email,"password"))return {ok:false,message:"Trop de tentatives. Réessayez dans quinze minutes."};
  const [record]=await getDb().select().from(customerUsers).where(and(eq(customerUsers.id,user.id),eq(customerUsers.enabled,true))).limit(1);
  if(!record||!await verifyPassword(current,record.passwordHash))return {ok:false,message:"Le mot de passe actuel est incorrect."};
  const passwordHash=await hashPassword(password,{minLength:8}),jar=await cookies();
  const token=await getDb().transaction(async tx=>{
   const [changed]=await tx.update(customerUsers).set({passwordHash}).where(and(eq(customerUsers.id,user.id),eq(customerUsers.passwordHash,record.passwordHash),eq(customerUsers.enabled,true))).returning({id:customerUsers.id});
   if(!changed)throw new Error("Concurrent credential change");
   // The update locks the user first; recovery uses the same user -> token order.
   await tx.delete(customerResetTokens).where(eq(customerResetTokens.userId,user.id));
   await tx.delete(customerSessions).where(eq(customerSessions.userId,user.id));
   return makeSession(tx,user,undefined,undefined);
  });
  jar.set(CUSTOMER_COOKIE,token,cookieOptions());return {ok:true,message:"Votre mot de passe a été modifié. Les autres sessions ont été déconnectées."};
 }catch(error){if(error instanceof CustomerUnauthorizedError)redirect("/compte/connexion");return unavailable;}
}

export async function customerRequestReset(_prev:ActionState,fd:FormData):Promise<ActionState>{
 const email=value(fd,"email").trim().toLowerCase();
 if(!isEmail(email)||email.length>255)return {ok:false,message:"Indiquez une adresse e-mail valide."};
 if(!databaseConfigured)return unavailable;
 if(!serverEnv.email.transactionalEnabled)return {ok:false,message:"La récupération par e-mail est temporairement indisponible. Contactez l’équipe Carriova pour retrouver votre accès."};
 const response={ok:true,message:"Si cette adresse correspond à un compte, consultez vos e-mails pour poursuivre. Vérifiez aussi les courriers indésirables ; contactez l’équipe si aucun message n’arrive."};
 try{
  if(!await allowed(email,"recovery"))return {ok:false,message:"Trop de demandes. Réessayez dans quinze minutes."};
  const token=randomBytes(32).toString("base64url");
  const issued=await getDb().transaction(async tx=>{
   const [user]=await tx.select({id:customerUsers.id}).from(customerUsers)
    .where(and(eq(customerUsers.email,email),eq(customerUsers.enabled,true))).for("update");
   if(!user)return false;
   await tx.delete(customerResetTokens).where(eq(customerResetTokens.userId,user.id));
   await tx.insert(customerResetTokens).values({tokenHash:customerTokenHash(token),userId:user.id,expiresAt:new Date(Date.now()+30*60*1000)});
   return true;
  });
  if(!issued)return response;
  const url=new URL("/compte/recuperer",serverEnv.NEXT_PUBLIC_SITE_URL);url.searchParams.set("token",token);
  const text="Pour choisir un nouveau mot de passe Carriova, ouvrez ce lien dans les 30 prochaines minutes : "+url.href+"\nSi vous n’avez pas demandé cette réinitialisation, ignorez cet e-mail.";
  await fetch(serverEnv.email.baseUrl.replace(/\/$/,"")+"/emails",{
   method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+serverEnv.email.apiKey,"Idempotency-Key":"customer-reset/"+customerTokenHash(token)},
   body:JSON.stringify({from:serverEnv.email.transactionalFrom,reply_to:serverEnv.SUPPORT_EMAIL||serverEnv.CONTACT_EMAIL,to:[email],subject:"Retrouvez votre espace Carriova",text,
    html:renderTransactionalEmail({title:"Retrouvez votre espace Carriova",body:"Vous avez demandé à choisir un nouveau mot de passe. Ce lien est valable pendant 30 minutes et ne peut être utilisé qu’une fois.",actionLabel:"Choisir mon mot de passe",actionUrl:url.href,supportEmail:serverEnv.SUPPORT_EMAIL||serverEnv.CONTACT_EMAIL,note:"Si vous n’avez pas demandé cette réinitialisation, ignorez cet e-mail."})}),
   signal:AbortSignal.timeout(8000),cache:"no-store",
  }).catch(()=>undefined);
  return response;
 }catch{return unavailable;}
}
export async function customerResetPassword(_prev:ActionState,fd:FormData):Promise<ActionState>{
 const token=value(fd,"token"),password=value(fd,"password");
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))return {ok:false,message:"Ce lien de récupération est invalide ou expiré."};
 if(password.length<8||password.length>256||password!==value(fd,"confirmPassword"))return {ok:false,message:"Choisissez au moins 8 caractères et confirmez le mot de passe à l’identique."};
 if(!databaseConfigured)return unavailable;
 try{
  if(!await allowed(customerTokenHash(token),"reset"))return {ok:false,message:"Trop de tentatives. Réessayez dans quinze minutes."};
  const passwordHash=await hashPassword(password,{minLength:8});
  const reset=await getDb().transaction(async tx=>{
   const hashedToken=customerTokenHash(token);
   // Discover the owner without locking the token, then always lock user before token.
   const [candidate]=await tx.select({userId:customerResetTokens.userId}).from(customerResetTokens)
    .where(eq(customerResetTokens.tokenHash,hashedToken)).limit(1);
   if(!candidate)return false;
   const [user]=await tx.select({id:customerUsers.id,enabled:customerUsers.enabled}).from(customerUsers)
    .where(eq(customerUsers.id,candidate.userId)).for("update");
   if(!user?.enabled)return false;
   const [record]=await tx.select({tokenHash:customerResetTokens.tokenHash}).from(customerResetTokens)
    .where(and(eq(customerResetTokens.tokenHash,hashedToken),eq(customerResetTokens.userId,user.id),gt(customerResetTokens.expiresAt,new Date()),isNull(customerResetTokens.usedAt))).for("update");
   if(!record)return false;
   await tx.update(customerUsers).set({passwordHash}).where(eq(customerUsers.id,user.id));
   await tx.delete(customerResetTokens).where(eq(customerResetTokens.userId,user.id));
   await tx.delete(customerSessions).where(eq(customerSessions.userId,user.id));
   return true;
  });
  if(!reset)return {ok:false,message:"Ce lien de récupération est invalide ou expiré."};
  (await cookies()).set(CUSTOMER_COOKIE,"",{...cookieOptions(),maxAge:0});
  return {ok:true,message:"Votre mot de passe a été modifié. Connectez-vous avec votre nouveau mot de passe."};
 }catch{return unavailable;}
}
