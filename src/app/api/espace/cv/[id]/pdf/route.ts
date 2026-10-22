import { requireCustomer } from "@/lib/customer-auth";
import { getCustomerCv } from "@/lib/cv-store";
import { privateCvHeaders, cvErrorResponse, parseCvId } from "@/lib/cv-http";
import { renderCvPdf } from "@/lib/cv-pdf";
import { rateLimit } from "@/lib/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const customer = await requireCustomer();
    const id = parseCvId((await params).id);
    const document = await getCustomerCv(id, customer.id);
    if (!document) return Response.json({ error: "CV introuvable." }, { status: 404, headers: privateCvHeaders });
    const rawVersion = new URL(request.url).searchParams.get("version");
    if (!rawVersion || !/^(0|[1-9]\d*)$/.test(rawVersion) || Number(rawVersion) !== document.version) return Response.json({ error: "Ce CV a été modifié. Sauvegardez ou rechargez la dernière version avant de l’exporter.", code: "VERSION_CONFLICT" }, { status: 409, headers: privateCvHeaders });
    if (!rateLimit(`cv-pdf:${customer.id}`, 12, 60000).ok) return Response.json({ error: "Veuillez patienter une minute avant un nouvel export." }, { status: 429, headers: privateCvHeaders });
    const pdf = await renderCvPdf(document);
    if (pdf.byteLength > 3 * 1024 * 1024) return Response.json({ error: "Ce CV est trop volumineux pour être exporté. Réduisez son contenu." }, { status: 422, headers: privateCvHeaders });
    // Truncate by Unicode code point; replace isolated surrogates before URI encoding.
    const downloadTitle = Array.from(document.title.replace(/[\r\n\/\\]/g, " ")).slice(0, 100).join("").replace(/[\uD800-\uDFFF]/gu, "\uFFFD");
    const filename = encodeURIComponent(`${downloadTitle}.pdf`).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(new Uint8Array(pdf), { headers: { ...privateCvHeaders, "Content-Type": "application/pdf", "Content-Length": String(pdf.byteLength), "Content-Disposition": `attachment; filename="CV.pdf"; filename*=UTF-8''${filename}`, "Content-Security-Policy": "sandbox; default-src 'none'" } });
  } catch (error) { return cvErrorResponse(error); }
}
