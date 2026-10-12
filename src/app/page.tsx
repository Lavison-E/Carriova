import Image from "next/image";
import Link from "next/link";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";
import { Badge, ButtonLink, Eyebrow, FaqList, JsonLd, Section } from "@/components/ui/primitives";
import { getFaqs, getPublishedJobs, getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { solutions } from "@/lib/site";

export const dynamic = "force-dynamic";

const solutionIcons: Record<string, CareerIconName> = {
  cv: "document", "lettre-de-motivation": "letter", opportunites: "briefcase",
  matching: "target", coaching: "compass", expertise: "people",
};

const resources = [
  { href: "/conseils-cv", title: "Un CV qui raconte ce que vous apportez.", category: "CV & candidature", text: "Les bons repères pour structurer votre parcours et faire ressortir l’essentiel.", icon: "document" as const },
  { href: "/conseils-carriere", title: "Et si vous faisiez le point sur la suite ?", category: "Projet professionnel", text: "Prenez du recul sur vos envies, vos forces et votre prochaine étape.", icon: "compass" as const },
  { href: "/faq", title: "Le bon accompagnement commence ici.", category: "Bien démarrer", text: "Des réponses claires pour choisir la solution adaptée à votre situation.", icon: "people" as const },
];

export default async function HomePage() {
  const [homeFaqs, posts, jobs] = await Promise.all([getFaqs("home"), getPublishedPosts(), getPublishedJobs()]);
  const featuredPosts = posts.slice(0, 3);
  const featuredJobs = jobs.slice(0, 3);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }])} />
      {homeFaqs.length ? <JsonLd data={faqJsonLd(homeFaqs)} /> : null}

      <section className="overflow-hidden bg-paper">
        <div className="site-container grid items-center gap-12 pb-12 pt-12 md:pb-16 md:pt-16 lg:grid-cols-[1.12fr_1fr] lg:gap-16 lg:pb-20 lg:pt-16">
          <div className="relative z-10">
            <Eyebrow className="flex items-center gap-3"><span className="h-px w-8 bg-orange" />Votre ambition a de l’avenir</Eyebrow>
            <h1 className="mt-6 text-[clamp(2.85rem,5.35vw,4.65rem)] font-semibold leading-[1.06] tracking-[-0.055em] text-night">
              Votre prochain<br />
              <span className="font-editorial text-[1.22em] font-normal italic tracking-[-0.04em] text-orange">chapitre</span><br />
              commence ici.
            </h1>
            <p className="mt-7 max-w-[28rem] text-base leading-7 text-muted sm:text-[1.06rem] sm:leading-8">
              Vous avez le potentiel. Donnons-lui une direction.
              CV, candidatures et coaching : avançons ensemble vers la carrière qui vous ressemble.
            </p>
            <div data-sticky-cta-observe className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/solutions" variant="orange" size="lg">Trouver ma solution <CareerIcon name="arrow" className="ml-2 h-4 w-4" /></ButtonLink>
              <Link href="/emploi" className="inline-flex min-h-12 items-center justify-center gap-2 px-3 text-sm font-semibold text-night underline decoration-night/25 underline-offset-8 transition-colors hover:text-orange">Explorer les offres <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="mt-9 flex items-center gap-3 border-t border-line pt-5 text-xs leading-5 text-muted sm:max-w-[28rem]">
              <CareerIcon name="people" className="h-5 w-5 shrink-0 text-night" />
              <p>Un accompagnement humain.<br className="sm:hidden" /> Une ambition : la vôtre.</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[480px] lg:pt-3">
            <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              <span>Côte d’Ivoire · Horizons ouverts</span>
              <span aria-hidden="true">C / 01</span>
            </div>
            <div className="relative aspect-[4/4.7] overflow-hidden rounded-tl-[5rem] rounded-tr-xl rounded-br-xl rounded-bl-xl bg-[#dfd3bf] sm:rounded-tl-[7rem]">
              <Image src="/images/carriova-career-portrait.webp" alt="Portrait illustratif d’une professionnelle dans un espace de travail lumineux." fill sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 480px, 42vw" loading="eager" fetchPriority="high" className="object-cover object-[50%_43%]" />
            </div>
            <div className="absolute -right-2 top-12 flex h-20 w-20 rotate-6 flex-col items-center justify-center rounded-full border-[5px] border-paper bg-night text-center text-[9px] font-bold uppercase leading-4 tracking-[0.13em] text-white sm:-right-5 sm:h-24 sm:w-24">
              <CareerIcon name="compass" className="mb-1 h-6 w-6 text-gold" />À votre rythme
            </div>
            <div className="relative -mt-20 ml-5 mr-5 flex items-center gap-4 rounded-lg border border-line bg-white p-5 shadow-[0_12px_30px_rgba(0,18,82,0.08)] sm:-ml-8 sm:mr-12 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f8e9df] text-orange"><CareerIcon name="target" className="h-5 w-5" /></span>
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Le point de départ, c’est vous.</p><p className="mt-1.5 text-sm font-semibold leading-6 text-night">Votre parcours. Votre valeur. Votre avenir.</p></div>
            </div>
          </div>
        </div>
        <div className="border-y border-line">
          <div className="site-container grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              { n: "01", title: "Valoriser mon profil", detail: "Un CV qui fait la différence", href: "/solutions/cv", icon: "document" as const },
              { n: "02", title: "Trouver ma voie", detail: "Un cap, avec un regard expert", href: "/solutions/coaching", icon: "compass" as const },
              { n: "03", title: "Saisir une opportunité", detail: "Une candidature qui a du sens", href: "/emploi", icon: "briefcase" as const },
            ].map((item) => <Link key={item.n} href={item.href} className="group flex items-center gap-4 py-6 transition-colors hover:bg-white/60 md:px-6 md:first:pl-0 md:last:pr-0"><span className="text-[10px] text-muted">{item.n}</span><CareerIcon name={item.icon} className="h-6 w-6 shrink-0 text-orange" /><div className="flex-1"><h2 className="text-sm font-semibold text-night">{item.title}</h2><p className="mt-1 text-xs text-muted">{item.detail}</p></div><span aria-hidden="true" className="text-lg text-night transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span></Link>)}
          </div>
        </div>
      </section>

      <Section id="solutions">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><Eyebrow>Des solutions, un fil conducteur : vous</Eyebrow><h2 className="editorial-heading mt-4 max-w-2xl">À chaque ambition,<br /><span className="font-editorial text-[1.16em] font-normal italic">son point de départ.</span></h2></div>
          <Link href="/solutions" className="text-link mb-1">Toutes nos solutions <CareerIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <Link href="/solutions/cv" className="group relative flex flex-col overflow-hidden rounded-xl bg-paper">
            <div className="p-7 pb-0 sm:p-9 sm:pb-0"><span className="text-[10px] font-bold uppercase tracking-[0.17em] text-orange">Le premier pas</span><h3 className="mt-3 text-[1.65rem] font-semibold tracking-tight text-night">Un CV à la hauteur<br />de votre potentiel.</h3><p className="mt-3 max-w-sm text-sm leading-7 text-muted">Transformez vos expériences en un parcours clair, lisible et convaincant.</p><span className="text-link mt-5">Découvrir le CV professionnel <CareerIcon name="arrow" className="h-4 w-4" /></span></div>
            <div aria-hidden="true" className="relative mt-8 h-[260px] overflow-hidden px-8 pt-3 sm:h-[285px]">
              <div className="mx-auto w-full max-w-[320px] rotate-[-5deg] border border-line bg-white p-7 shadow-[0_12px_32px_rgba(0,18,82,0.1)] transition-transform duration-300 group-hover:rotate-[-2deg]">
                <div className="flex items-start justify-between border-b-2 border-night pb-4"><div><div className="text-[17px] font-semibold text-night">Votre nom.</div><div className="mt-1 text-[9px] uppercase tracking-widest text-orange">Votre prochaine ambition</div></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper text-night"><CareerIcon name="people" className="h-4 w-4" /></div></div>
                <p className="mt-4 text-[9px] font-bold uppercase tracking-wider text-night">Un profil qui vous ressemble</p><div className="mt-2 space-y-1.5"><div className="h-1 w-full bg-line" /><div className="h-1 w-11/12 bg-line" /><div className="h-1 w-3/4 bg-line" /></div>
                <p className="mt-5 text-[9px] font-bold uppercase tracking-wider text-night">Des expériences qui comptent</p>{[1,2].map((n) => <div key={n} className="mt-3 flex gap-3"><div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" /><div className="flex-1 space-y-1.5"><div className="h-1.5 w-1/2 bg-night/55" /><div className="h-1 w-full bg-line" /><div className="h-1 w-3/4 bg-line" /></div></div>)}
              </div>
              <span className="absolute bottom-5 right-5 rotate-[3deg] border border-line bg-[#eee9dc] px-4 py-2 text-[11px] font-medium text-night">Votre valeur, mise en mots.</span>
            </div>
          </Link>
          <div className="border-t border-line">
            {solutions.filter((item) => item.slug !== "cv").map((item, i) => <Link key={item.slug} href={item.href} className="group grid grid-cols-[2rem_1fr_1rem] items-start gap-4 border-b border-line py-6 sm:gap-5"><span className="pt-1 text-[11px] text-muted">0{i + 2}</span><div><div className="flex items-center gap-3"><CareerIcon name={solutionIcons[item.slug]} className="h-5 w-5 shrink-0 text-orange" /><h3 className="text-base font-semibold tracking-tight text-night transition-colors group-hover:text-orange sm:text-lg">{item.title}</h3></div><p className="mt-2 max-w-md text-sm leading-6 text-muted">{item.short}</p></div><span aria-hidden="true" className="text-xl text-night transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span></Link>)}
          </div>
        </div>
      </Section>

      <Section tone="night" className="relative overflow-hidden">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-24">
          <div><Eyebrow className="!text-gold">La méthode Carriova</Eyebrow><h2 className="mt-5 text-4xl font-medium leading-[1.15] tracking-[-0.04em] md:text-5xl">Une carrière ne suit<br />pas une ligne droite.<br /><span className="font-editorial text-[1.16em] italic text-[#edb47c]">Elle se construit.</span></h2><p className="mt-6 max-w-sm text-sm leading-7 text-white/70">Premier emploi, évolution ou nouveau départ : nous partons de votre réalité pour construire la suite, avec méthode et un regard humain.</p><ButtonLink href="/solutions/coaching" variant="white" className="mt-8">Découvrir le coaching <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink></div>
          <div className="flex flex-col justify-center">
            {[
              { n: "01", title: "Comprendre votre parcours", text: "Vos expériences, vos envies et vos atouts. On commence par ce qui fait votre singularité." },
              { n: "02", title: "Construire votre candidature", text: "Un positionnement clair et des documents adaptés aux opportunités que vous visez." },
              { n: "03", title: "Avancer avec confiance", text: "Un regard expert, des conseils concrets et des prochaines étapes à votre mesure." },
            ].map((step) => <div key={step.n} className="flex gap-6 border-t border-white/20 py-7 last:border-b"><span className="font-editorial text-4xl italic text-[#edb47c]">{step.n}</span><div><h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-7 text-white/70">{step.text}</p></div></div>)}
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><Eyebrow>Emploi & opportunités</Eyebrow><h2 className="editorial-heading mt-4">Et si la suite était <span className="font-editorial text-[1.16em] font-normal italic">ici ?</span></h2></div>
          <Link href="/emploi" className="text-link">Explorer les offres <CareerIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 border-t border-line">
          {featuredJobs.length ? featuredJobs.map((job) => <Link key={job.slug} href={`/emploi/${job.slug}`} className="group flex flex-col gap-5 border-b border-line py-7 sm:flex-row sm:items-center"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper text-night"><CareerIcon name="briefcase" /></span><div className="flex-1"><h3 className="text-lg font-semibold text-night group-hover:text-orange">{job.title}</h3><p className="mt-2 text-sm text-muted">{job.company} <span className="mx-2" aria-hidden="true">·</span> {job.location}</p></div><div className="flex items-center justify-between gap-6"><Badge>{job.contractType}</Badge><CareerIcon name="arrow" className="h-5 w-5 text-night" /></div></Link>) : <div className="grid gap-6 border-b border-line py-9 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper text-orange"><CareerIcon name="briefcase" /></span><div><h3 className="text-lg font-semibold text-night">Votre prochaine opportunité se prépare.</h3><p className="mt-2 max-w-lg text-sm leading-7 text-muted">Aucune offre à afficher pour le moment. Faites de ce temps une longueur d’avance : préparez un CV prêt pour la suite.</p></div><Link href="/conseils-cv" className="text-link">Préparer mon CV <CareerIcon name="arrow" className="h-4 w-4" /></Link></div>}
        </div>
      </Section>

      <Section tone="paper">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><Eyebrow>Le carnet Carriova</Eyebrow><h2 className="editorial-heading mt-4">Un peu de recul.<br /><span className="font-editorial text-[1.16em] font-normal italic">De nouvelles perspectives.</span></h2></div>
          <Link href="/ressources" className="text-link">Toutes les ressources <CareerIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <div className="mt-12 grid gap-9 md:grid-cols-3">
          {(featuredPosts.length ? featuredPosts.map((post, i) => ({ href: `/blog/${post.slug}`, title: post.title, category: post.category, text: post.excerpt, icon: resources[i].icon, time: `${post.readingTime} min de lecture` })) : resources.map((r) => ({ ...r, time: "À découvrir" }))).map((item, i) => <Link key={item.href} href={item.href} className="group">
            <div className={`resource-art resource-art-${i} relative mb-6 flex h-52 items-center justify-center overflow-hidden rounded-lg`} aria-hidden="true"><span className="absolute left-5 top-4 text-[9px] font-bold uppercase tracking-[0.2em]">Carnet / 0{i + 1}</span><span className="resource-orbit" /><span className="resource-symbol"><CareerIcon name={item.icon} className="h-14 w-14" /></span><span className="absolute bottom-4 right-5 text-[10px] font-medium tracking-wider">CARRIOVA</span></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange">{item.category}</p><h3 className="mt-3 text-xl font-semibold leading-[1.4] tracking-tight text-night group-hover:text-orange">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{item.text}</p><div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted"><span>{item.time}</span><span aria-hidden="true" className="text-lg text-night">↗</span></div>
          </Link>)}
        </div>
      </Section>

      {homeFaqs.length ? <Section><div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20"><div><Eyebrow>Vos questions</Eyebrow><h2 className="editorial-heading mt-4">Avançons<br /><span className="font-editorial font-normal italic">l’esprit clair.</span></h2><Link href="/faq" className="text-link mt-6">Toutes les réponses <CareerIcon name="arrow" className="h-4 w-4" /></Link></div><FaqList items={homeFaqs.slice(0,5)} /></div></Section> : null}
    </>
  );
}
