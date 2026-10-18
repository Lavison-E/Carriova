import { getWorkspaceFile } from "@/lib/workspace-files";
import { CustomerUnauthorizedError } from "@/lib/customer-auth";
import { UnauthorizedError } from "@/lib/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Vary": "Cookie" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const file = await getWorkspaceFile(/^[1-9]\d*$/.test(id) ? Number(id) : 0, "customer");
    if (!file) return Response.json({ error: "Fichier introuvable." }, { status: 404, headers: privateHeaders });
    const filename = encodeURIComponent(file.filename).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(new Uint8Array(file.content), { headers: {
      ...privateHeaders,
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="document"; filename*=UTF-8''${filename}`,
      "Content-Security-Policy": "sandbox; default-src 'none'",
    } });
  } catch (error) {
    if (error instanceof CustomerUnauthorizedError || error instanceof UnauthorizedError) {
      return Response.json({ error: "Connexion requise." }, { status: 401, headers: privateHeaders });
    }
    return Response.json({ error: "Fichier temporairement indisponible." }, { status: 503, headers: privateHeaders });
  }
}
