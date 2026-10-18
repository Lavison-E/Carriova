const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");

function load(file, mocks = {}) {
  const filename = resolve(__dirname, "..", file);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const nativeRequire = createRequire(filename), mod = { exports: {} };
  new Function("require", "module", "exports", code)(name => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name), mod, mod.exports);
  return mod.exports;
}
test("Staff authentication uses persistent, revocable and expiring sessions", async (t) => {
  const passwords = await import("../src/lib/staff-password.mjs");
  const password = "Ephemeral-test-passphrase-2026";
  const hash = await passwords.hashPassword(password);
  await t.test("salted scrypt rejects wrong, malformed and short credentials", async () => {
    assert.notEqual(hash, await passwords.hashPassword(password));
    assert.equal(await passwords.verifyPassword(password, hash), true);
    assert.equal(await passwords.verifyPassword("wrong", hash), false);
    assert.equal(await passwords.verifyPassword(password, "plaintext"), false);
    await assert.rejects(passwords.hashPassword("short"));
  });
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_staff.sql"), "utf8"));
  const db = drizzle(pg);
  const schema = load("src/db/staff-schema.ts");
  const cookieValues = new Map();
  let lastCookie;
  const jar = {
    get(name) { const value = cookieValues.get(name); return value ? { value } : undefined; },
    set(name, value, options) { cookieValues.set(name, value); lastCookie = { name, value, options }; },
  };
  const common = {
    "server-only": {},
    "@/db": { databaseConfigured: true, getDb: () => db },
    "@/db/staff-schema": schema,
    "next/headers": { cookies: async () => jar, headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }) },
  };
  const auth = load("src/lib/staff-auth.ts", common);
  class Redirect extends Error { constructor(path) { super(path); this.path = path; } }
  const actions = load("src/lib/staff-actions.ts", {
    ...common, "@/lib/staff-auth": auth, "@/lib/staff-password.mjs": passwords,
    "@/lib/security": load("src/lib/security.ts"),
    "next/navigation": { redirect(path) { throw new Redirect(path); } },
  });
  const login = (email, pass = password) => { const fd = new FormData(); fd.set("email", email); fd.set("password", pass); return actions.staffLogin({}, fd); };
  await pg.query("INSERT INTO staff_users(email,name,password_hash,role) VALUES($1,$2,$3,$4)", ["advisor@example.test", "Test Advisor", hash, "advisor"]);
  await t.test("anonymous and forged cookies grant no identity", async () => {
    assert.equal(await auth.getStaffSession(), null);
    await assert.rejects(auth.requireStaff(), auth.UnauthorizedError);
    cookieValues.set(auth.STAFF_COOKIE, "forged");
    assert.equal(await auth.getStaffSession(), null);
    cookieValues.set(auth.STAFF_COOKIE, "A".repeat(43));
    assert.equal(await auth.getStaffSession(), null);
    cookieValues.clear();
  });
  await t.test("valid login stores only a token hash and sets production cookie protections", async () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try { await assert.rejects(login("ADVISOR@example.test"), error => error instanceof Redirect && error.path === "/admin/crm"); }
    finally { if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv; }
    assert.equal(lastCookie.options.httpOnly, true);
    assert.equal(lastCookie.options.secure, true);
    assert.equal(lastCookie.options.sameSite, "lax");
    assert.equal(lastCookie.options.path, "/admin");
    assert.equal(lastCookie.options.maxAge, 28800);
    const rows = (await pg.query("SELECT * FROM staff_sessions")).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].token_hash, auth.tokenHash(lastCookie.value));
    assert.notEqual(rows[0].token_hash, lastCookie.value);
    assert.deepEqual(await auth.getStaffSession(), { id: 1, email: "advisor@example.test", name: "Test Advisor", role: "advisor" });
  });
  await t.test("disabled users and expired sessions lose access immediately", async () => {
    await pg.query("UPDATE staff_users SET enabled=false WHERE id=1");
    assert.equal(await auth.getStaffSession(), null);
    const response = await login("advisor@example.test");
    assert.equal(response.ok, false);
    await pg.query("UPDATE staff_users SET enabled=true WHERE id=1");
    await pg.query("UPDATE staff_sessions SET expires_at=now()-interval '1 second'");
    assert.equal(await auth.getStaffSession(), null);
  });
  await t.test("login rotates tokens and logout revokes the stored session", async () => {
    const old = cookieValues.get(auth.STAFF_COOKIE);
    await assert.rejects(login("advisor@example.test"), Redirect);
    assert.notEqual(old, cookieValues.get(auth.STAFF_COOKIE));
    assert.equal((await pg.query("SELECT count(*)::int AS count FROM staff_sessions")).rows[0].count, 1);
    await assert.rejects(actions.staffLogout(), error => error instanceof Redirect && error.path === "/admin/connexion");
    assert.equal((await pg.query("SELECT count(*)::int AS count FROM staff_sessions")).rows[0].count, 0);
    assert.equal(await auth.getStaffSession(), null);
  });
  await t.test("unknown user and wrong password have the same generic response", async () => {
    const unknown = await login("unknown@example.test");
    const wrong = await login("advisor@example.test", "wrong");
    assert.deepEqual(unknown, wrong);
    assert.equal(unknown.ok, false);
  });
  await t.test("persistent attempt limit stops brute force before password verification", async () => {
    await pg.query("INSERT INTO staff_login_attempts(key,attempts,reset_at) VALUES($1,8,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=8,reset_at=excluded.reset_at", [auth.tokenHash("email:advisor@example.test")]);
    const response = await login("advisor@example.test");
    assert.equal(response.ok, false);
    assert.match(response.message, /Trop de tentatives/);
    assert.equal((await pg.query("SELECT count(*)::int AS count FROM staff_sessions")).rows[0].count, 0);
  });
});
