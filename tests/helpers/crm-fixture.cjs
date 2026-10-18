const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const ts = require("typescript");

// Exact DDL of the historical leads table in src/db/schema.ts. Test databases only.
const CORE_LEADS_SQL = `CREATE TABLE leads (
  id serial PRIMARY KEY,
  first_name varchar(120) NOT NULL,
  last_name varchar(120),
  email varchar(255) NOT NULL,
  whatsapp varchar(40),
  objective varchar(160),
  interest varchar(160),
  source varchar(120),
  landing_page varchar(255),
  message text,
  type varchar(60) NOT NULL,
  consent_marketing boolean NOT NULL DEFAULT false,
  consent_privacy boolean NOT NULL DEFAULT false,
  status varchar(40) NOT NULL DEFAULT 'prospect',
  created_at timestamp NOT NULL DEFAULT now()
);`;

function loadTypeScript(file, mocks = {}) {
  const filename = resolve(__dirname, "../..", file);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const nativeRequire = createRequire(filename);
  const localRequire = (name) => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name);
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

// The production migration runner sends complete multi-statement SQL files to pg.query.
// PGlite supports the same SQL through exec when no bound parameters are involved.
function migrationClient(pglite) {
  return { async query(sql, parameters) {
    if (parameters?.length) return pglite.query(sql, parameters);
    return (await pglite.exec(sql)).at(-1) ?? { rows: [] };
  } };
}
module.exports = { CORE_LEADS_SQL, loadTypeScript, migrationClient };
