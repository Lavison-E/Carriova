import "server-only";

export function getCvAiConfig() {
  const apiKey = (process.env.GROQ_API_KEY ?? "").trim();
  const model = (process.env.GROQ_CV_MODEL ?? "openai/gpt-oss-120b").trim();
  const supported = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"].includes(model);
  const configuredLimit = Number(process.env.CV_AI_DAILY_LIMIT ?? 200);
  return {
    apiKey, model,
    enabled: Boolean(apiKey) && supported && process.env.CV_AI_ENABLED?.trim().toLowerCase() !== "false",
    dailyLimit: Number.isInteger(configuredLimit) && configuredLimit > 0 && configuredLimit <= 10000 ? configuredLimit : 200,
  };
}
export function isCvAiAvailable() { return getCvAiConfig().enabled; }
