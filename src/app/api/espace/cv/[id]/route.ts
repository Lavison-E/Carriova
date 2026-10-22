import { requireCustomer } from "@/lib/customer-auth";
import { deleteCustomerCv, getCustomerCv, updateCustomerCv, CvStoreError } from "@/lib/cv-store";
import { parseCvVersion } from "@/lib/cv";
import { assertCvOrigin, cvErrorResponse, parseCvId, privateCvHeaders, readCvJson } from "@/lib/cv-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const customer = await requireCustomer(); const id = parseCvId((await context.params).id);
    const document = await getCustomerCv(id, customer.id);
    if (!document) throw new CvStoreError(404, "NOT_FOUND", "Ce CV est introuvable.");
    return Response.json({ document }, { headers: privateCvHeaders });
  } catch (error) { return cvErrorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    assertCvOrigin(request); const customer = await requireCustomer(); const id = parseCvId((await context.params).id);
    const document = await updateCustomerCv(id, customer.id, await readCvJson(request));
    return Response.json({ document }, { headers: privateCvHeaders });
  } catch (error) { return cvErrorResponse(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertCvOrigin(request); const customer = await requireCustomer(); const id = parseCvId((await context.params).id);
    const input = await readCvJson(request, 1024);
    await deleteCustomerCv(id, customer.id, parseCvVersion(input.version));
    return Response.json({ ok: true }, { headers: privateCvHeaders });
  } catch (error) { return cvErrorResponse(error); }
}
