import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/primitives";
import { privacyPolicy, type PrivacyBlock } from "@/lib/editorial";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de Carriova, mise à jour le 18 octobre 2026 : données personnelles, finalités, droits et fonctionnalités envisagées.",
  path: "/legal/confidentialite",
});

function PrivacyText({ text }: { text: string }) {
  return text.split(/(contact@carriovaci\.com|https:\/\/carriovaci\.com)/g).map((part, index) => {
    if (part === "contact@carriovaci.com") return <a key={index} className="font-medium text-night underline underline-offset-4 hover:text-[#bd470d]" href="mailto:contact@carriovaci.com">{part}</a>;
    if (part === "https://carriovaci.com") return <a key={index} className="font-medium text-night underline underline-offset-4 hover:text-[#bd470d]" href="https://carriovaci.com">{part}</a>;
    return part;
  });
}

function PolicyBlock({ block }: { block: PrivacyBlock }) {
  if (block.type === "list") return <ul className="list-disc space-y-3 pl-5 marker:text-[#bd470d]">{block.items.map((item, index) => <li key={index}><PrivacyText text={item} /></li>)}</ul>;
  if (block.type === "subheading") return <h3 className="pt-3 text-lg font-semibold text-night">{block.text}</h3>;
  return <p><PrivacyText text={block.text} /></p>;
}

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Confidentialité"
        title={privacyPolicy.title}
        text={privacyPolicy.tagline}
        crumbs={[{ href: "/", label: "Accueil" }, { href: "/legal/confidentialite", label: "Confidentialité" }]}
      />
      <Section>
        <div className="mb-12 flex flex-col items-start gap-5 border-b border-night/15 pb-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-night">{privacyPolicy.updated}</p>
          <a href={privacyPolicy.downloadHref} download className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-night px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-royal">Télécharger le document original <span className="text-xs text-white/70">PDF · 11 pages</span><span aria-hidden="true">↓</span></a>
        </div>
        <div className="grid items-start gap-12 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Sommaire de la politique de confidentialité" className="rounded-xl border border-night/15 bg-[#f7f5ef] p-5 lg:sticky lg:top-28">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-night">Consulter le sommaire</summary>
              <ol className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto pr-2">
                {privacyPolicy.sections.map((section) => <li key={section.number}><a href={`#section-${section.number}`} className="flex gap-3 text-xs leading-6 text-muted hover:text-[#bd470d]"><span className="font-semibold tabular-nums text-[#bd470d]">{section.number}.</span><span>{section.title}</span></a></li>)}
              </ol>
            </details>
          </nav>
          <article className="min-w-0 max-w-3xl">
            {privacyPolicy.sections.map((section) => (
              <section key={section.number} id={`section-${section.number}`} className="scroll-mt-28 border-t border-night/15 py-9 first:border-t-0 first:pt-0">
                <p aria-hidden="true" className="mb-3 text-xs font-semibold tabular-nums text-[#bd470d]">{String(section.number).padStart(2, "0")}</p>
                <h2 className="text-2xl font-semibold leading-snug tracking-tight text-night"><span className="sr-only">{section.number}. </span>{section.title}</h2>
                <div className="mt-6 space-y-5 text-sm leading-7 text-muted">{section.blocks.map((block, index) => <PolicyBlock key={index} block={block} />)}</div>
              </section>
            ))}
          </article>
        </div>
      </Section>
    </>
  );
}
