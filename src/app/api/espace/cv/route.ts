import { requireCustomer } from "@/lib/customer-auth";
import { createCustomerCv, listCustomerCvs } from "@/lib/cv-store";
import { assertCvOrigin, cvErrorResponse, privateCvHeaders, readCvJson } from "@/lib/cv-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const customer = await requireCustomer();
    return Response.json({ documents: await listCustomerCvs(customer.id) }, { headers: privateCvHeaders });
  } catch (error) { return cvErrorResponse(error); }
}
export async function POST(request: Request) {
  try {
    assertCvOrigin(request); const customer = await requireCustomer();
    const input = await readCvJson(request);
    const document = await createCustomerCv(customer.id, input, customer);
    return Response.json({ document }, { status: 201, headers: privateCvHeaders });
  } catch (error) { return cvErrorResponse(error); }
}
