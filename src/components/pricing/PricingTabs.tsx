"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export function PricingTabs({ packs, services }: { packs: ReactNode; services: ReactNode }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const labels = ["Par situation", "Par solution"];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = selected === 0 ? 1 : 0;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return <div>
    <div className="mb-10 flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-center sm:justify-between">
      <div role="tablist" aria-label="Explorer les accompagnements" className="grid w-full grid-cols-2 gap-1 rounded-xl bg-paper p-1.5 sm:w-auto">
        {labels.map((label, index) => <button key={label} ref={(element) => { tabs.current[index] = element; }} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={selected === index} aria-controls={`${id}-panel-${index}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={handleKeyDown} className={`min-h-12 rounded-lg px-4 py-3 text-xs font-semibold transition-colors sm:px-8 sm:text-sm ${selected === index ? "bg-night text-white shadow-sm" : "text-muted hover:bg-white hover:text-night"}`}>{label}<span className={`ml-2 hidden text-[10px] sm:inline ${selected === index ? "text-white/70" : "text-muted"}`}>{index === 0 ? "6 packs" : "22 formules"}</span></button>)}
      </div>
      <p className="max-w-xs text-xs leading-6 text-muted">{selected === 0 ? "Plusieurs services réunis autour de votre objectif, à un tarif avantageux." : "Un besoin précis ? Choisissez la formule qui y répond."}</p>
    </div>
    <div id={`${id}-panel-0`} role="tabpanel" aria-labelledby={`${id}-tab-0`} tabIndex={0} hidden={selected !== 0}>{packs}</div>
    <div id={`${id}-panel-1`} role="tabpanel" aria-labelledby={`${id}-tab-1`} tabIndex={0} hidden={selected !== 1}>{services}</div>
  </div>;
}
