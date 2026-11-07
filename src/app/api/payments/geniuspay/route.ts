import { requireCustomer } from "@/lib/customer-auth";
import { assertPaymentOrigin, paymentErrorResponse, privatePaymentHeaders, readPaymentJson } from "@/lib/payment-http";
import { getRequestPaymentSummary, parsePaymentRequestId, paymentQuota, startRequestPayment } from "@/lib/payment-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  try { const customer = await requireCustomer(); await paymentQuota(customer.id);
    const id = parsePaymentRequestId(new URL(request.url).searchParams.get("requestId"));
    return Response.json(await getRequestPaymentSummary(id, customer.id), { headers: privatePaymentHeaders });
  } catch (error) { return paymentErrorResponse(error); }
}
export async function POST(request: Request): Promise<Response> {
  try { const customer = await requireCustomer(); assertPaymentOrigin(request); await paymentQuota(customer.id);
    const body = await readPaymentJson(request);
    return Response.json(await startRequestPayment(parsePaymentRequestId(body.requestId), customer), { headers: privatePaymentHeaders });
  } catch (error) { return paymentErrorResponse(error); }
}
