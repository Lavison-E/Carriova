"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => router.refresh())} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2.5 self-start rounded-lg border border-line bg-white px-3.5 text-[11px] font-medium text-night transition-colors hover:border-night/30 disabled:cursor-wait disabled:opacity-60">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 ${pending ? "motion-safe:animate-spin" : ""}`}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 17.9 17" /></svg>
    <span>{pending ? "Actualisation…" : "Actualiser"}</span>
  </button>;
}
