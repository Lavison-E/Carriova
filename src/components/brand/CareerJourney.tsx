import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";

const steps = [
  { number: "01", title: "Votre potentiel", detail: "Des compétences à révéler", icon: "compass", href: "/solutions/coaching" },
  { number: "02", title: "Votre candidature", detail: "Un parcours à valoriser", icon: "document", href: "/solutions/cv" },
  { number: "03", title: "Votre prochain cap", detail: "Des opportunités à explorer", icon: "briefcase", href: "/emploi" },
] as const;

export function CareerJourney() {
  return (
    <div className="career-journey relative mx-auto w-full max-w-md rounded-[2rem] border border-white/15 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Une carrière qui avance</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-gold"><CareerIcon name="arrow" className="-rotate-45" /></span>
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 440 450" fill="none" aria-hidden="true">
        <path d="M-20 415C150 435 70 145 275 200S350 65 465 25" stroke="#fe9c0c" strokeOpacity=".35" strokeWidth="2" strokeDasharray="5 7" />
        <circle cx="358" cy="79" r="49" stroke="white" strokeOpacity=".06" strokeWidth="30" />
        <circle cx="55" cy="358" r="48" stroke="white" strokeOpacity=".04" strokeWidth="30" />
      </svg>
      <ol className="relative mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={step.number} className={index === 1 ? "ml-5 sm:ml-8" : "mr-5 sm:mr-8"}>
            <Link href={step.href} className="group flex items-center gap-4 rounded-2xl border border-white/15 bg-[#0b2264]/95 p-4 shadow-xl transition-colors hover:border-gold/60 hover:bg-[#132d76]">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${index === 2 ? "bg-gold text-night" : "bg-white/10 text-white"}`}><CareerIcon name={step.icon} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold tracking-[0.15em] text-gold">ÉTAPE {step.number}</span>
                <span className="mt-1 block text-base font-bold">{step.title}</span>
                <span className="mt-1 block text-xs leading-5 text-white/65">{step.detail}</span>
              </span>
              <CareerIcon name="arrow" className="h-4 w-4 shrink-0 text-white/50 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ol>
      <p className="relative mt-7 flex items-center gap-2 text-xs text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-gold" />À votre rythme. Avec une direction.</p>
    </div>
  );
}
