import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { ecosystemModules, solutions } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Solutions carrière et employabilité",
  description:
    "Découvrez l’écosystème CARRIOVA : CV professionnel, lettre de motivation, opportunités, matching, coaching et expertise humaine.",
  path: "/solutions",
  keywords: ["solutions carrière", "CV", "coaching", "emploi"],
});

const journey = [
  {
    title: "Poser les bases.",
    text: "Mettre des mots justes sur votre parcours et sur ce que vous souhaitez construire.",
    modules: ecosystemModules.slice(0, 2),
  },
  {
    title: "Ouvrir les possibilités.",
    text: "Relier vos compétences à une opportunité, puis préparer une candidature qui a du sens.",
    modules: ecosystemModules.slice(2, 6),
  },
  {
    title: "Prendre de la hauteur.",
    text: "Bénéficier d’un regard humain pour affiner vos choix et préparer la suite.",
    modules: ecosystemModules.slice(6),
  },
];

export default function SolutionsPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/solutions", label: "Solutions" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Nos solutions"
        title="Une ambition. Plusieurs façons d’avancer."
        text="Un CV à repenser, une opportunité à saisir, une direction à clarifier. Trouvez l’accompagnement qui répond à votre prochain objectif."
        primary={{ href: "/contact", label: "Parlons de votre projet" }}
        secondary={{ href: "/tarifs", label: "Voir les offres" }}
        crumbs={crumbs}
      />

      <Section>
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">L’accompagnement CARRIOVA</p>
            <h2 className="font-editorial mt-4 max-w-xl text-4xl font-normal italic leading-[1.1] text-night md:text-5xl">Le bon appui,<br />au bon moment.</h2>
          </div>
          <p className="max-w-xs text-sm leading-7 text-muted">Explorez nos solutions. Chacune commence par votre situation et vise un prochain pas concret.</p>
        </div>
        <div className="border-b border-night/20">
          {solutions.map((item, index) => (
            <Link key={item.slug} href={item.href} className="group grid gap-5 border-t border-night/20 py-8 transition-colors hover:bg-[#f7f5ef] md:grid-cols-12 md:gap-6 md:py-10">
              <span aria-hidden="true" className="pt-1 text-xs font-semibold tabular-nums text-[#bd470d] md:col-span-1">{String(index + 1).padStart(2, "0")}</span>
              <div className="md:col-span-4">
                <h3 className="text-2xl font-semibold leading-tight tracking-tight text-night transition-colors group-hover:text-[#bd470d]">{item.title}</h3>
                <p className="mt-3 text-xs leading-6 text-muted">{item.audience}</p>
              </div>
              <p className="max-w-md text-sm leading-7 text-muted md:col-span-4">{item.short}</p>
              <span className="flex items-center gap-3 text-sm font-semibold text-night md:col-span-3 md:justify-self-end md:self-start">
                {item.cta}
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-night/20 text-lg transition-colors group-hover:border-[#bd470d] group-hover:bg-[#bd470d] group-hover:text-white">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="night">
        <div className="max-w-2xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#edb294]">Un parcours qui vous ressemble</p>
          <h2 className="font-editorial mt-5 text-5xl font-normal italic leading-[1.1] text-white md:text-6xl">Votre carrière<br />se construit dans la durée.</h2>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
          {journey.map((stage, index) => (
            <div key={stage.title} className="border-t border-white/25 pt-6">
              <p className="text-xs font-medium text-[#edb294]">0{index + 1}</p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{stage.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/70">{stage.text}</p>
              <ul className="mt-6 space-y-3">
                {stage.modules.map((module) => (
                  <li key={module.n}>
                    <Link href={module.href} className="inline-flex items-center gap-3 text-sm text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#edb294] hover:decoration-[#edb294]">
                      {module.title}<span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Commençons par un échange</p>
            <h2 className="font-editorial mt-4 text-4xl font-normal italic leading-tight text-night md:text-5xl">Vous hésitez sur<br />le prochain pas ?</h2>
            <p className="mt-5 text-sm leading-7 text-muted">Décrivez-nous votre situation. Nous vous aidons à choisir un accompagnement adapté à votre besoin.</p>
          </div>
          <ButtonLink href="/contact" variant="orange" size="lg">Parler à l’équipe<span aria-hidden="true">↗</span></ButtonLink>
        </div>
      </Section>
    </>
  );
}
