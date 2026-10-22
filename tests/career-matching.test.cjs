const test = require("node:test");
const assert = require("node:assert/strict");
const {loadTypeScript:load} = require("./helpers/crm-fixture.cjs");
const opportunities = load("src/lib/opportunities.ts");
const {getCareerMatches:match} = load("src/lib/career-matching.ts", {"@/lib/opportunities":opportunities});
const now = Date.parse("2026-10-22T06:00:00Z");
function profile(patch={}) { return {targetRoles:["Comptable"],skills:[],experienceLevel:"mid",countryCode:"CI",city:"Abidjan",targetCountries:["CI"],contractTypes:[],workModes:[],languages:[],professionalSummary:"",educationSummary:"",availability:"",cvDocumentId:null,...patch}; }
function job(patch={}) { return {slug:"fictional-accounting",title:"Chef comptable",company:"Entreprise de test",location:"Abidjan",country:"Côte d’Ivoire",countryCode:"CI",contractType:"Contrat permanent",experience:"Confirmé",industry:"Finance & comptabilité",workMode:"Sur site",description:"Clôtures comptables et suivi des états financiers avec Excel.",publishedAt:"2026-10-20T12:00:00Z",updatedAt:"2026-10-20T12:00:00Z",expiresAt:null,sourceKind:"feed",sourceName:"Source officielle de test",sourceUrl:"https://example.test/job",reference:"TEST-1",verifiedAt:"2026-10-22T05:00:00Z",...patch}; }

test("minimum profile needs a role, target country and experience level",()=>{
  for (const patch of [{targetRoles:[]},{targetRoles:[" "]},{targetCountries:[]},{experienceLevel:""}]) assert.deepEqual(match(profile(patch),[job()],now),[]);
});
test("country alone, generic titles and common soft skills cannot produce a match",()=>{
  assert.deepEqual(match(profile({targetRoles:["Infirmier"],skills:["Organisation","Excel","Communication"]}),[job({description:"Organisation, communication et Excel."})],now),[]);
  assert.deepEqual(match(profile({targetRoles:["Responsable"],skills:[]}),[job({title:"Responsable comptable"})],now),[]);
});
test("known country, contract and work mode preferences are strict, including remote jobs",()=>{
  for(const [preferences,posting] of [[{targetCountries:["SN"]},{}],[{contractTypes:["internship"]},{}],[{workModes:["remote"]},{}],[{targetCountries:["SN"],workModes:["remote"]},{workMode:"Télétravail"}]]) assert.deepEqual(match(profile(preferences),[job(posting)],now),[]);
  assert.equal(match(profile({contractTypes:["permanent"],workModes:["onsite"]}),[job()],now).length,1);
  assert.equal(match(profile({contractTypes:["fixed_term"]}),[job({contractType:"Engagement à durée déterminée"})],now).length,1);
});
test("unknown criteria remain visible with explicit checks, remote with missions is not assumed fully remote",()=>{
  const [result]=match(profile({contractTypes:["permanent"],workModes:["remote"]}),[job({countryCode:"",contractType:"À consulter",workMode:"Télétravail et missions",experience:null})],now);
  assert.ok(result);
  for(const term of ["Pays", "contrat", "Mode de travail", "expérience", "clôture"]) assert.ok(result.checks.some(check=>check.includes(term)),term);
});
test("job title evidence ranks before a related sector when other evidence is equal",()=>{
  const indirect=job({slug:"a-related",title:"Responsable audit",publishedAt:"2026-10-21T12:00:00Z"});
  const direct=job({slug:"z-direct"});
  const results=match(profile(),[indirect,direct],now);
  assert.deepEqual(results.map(row=>row.opportunity.slug),["z-direct","a-related"]);
  assert.match(results[0].reasons.join(" "),/intitulé/);
  assert.match(results[1].reasons.join(" "),/domaine/);
  assert.deepEqual(Object.keys(results[0]).sort(),["checks","opportunity","reasons"]);
});
test("real mission text supplies exact skill evidence without substring matches",()=>{
  const source=job({industry:null,title:"Analyste reporting",description:"Analyse des opérations.",matchingText:"Pratique de SQL, Power BI et JavaScript."});
  const [result]=match(profile({targetRoles:["Ingénieur données"],skills:["SQL","Power BI","Java"]}),[source],now);
  assert.ok(result); assert.match(result.reasons.join(" "),/SQL, Power BI/); assert.doesNotMatch(result.reasons.join(" "),/Java/);
  assert.deepEqual(match(profile({targetRoles:["Ingénieur données"],skills:["SQL","sql"]}),[source],now),[]);
});
test("accents and plurals match, and roles in company boilerplate do not count",()=>{
  assert.equal(match(profile({targetRoles:["Chargée de communication"]}),[job({title:"CHARGE DE COMMUNICATION",industry:null})],now).length,1);
  assert.deepEqual(match(profile({targetRoles:["Développeur web"]}),[job({company:"Logiciels et informatique",description:"Nos développeurs accompagnent les hôtels."})],now),[]);
});
test("experience changes ordering and checks, never silently excludes a career transition",()=>{
  const results=match(profile({experienceLevel:"entry"}),[job({slug:"senior",experience:"Direction"}),job({slug:"entry",experience:"Débutant"})],now);
  assert.equal(results.length,2); assert.equal(results[0].opportunity.slug,"entry");
  assert.ok(results[1].checks.some(check=>check.includes("Comparez les années")));
});
test("closed, future-dated and stale postings are excluded at matching time",()=>{
  const closed=job({expiresAt:new Date(now).toISOString()});
  const stale=job({verifiedAt:"2026-10-20T00:00:00Z"});
  const future=job({publishedAt:"2026-10-23T00:00:00Z"});
  const selection=job({sourceKind:"selection",verifiedAt:"2026-10-18T20:40:00Z",expiresAt:"2026-10-27T23:55:00Z"});
  assert.deepEqual(match(profile(),[closed,stale,future],now),[]);
  assert.equal(match(profile(),[selection],now).length,1);
  assert.deepEqual(match(profile(),[selection],Date.parse("2026-10-27T23:55:00Z")),[]);
});
test("identity, residence, summaries, nationality and attached CV cannot affect the ranking",()=>{
  const before=match(profile(),[job()],now);
  const after=match(profile({countryCode:"SN",city:"Dakar",professionalSummary:"Nationalité française, 50 ans. Marketing.",educationSummary:"Développement web",availability:"Immédiate",cvDocumentId:999,languages:[{name:"Anglais",level:"C2"}]}),[job()],now);
  assert.deepEqual(after,before);
});
test("matching is deterministic, deduplicated and never mutates profile or catalogue",()=>{
  const input=profile(), one=job({slug:"b"}), two=job({slug:"a"});
  const previous=JSON.stringify({input,one,two});
  assert.deepEqual(match(input,[one,two,one],now).map(row=>row.opportunity.slug),["a","b"]);
  assert.equal(JSON.stringify({input,one,two}),previous);
});