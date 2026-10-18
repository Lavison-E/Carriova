import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { createClient, safeDatabaseError } from "./database.mjs";
import { hashPassword } from "../src/lib/staff-password.mjs";

const [command, emailArg, nameArg, roleArg = "advisor"] = process.argv.slice(2);
const email = (emailArg || "").trim().toLowerCase();
async function passwordPrompt() {
  if (!process.stdin.isTTY) throw new Error("Utilisez un terminal interactif pour saisir le mot de passe.");
  let muted = false;
  const output = new Writable({ write(chunk, _encoding, callback) { if (!muted) process.stdout.write(chunk); callback(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  const ask = (label) => new Promise(resolve => { muted = false; rl.question(label, value => { muted = false; process.stdout.write("\n"); resolve(value); }); muted = true; });
  try {
    const password = await ask("Mot de passe (15 caractères minimum, saisie masquée) : ");
    const confirmation = await ask("Confirmer le mot de passe : ");
    if (password !== confirmation) throw new Error("Les mots de passe ne correspondent pas.");
    return password;
  } finally { muted = false; rl.close(); }
}
let client;
try {
  if (!["create", "reset", "disable"].includes(command) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
    throw new Error("Usage : npm run crm:user -- create email 'Nom' [admin|advisor] | reset email | disable email");
  if (command === "create" && (!nameArg?.trim() || nameArg.trim().length > 120 || !["admin", "advisor"].includes(roleArg)))
    throw new Error("Indiquez un nom (120 caractères maximum) et un rôle admin ou advisor.");
  const passwordHash = command === "disable" ? null : await hashPassword(await passwordPrompt());
  client = createClient();
  await client.connect();
  await client.query("BEGIN");
  try {
    let user;
    if (command === "create") {
      const result = await client.query("INSERT INTO staff_users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id", [email, nameArg.trim(), passwordHash, roleArg]);
      user = result.rows[0];
    } else {
      const statement = command === "reset" ? "UPDATE staff_users SET password_hash=$2 WHERE email=$1 RETURNING id" : "UPDATE staff_users SET enabled=false WHERE email=$1 RETURNING id";
      const result = await client.query(statement, command === "reset" ? [email, passwordHash] : [email]);
      user = result.rows[0];
      if (!user) throw Object.assign(new Error("Compte introuvable"), { code: "STAFF_NOT_FOUND" });
      await client.query("DELETE FROM staff_invites WHERE user_id=$1", [user.id]);
      await client.query("DELETE FROM staff_sessions WHERE user_id=$1", [user.id]);
    }
    await client.query("COMMIT");
    console.log("Opération équipe terminée. Aucun mot de passe n’a été affiché.");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
} catch (error) {
  // Input validation messages contain no user data. Database errors can, so redact them.
  console.error(client ? "Opération impossible (" + safeDatabaseError(error) + ")." : error.message);
  process.exitCode = 1;
} finally { if (client) await client.end(); }
