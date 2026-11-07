import { paymentErrorResponse, privatePaymentHeaders, readPaymentBody } from "@/lib/payment-http";
import { processGeniusPayWebhook } from "@/lib/payment-store";
export const runtime = "nodejs";
export async function POST(request: Request): Promise<Response> {
  try { await processGeniusPayWebhook(await readPaymentBody(request), request.headers); return Response.json({ received: true }, { headers: privatePaymentHeaders }); }
  catch (error) { return paymentErrorResponse(error); }
}
