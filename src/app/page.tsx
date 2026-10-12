import Link from "next/link";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";
import { CareerJourney } from "@/components/brand/CareerJourney";
import { Badge, ButtonLink, Card, Eyebrow, FaqList, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { getFaqs, getPublishedJobs, getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { howSteps, intents, solutions } from "@/lib/site";

export const dynamic = "force-dynamic";

const solutionIcons: Record<string, CareerIconName> = {
  cv: "document",
  "lettre-de-motivation": "letter",
  opportunites: "briefcase",
  matching: "target",
  coaching: "compass",
  expertise: "people",
};
const intentIcons: CareerIconName[] = ["briefcase", "document", "target", "compass", "people"];

export default async function HomePage() {
  const [homeFaqs, posts, jobs] = await Promise.all([getFaqs("home"), getPublishedPosts(), getPublishedJobs()]);
  const featuredPosts = posts.slice(0, 3);
  const featuredJobs = jobs.slice(0, 3);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }])} />
      {homeFaqs.length ? <JsonLd data={faqJsonLd(homeFaqs)} /> : null}

      <section className="hero-grid relative overflow-hidden text-white">
        <div className="mesh pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-wide text-white/85 sm:text-xs"><span className="h-1.5 w-1.5 rounded-full bg-gold" />Votre avenir professionnel commence ici</p>
            <h1 className="mt-6 max-w-2xl text-[2.6rem] font-extrabold leading-[1.1] tracking-[-0.045em] sm:text-6xl lg:text-[3.65rem]">
              Révélez votre potentiel.<br />
              <span className="text-gold">Boostez votre carrière.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              Un CV qui vous ressemble. Des candidatures qui ont du sens. Un accompagnement pour avancer vers votre prochain cap.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/solutions/cv" variant="orange" size="lg">Améliorer mon CV <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/emploi" variant="ghost" size="lg">Explorer les offres</ButtonLink>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
              <span className="flex items-center gap-1.5"><CareerIcon name="check" className="h-4 w-4 text-gold" />Un parcours personnalisé</span>
              <span className="flex items-center gap-1.5"><CareerIcon name="check" className="h-4 w-4 text-gold" />Une expertise humaine</span>
            </div>
          </div>
          <div className="lg:col-span-5"><CareerJourney /></div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-5 py-5 text-xs text-white/65 sm:flex-row sm:items-center md:px-8">
            <p>Du premier emploi au prochain tournant.</p>
            <p className="font-medium tracking-wide">Côte d’Ivoire <span className="px-2 text-gold" aria-hidden="true">/</span> Afrique <span className="px-2 text-gold" aria-hidden="true">/</span> International</p>
          </div>
        </div>
      </section>

      <Section tone="paper" className="!py-12 md:!py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold tracking-tight text-night">Quel est votre prochain objectif ?</h2>
          <p className="text-sm text-muted">Choisissez votre point de départ.</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {intents.map((intent, index) => (
            <Link key={intent.id} href={intent.href} className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-bright sm:items-start lg:flex-col">
              <CareerIcon name={intentIcons[index]} className="h-6 w-6 shrink-0 text-bright" />
              <span className="flex flex-1 flex-col"><span className="text-sm font-semibold leading-6 text-night">{intent.label}</span><span className="mt-2 text-xs text-muted group-hover:text-bright">{intent.cta} <span aria-hidden="true">↗</span></span></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="solutions">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="Les solutions CARRIOVA" title="Votre ambition. Les bons outils pour avancer." text="De la première candidature à une nouvelle direction : trouvez l’accompagnement adapté à votre besoin." />
          <Link href="/solutions" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-bright">Toutes les solutions <CareerIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map((item, index) => (
            <Link key={item.slug} href={item.href} className="group flex flex-col rounded-3xl border border-line p-7 transition-colors hover:border-bright hover:bg-paper">
              <div className="flex items-center justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index % 2 ? "bg-[#fff3e8] text-[#ad4304]" : "bg-soft text-bright"}`}><CareerIcon name={solutionIcons[item.slug]} /></span><span className="text-xs font-semibold tracking-wider text-muted/60">0{index + 1}</span></div>
              <h3 className="mt-6 text-xl font-bold text-night">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-muted">{item.short}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-bright">Découvrir <CareerIcon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeader eyebrow="Une méthode, un cap" title="On part de vous. On construit la suite." text="Votre parcours, vos compétences et vos objectifs guident chaque étape de l’accompagnement." />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {howSteps.map((step, index) => (
            <li key={step.title} className="border-t border-line pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-night text-xs font-semibold text-white">0{index + 1}</span>
              <h3 className="mt-5 font-bold text-night">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="Emploi & opportunités" title="Et si votre prochaine étape était ici ?" text="Explorez les offres publiées et préparez une candidature adaptée au poste visé." />
          <ButtonLink href="/emploi" variant="secondary" className="shrink-0">Voir les offres <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredJobs.length ? featuredJobs.map((job) => (
            <Link key={job.slug} href={`/emploi/${job.slug}`} className="group rounded-3xl border border-line p-6 transition-colors hover:border-bright">
              <Badge>{job.contractType}</Badge>
              <h3 className="mt-4 text-lg font-bold text-night group-hover:text-bright">{job.title}</h3>
              <p className="mt-2 text-sm text-muted">{job.company} · {job.location}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted">{job.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bright">Voir l’offre <CareerIcon name="arrow" className="h-4 w-4" /></span>
            </Link>
          )) : (
            <div className="flex flex-col items-start gap-6 rounded-3xl border border-dashed border-line bg-paper p-7 sm:flex-row sm:items-center md:col-span-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-bright"><CareerIcon name="briefcase" /></span>
              <div className="flex-1"><h3 className="font-bold text-night">Votre recherche se prépare dès maintenant.</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-muted">Aucune offre à afficher pour le moment. Profitez-en pour préciser votre projet et préparer un CV adapté aux postes que vous visez.</p></div>
              <ButtonLink href="/conseils-cv" variant="secondary" className="shrink-0">Préparer mon CV</ButtonLink>
            </div>
          )}
        </div>
      </Section>

      <section className="bg-white px-5 pb-20 md:px-8 md:pb-28">
        <div className="mx-auto grid max-w-[68rem] gap-10 overflow-hidden rounded-[2rem] bg-night p-7 text-white sm:p-10 lg:grid-cols-2 lg:p-14">
          <div>
            <Eyebrow className="!text-gold">L’humain fait la différence</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">Vous n’avez pas à tout décider seul.</h2>
            <p className="mt-5 text-base leading-8 text-white/70">Un regard extérieur pour clarifier vos options, préparer un entretien ou faire évoluer votre carrière. Ensemble, donnons une direction à votre prochain pas.</p>
            <ButtonLink href="/solutions/coaching" variant="orange" className="mt-7">Découvrir le coaching <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink>
          </div>
          <div className="grid content-center gap-4">
            {[
              { title: "Clarifier votre projet", text: "Mieux comprendre vos forces, vos envies et les options qui s’offrent à vous.", icon: "compass" as const },
              { title: "Préparer les moments clés", text: "Entretiens, reconversion ou mobilité : avancer avec méthode et confiance.", icon: "target" as const },
              { title: "Bénéficier d’un regard expert", text: "Une relecture de vos documents et des conseils adaptés à votre situation.", icon: "people" as const },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"><CareerIcon name={item.icon} className="mt-1 h-5 w-5 shrink-0 text-gold" /><div><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{item.text}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <Section tone="paper">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="Les ressources" title="Un peu de recul. De nouvelles idées." text="Des conseils pour mieux raconter votre parcours et préparer votre prochaine candidature." />
          <Link href="/ressources" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-bright">Toutes les ressources <CareerIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredPosts.length ? featuredPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <Card className="h-full !shadow-none transition-colors group-hover:border-bright"><Badge>{post.category}</Badge><h3 className="mt-5 text-lg font-bold leading-7 text-night group-hover:text-bright">{post.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{post.excerpt}</p><p className="mt-6 text-xs font-medium text-muted">{post.readingTime} min de lecture <span aria-hidden="true" className="ml-2 text-bright">↗</span></p></Card>
            </Link>
          )) : [
            { href: "/conseils-cv", title: "Faire ressortir l’essentiel dans votre CV", category: "CV & candidature", text: "Structure, expériences, compétences : retrouvez les repères pour un CV lisible et ciblé." },
            { href: "/conseils-carriere", title: "Donner une direction à votre carrière", category: "Projet professionnel", text: "Prenez du recul sur votre parcours et identifiez les prochaines étapes de votre évolution." },
            { href: "/faq", title: "Bien choisir votre accompagnement", category: "Questions fréquentes", text: "Découvrez le fonctionnement de CARRIOVA et les réponses aux questions sur nos solutions." },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-3xl border border-line bg-white p-7 transition-colors hover:border-bright"><p className="text-xs font-semibold text-bright">{item.category}</p><h3 className="mt-4 text-lg font-bold leading-7 text-night">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{item.text}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-bright">Explorer <CareerIcon name="arrow" className="h-4 w-4" /></span></Link>
          ))}
        </div>
      </Section>

      {homeFaqs.length ? (
        <Section><div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]"><div><SectionHeader eyebrow="Vos questions" title="Avançons l’esprit clair." /><Link href="/faq" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-bright">Toutes les réponses <CareerIcon name="arrow" className="h-4 w-4" /></Link></div><FaqList items={homeFaqs.slice(0, 5)} /></div></Section>
      ) : null}

      <Section className="text-center">
        <Eyebrow>Votre prochain chapitre</Eyebrow>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-night md:text-4xl">Le bon moment pour avancer,<br className="hidden sm:block" /> c’est le vôtre.</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted">Un objectif précis ou simplement l’envie de faire le point ? Trouvons ensemble votre prochaine étape.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/solutions" variant="orange" size="lg">Trouver ma solution <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink><ButtonLink href="/contact" variant="secondary" size="lg">Parlons de mon projet</ButtonLink></div>
      </Section>
    </>
  );
}
