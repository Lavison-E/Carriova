import Link from "next/link";
import { CoachingForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import {
  ButtonLink,
  Card,
  FaqList,
  JsonLd,
  Section,
  SectionHeader,
} from "@/components/ui/primitives";
import type { SolutionPageContent } from "@/lib/solution-content";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import type { Faq } from "@/db/schema";

export function SolutionView({
  content,
  faqs,
}: {
  content: SolutionPageContent;
  faqs: Faq[];
}) {
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
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Problème" title="Ce que nous adressons." />
            <p className="mt-4 text-base leading-7 text-muted">{content.problem}</p>
          </div>
          <div>
            <SectionHeader eyebrow="Valeur" title="Comment CARRIOVA intervient." />
            <p className="mt-4 text-base leading-7 text-muted">{content.value}</p>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeader eyebrow="Pour qui" title="Cette solution est utile si…" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {content.forWho.map((item) => (
            <Card key={item}>
              <p className="font-semibold text-night">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Processus" title="Comment cela se déroule." />
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {content.process.map((step, i) => (
            <li key={step.title} className="rounded-3xl border border-line p-5">
              <p className="text-xs font-semibold text-orange">0{i + 1}</p>
              <h3 className="mt-2 font-bold text-night">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="soft">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Bénéfices" title="Ce que vous gagnez." />
            <ul className="mt-6 space-y-3 text-sm leading-6 text-muted">
              {content.benefits.map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader eyebrow="Livrables" title="Ce que vous emportez." />
            <ul className="mt-6 space-y-3 text-sm leading-6 text-muted">
              {content.deliverables.map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {content.slug === "coaching" ? (
        <Section id="reserver">
          <div className="grid gap-10 md:grid-cols-2">
            <SectionHeader
              eyebrow="Réservation"
              title="Demandez une séance selon vos disponibilités."
              text="Nous confirmons un créneau après réception de votre demande. Aucun paiement n’est déclenché depuis ce formulaire."
            />
            <Card>
              <CoachingForm />
            </Card>
          </div>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section tone="paper">
          <SectionHeader eyebrow="FAQ" title="Questions fréquentes." />
          <div className="mt-8">
            <FaqList items={faqs} />
          </div>
        </Section>
      ) : null}

      <Section>
        <SectionHeader eyebrow="Pour aller plus loin" title="Ressources et solutions liées." />
        <div className="mt-8 flex flex-wrap gap-3">
          {content.related.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-night hover:border-bright hover:text-bright"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={content.primary.href} variant="orange" size="lg">
            {content.primary.label}
          </ButtonLink>
          <ButtonLink href="/tarifs" variant="secondary" size="lg">
            Voir les offres
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
