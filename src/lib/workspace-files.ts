import "server-only";

import { inflateRawSync } from "node:zlib";
import { and, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requestEvents, requestFiles, serviceRequests } from "@/db/workspace-schema";
import { requireCustomer } from "@/lib/customer-auth";
import { requireStaff } from "@/lib/staff-auth";
import { WORKSPACE_MAX_FILE_BYTES, type WorkspaceContext } from "@/lib/workspace";

export class WorkspaceFileValidationError extends Error {}
export function safeWorkspaceFilename(name: string) {
  const basename = name.replace(/\\/g, "/").split("/").at(-1) ?? "document";
  const safe = basename.normalize("NFKC").replace(/[^\p{L}\p{N} ._()-]/gu, "-").replace(/^\.+/, "").trim();
  const dot = safe.lastIndexOf(".");
  if (dot < 1) return "document";
  return `${safe.slice(0, dot).slice(0, 120).trim() || "document"}${safe.slice(dot).toLowerCase()}`;
}

function isDocx(content: Buffer) {
  if (content.length < 22 || content.readUInt32LE(0) !== 0x04034b50) return false;
  let end = -1;
  for (let i = content.length - 22; i >= Math.max(0, content.length - 65557); i--) {
    if (content.readUInt32LE(i) === 0x06054b50 && i + 22 + content.readUInt16LE(i + 20) === content.length) { end = i; break; }
  }
  if (end < 0 || content.readUInt16LE(end + 4) !== 0 || content.readUInt16LE(end + 6) !== 0) return false;
  const entries = content.readUInt16LE(end + 10);
  const directorySize = content.readUInt32LE(end + 12);
  let cursor = content.readUInt32LE(end + 16);
  if (entries < 3 || entries > 512 || cursor + directorySize !== end || content.readUInt16LE(end + 8) !== entries) return false;
  const names = new Set<string>();
  const required = new Map<string, string>();
  let unpacked = 0;
  for (let n = 0; n < entries; n++) {
    if (cursor + 46 > end || content.readUInt32LE(cursor) !== 0x02014b50) return false;
    const flags = content.readUInt16LE(cursor + 8);
    const method = content.readUInt16LE(cursor + 10);
    const compressed = content.readUInt32LE(cursor + 20);
    const size = content.readUInt32LE(cursor + 24);
    const nameLength = content.readUInt16LE(cursor + 28);
    const extraLength = content.readUInt16LE(cursor + 30);
    const commentLength = content.readUInt16LE(cursor + 32);
    const offset = content.readUInt32LE(cursor + 42);
    if (cursor + 46 + nameLength + extraLength + commentLength > end || (flags & 1) || ![0, 8].includes(method)) return false;
    const name = content.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    if (!name || names.has(name) || name.includes("\\") || name.startsWith("/") || name.split("/").includes("..") || /vbaProject|\.exe$|\.js$/i.test(name)) return false;
    names.add(name);
    unpacked += size;
    if (size > 12 * 1024 * 1024 || unpacked > 30 * 1024 * 1024 || offset + 30 > content.length || content.readUInt32LE(offset) !== 0x04034b50) return false;
    const localNameLength = content.readUInt16LE(offset + 26);
    const start = offset + 30 + localNameLength + content.readUInt16LE(offset + 28);
    if (start + compressed > content.readUInt32LE(end + 16) || content.subarray(offset + 30, offset + 30 + localNameLength).toString("utf8") !== name) return false;
    if (["[Content_Types].xml", "word/document.xml", "_rels/.rels"].includes(name)) {
      if (size > 4 * 1024 * 1024) return false;
      const packed = content.subarray(start, start + compressed);
      const decoded = method === 0 ? packed : inflateRawSync(packed, { maxOutputLength: 4 * 1024 * 1024 });
      if (decoded.length !== size) return false;
      required.set(name, decoded.toString("utf8"));
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return cursor === end && required.size === 3
    && Boolean(required.get("[Content_Types].xml")?.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"))
    && !/macroEnabled/i.test(required.get("[Content_Types].xml") ?? "")
    && /<(?:\w+:)?document[\s>]/.test(required.get("word/document.xml") ?? "")
    && /<(?:\w+:)?Relationships[\s>]/.test(required.get("_rels/.rels") ?? "");
}

export async function validateWorkspaceFile(file: File) {
  if (file.size < 1 || file.size > WORKSPACE_MAX_FILE_BYTES) throw new WorkspaceFileValidationError("Choisissez un fichier de 3 Mo maximum.");
  const filename = safeWorkspaceFilename(file.name);
  const extension = filename.split(".").at(-1);
  const content = Buffer.from(await file.arrayBuffer());
  if (content.length !== file.size) throw new WorkspaceFileValidationError("Le fichier est incomplet.");
  let mimeType: string | null = null;
  try {
    if (extension === "pdf" && /^%PDF-(?:1\.[0-7]|2\.0)/.test(content.subarray(0, 8).toString("ascii")) && content.subarray(-1024).includes(Buffer.from("%%EOF"))) mimeType = "application/pdf";
    if (extension === "png" && content.length >= 45 && content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && content.readUInt32BE(8) === 13 && content.subarray(12, 16).toString("ascii") === "IHDR" && content.subarray(-8, -4).toString("ascii") === "IEND") mimeType = "image/png";
    if (["jpg", "jpeg"].includes(extension ?? "") && content.length >= 4 && content[0] === 255 && content[1] === 216 && content[2] === 255 && content[content.length - 2] === 255 && content[content.length - 1] === 217) mimeType = "image/jpeg";
    if (extension === "docx" && isDocx(content)) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } catch { /* A malformed archive is a validation error, never an accepted file. */ }
  if (!mimeType) throw new WorkspaceFileValidationError("Le contenu doit correspondre à un fichier PDF, DOCX, JPG ou PNG valide.");
  return { filename, mimeType, size: content.length, content };
}

export async function getWorkspaceFile(id: number, context: WorkspaceContext = "customer") {
  const customerId = context === "team" ? (await requireStaff(), undefined) : (await requireCustomer()).id;
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const ownership = customerId === undefined ? undefined : eq(serviceRequests.customerId, customerId);
  const published = customerId === undefined ? undefined : or(eq(requestFiles.kind, "brief"), sql`exists (
    select 1 from ${requestEvents} where ${requestEvents.requestId} = ${requestFiles.requestId}
    and ${requestEvents.type} = 'delivered' and ${requestEvents.createdAt} >= ${requestFiles.createdAt}
  )`);
  const [file] = await getDb().select({ filename: requestFiles.filename, mimeType: requestFiles.mimeType, size: requestFiles.size, content: requestFiles.content })
    .from(requestFiles).innerJoin(serviceRequests, eq(serviceRequests.id, requestFiles.requestId))
    .where(and(eq(requestFiles.id, id), ownership, published)).limit(1);
  return file ?? null;
}
