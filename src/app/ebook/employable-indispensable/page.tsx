import type { Metadata } from "next";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { EbookBuyButton, EbookCover, EbookGlow, EbookPrice } from "@/components/ebook/EbookPromo";
import { FaqList, JsonLd } from "@/components/ui/primitives";
import { ebook, ebookCheckoutHref } from "@/lib/ebook";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

const description = "L’ebook carrière de CARRIOVA : un CV qui prouve votre valeur, des entretiens préparés avec la méthode STAR et un plan sur 12 mois. 157 pages, 10 annexes et 3 bonus, en téléchargement immédiat.";
const base = buildMetadata({ title: `${ebook.name} — l’ebook carrière`, description, path: ebook.path, keywords: ["ebook carrière", "employabilité", "méthode STAR", "modèles de CV", "plan 30-60-90"] });
export const metadata: Metadata = {
  ...base,
  openGraph: { ...base.openGraph, type: "book", images: [{ url: absoluteUrl(ebook.ogImage), width: 1600, height: 1600, alt: `${ebook.name}, l’ebook carrière de CARRIOVA` }] },
  twitter: { ...base.twitter, images: [absoluteUrl(ebook.ogImage)] },
};

const productJsonLd = {
  "@context": "https://schema.org", "@type": "Book", name: ebook.name, alternativeHeadline: ebook.subtitle,
  author: { "@type": "Person", name: ebook.author }, bookFormat: "https://schema.org/EBook", numberOfPages: 157, inLanguage: "fr",
  image: absoluteUrl(ebook.ogImage), url: absoluteUrl(ebook.path),
  offers: { "@type": "Offer", price: "22.47", priceCurrency: "USD", availability: "https://schema.org/InStock", url: ebook.checkoutUrl },
};

function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: React.ReactNode; light?: boolean }) {
  return <div><p className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? "text-gold" : "text-orange"}`}><span className={`h-px w-8 ${light ? "bg-gold" : "bg-orange"}`} />{eyebrow}</p><h2 className={`mt-4 text-[clamp(2rem,3.6vw,2.9rem)] font-semibold leading-[1.08] tracking-[-0.045em] ${light ? "text-white" : "text-night"}`}>{children}</h2></div>;
}

export default function EbookPage() {
  return <>
    <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Ressources", path: "/ressources" }, { name: ebook.name, path: ebook.path }])} />
    <JsonLd data={productJsonLd} />
    <JsonLd data={faqJsonLd(ebook.faqs.map((faq) => ({ ...faq })))} />

    {/* Hero */}
    <section className="relative isolate overflow-hidden bg-night text-white">
      <EbookGlow />
      <div className="site-container relative grid items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-24 lg:pt-14">
        <div>
          <nav aria-label="Fil d’Ariane" className="mb-10 flex flex-wrap items-center gap-2 text-[11px] text-white/55"><Link href="/" className="hover:text-white">Accueil</Link><span aria-hidden="true">/</span><Link href="/ressources" className="hover:text-white">Ressources</Link><span aria-hidden="true">/</span><span className="text-white/80">Ebook</span></nav>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold"><span className="h-px w-8 bg-gold" />Ebook · Employabilité</p>
          <h1 className="mt-6 text-[clamp(3rem,6.4vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.06em]">Prouvez<br /><span className="font-editorial font-normal italic tracking-[-0.03em] text-gold">votre valeur.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80"><strong className="font-semibold text-white">{ebook.name}</strong> : {ebook.subtitle.toLocaleLowerCase("fr")}. La méthode CARRIOVA, du CV stratégique à vos 90 premiers jours en poste.</p>
          <ul className="mt-7 grid gap-3 text-sm text-white/85 sm:grid-cols-2">{["CV stratégique : des résultats, pas des tâches", "Entretiens préparés avec la méthode STAR", "Plan 30-60-90 jours et cap sur 12 mois", "3 bonus offerts, dont 3 modèles de CV"].map((item) => <li key={item} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange"><CareerIcon name="check" className="h-3 w-3" /></span>{item}</li>)}</ul>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center"><EbookBuyButton className="sm:min-w-[19rem]" /><EbookPrice /></div>
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/55"><span>⚡ Téléchargement immédiat</span><span>🔒 Paiement sécurisé · Mobile Money ou carte</span><span>↺ Remboursable 7 jours</span></p>
        </div>
        <div className="relative mx-auto w-full max-w-[440px]">
          <div aria-hidden="true" className="absolute inset-x-10 bottom-0 h-16 rounded-[50%] bg-black/50 blur-2xl" />
          <EbookCover priority className="relative rotate-[1.5deg] transition-transform duration-700 hover:rotate-0" />
        </div>
      </div>
      <div className="relative border-t border-white/10 bg-white/[0.03]">
        <dl className="site-container grid grid-cols-2 divide-white/10 py-6 sm:grid-cols-4 sm:divide-x">{ebook.stats.map((stat) => <div key={stat.label} className="px-2 py-2 text-center sm:px-6"><dt className="text-[11px] uppercase tracking-[0.14em] text-white/55">{stat.label}</dt><dd className="mt-1 text-3xl font-semibold tracking-tight">{stat.value}</dd></div>)}</dl>
      </div>
    </section>

    {/* Promises */}
    <section className="bg-paper py-20 md:py-24">
      <div className="site-container">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"><SectionTitle eyebrow="Ce que vous allez construire">Cinq leviers pour devenir <span className="font-editorial font-normal italic text-orange">celui qu’on recherche.</span></SectionTitle><p className="max-w-xl text-base leading-8 text-muted lg:justify-self-end">Pas de recettes miracles : une méthode, des exemples et des outils pour rendre visible ce que vous apportez, puis le faire grandir.</p></div>
        <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{ebook.promises.map((promise, index) => <li key={promise.title} className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,18,82,0.08)]"><span className="font-editorial text-4xl italic text-orange/80">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-6 text-base font-semibold tracking-tight text-night">{promise.title}</h3><p className="mt-2 text-sm leading-7 text-muted">{promise.text}</p><span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-orange transition-transform duration-300 group-hover:scale-x-100" /></li>)}</ol>
      </div>
    </section>

    {/* Inside + bonuses */}
    <section className="py-20 md:py-24">
      <div className="site-container grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionTitle eyebrow="À l’intérieur">157 pages pensées <span className="font-editorial font-normal italic text-orange">pour passer à l’action.</span></SectionTitle>
          <p className="mt-5 text-base leading-8 text-muted">7 parties et 20 chapitres, chacun avec ses cas pratiques, ses encadrés de révision et ses exercices. Et 10 annexes prêtes à l’emploi, dont :</p>
          <ul className="mt-8 divide-y divide-line border-y border-line">{ebook.inside.map((item) => <li key={item} className="flex items-start gap-4 py-4 text-sm leading-7 text-night"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff0e5] text-orange"><CareerIcon name="check" className="h-3 w-3" /></span>{item}</li>)}</ul>
        </div>
        <div className="relative isolate overflow-hidden rounded-3xl bg-night p-7 text-white sm:p-10">
          <EbookGlow />
          <div className="relative">
            <p className="inline-flex rounded-full bg-orange px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">Bonus inclus</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">Trois outils offerts avec l’ebook</h2>
            <ul className="mt-8 space-y-4">{ebook.bonuses.map((bonus, index) => <li key={bonus.title} className="flex gap-5 rounded-2xl border border-white/12 bg-white/[0.05] p-5 backdrop-blur"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold text-gold">{index + 1}</span><div><h3 className="flex flex-wrap items-center gap-3 font-semibold">{bonus.title}<span className="rounded-full border border-gold/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">Offert</span></h3><p className="mt-1.5 text-sm leading-7 text-white/70">{bonus.detail}</p></div></li>)}</ul>
            <div className="mt-8"><EbookBuyButton label="Recevoir l’ebook et ses bonus" className="w-full" /></div>
          </div>
        </div>
      </div>
    </section>

    {/* Audience + author */}
    <section className="bg-paper py-20 md:py-24">
      <div className="site-container grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-line bg-white p-7 sm:p-10">
          <SectionTitle eyebrow="Pour qui ?">Écrit pour celles et ceux <span className="font-editorial font-normal italic text-orange">qui veulent avancer.</span></SectionTitle>
          <ul className="mt-8 space-y-4">{ebook.audience.map((item) => <li key={item} className="flex items-start gap-4 text-base leading-7 text-night"><CareerIcon name="target" className="mt-1 h-5 w-5 shrink-0 text-orange" />{item}</li>)}</ul>
          <p className="mt-8 rounded-xl bg-paper px-5 py-4 text-xs leading-6 text-muted">{ebook.notFor}</p>
        </div>
        <figure className="flex flex-col justify-between rounded-3xl bg-night p-7 text-white sm:p-10">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">L’auteur</p><p className="mt-5 font-editorial text-[1.9rem] italic leading-[1.25] tracking-[-0.01em]">La méthode qui guide l’accompagnement CARRIOVA, enfin réunie dans un livre.</p></div>
          <figcaption className="mt-10 border-t border-white/15 pt-6"><p className="font-semibold">{ebook.author}</p><p className="mt-1 text-sm text-white/65">{ebook.authorRole}</p></figcaption>
        </figure>
      </div>
    </section>

    {/* FAQ + final CTA */}
    <section className="py-20 md:py-24">
      <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionTitle eyebrow="Questions fréquentes">Tout savoir <span className="font-editorial font-normal italic text-orange">avant de commencer.</span></SectionTitle>
        <FaqList items={ebook.faqs.map((faq) => ({ ...faq }))} />
      </div>
    </section>
    <section className="border-t border-line bg-[#fff7f0]">
      <div className="site-container flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center">
        <div><h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-tight tracking-[-0.045em] text-night">Votre valeur mérite <span className="font-editorial font-normal italic text-orange">d’être vue.</span></h2><div className="mt-4"><EbookPrice tone="light" /></div></div>
        <div className="flex flex-col items-start gap-3"><EbookBuyButton className="min-w-[19rem]" /><a href={ebookCheckoutHref("site")} target="_blank" rel="noopener" className="text-[11px] text-muted underline-offset-4 hover:underline">Paiement et téléchargement sur la boutique sécurisée Chariow ↗</a></div>
      </div>
    </section>
  </>;
}
