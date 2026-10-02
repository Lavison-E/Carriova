import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, Card, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { breadcrumbJsonLd } from "@/lib/seo";

export type SeoLandingContent = {
  path: string;
  eyebrow: string;
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  sections: { title: string; text: string }[];
  related: { href: string; label: string }[];
};

export function SeoLanding({ content }: { content: SeoLandingContent }) {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: content.path, label: content.eyebrow },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        text={content.text}
        primary={content.primary}
        secondary={content.secondary}
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {content.sections.map((item) => (
            <Card key={item.title}>
              <h2 className="text-xl font-bold text-night">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section tone="paper">
        <SectionHeader eyebrow="Continuer" title="Aller plus loin dans l’écosystème." />
        <div className="mt-6 flex flex-wrap gap-3">
          {content.related.map((item) => (
            <ButtonLink key={item.href} href={item.href} variant="secondary" size="sm">
              {item.label}
            </ButtonLink>
          ))}
        </div>
      </Section>
    </>
  );
}
