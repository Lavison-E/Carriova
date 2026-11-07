import { requireCustomer } from "@/lib/customer-auth";
import { assertPaymentOrigin, paymentErrorResponse, privatePaymentHeaders, readPaymentJson } from "@/lib/payment-http";
import { parsePaymentRequestId, paymentQuota, verifyRequestPayments } from "@/lib/payment-store";
export const runtime = "nodejs";
export async function POST(request: Request): Promise<Response> {
  try { const customer = await requireCustomer(); assertPaymentOrigin(request); await paymentQuota(customer.id);
    const body = await readPaymentJson(request);
    return Response.json(await verifyRequestPayments(parsePaymentRequestId(body.requestId), customer.id, body.paymentId), { headers: privatePaymentHeaders });
  } catch (error) { return paymentErrorResponse(error); }
}
