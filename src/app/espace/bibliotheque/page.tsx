import type { Metadata } from "next";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { EbookBuyButton, EbookCover, EbookGlow, EbookPrice } from "@/components/ebook/EbookPromo";
import { WorkspaceHeading } from "@/components/workspace/WorkspaceUi";
import { ebook } from "@/lib/ebook";

export const metadata: Metadata = { title: "Ma bibliothèque" };

export default function LibraryPage() {
  return <>
    <WorkspaceHeading eyebrow="Bibliothèque premium" title="Apprendre à votre rythme." text="Les ressources CARRIOVA pour avancer entre deux échanges avec l’équipe. Le paiement et le téléchargement se font sur notre boutique sécurisée." />

    <section aria-labelledby="library-ebook" className="relative isolate overflow-hidden rounded-2xl bg-night text-white shadow-[0_28px_70px_rgba(0,18,82,0.25)]">
      <EbookGlow />
      <div className="relative grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12 xl:p-12">
        <div>
          <p className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold"><span className="rounded-full bg-orange px-2.5 py-1 text-white">Nouveau</span>Ebook · PDF + bonus</p>
          <h2 id="library-ebook" className="mt-5 text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.05em]">{ebook.name}</h2>
          <p className="mt-3 font-editorial text-xl italic text-white/80">{ebook.subtitle}</p>
          <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{ebook.stats.map((stat) => <div key={stat.label} className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3"><dt className="sr-only">{stat.label}</dt><dd><span className="block text-2xl font-semibold">{stat.value}</span><span className="text-[11px] leading-5 text-white/60">{stat.label}</span></dd></div>)}</dl>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center"><EbookBuyButton source="espace" /><EbookPrice /></div>
          <p className="mt-4 text-[11px] text-white/55">Téléchargement immédiat · Mobile Money ou carte · Remboursable 7 jours</p>
        </div>
        <div className="mx-auto w-full max-w-[260px]"><EbookCover sizes="280px" priority /></div>
      </div>
    </section>

    <div className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section aria-labelledby="library-learn" className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Ce que vous allez construire</p>
        <h2 id="library-learn" className="mt-3 text-xl font-semibold tracking-tight">Cinq leviers, du CV à vos 90 premiers jours</h2>
        <ol className="mt-6 space-y-4">{ebook.promises.map((promise, index) => <li key={promise.title} className="flex gap-4"><span className="font-editorial text-2xl italic leading-none text-orange">{String(index + 1).padStart(2, "0")}</span><div><h3 className="text-sm font-semibold text-night">{promise.title}</h3><p className="mt-1 text-xs leading-6 text-muted">{promise.text}</p></div></li>)}</ol>
      </section>
      <section aria-labelledby="library-bonus" className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Offerts avec l’ebook</p>
        <h2 id="library-bonus" className="mt-3 text-xl font-semibold tracking-tight">Trois bonus prêts à servir</h2>
        <ul className="mt-6 space-y-3">{ebook.bonuses.map((bonus) => <li key={bonus.title} className="rounded-xl bg-paper p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-night"><CareerIcon name="check" className="h-4 w-4 text-orange" />{bonus.title}</h3><p className="mt-1.5 text-xs leading-6 text-muted">{bonus.detail}</p></li>)}</ul>
      </section>
    </div>

    <section className="mt-7 flex flex-col justify-between gap-5 rounded-2xl border border-night/10 bg-white p-6 sm:flex-row sm:items-center sm:p-7">
      <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0e5] text-orange"><CareerIcon name="people" className="h-5 w-5" /></span><div><h2 className="text-base font-semibold text-night">Envie d’aller plus vite avec un conseiller ?</h2><p className="mt-1 text-xs leading-6 text-muted">Appliquez la méthode à votre situation : CV, entretien ou plan de carrière, l’équipe vous accompagne.</p></div></div>
      <Link href="/espace/nouvelle-demande" className="inline-flex min-h-12 shrink-0 items-center justify-between gap-6 rounded-lg bg-night px-5 text-xs font-semibold text-white hover:bg-royal">Faire une demande<CareerIcon name="arrow" className="h-4 w-4" /></Link>
    </section>
    <p className="mt-5 text-[11px] leading-6 text-muted">Déjà acheté ? Votre PDF et vos bonus sont disponibles depuis la confirmation de commande Chariow envoyée à votre adresse e-mail.</p>
  </>;
}
