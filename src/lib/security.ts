const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }
  if (current.count >= limit) return { ok: false as const };
  current.count += 1;
  return { ok: true as const };
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 255;
}

export function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function sanitizePhone(value: string) {
  const cleaned = value.replace(/[^\d+\s()-]/g, "").trim();
  return clip(cleaned, 20);
}

export function looksLikeBot(formData: FormData) {
  const honey = formData.get("companyWebsite");
  return typeof honey === "string" && honey.trim().length > 0;
}

export const ALLOWED_EVENTS = new Set([
  "page_view",
  "solution_view",
  "cta_click",
  "lead_form_start",
  "lead_form_submit",
  "account_created",
  "login_request",
  "cv_start",
  "coaching_booking",
  "job_view",
  "newsletter_signup",
]);

export function parseStringList(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    /* ignore malformed CMS payload */
  }
  return [];
}

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
