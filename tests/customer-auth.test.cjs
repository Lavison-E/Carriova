const assert=require("node:assert/strict");
const test=require("node:test");
const {randomBytes}=require("node:crypto");
const {PGlite}=require("@electric-sql/pglite");
const {drizzle}=require("drizzle-orm/pglite");
const {CORE_LEADS_SQL,loadTypeScript:load,migrationClient}=require("./helpers/crm-fixture.cjs");

test("Customer accounts and pending-request ownership",async t=>{
 const pg=new PGlite();t.after(()=>pg.close());await pg.exec(CORE_LEADS_SQL);
 const {migrateCrm}=await import("../scripts/migrate-crm.mjs");await migrateCrm(migrationClient(pg));
 const db=drizzle(pg),core=load("src/db/schema.ts");
 const customerSchema=load("src/db/customer-schema.ts",{"./schema":core});
 const crm=load("src/db/crm-schema.ts",{"./schema":core});
 const workspace=load("src/db/workspace-schema.ts",{"./schema":core,"./customer-schema":customerSchema});
 const qualification=load("src/lib/qualification.ts", { "@/lib/countries": load("src/lib/countries.ts") });
 const passwords=await import("../src/lib/staff-password.mjs");
 const values=new Map();let lastCookie;
 const jar={get:name=>values.has(name)?{value:values.get(name)}:undefined,set(name,value,options){values.set(name,value);lastCookie={name,value,options};}};
 const base={"server-only":{},"@/db":{databaseConfigured:true,getDb:()=>db},"@/db/customer-schema":customerSchema,"next/headers":{cookies:async()=>jar,headers:async()=>new Headers({"x-forwarded-for":"127.0.0.5"})}};
 const auth=load("src/lib/customer-auth.ts",base);
 const claims=load("src/lib/customer-claims.ts",{...base,"@/lib/customer-auth":auth,"@/db/schema":core,"@/db/crm-schema":crm,"@/db/workspace-schema":workspace,"@/lib/qualification":qualification});
 class Redirect extends Error{constructor(path){super(path);this.path=path;}}
 const env={NEXT_PUBLIC_SITE_URL:"https://carriova.example",CONTACT_EMAIL:"contact@example.test",SUPPORT_EMAIL:"support@example.test",email:{enabled:false,transactionalEnabled:false,transactionalFrom:"Carriova <noreply@example.test>",baseUrl:"https://api.resend.com",apiKey:"fictional-test-key",from:"Carriova <noreply@example.test>"}};
 const renderer=await import("../src/lib/transactional-email.mjs");
 const actionMocks={...base,"@/lib/transactional-email.mjs":renderer,"@/lib/workspace-mail":{scheduleWorkspaceNotifications(){}},"@/lib/customer-auth":auth,"@/lib/customer-claims":claims,"@/lib/staff-password.mjs":passwords,"@/lib/security":load("src/lib/security.ts"),"@/lib/env":{serverEnv:env},"next/navigation":{redirect(path){throw new Redirect(path);}}};
 const whatsapp=load("src/lib/whatsapp.ts",{"@/lib/countries":load("src/lib/countries.ts")});
 actionMocks["@/lib/whatsapp"]=whatsapp;actionMocks["next/cache"]={revalidatePath(){}};
 const actions=load("src/lib/customer-actions.ts",actionMocks);
 const fd=data=>{const form=new FormData();for(const[k,v]of Object.entries(data))form.set(k,v);return form;};
 const password="Local-customer-test-passphrase";
 const signup=(email,name="Client de test")=>actions.customerSignup({},fd({name,email,password,confirmPassword:password,consentPrivacy:"on",whatsappCountry:"CI",whatsapp:"07 00 00 00 00"}));
 let customerId,ownedRequestId,claimedToken;
 await t.test("anonymous and staff cookies never grant customer access",async()=>{
  assert.equal(await auth.getCustomerSession(),null);values.set("carriova_staff",randomBytes(32).toString("base64url"));
  assert.equal(await auth.getCustomerSession(),null);await assert.rejects(auth.requireCustomer(),auth.CustomerUnauthorizedError);
 });
 await t.test("signup claims only the bearer request, never historical leads matching email",async()=>{
  const raw=randomBytes(32).toString("base64url");
  const lead=(await pg.query("INSERT INTO leads(first_name,email,type) VALUES('Demande test','','qualification') RETURNING id")).rows[0];
  await pg.query("INSERT INTO lead_qualifications(lead_id,country,profile,discovery_source,need,cv_status,timeline,budget,payment_readiness,contact_whatsapp,consent_version,privacy_notice) VALUES($1,'cote_ivoire','job_seeker','linkedin','improve_cv','improve','week','10000_20000','discuss',false,'2026-10-18','Consentement test')",[lead.id]);
  await pg.query("INSERT INTO leads(first_name,email,type) VALUES('Historique privé','client@example.test','contact')");
  await pg.query("INSERT INTO customer_lead_claims(token_hash,lead_id,expires_at) VALUES($1,$2,now()+interval '1 day')",[auth.customerTokenHash(raw),lead.id]);
  claimedToken=raw;values.set(auth.CLAIM_COOKIE,raw);
  await assert.rejects(signup("client@example.test"),e=>e instanceof Redirect&&e.path==="/espace");
  const user=await auth.getCustomerSession();customerId=user.id;assert.equal(user.email,"client@example.test");assert.equal(user.passwordHash,undefined);
  const rows=(await pg.query("SELECT * FROM service_requests")).rows;assert.equal(rows.length,1);assert.equal(rows[0].customer_id,customerId);assert.equal(rows[0].lead_id,lead.id);ownedRequestId=rows[0].id;
  assert.equal(values.get(auth.CLAIM_COOKIE),"");
  assert.equal((await pg.query("SELECT customer_id FROM customer_lead_claims")).rows[0].customer_id,customerId);
  assert.equal((await pg.query("SELECT count(*)::int AS n FROM request_events")).rows[0].n,1);
 });
 await t.test("WhatsApp is required for new accounts, normalized and separate from marketing",async()=>{
  const stored=(await pg.query("SELECT whatsapp,consent_marketing,consent_version FROM customer_users WHERE id=$1",[customerId])).rows[0];
  assert.equal(stored.whatsapp,"+2250700000000");assert.equal(stored.consent_marketing,false);assert.equal(stored.consent_version,"2026-10-22");
  for(const whatsapp of ["", "invalid", "+22512", "0700000000<script>"]){
   const result=await actions.customerSignup({},fd({name:"Numéro test",email:"missing-phone@example.test",password,confirmPassword:password,consentPrivacy:"on",whatsappCountry:"CI",whatsapp}));
   assert.equal(result.ok,false);assert.ok(result.fieldErrors.whatsapp);
  }
  assert.equal((await pg.query("SELECT count(*)::int AS n FROM customer_users WHERE email='missing-phone@example.test'")).rows[0].n,0);
 });
 await t.test("WhatsApp updates affect only the authenticated account and reject stale changes",async()=>{
  const other=(await pg.query("INSERT INTO customer_users(email,name,password_hash,consent_privacy,consent_version) VALUES('phone-owner@example.test','Autre compte','unused',true,'2026-10-18') RETURNING id")).rows[0];
  const changed=await actions.customerUpdateWhatsApp({},fd({customerId:String(other.id),whatsappCountry:"FR",whatsapp:"06 01 02 03 04",expectedWhatsApp:"+2250700000000",consentMarketing:"on"}));
  assert.equal(changed.ok,true);assert.equal(changed.whatsapp,"+33601020304");
  const own=(await pg.query("SELECT whatsapp,consent_marketing FROM customer_users WHERE id=$1",[customerId])).rows[0];
  assert.equal(own.whatsapp,"+33601020304");assert.equal(own.consent_marketing,false);
  assert.equal((await pg.query("SELECT whatsapp FROM customer_users WHERE id=$1",[other.id])).rows[0].whatsapp,null);
  const stale=await actions.customerUpdateWhatsApp({},fd({whatsappCountry:"CI",whatsapp:"0700000000",expectedWhatsApp:"+2250700000000"}));
  assert.equal(stale.ok,false);assert.match(stale.message,/autre fenêtre/);
  const session=values.get(auth.CUSTOMER_COOKIE);values.delete(auth.CUSTOMER_COOKIE);
  await assert.rejects(actions.customerUpdateWhatsApp({},fd({whatsappCountry:"CI",whatsapp:"0700000000",expectedWhatsApp:""})),Redirect);
  values.set(auth.CUSTOMER_COOKIE,session);
 });
 await t.test("pending token is single use and cannot transfer ownership",async()=>{
  const second=(await pg.query("INSERT INTO customer_users(email,name,password_hash,consent_privacy,consent_version) VALUES('second@example.test','Second test','unused',true,'2026-10-18') RETURNING id")).rows[0];
  await db.transaction(tx=>claims.claimPendingLead(tx,claimedToken,{id:second.id,name:"Second test",email:"second@example.test"}));
  const forged=randomBytes(32).toString("base64url");
  await db.transaction(tx=>claims.claimPendingLead(tx,forged,{id:second.id,name:"Second test",email:"second@example.test"}));
  assert.equal((await pg.query("SELECT customer_id FROM service_requests WHERE id=$1",[ownedRequestId])).rows[0].customer_id,customerId);
 });
 await t.test("duplicate signup leaves the existing password and requests untouched",async()=>{
  const before=(await pg.query("SELECT password_hash FROM customer_users WHERE id=$1",[customerId])).rows[0].password_hash;
  const result=await signup("client@example.test");assert.equal(result.ok,false);
  assert.equal((await pg.query("SELECT password_hash FROM customer_users WHERE id=$1",[customerId])).rows[0].password_hash,before);
  assert.equal((await pg.query("SELECT count(*)::int AS n FROM service_requests")).rows[0].n,1);
 });
 await t.test("session cookies are HttpOnly and logout revokes the database session",async()=>{
  await assert.rejects(actions.customerLogout(),Redirect);assert.equal(await auth.getCustomerSession(),null);
  await assert.rejects(actions.customerLogin({},fd({email:"client@example.test",password})),Redirect);
  assert.equal(lastCookie.options.httpOnly,true);assert.equal(lastCookie.options.sameSite,"lax");assert.equal(lastCookie.options.path,"/");
  assert.equal((await pg.query("SELECT count(*)::int AS n FROM customer_sessions WHERE user_id=$1",[customerId])).rows[0].n,1);
  await pg.query("UPDATE customer_users SET enabled=false WHERE id=$1",[customerId]);assert.equal(await auth.getCustomerSession(),null);
  await pg.query("UPDATE customer_users SET enabled=true WHERE id=$1",[customerId]);
 });
 await t.test("recovery fails honestly without a configured mail provider",async()=>{
  const result=await actions.customerRequestReset({},fd({email:"client@example.test"}));assert.equal(result.ok,false);assert.match(result.message,/indisponible/);
 });
 await t.test("single-use reset replaces password and revokes all customer sessions",async()=>{
  env.email.enabled=true;env.email.transactionalEnabled=true;let mailed;
  const previousFetch=global.fetch;global.fetch=async(_url,init)=>{mailed=JSON.parse(init.body);return new Response("{}",{status:200});};
  try{
   const result=await actions.customerRequestReset({},fd({email:"client@example.test"}));assert.equal(result.ok,true);
  }finally{global.fetch=previousFetch;}
  assert.deepEqual(mailed.to,["client@example.test"]);
  assert.equal(mailed.from,env.email.transactionalFrom);assert.equal(mailed.reply_to,env.SUPPORT_EMAIL);assert.match(mailed.html,/<html/);
  const url=mailed.text.match(/https:\/\/[^\s]+/)[0];const token=new URL(url).searchParams.get("token");assert.ok(token);
  assert.equal((await pg.query("SELECT token_hash FROM customer_reset_tokens")).rows[0].token_hash,auth.customerTokenHash(token));
  const next="A-new-local-password-for-test";
  assert.equal((await actions.customerResetPassword({},fd({token,password:next,confirmPassword:next}))).ok,true);
  assert.equal((await pg.query("SELECT count(*)::int AS n FROM customer_sessions WHERE user_id=$1",[customerId])).rows[0].n,0);
  assert.equal((await actions.customerResetPassword({},fd({token,password:next,confirmPassword:next}))).ok,false);
  assert.equal((await actions.customerLogin({},fd({email:"client@example.test",password}))).ok,false);
  await assert.rejects(actions.customerLogin({},fd({email:"client@example.test",password:next})),Redirect);
 });
 async function seedAccount(email){
  const passwordHash=await passwords.hashPassword(password);
  const user=(await pg.query("INSERT INTO customer_users(email,name,password_hash,consent_privacy,consent_version) VALUES($1,'Client sécurité',$2,true,'2026-10-18') RETURNING id",[email,passwordHash])).rows[0];
  const session=randomBytes(32).toString("base64url");
  await pg.query("INSERT INTO customer_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",[auth.customerTokenHash(session),user.id]);
  values.clear();values.set(auth.CUSTOMER_COOKIE,session);
  return {id:user.id,email,session};
 }
 async function seedReset(userId){
  const token=randomBytes(32).toString("base64url");
  await pg.query("INSERT INTO customer_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[auth.customerTokenHash(token),userId]);
  return token;
 }
 async function counts(userId){
  return (await pg.query("SELECT (SELECT count(*)::int FROM customer_sessions WHERE user_id=$1) AS sessions, (SELECT count(*)::int FROM customer_reset_tokens WHERE user_id=$1) AS resets",[userId])).rows[0];
 }
 await t.test("an authenticated password change revokes all previously issued recovery links",async()=>{
  const user=await seedAccount("change-links@example.test");
  const tokens=[await seedReset(user.id),await seedReset(user.id)];
  const next="Changed-password-invalidates-old-links";
  const result=await actions.customerChangePassword({},fd({currentPassword:password,newPassword:next,confirmPassword:next}));
  assert.equal(result.ok,true);
  assert.deepEqual(await counts(user.id),{sessions:1,resets:0});
  assert.notEqual(values.get(auth.CUSTOMER_COOKIE),user.session);
  for(const token of tokens)assert.equal((await actions.customerResetPassword({},fd({token,password,confirmPassword:password}))).ok,false);
  const stored=(await pg.query("SELECT password_hash FROM customer_users WHERE id=$1",[user.id])).rows[0];
  assert.equal(await passwords.verifyPassword(next,stored.password_hash),true);
 });
 await t.test("a successful reset revokes every outstanding token and session for the account",async()=>{
  const user=await seedAccount("reset-all@example.test");
  const first=await seedReset(user.id),other=await seedReset(user.id);
  const next="Reset-password-invalidates-all-links";
  assert.equal((await actions.customerResetPassword({},fd({token:first,password:next,confirmPassword:next}))).ok,true);
  assert.deepEqual(await counts(user.id),{sessions:0,resets:0});
  assert.equal((await actions.customerResetPassword({},fd({token:other,password,confirmPassword:password}))).ok,false);
 });
 await t.test("reissuing recovery links leaves only the newest link usable",async()=>{
  const user=await seedAccount("latest-reset@example.test");
  const mailed=[];
  const previousFetch=global.fetch;
  global.fetch=async(_url,init)=>{mailed.push(JSON.parse(init.body));return new Response("{}",{status:200});};
  try{
   assert.equal((await actions.customerRequestReset({},fd({email:user.email}))).ok,true);
   assert.equal((await actions.customerRequestReset({},fd({email:user.email}))).ok,true);
  }finally{global.fetch=previousFetch;}
  const tokens=mailed.map(mail=>new URL(mail.text.match(/https:\/\/[^\s]+/)[0]).searchParams.get("token"));
  assert.equal((await counts(user.id)).resets,1);
  const next="Only-the-latest-reset-link-is-accepted";
  assert.equal((await actions.customerResetPassword({},fd({token:tokens[0],password:next,confirmPassword:next}))).ok,false);
  assert.equal((await actions.customerResetPassword({},fd({token:tokens[1],password:next,confirmPassword:next}))).ok,true);
 });
 await t.test("a verified login cannot recreate a session after reset, change or disable",async()=>{
  for(const scenario of ["reset","change","disable"]){
   const user=await seedAccount(`concurrent-${scenario}@example.test`);
   const recovery=await seedReset(user.id);
   let reachedVerification,releaseVerification;
   const verified=new Promise(resolve=>{reachedVerification=resolve;});
   const gate=new Promise(resolve=>{releaseVerification=resolve;});
   const pausedActions=load("src/lib/customer-actions.ts",{...actionMocks,"@/lib/staff-password.mjs":{
    ...passwords,
    async verifyPassword(candidate,encoded){
     const valid=await passwords.verifyPassword(candidate,encoded);
     reachedVerification();
     await gate;
     return valid;
    },
   }});
   const attempt=pausedActions.customerLogin({},fd({email:user.email,password})).then(result=>({result}),error=>({error}));
   await verified;
   const next=`New-password-during-${scenario}-verification`;
   let expectedSessions=0;
   try{
    if(scenario==="reset")assert.equal((await actions.customerResetPassword({},fd({token:recovery,password:next,confirmPassword:next}))).ok,true);
    else if(scenario==="change"){
     assert.equal((await actions.customerChangePassword({},fd({currentPassword:password,newPassword:next,confirmPassword:next}))).ok,true);
     expectedSessions=1;
    }else{
     await pg.query("UPDATE customer_users SET enabled=false WHERE id=$1",[user.id]);
     await pg.query("DELETE FROM customer_sessions WHERE user_id=$1",[user.id]);
    }
   }finally{releaseVerification();}
   const outcome=await attempt;
   assert.equal(outcome.error,undefined,`${scenario}: stale verification must not redirect into a session`);
   assert.equal(outcome.result.ok,false,`${scenario}: old credentials must fail`);
   assert.equal((await counts(user.id)).sessions,expectedSessions,`${scenario}: no late session may survive revocation`);
  }
 });

 await t.test("customer signup, change and reset accept eight characters and reject seven",async()=>{
  const email="minimum-eight@example.test",short="Seven7!",initial="Client8!",changed="Change8!",reset="Reset88!";
  const signupData={name:"Client minimum",email,password:short,confirmPassword:short,consentPrivacy:"on",whatsappCountry:"CI",whatsapp:"07 00 00 00 00"};
  const rejected=await actions.customerSignup({},fd(signupData));
  assert.equal(rejected.ok,false);assert.ok(rejected.fieldErrors.password);
  assert.equal((await pg.query("SELECT count(*)::int AS n FROM customer_users WHERE email=$1",[email])).rows[0].n,0);
  values.clear();
  await assert.rejects(actions.customerSignup({},fd({...signupData,password:initial,confirmPassword:initial})),Redirect);
  const user=await auth.requireCustomer();
  assert.equal((await actions.customerChangePassword({},fd({currentPassword:initial,newPassword:short,confirmPassword:short}))).ok,false);
  assert.equal((await actions.customerChangePassword({},fd({currentPassword:initial,newPassword:changed,confirmPassword:changed}))).ok,true);
  const recovery=await seedReset(user.id);
  assert.equal((await actions.customerResetPassword({},fd({token:recovery,password:short,confirmPassword:short}))).ok,false);
  assert.equal((await actions.customerResetPassword({},fd({token:recovery,password:reset,confirmPassword:reset}))).ok,true);
  assert.deepEqual(await counts(user.id),{sessions:0,resets:0});
  await assert.rejects(actions.customerLogin({},fd({email,password:reset})),Redirect);
  assert.equal((await auth.requireCustomer()).id,user.id);
 });

});


test("shared password hashing keeps staff at fifteen and uses the same KDF for eight-character customer passwords",async()=>{
 const {hashPassword,verifyPassword}=await import("../src/lib/staff-password.mjs");
 const password="Client8!";
 await assert.rejects(hashPassword(password));
 await assert.rejects(hashPassword("12345678901234"));
 await assert.rejects(hashPassword("Seven7!",{minLength:8}));
 await assert.rejects(hashPassword("x".repeat(257),{minLength:8}));
 await assert.rejects(hashPassword(password,{minLength:1}));
 const hash=await hashPassword(password,{minLength:8});
 assert.match(hash,/^scrypt\$32768\$8\$3\$/);
 assert.equal(await verifyPassword(password,hash),true);
 assert.equal(await verifyPassword("Changed8",hash),false);
});
