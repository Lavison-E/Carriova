const assert = require("node:assert/strict");
const test = require("node:test");
const { createHash, randomBytes } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { loadTypeScript: load, migrationClient } = require("./helpers/crm-fixture.cjs");
const hash = token => createHash("sha256").update(token).digest("hex");
const fd = values => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };

 test("Staff invitations activate only the invited account with its operator-selected role", async t => {
  const pg = new PGlite(); t.after(() => pg.close());
  for (const file of ["20261018_staff.sql", "20261018_staff_invites.sql"]) await pg.exec(readFileSync(resolve(__dirname, "../migrations", file), "utf8"));
  const client = migrationClient(pg), db = drizzle(pg);
  const { issueStaffInvitation, invitationMailConfig, sendStaffInvitation } = await import("../scripts/staff-invite.mjs");
  const passwords = await import("../src/lib/staff-password.mjs");
  const staff = load("src/db/staff-schema.ts");
  const invites = load("src/db/staff-invite-schema.ts", { "./staff-schema": staff });
  let clearedCookie;
  class Redirect extends Error { constructor(path) { super(path); this.path = path; } }
  const mocks = {
    "@/db": { databaseConfigured: true, getDb: () => db },
    "@/db/staff-schema": staff, "@/db/staff-invite-schema": invites,
    "@/lib/staff-auth": { STAFF_COOKIE: "carriova_staff", tokenHash: hash },
    "@/lib/staff-password.mjs": passwords,
    "next/headers": { headers: async () => new Headers({ "x-forwarded-for": "127.0.0.25" }), cookies: async () => ({ set: (...args) => { clearedCookie = args; } }) },
    "next/navigation": { redirect(path) { throw new Redirect(path); } },
  };
  const actions = load("src/lib/staff-invite-actions.ts", mocks);
  const password = "A-private-test-passphrase-123";
  const activate = (token, extra = {}) => actions.activateStaffInvitation({}, fd({ token, password, confirmPassword: password, ...extra }));
  const issue = (email, role = "advisor") => issueStaffInvitation(client, { email, name: "Équipe test", role });
  const user = async email => (await pg.query("SELECT * FROM staff_users WHERE email=$1", [email])).rows[0];
  let pending;
  await t.test("new account is disabled and only a 24-hour token digest is stored", async () => {
    pending = await issue("  invite@example.test  ");
    assert.equal(pending.email, "invite@example.test"); assert.match(pending.token, /^[A-Za-z0-9_-]{43}$/);
    const account = await user(pending.email); assert.equal(account.enabled, false); assert.equal(account.role, "advisor");
    assert.equal(account.password_hash, passwords.DUMMY_PASSWORD_HASH);
    const row = (await pg.query("SELECT * FROM staff_invites WHERE user_id=$1", [account.id])).rows[0];
    assert.equal(row.token_hash, hash(pending.token)); assert.notEqual(row.token_hash, pending.token);
    assert.ok(Math.abs(new Date(row.expires_at) - Date.now() - 86_400_000) < 10_000);
  });
  await t.test("wrong, expired and short-password attempts never activate an account", async () => {
    assert.equal((await activate(randomBytes(32).toString("base64url"))).ok, false);
    const invalidPassword = await activate(pending.token, { password: "short", confirmPassword: "short" });
    assert.ok(invalidPassword.fieldErrors.password);
    await pg.query("UPDATE staff_invites SET expires_at=now()-interval '1 minute' WHERE token_hash=$1", [hash(pending.token)]);
    assert.equal((await activate(pending.token)).ok, false); assert.equal((await user(pending.email)).enabled, false);
  });
  await t.test("reissue invalidates the old link and keeps expired pending accounts disabled", async () => {
    const old = pending.token; pending = await issue(pending.email);
    assert.notEqual(pending.token, old); assert.equal((await activate(old)).ok, false);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM staff_invites")).rows[0].n, 1);
    assert.equal((await user(pending.email)).enabled, false);
  });
  await t.test("activation hashes the chosen password, revokes sessions and cannot forge admin or email", async () => {
    const account = await user(pending.email);
    await pg.query("INSERT INTO staff_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')", [hash("stale-test-session"), account.id]);
    await assert.rejects(activate(pending.token, { role: "admin", email: "other@example.test", userId: "999" }), error => error instanceof Redirect && error.path === "/admin/connexion");
    const activated = await user(pending.email); assert.equal(activated.enabled, true); assert.equal(activated.role, "advisor");
    assert.equal(await passwords.verifyPassword(password, activated.password_hash), true); assert.notEqual(activated.password_hash, password);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM staff_invites WHERE user_id=$1", [account.id])).rows[0].n, 0);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM staff_sessions WHERE user_id=$1", [account.id])).rows[0].n, 0);
    assert.deepEqual(clearedCookie.slice(0, 2), ["carriova_staff", ""]); assert.equal(clearedCookie[2].path, "/admin"); assert.equal(clearedCookie[2].httpOnly, true);
    assert.equal((await activate(pending.token)).ok, false);
  });
  await t.test("active and previously disabled non-pending accounts cannot be reinvited", async () => {
    const before = await user(pending.email);
    await assert.rejects(issue(pending.email, "admin"), { code: "INVITE_ACCOUNT_ALREADY_ACTIVE" });
    assert.equal((await user(pending.email)).password_hash, before.password_hash);
    await pg.query("UPDATE staff_users SET enabled=false WHERE id=$1", [before.id]);
    await assert.rejects(issue(pending.email, "admin"), { code: "INVITE_ACCOUNT_NOT_PENDING" });
    const after = await user(pending.email); assert.equal(after.role, "advisor"); assert.equal(after.password_hash, before.password_hash);
  });
  await t.test("a valid admin invitation preserves the operator-selected admin role", async () => {
    const admin = await issue("admin@example.test", "admin");
    await assert.rejects(activate(admin.token, { role: "advisor" }), Redirect);
    assert.equal((await user(admin.email)).role, "admin");
  });
  await t.test("an already enabled account cannot be modified by a still-present invite", async () => {
    const invitation = await issue("enabled@example.test");
    await pg.query("UPDATE staff_users SET enabled=true WHERE email=$1", [invitation.email]);
    assert.equal((await activate(invitation.token)).ok, false);
    assert.equal((await user(invitation.email)).password_hash, passwords.DUMMY_PASSWORD_HASH);
  });
  await t.test("activation rolls back account and token changes when session revocation fails", async () => {
    const invitation = await issue("rollback@example.test");
    const brokenDb = Object.create(db);
    brokenDb.transaction = callback => db.transaction(tx => callback(new Proxy(tx, { get(target, key) {
      if (key === "delete") return table => { if (table === staff.staffSessions) throw new Error("Synthetic failure"); return target.delete(table); };
      const value = target[key]; return typeof value === "function" ? value.bind(target) : value;
    } })));
    const broken = load("src/lib/staff-invite-actions.ts", { ...mocks, "@/db": { databaseConfigured: true, getDb: () => brokenDb } });
    assert.equal((await broken.activateStaffInvitation({}, fd({ token: invitation.token, password, confirmPassword: password }))).ok, false);
    assert.equal((await user(invitation.email)).enabled, false);
    assert.equal((await pg.query("SELECT token_hash FROM staff_invites WHERE token_hash=$1", [hash(invitation.token)])).rows.length, 1);
  });
  await t.test("mail uses the transactional sender, support reply and a private activation link", async () => {
    const config = invitationMailConfig({ RESEND_API_KEY: "test-only-key", NEXT_PUBLIC_SITE_URL: "https://carriova.example", EMAIL_FROM: "Legacy <legacy@example.test>", SUPPORT_EMAIL: "support@example.test", CONTACT_EMAIL: "contact@example.test" });
    let body, headers;
    const result = await sendStaffInvitation(pending, config, async (url, init) => { assert.equal(url, "https://api.resend.com/emails"); body = JSON.parse(init.body); headers = init.headers; return new Response(JSON.stringify({ id: "test-provider-id" }), { status: 200 }); });
    assert.deepEqual(result, { sent: true, providerId: "test-provider-id" }); assert.match(body.html, /Activer mon accès équipe/); assert.ok(body.html.includes("/admin/activer?token=")); assert.equal(body.from, "CARRIOVA <noreply@carriovaci.com>"); assert.equal(body.reply_to, "support@example.test"); assert.deepEqual(body.to, [pending.email]);
    const link = new URL(body.text.match(/https:\/\/[^\s]+/)[0]); assert.equal(link.pathname, "/admin/activer"); assert.equal(link.searchParams.get("token"), pending.token);
    assert.equal(headers["Idempotency-Key"].includes(pending.token), false); assert.equal(body.text.includes(password), false);
    assert.equal(invitationMailConfig({ RESEND_API_KEY: "test", NEXT_PUBLIC_SITE_URL: "https://carriova.example", EMAIL_TRANSACTIONAL_FROM: "Équipe <team@example.test>", SUPPORT_EMAIL: "invalid", CONTACT_EMAIL: "contact@example.test" }).from, "Équipe <team@example.test>");
    assert.equal(invitationMailConfig({ RESEND_API_KEY: "test", NEXT_PUBLIC_SITE_URL: "https://carriova.example", SUPPORT_EMAIL: "invalid", CONTACT_EMAIL: "contact@example.test" }).replyTo, "contact@example.test");
  });
  await t.test("mail failure is explicit for provider rejection, malformed success and network errors", async () => {
    const config = invitationMailConfig({ RESEND_API_KEY: "test", NEXT_PUBLIC_SITE_URL: "https://carriova.example" });
    for (const send of [async () => new Response("{}", { status: 403 }), async () => new Response("{}", { status: 200 }), async () => { throw new Error("Sensitive upstream details"); }]) {
      await assert.rejects(sendStaffInvitation(pending, config, send), { code: "INVITE_EMAIL_FAILED", message: "INVITE_EMAIL_FAILED" });
    }
    assert.throws(() => invitationMailConfig({ RESEND_API_KEY: "test", NEXT_PUBLIC_SITE_URL: "http://carriova.example" }), { code: "INVITE_MAIL_NOT_CONFIGURED" });
    assert.throws(() => invitationMailConfig({ NEXT_PUBLIC_SITE_URL: "https://carriova.example" }), { code: "INVITE_MAIL_NOT_CONFIGURED" });
  });
});
