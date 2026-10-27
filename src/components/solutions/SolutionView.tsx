import Link from "next/link";
import { qualificationRequestHref, serviceNeedForSlug, workspaceRequestHref } from "@/lib/service-catalog";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, FaqList, JsonLd, Section } from "@/components/ui/primitives";
import type { SolutionPageContent } from "@/lib/solution-content";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import type { Faq } from "@/db/schema";

export function SolutionView({ content, faqs }: { content: SolutionPageContent; faqs: Faq[] }) {
  const requestNeed = serviceNeedForSlug(content.slug);
  const displayedFaqs = faqs.map((faq) => faq.answer === "Via le formulaire de la page coaching. Nous confirmons un créneau selon les disponibilités."
    ? { ...faq, answer: "Présentez votre besoin dans le formulaire de qualification. L’équipe vous proposera un format et conviendra d’un créneau avec vous. Votre demande ne réserve pas automatiquement une séance." }
    : faq);
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/solutions", label: "Solutions" },
    { href: `/solutions/${content.slug}`, label: content.eyebrow },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      {displayedFaqs.length ? <JsonLd data={faqJsonLd(displayedFaqs)} /> : null}
      <PageHero
        image={content.slug === "coaching" ? { src: "/images/Caoching Carriova.png", alt: "Une conseillère accompagne un professionnel lors d’un échange autour de son parcours.", width: 1122, height: 1402, caption: "Un temps d’échange pour éclairer la prochaine étape." } : undefined}
        eyebrow={content.eyebrow}
        title={content.title}
        text={content.text}
        primary={content.primary}
        secondary={content.secondary}
        crumbs={crumbs}
      >
        {content.slug !== "opportunites" ? <div className="max-w-2xl rounded-lg border border-night/15 bg-white/60 px-4 py-3"><p className="text-xs leading-6 text-muted">Le contenu, le tarif et l’échéance sont précisés avant le démarrage de la prestation.</p><Link href={workspaceRequestHref(requestNeed)} className="mt-1 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-night underline decoration-night/25 underline-offset-4 hover:text-orange">Déjà connecté ? Créer cette demande dans mon espace <span aria-hidden="true">↗</span></Link></div> : null}
      </PageHero>

      {content.slug === "cv" ? <Section className="!py-8"><div className="flex flex-col gap-6 rounded-xl border border-night/15 bg-paper p-6 sm:p-8 md:flex-row md:items-center md:justify-between"><div className="max-w-xl"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Le studio CV</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">Vous préférez le rédiger vous-même ?</h2><p className="mt-3 text-sm leading-7 text-muted">Créez et modifiez votre CV dans votre espace, choisissez une présentation et téléchargez votre PDF. L’accompagnement de l’équipe reste disponible si vous souhaitez être conseillé.</p></div><div className="shrink-0"><ButtonLink href="/espace/cv" variant="primary">Ouvrir le studio CV</ButtonLink><p className="mt-3 text-[10px] leading-6 text-muted">Connexion à votre espace requise.</p></div></div></Section> : null}

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
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">{content.slug === "opportunites" ? "Les ressources disponibles" : "Selon la proposition convenue"}</p>
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
          <div className="grid items-start gap-8 rounded-xl border border-line bg-paper p-6 sm:p-9 md:grid-cols-2 md:gap-12">
            <div><p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-orange">Choisir le bon échange</p><h2 className="mt-5 font-editorial text-4xl italic leading-tight text-night">Votre objectif guide<br />le format de la séance.</h2><p className="mt-5 text-sm leading-7 text-muted">Présentez votre besoin. Le rendez-vous sera confirmé avec l’équipe après définition de l’accompagnement et de son tarif.</p></div>
            <div className="space-y-4"><ButtonLink href={qualificationRequestHref("career_growth")} variant="orange" className="w-full justify-between">Faire le point sur ma carrière <span aria-hidden="true">↗</span></ButtonLink><ButtonLink href={qualificationRequestHref("interview")} variant="secondary" className="w-full justify-between">Préparer un entretien <span aria-hidden="true">↗</span></ButtonLink><p className="text-xs leading-6 text-muted">Vous pourrez retrouver la proposition, les échanges et les supports partagés dans votre espace client.</p></div>
          </div>
        </Section>
      ) : null}

      {displayedFaqs.length ? (
        <Section tone="paper">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Quelques réponses</p>
              <h2 className="font-editorial mt-4 text-4xl font-normal italic leading-tight text-night">Avant de<br />vous lancer.</h2>
            </div>
            <div className="md:col-span-8"><FaqList items={displayedFaqs} /></div>
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
