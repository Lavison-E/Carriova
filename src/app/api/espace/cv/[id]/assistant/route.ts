import { requireCustomer } from "@/lib/customer-auth";
import { CvStoreError, getCustomerCv, reserveCvAiRun, finishCvAiRun } from "@/lib/cv-store";
import { privateCvHeaders, cvErrorResponse, readCvJson, assertCvOrigin, parseCvId } from "@/lib/cv-http";
import { getCvAiConfig } from "@/lib/cv-ai-config";
import { CvAiError, generateCvSuggestion, validateCvAiInput } from "@/lib/cv-ai";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let run: { runId: number; customerId: number } | undefined;
  try {
    assertCvOrigin(request);
    const customer = await requireCustomer();
    const id = parseCvId((await params).id);
    const input = await readCvJson(request, 24000) as Record<string, unknown>;
    if (!input || typeof input !== "object" || input.consent !== true || typeof input.facts !== "string" || typeof input.target !== "string" || !Number.isSafeInteger(input.version) || Number(input.version) < 0 || typeof input.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) {
      throw new CvAiError("INVALID_INPUT", "Vérifiez votre demande et acceptez l’envoi du contenu professionnel à Groq.", 400);
    }
    const config = getCvAiConfig();
    if (!config.enabled) throw new CvAiError("AI_UNAVAILABLE", "L’aide IA n’est pas encore disponible. Vous pouvez rédiger et exporter votre CV manuellement.");
    const document = await getCustomerCv(id, customer.id);
    if (!document) throw new CvAiError("NOT_FOUND", "CV introuvable.", 404);
    if (document.version !== Number(input.version)) throw new CvAiError("VERSION_CONFLICT", "Ce CV a été modifié. Rechargez la dernière version avant de continuer.", 409);
    validateCvAiInput(document.content, input.facts, input.target);
    const reserved = await reserveCvAiRun(customer.id, id, Number(input.version), input.requestId, { globalDailyLimit: config.dailyLimit });
    run = { runId: reserved.runId, customerId: customer.id };
    const result = await generateCvSuggestion(document.content, input.facts, input.target);
    await finishCvAiRun(run.runId, customer.id, { status: "succeeded", model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    run = undefined;
    // The draft may have been changed/deleted from another tab while Groq was responding.
    const current = await getCustomerCv(id, customer.id);
    if (!current || current.version !== Number(input.version)) throw new CvAiError("VERSION_CONFLICT", "Ce CV a été modifié dans une autre fenêtre. Rechargez la version sauvegardée avant une nouvelle proposition.", 409);
    return Response.json({ suggestion: result.suggestion, sourceVersion: Number(input.version), requestId: input.requestId }, { headers: privateCvHeaders });
  } catch (error) {
    if (run) {
      try { await finishCvAiRun(run.runId, run.customerId, { status: "failed", errorCode: error instanceof CvAiError || error instanceof CvStoreError ? error.code : "INTERNAL" }); } catch { /* Keep the reservation: no blind provider retry if accounting is unavailable. */ }
    }
    if (error instanceof CvAiError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: privateCvHeaders });
    return cvErrorResponse(error);
  }
}
