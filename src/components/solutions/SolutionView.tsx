import Link from "next/link";
import { CoachingForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, FaqList, JsonLd, Section } from "@/components/ui/primitives";
import type { SolutionPageContent } from "@/lib/solution-content";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import type { Faq } from "@/db/schema";

export function SolutionView({ content, faqs }: { content: SolutionPageContent; faqs: Faq[] }) {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/solutions", label: "Solutions" },
    { href: `/solutions/${content.slug}`, label: content.eyebrow },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      {faqs.length ? <JsonLd data={faqJsonLd(faqs)} /> : null}
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        text={content.text}
        primary={content.primary}
        secondary={content.secondary}
        crumbs={crumbs}
      />

      <Section>
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d] md:col-span-3">02 / L’essentiel</p>
          <div className="grid gap-10 md:col-span-9 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-night">Partir de votre réalité.</h2>
              <p className="mt-5 text-sm leading-7 text-muted">{content.problem}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-night">Construire la bonne réponse.</h2>
              <p className="mt-5 text-sm leading-7 text-muted">{content.value}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">À qui s’adresse cette solution ?</p>
            <h2 className="font-editorial mt-4 text-4xl font-normal italic leading-tight text-night">Votre situation,<br />notre point de départ.</h2>
          </div>
          <ul className="grid gap-x-10 md:col-span-8 sm:grid-cols-2">
            {content.forWho.map((item) => (
              <li key={item} className="flex items-start gap-3 border-t border-night/15 py-5 text-sm font-medium leading-6 text-night">
                <span aria-hidden="true" className="text-[#bd470d]">↗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">03 / La méthode</p>
            <h2 className="font-editorial mt-5 text-5xl font-normal italic leading-[1.08] text-night">Un travail de fond.<br />Étape par étape.</h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted">De votre objectif au prochain pas, voici les étapes de votre parcours.</p>
          </div>
          <ol className="lg:col-span-8">
            {content.process.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-4 border-t border-night/20 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6">
                <span aria-hidden="true" className="pt-1 text-xs font-semibold tabular-nums text-[#bd470d]">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-night">{step.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="night">
        <div className="grid items-start gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#edb294]">04 / Ce qui change pour vous</p>
            <h2 className="font-editorial mt-5 text-5xl font-normal italic leading-tight text-white">Une base plus solide<br />pour avancer.</h2>
            <ul className="mt-8 max-w-xl divide-y divide-white/15">
              {content.benefits.map((item) => (
                <li key={item} className="flex items-start gap-4 py-4 text-sm leading-6 text-white/80">
                  <span aria-hidden="true" className="text-[#edb294]">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-[#f7f5ef] p-7 text-night md:col-span-5 md:mt-12 sm:p-9">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Les livrables</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Ce que vous emportez.</h2>
            <ul className="mt-7 space-y-5">
              {content.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted">
                  <span aria-hidden="true" className="font-semibold text-[#bd470d]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {content.slug === "coaching" ? (
        <Section id="reserver">
          <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Parlons de votre projet</p>
              <h2 className="font-editorial mt-5 text-5xl font-normal italic leading-tight text-night">Un temps pour vous.<br />Un cap pour la suite.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-muted">Partagez votre besoin et vos disponibilités. Nous vous recontactons pour confirmer un créneau. Aucun paiement n’est déclenché par cette demande.</p>
            </div>
            <div className="rounded-xl border border-night/15 bg-white p-6 sm:p-8">
              <CoachingForm />
            </div>
          </div>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section tone="paper">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Quelques réponses</p>
              <h2 className="font-editorial mt-4 text-4xl font-normal italic leading-tight text-night">Avant de<br />vous lancer.</h2>
            </div>
            <div className="md:col-span-8"><FaqList items={faqs} /></div>
          </div>
        </Section>
      ) : null}

      <Section>
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Pour aller plus loin</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-night">Tout se relie.</h2>
          </div>
          <div className="md:col-span-8">
            {content.related.map((item) => (
              <Link key={item.href} href={item.href} className="group flex items-center justify-between gap-5 border-b border-night/15 py-5 text-sm font-semibold text-night transition-colors hover:text-[#bd470d]">
                {item.label}
                <span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">↗</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-7 border-t border-night/20 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-editorial text-4xl italic leading-tight text-night">Et si l’on commençait ?</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={content.primary.href} variant="orange" size="lg">{content.primary.label}<span aria-hidden="true">↗</span></ButtonLink>
            <ButtonLink href="/tarifs" variant="secondary" size="lg">Voir les offres</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
