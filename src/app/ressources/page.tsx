import Link from "next/link";
import { ResourceLeadForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { editorialPosts } from "@/lib/editorial";

export const metadata = buildMetadata({
  title: "Ressources carrière",
  description:
    "Des articles, des guides et des conseils pour préparer votre CV, écrire vos candidatures et avancer dans votre carrière.",
  path: "/ressources",
});

const resources = [
  { href: "/blog", title: "Le blog", text: "Des lectures pour mieux comprendre la recherche d’emploi et les moments clés d’une carrière.", cta: "Lire les articles" },
  { href: "/guides", title: "Les guides", text: "Des repères concrets pour passer de votre première idée à une candidature aboutie.", cta: "Explorer les guides" },
  { href: "/conseils-carriere", title: "Conseils carrière", text: "Faire le point, envisager une reconversion ou préparer votre prochaine évolution.", cta: "Prendre du recul" },
  { href: "/faq", title: "Vos questions", text: "Les réponses aux questions que vous vous posez sur CARRIOVA et ses accompagnements.", cta: "Consulter les réponses" },
  { href: "/conseils-cv", title: "Conseils CV", text: "Choisir les bons mots, rendre votre parcours lisible et faire ressortir vos réalisations.", cta: "Travailler mon CV" },
  { href: "/lettre-de-motivation", title: "Lettre de motivation", text: "Exprimer ce qui vous motive et relier votre expérience aux besoins d’un poste.", cta: "Préparer ma lettre" },
];

export default function ResourcesPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/ressources", label: "Ressources" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero image={{ src: "/images/Ressources Carriova.png", alt: "Une professionnelle prend des notes en consultant des ressources sur son ordinateur.", width: 1122, height: 1402, caption: "Des repères pour avancer avec méthode." }}
        eyebrow="Ressources"
        title="Apprendre, puis agir."
        text="Les bonnes questions, des conseils pratiques et le temps de faire le point. Retrouvez ici de quoi préparer votre prochain pas professionnel."
        crumbs={crumbs}
      />
      <Section className="pb-0 md:pb-0">
        <article className="grid gap-8 border-b border-night/20 pb-12 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">À lire maintenant</p>
            <p className="mt-3 text-xs leading-6 text-muted">Recherche d’emploi<br />7 min de lecture · 18 octobre 2026</p>
          </div>
          <div className="md:col-span-9">
            <h2 className="font-editorial max-w-3xl text-3xl italic leading-tight text-night sm:text-4xl"><Link href={`/blog/${editorialPosts[0].slug}`} className="hover:text-[#bd470d]">{editorialPosts[0].title}</Link></h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">Sept étapes, un tableau de suivi et une routine hebdomadaire pour avancer avec méthode.</p>
            <Link href={`/blog/${editorialPosts[0].slug}`} className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-night underline decoration-night/25 underline-offset-4 hover:text-[#bd470d]">Lire l’article<span aria-hidden="true">↗</span></Link>
          </div>
        </article>
      </Section>
      <Section>
        <ol className="grid gap-x-16 md:grid-cols-2 lg:gap-x-24">
          {resources.map((item, index) => (
            <li key={item.href} className="grid grid-cols-[2rem_1fr] gap-4 border-t border-night/20 py-9 sm:gap-6 sm:py-11">
              <span aria-hidden="true" className="pt-1 text-xs font-semibold tabular-nums text-[#bd470d]">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-night">{item.title}</h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-muted">{item.text}</p>
                <Link href={item.href} className="group mt-6 inline-flex min-h-11 items-center gap-4 text-sm font-semibold text-night underline decoration-night/25 underline-offset-4 transition-colors hover:text-[#bd470d] hover:decoration-[#bd470d]">
                  {item.cta}
                  <span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">↗</span>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section tone="paper">
        <div className="grid items-start gap-10 md:grid-cols-2 lg:gap-24">
          <div className="md:pt-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Une ressource pour commencer</p>
            <h2 className="font-editorial mt-5 text-5xl font-normal italic leading-[1.08] text-night">Votre CV,<br />avec un peu de recul.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted">Demandez notre guide CV pour vous aider à structurer votre parcours et préparer votre candidature. Laissez votre prénom et votre adresse e-mail : notre équipe vous transmettra la ressource.</p>
            <p className="mt-5 max-w-md text-xs leading-6 text-muted">Vous choisissez si vous souhaitez aussi recevoir nos autres conseils et ressources.</p>
          </div>
          <div className="rounded-xl border border-night/15 bg-white p-6 sm:p-8">
            <p className="mb-6 text-lg font-semibold text-night">Recevoir le guide CV</p>
            <ResourceLeadForm resource="guide-cv" />
          </div>
        </div>
      </Section>
    </>
  );
}
