const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript: load } = require("./helpers/crm-fixture.cjs");
const countries = load("src/lib/countries.ts");
const profileLib = load("src/lib/career-profile.ts", { "@/lib/countries": countries });
const whatsapp = load("src/lib/whatsapp.ts", { "@/lib/countries": countries });
const { createEmptyCareerProfile: empty, parseCareerProfile: parse, isProfileReadyForMatching: ready, profileCompletion, CareerProfileValidationError } = profileLib;

test("WhatsApp normalization preserves country rules and rejects malformed input", () => {
  for (const [number, country, expected] of [
    ["07 00 00 00 00", "CI", "+2250700000000"], ["+225 07 00 00 00 00", "CI", "+2250700000000"],
    ["00225 07 00 00 00 00", "CI", "+2250700000000"], ["06 01 02 03 04", "FR", "+33601020304"],
    ["+233241234567", "CI", "+233241234567"],
  ]) assert.equal(whatsapp.normalizeWhatsApp(number, country), expected);
  for (const [number, country] of [["", "CI"], ["1234", "CI"], ["+2250700000000", "ZZ"], ["Call +2250700000000", "CI"], ["+2250700000000 ext 12", "CI"], ["+2250700000000<script>", "CI"], ["1".repeat(41), "CI"], [12345, "CI"]]) assert.equal(whatsapp.normalizeWhatsApp(number, country), null);
  assert.equal(whatsapp.whatsAppCountryFor("+33601020304"), "FR");
  assert.equal(whatsapp.whatsAppCountryFor(null), "CI");
});
test("partial profiles, matching readiness and completion describe different things", () => {
  assert.deepEqual(parse(empty()), empty());assert.equal(ready(empty()), false);assert.equal(profileCompletion(empty()), 0);
  const value = parse({ ...empty(), targetRoles: [" Comptable ", "Comptable"], targetCountries: ["ci", "FR", "CI"], experienceLevel: "junior" });
  assert.deepEqual(value.targetRoles, ["Comptable"]);assert.deepEqual(value.targetCountries, ["CI", "FR"]);assert.equal(ready(value), true);assert.ok(profileCompletion(value) < 100);
  for (const override of [{targetRoles: []}, {targetCountries: []}, {experienceLevel: ""}]) assert.equal(ready({...value,...override}), false);
});
test("profile schema rejects invalid countries, enums, oversized data and forged CV identifiers", () => {
  for (const patch of [
    { targetRoles: Array(6).fill("Poste") }, { targetRoles: ["x".repeat(121)] }, { skills: Array(41).fill("Excel") },
    { countryCode: "ZZ" }, { targetCountries: ["Africa"] }, { targetCountries: Array(11).fill("CI") },
    { experienceLevel: "admin" }, { contractTypes: ["unknown"] }, { workModes: ["anywhere"] },
    { professionalSummary: "x".repeat(3001) }, { educationSummary: "x".repeat(2001) }, { availability: "x".repeat(161) },
    { languages: Array(13).fill({name:"Français",level:"B2"}) }, { languages: [{name:"a",level:4}] },
    { cvDocumentId: -1 }, { cvDocumentId: "123" }, { cvDocumentId: 1.4 }, { city: "A\u0000B" },
  ]) assert.throws(() => parse({...empty(),...patch}), CareerProfileValidationError);
  assert.throws(() => parse({...empty(),extra:"x".repeat(40001)}), CareerProfileValidationError);
  for (const value of [-1, 1.1, "0", null, 2147483647]) assert.throws(() => profileLib.parseCareerProfileVersion(value), CareerProfileValidationError);
  assert.deepEqual(parse({...empty(),customerId:999,admin:true}), empty());
});

test("private career profiles: owner access, CV ownership, version conflicts and migrations", async t => {
  const pg = new PGlite();t.after(() => pg.close());await pg.exec(CORE_LEADS_SQL);
  for (const file of ["20261018_customer.sql", "20261018_cv.sql", "20261022_career_profile.sql"]) await pg.exec(readFileSync(require("node:path").resolve(__dirname, "../migrations/" + file), "utf8"));
  const migration = readFileSync(require("node:path").resolve(__dirname,"../migrations/20261022_career_profile.sql"),"utf8");await pg.exec(migration);
  const db = drizzle(pg), core = load("src/db/schema.ts");
  const customerSchema = load("src/db/customer-schema.ts", { "./schema": core });
  const cvSchema = load("src/db/cv-schema.ts", { "./customer-schema": customerSchema });
  const profileSchema = load("src/db/career-profile-schema.ts", { "./customer-schema": customerSchema });
  const users = (await pg.query("INSERT INTO customer_users(email,name,password_hash,consent_privacy,consent_version) VALUES('first@example.test','Premier','test',true,'test'),('second@example.test','Second','test',true,'test') RETURNING id,email,name")).rows;
  let current = null, accesses = 0;
  class Unauthorized extends Error {}
  class Redirect extends Error { constructor(path) { super(path);this.path = path; } }
  const auth = { CustomerUnauthorizedError: Unauthorized, requireCustomer: async () => { if (!current) throw new Unauthorized(); return current; } };
  const mocks = { "server-only": {}, "@/db": { getDb: () => { accesses++;return db; } }, "@/db/customer-schema": customerSchema, "@/db/cv-schema": cvSchema, "@/db/career-profile-schema": profileSchema, "@/lib/career-profile": profileLib, "@/lib/customer-auth": auth, "next/cache": { revalidatePath() {} }, "next/navigation": { redirect(path) { throw new Redirect(path); } } };
  const actions = load("src/lib/career-profile-actions.ts", mocks), queries = load("src/lib/career-profile-queries.ts", mocks);
  const fd = (profile, version, extra = {}) => { const data = new FormData();data.set("content", JSON.stringify(profile));data.set("version", String(version));for(const [key,value] of Object.entries(extra))data.set(key,String(value));return data; };
  let ownCv, otherCv;
  await t.test("anonymous reads and saves are denied before database access", async () => {
    await assert.rejects(queries.getCustomerCareerProfile(), Unauthorized);await assert.rejects(queries.getCustomerWhatsApp(), Unauthorized);
    await assert.rejects(actions.saveCareerProfile({},fd(empty(),0)), e => e instanceof Redirect && e.path === "/compte/connexion");assert.equal(accesses,0);
  });
  await t.test("legacy accounts have no required WhatsApp and an empty profile until first save", async () => {
    current=users[0];assert.equal(await queries.getCustomerWhatsApp(),null);
    assert.deepEqual(await queries.getCustomerCareerProfile(),{profile:empty(),version:0,updatedAt:null});
    const saved=await actions.saveCareerProfile({},fd(empty(),0));assert.equal(saved.ok,true);assert.equal(saved.record.version,1);
  });
  await t.test("first creation, writes and reads cannot select another owner from form data", async () => {
    current=users[1];assert.equal((await queries.getCustomerCareerProfile()).version,0);
    const content={...empty(),targetRoles:["Analyste"],targetCountries:["CI"],experienceLevel:"entry",customerId:users[0].id};
    const saved=await actions.saveCareerProfile({},fd(content,0,{customerId:users[0].id}));assert.equal(saved.ok,true);
    assert.deepEqual((await queries.getCustomerCareerProfile()).profile.targetRoles,["Analyste"]);
    current=users[0];assert.deepEqual((await queries.getCustomerCareerProfile()).profile.targetRoles,[]);
  });
  await t.test("stale versions cannot overwrite a newer saved profile", async () => {
    const saved=await actions.saveCareerProfile({},fd({...empty(),city:"Abidjan"},1));assert.equal(saved.ok,true);assert.equal(saved.record.version,2);
    const stale=await actions.saveCareerProfile({},fd({...empty(),city:"Dakar"},1));assert.equal(stale.ok,false);assert.equal(stale.conflict,true);
    const currentRecord=await queries.getCustomerCareerProfile();assert.equal(currentRecord.profile.city,"Abidjan");assert.equal(currentRecord.version,2);
  });
  await t.test("a CV must belong to the authenticated customer", async () => {
    ownCv=(await pg.query("INSERT INTO cv_documents(customer_id,title,content) VALUES($1,'CV personnel','{}') RETURNING id",[users[0].id])).rows[0].id;
    otherCv=(await pg.query("INSERT INTO cv_documents(customer_id,title,content) VALUES($1,'CV privé autre compte','{}') RETURNING id",[users[1].id])).rows[0].id;
    const denied=await actions.saveCareerProfile({},fd({...empty(),cvDocumentId:otherCv},2));assert.equal(denied.ok,false);assert.ok(denied.fieldErrors.cvDocumentId);
    assert.equal((await queries.getCustomerCareerProfile()).version,2);
    const saved=await actions.saveCareerProfile({},fd({...empty(),cvDocumentId:ownCv},2));assert.equal(saved.ok,true);assert.equal(saved.record.version,3);
  });
  await t.test("deleted CVs do not prevent reading or unlinking the saved profile", async () => {
    await pg.query("DELETE FROM cv_documents WHERE id=$1",[ownCv]);
    const loaded=await queries.getCustomerCareerProfile();assert.equal(loaded.profile.cvDocumentId,ownCv);
    const staleCv=await actions.saveCareerProfile({},fd(loaded.profile,3));assert.equal(staleCv.ok,false);assert.ok(staleCv.fieldErrors.cvDocumentId);
    const unlinked=await actions.saveCareerProfile({},fd({...loaded.profile,cvDocumentId:null},3));assert.equal(unlinked.ok,true);
  });
  await t.test("disabled accounts cannot write even after a prior session check", async () => {
    await pg.query("UPDATE customer_users SET enabled=false WHERE id=$1",[users[0].id]);
    await assert.rejects(actions.saveCareerProfile({},fd(empty(),4)), Redirect);
    assert.equal((await pg.query("SELECT version FROM customer_career_profiles WHERE customer_id=$1",[users[0].id])).rows[0].version,4);
  });
  await t.test("invalid profiles never create a new version and account deletion cascades", async () => {
    current=users[1];const bad=await actions.saveCareerProfile({},fd({...empty(),targetCountries:["ZZ"]},1));assert.equal(bad.ok,false);assert.ok(bad.fieldErrors.targetCountries);
    assert.equal((await queries.getCustomerCareerProfile()).version,1);
    await pg.query("DELETE FROM customer_users WHERE id=$1",[users[1].id]);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM customer_career_profiles WHERE customer_id=$1",[users[1].id])).rows[0].n,0);
  });
});
