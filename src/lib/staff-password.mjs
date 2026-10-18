import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const settings = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const derive = (password, salt) => new Promise((resolve, reject) => {
  scrypt(password, salt, 64, settings, (error, key) => error ? reject(error) : resolve(key));
});
export const DUMMY_PASSWORD_HASH = "scrypt$32768$8$3$" + "00".repeat(16) + "$" + "00".repeat(64);
export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 15 || password.length > 256) throw new Error("Le mot de passe doit contenir entre 15 et 256 caractères.");
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return "scrypt$32768$8$3$" + salt.toString("hex") + "$" + key.toString("hex");
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 256 || typeof encoded !== "string") return false;
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded);
  if (!match) return false;
  const actual = await derive(password, Buffer.from(match[1], "hex"));
  return timingSafeEqual(actual, Buffer.from(match[2], "hex"));
}
