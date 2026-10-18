import { createHash, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { DUMMY_PASSWORD_HASH } from "../src/lib/staff-password.mjs";
import { renderTransactionalEmail } from "../src/lib/transactional-email.mjs";

const failure = code => Object.assign(new Error(code), { code });
const hashToken = token => createHash("sha256").update(token).digest("hex");
const isEmail = value => typeof value === "string" && value.length <= 255 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(value);
const isSender = value => {
  if (typeof value !== "string" || /[\r\n]/.test(value)) return false;
  const address = /^(?:[^<>]+\s)?<([^<>]+)>$/.exec(value)?.[1] ?? value;
  return isEmail(address);
};

export function invitationMailConfig(env) {
  if (!env.RESEND_API_KEY?.trim()) throw failure("INVITE_MAIL_NOT_CONFIGURED");
  let site, endpoint;
  try {
    site = new URL(env.NEXT_PUBLIC_SITE_URL);
    endpoint = new URL("emails", (env.RESEND_BASE_URL || "https://api.resend.com").replace(/\/$/, "") + "/");
  } catch { throw failure("INVITE_MAIL_NOT_CONFIGURED"); }
  if (site.protocol !== "https:" || site.username || site.password || endpoint.protocol !== "https:" || endpoint.username || endpoint.password)
    throw failure("INVITE_MAIL_NOT_CONFIGURED");
  const from = isSender(env.EMAIL_TRANSACTIONAL_FROM) ? env.EMAIL_TRANSACTIONAL_FROM : "CARRIOVA <noreply@carriovaci.com>";
  const replyTo = isEmail(env.SUPPORT_EMAIL) ? env.SUPPORT_EMAIL : isEmail(env.CONTACT_EMAIL) ? env.CONTACT_EMAIL : "contact@carriovaci.com";
  return { apiKey: env.RESEND_API_KEY, from, replyTo, site: site.origin, endpoint: endpoint.href };
}

// This operator-only function never enables a user or changes an existing active account.
export async function issueStaffInvitation(client, input) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const role = input.role;
  if (!isEmail(email) || name.length < 2 || name.length > 120 || /[\r\n]/.test(name) || !["admin", "advisor"].includes(role))
    throw failure("INVITE_INVALID_INPUT");
  await client.query("BEGIN");
  try {
    const inserted = await client.query("INSERT INTO staff_users(email,name,password_hash,role,enabled) VALUES($1,$2,$3,$4,false) ON CONFLICT(email) DO NOTHING RETURNING id", [email, name, DUMMY_PASSWORD_HASH, role]);
    const user = (await client.query("SELECT id,enabled FROM staff_users WHERE email=$1 FOR UPDATE", [email])).rows[0];
    if (!user || user.enabled) throw failure("INVITE_ACCOUNT_ALREADY_ACTIVE");
    if (!inserted.rows.length) {
      const pending = await client.query("SELECT user_id FROM staff_invites WHERE user_id=$1 FOR UPDATE", [user.id]);
      if (!pending.rows.length) throw failure("INVITE_ACCOUNT_NOT_PENDING");
    }
    const token = randomBytes(32).toString("base64url");
    await client.query("UPDATE staff_users SET name=$2,role=$3 WHERE id=$1", [user.id, name, role]);
    await client.query("DELETE FROM staff_invites WHERE user_id=$1", [user.id]);
    await client.query("INSERT INTO staff_invites(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '24 hours')", [hashToken(token), user.id]);
    await client.query("DELETE FROM staff_sessions WHERE user_id=$1", [user.id]);
    await client.query("COMMIT");
    return { token, email, name, role };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function sendStaffInvitation(invitation, config, send = fetch) {
  const link = new URL("/admin/activer", config.site);
  link.searchParams.set("token", invitation.token);
  const role = invitation.role === "admin" ? "administrateur" : "conseiller";
  try {
    const response = await send(config.endpoint, {
      method: "POST",
      headers: { Authorization: "Bearer " + config.apiKey, "Content-Type": "application/json", "Idempotency-Key": "carriova-staff-invite-" + hashToken(invitation.token) },
      body: JSON.stringify({
        from: config.from, reply_to: config.replyTo, to: [invitation.email],
        subject: "Votre invitation à l’équipe Carriova",
        html: renderTransactionalEmail({
          title: "Bienvenue dans l’équipe Carriova",
          body: "Bonjour " + invitation.name + ",\n\nVous êtes invité(e) à rejoindre l’équipe avec le rôle " + role + ". Choisissez votre mot de passe pour activer votre accès.",
          actionLabel: "Activer mon accès équipe", actionUrl: link.href, supportEmail: config.replyTo,
          note: "Ce lien est personnel, valable 24 heures et utilisable une seule fois. Si vous ne l’attendiez pas, ignorez ce message.",
        }),
        text: "Bonjour " + invitation.name + ",\n\nVous êtes invité(e) à rejoindre l’équipe Carriova avec le rôle " + role + ". Choisissez votre mot de passe pour activer votre accès :\n\n" + link.href + "\n\nCe lien est personnel, valable 24 heures et utilisable une seule fois. Si vous ne l’attendiez pas, ignorez ce message.\n\nL’équipe Carriova",
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw failure("INVITE_EMAIL_FAILED");
    const body = await response.json();
    if (typeof body?.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(body.id)) throw failure("INVITE_EMAIL_FAILED");
    return { sent: true, providerId: body.id };
  } catch { throw failure("INVITE_EMAIL_FAILED"); }
}

async function main() {
  let client, committed = false;
  try {
    const args = process.argv.slice(2);
    if (args.length !== 3) throw failure("INVITE_USAGE");
    // dotenv is loaded only by a real CLI invocation, never by test imports.
    const { createClient } = await import("./database.mjs");
    const config = invitationMailConfig(process.env);
    client = createClient();
    await client.connect();
    const invitation = await issueStaffInvitation(client, { email: args[0], name: args[1], role: args[2] });
    committed = true;
    const delivery = await sendStaffInvitation(invitation, config);
    console.log("Identifiant d’envoi : " + delivery.providerId);
    console.log("Invitation enregistrée et acceptée par le service d’envoi. Le compte reste désactivé jusqu’à l’activation par son destinataire. Aucun lien ni jeton n’a été affiché.");
  } catch (error) {
    const safeCodes = ["INVITE_USAGE", "INVITE_INVALID_INPUT", "INVITE_ACCOUNT_ALREADY_ACTIVE", "INVITE_ACCOUNT_NOT_PENDING", "INVITE_MAIL_NOT_CONFIGURED", "INVITE_EMAIL_FAILED"];
    const code = safeCodes.includes(error?.code) ? error.code : "INVITE_DATABASE_FAILED";
    console.error("Invitation impossible (" + code + ")." + (committed ? " L’invitation reste en attente et le compte désactivé. Réexécutez la commande pour émettre un nouveau lien." : ""));
    if (code === "INVITE_USAGE") console.error('Usage : node scripts/staff-invite.mjs email "Nom" admin|advisor');
    process.exitCode = 1;
  } finally { if (client) await client.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
