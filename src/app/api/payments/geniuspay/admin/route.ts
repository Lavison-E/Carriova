import { paymentErrorResponse, privatePaymentHeaders } from "@/lib/payment-http";
import { getTeamRequestPaymentSummary, parsePaymentRequestId } from "@/lib/payment-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  try { const id = parsePaymentRequestId(new URL(request.url).searchParams.get("requestId"));
    return Response.json(await getTeamRequestPaymentSummary(id), { headers: privatePaymentHeaders });
  } catch (error) { return paymentErrorResponse(error); }
}
