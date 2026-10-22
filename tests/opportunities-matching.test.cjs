const test = require("node:test");
const assert = require("node:assert/strict");
const {loadTypeScript:load} = require("./helpers/crm-fixture.cjs");
const api = load("src/lib/opportunities.ts");
test("matching extracts bounded plain missions and qualifications, excluding company boilerplate and scripts",()=>{
  const input={sections:{companyDescription:{text:"SQL, Python, fake employer skills"},jobDescription:{text:"<p>Gestion &amp; analyse</p><script>Oracle</script><!-- Java --><style>Ruby</style>"},qualifications:{text:"<p>Excel&#xa0;et qualit&eacute; &#128; &#xD800;</p>"},additionalInformation:{text:"Terraform"}}};
  const text=api.postingMatchingText(input);
  assert.match(text,/Gestion & analyse/); assert.match(text,/Excel et qualité/);
  assert.doesNotMatch(text,/SQL|Python|Oracle|Java|Ruby|Terraform|<p>|<script>/);
  assert.equal(api.postingMatchingText({sections:{jobDescription:{text:"x".repeat(200000)}}}).length,16000);
  assert.equal(api.postingMatchingText(null),"");
});
test("missing work arrangement is unknown rather than incorrectly asserted as on site",()=>{
  const now=Date.parse("2026-10-22T06:00:00Z");
  const input={id:"744000156539459",name:"Comptable",releasedDate:"2026-10-20T12:00:00Z",active:true,visibility:"PUBLIC",company:{identifier:"AccorHotel"},postingUrl:"https://jobs.smartrecruiters.com/AccorHotel/744000156539459-test",location:{country:"ci",city:"Abidjan"},jobAd:{sections:{qualifications:{text:"<p>Excel</p>"}}}};
  const normalize=location=>api.normalizeAccorPosting({...input,location:{...input.location,...location}},new Date(now).toISOString(),now);
  assert.equal(normalize({}).workMode,null); assert.equal(normalize({remote:false}).workMode,null);
  assert.equal(normalize({remote:false,hybrid:false}).workMode,"Sur site");
  assert.equal(normalize({remote:true}).workMode,"Télétravail");
  assert.equal(normalize({hybrid:true}).workMode,"Hybride");
  assert.equal(normalize({}).matchingText,"Excel");
});