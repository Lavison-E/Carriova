import Image from "next/image";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { ebook, ebookCheckoutHref } from "@/lib/ebook";

/** Ambient glow + grid used behind every ebook visual, matching the cover art. */
export function EbookGlow() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-[#2449a0] opacity-60 blur-[110px]" />
    <div className="absolute -left-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-orange opacity-[0.16] blur-[120px]" />
    <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:56px_56px]" />
  </div>;
}

export function EbookCover({ className = "", priority = false, sizes = "(min-width: 1024px) 420px, 70vw" }: { className?: string; priority?: boolean; sizes?: string }) {
  return <Image src={ebook.cover} alt={`Couverture de l’ebook ${ebook.name}, par ${ebook.author}`} width={860} height={1130} priority={priority} sizes={sizes} className={`ebook-cover h-auto w-full ${className}`} />;
}

export function EbookPrice({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <span className={`text-3xl font-semibold tracking-tight ${tone === "dark" ? "text-white" : "text-night"}`}>{ebook.price}</span>
    <span className={`text-sm line-through ${tone === "dark" ? "text-white/50" : "text-muted"}`}>{ebook.compareAtPrice}</span>
    <span className="rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Offre de lancement</span>
  </p>;
}

export function EbookBuyButton({ source = "site", label = "Obtenir l’ebook maintenant", className = "" }: { source?: "site" | "espace" | "equipe"; label?: string; className?: string }) {
  return <a href={ebookCheckoutHref(source)} target="_blank" rel="noopener" className={`group inline-flex min-h-14 items-center justify-between gap-6 rounded-xl bg-orange px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(189,71,13,0.38)] transition hover:-translate-y-0.5 hover:bg-[#d4540f] ${className}`}>{label}<span className="flex items-center gap-2"><span className="sr-only">(paiement sécurisé Chariow, nouvel onglet)</span><CareerIcon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></a>;
}

/** Wide band for the public site (home, resources). */
export function EbookBand() {
  return <section aria-labelledby="ebook-band-title" className="relative isolate overflow-hidden bg-night text-white">
    <EbookGlow />
    <div className="site-container relative grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <div>
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold"><span className="h-px w-8 bg-gold" />Nouveau · L’ebook CARRIOVA</p>
        <h2 id="ebook-band-title" className="mt-5 text-[clamp(2.3rem,4.4vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.05em]">Prouvez <span className="font-editorial font-normal italic text-gold">votre valeur.</span><br />Devenez indispensable.</h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-white/75">{ebook.name} réunit la méthode CARRIOVA : un CV qui montre des résultats, des entretiens préparés avec la méthode STAR et un plan concret pour progresser. Avec trois bonus offerts.</p>
        <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">{ebook.stats.map((stat) => <div key={stat.label} className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 backdrop-blur"><dt className="sr-only">{stat.label}</dt><dd><span className="block text-2xl font-semibold tracking-tight">{stat.value}</span><span className="text-[11px] leading-5 text-white/60">{stat.label}</span></dd></div>)}</dl>
        <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center"><EbookBuyButton /><Link href={ebook.path} className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-white/85 hover:text-white">Découvrir le sommaire <CareerIcon name="arrow" className="h-4 w-4" /></Link></div>
        <div className="mt-6"><EbookPrice /></div>
      </div>
      <Link href={ebook.path} className="relative mx-auto block w-full max-w-[360px] transition-transform duration-500 hover:-translate-y-2 hover:rotate-[-1deg]" aria-label={`Découvrir l’ebook ${ebook.name}`}><EbookCover /></Link>
    </div>
  </section>;
}

/** Compact premium card for the client space. */
export function EbookSpaceCard() {
  return <section aria-labelledby="ebook-space-title" className="relative isolate overflow-hidden rounded-2xl bg-night text-white shadow-[0_24px_60px_rgba(0,18,82,0.22)]">
    <EbookGlow />
    <div className="relative grid items-center gap-6 p-6 sm:grid-cols-[1fr_190px] sm:p-8 lg:grid-cols-[1fr_220px]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Bibliothèque premium · Ebook</p>
        <h2 id="ebook-space-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{ebook.name}</h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-white/70">{ebook.subtitle}. 157 pages, 10 annexes et 3 bonus pour prouver votre valeur, du CV jusqu’à vos 90 premiers jours.</p>
        <ul className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium">{["Manuel d’entretien", "3 modèles de CV Word", "Plan 30-60-90 jours"].map((item) => <li key={item} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5">✓ {item}</li>)}</ul>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center"><EbookBuyButton source="espace" label="Obtenir l’ebook" /><Link href="/espace/bibliotheque" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white/80 hover:text-white">Voir le contenu <CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link></div>
      </div>
      <Link href="/espace/bibliotheque" className="mx-auto hidden w-full max-w-[200px] transition-transform duration-500 hover:-translate-y-1.5 sm:block" aria-label="Ouvrir la bibliothèque"><EbookCover sizes="220px" /></Link>
    </div>
  </section>;
}
