"use client";
import { useId, useState, type ReactNode } from "react";
export function JobFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return <>
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)} className="flex min-h-12 w-full items-center justify-between rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-night lg:hidden">
      {expanded ? "Masquer les filtres" : "Affiner ma recherche"}{activeCount ? <span className="rounded-full bg-paper px-2 py-1 text-xs">{activeCount}</span> : null}<span aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    <div id={id} className={`job-filter-content mt-4 lg:mt-0 ${expanded ? "block" : "hidden lg:block"}`}>{children}</div>
    <noscript><style>{".job-filter-content { display: block !important; }"}</style></noscript>
  </>;
}
