import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  ButtonLink,
  Card,
  Eyebrow,
  FaqList,
  JsonLd,
  Section,
  SectionHeader,
} from "@/components/ui/primitives";
import { getFaqs, getPublishedJobs, getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import {
  audiences,
  ecosystemModules,
  howSteps,
  intents,
  journeySteps,
  problems,
  solutions,
  transformations,
  whyPoints,
} from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [homeFaqs, posts, jobs] = await Promise.all([
    getFaqs("home"),
    getPublishedPosts(),
    getPublishedJobs(),
  ]);
  const featuredPosts = posts.slice(0, 3);
  const featuredJobs = jobs.slice(0, 3);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }])} />
      {homeFaqs.length ? <JsonLd data={faqJsonLd(homeFaqs)} /> : null}

      <section className="hero-grid relative overflow-hidden text-white">
        <div className="mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-12 md:px-8 md:py-24">
          <div className="md:col-span-7">
            <Eyebrow className="text-gold">Plateforme de carrière et d’employabilité</Eyebrow>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Révélez votre potentiel.
              <span className="mt-2 block text-white">
                Boostez votre <span className="orange-underline">carrière.</span>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 md:text-lg">
              Une plateforme intelligente pour valoriser votre profil, construire des candidatures
              convaincantes, trouver les bonnes opportunités et faire progresser votre carrière.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/compte/creer" variant="orange" size="lg">
                Commencer maintenant
              </ButtonLink>
              <ButtonLink href="/solutions" variant="ghost" size="lg">
                Découvrir nos solutions
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-white/60">
              CV · Lettre · Opportunités · Matching · Coaching · Expertise humaine
            </p>
          </div>
          <div className="md:col-span-5">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <Image
                src="/images/hero-trajectory.jpg"
                alt="Trajectoire abstraite représentant la progression de carrière CARRIOVA"
                width={1200}
                height={800}
                priority
                sizes="(max-width: 768px) 100vw, 42vw"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">Parcours CARRIOVA</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {journeySteps.map((step) => (
                    <span
                      key={step.key}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium"
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section tone="white">
        <SectionHeader
          eyebrow="Par où commencer"
          title="Dites-nous ce dont vous avez besoin."
          text="CARRIOVA s’adresse à plusieurs publics, sans mélanger les parcours. Choisissez votre intention : nous vous guidons vers la solution utile."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {intents.map((intent) => (
            <Link
              key={intent.id}
              href={intent.href}
              className="rounded-3xl border border-line bg-paper p-5 transition hover:border-bright hover:shadow-[0_16px_40px_rgba(0,18,82,0.08)]"
            >
              <p className="text-sm font-semibold text-night">{intent.label}</p>
              <p className="mt-3 text-xs font-semibold text-bright">{intent.cta} →</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-2">
          <SectionHeader
            eyebrow="Le problème"
            title="Le potentiel existe. La direction manque souvent."
            text="Beaucoup de candidatures échouent non pas par absence de talent, mais par un positionnement flou, un CV faible et un manque d’accompagnement."
          />
          <div className="grid gap-3">
            {problems.map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-white px-5 py-4 text-sm text-muted">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Card className="bg-[#f7f4ef]">
            <Eyebrow className="text-orange">Avant CARRIOVA</Eyebrow>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              {problems.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </Card>
          <Card className="border-bright/20 bg-soft">
            <Eyebrow>Avec CARRIOVA</Eyebrow>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-night">
              {transformations.map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section tone="night">
        <SectionHeader
          eyebrow="L’écosystème"
          title="Votre parcours de carrière, dans un seul écosystème."
          text="CARRIOVA n’est pas un générateur de CV, ni un simple job board, ni un chatbot. Ce sont des modules reliés, du potentiel à la progression."
          light
        />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {ecosystemModules.map((module) => (
            <Link
              key={module.n}
              href={module.href}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-gold">{module.n}</p>
              <h3 className="mt-3 text-lg font-bold">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{module.text}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Solutions"
          title="Une réponse claire pour chaque besoin."
          text="Chaque solution a sa page, son processus et son prochain pas. L’ensemble reste cohérent."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {solutions.map((item) => (
            <Card key={item.slug} className="flex flex-col">
              <Badge>{item.audience}</Badge>
              <h3 className="mt-4 text-xl font-bold text-night">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.short}</p>
              <ButtonLink href={item.href} className="mt-6" size="sm">
                {item.cta}
              </ButtonLink>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeader
          eyebrow="Méthode"
          title="Comment CARRIOVA travaille avec vous."
          text="Nous ne produisons pas un document pour produire un document. Nous partons de votre matière réelle."
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-5">
          {howSteps.map((step, i) => (
            <li key={step.title} className="rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(0,18,82,0.06)]">
              <p className="text-xs font-semibold text-orange">0{i + 1}</p>
              <h3 className="mt-2 font-bold text-night">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Pourquoi CARRIOVA"
              title="IA qui structure. Règles qui encadrent. Humain qui valide."
              text="Nous n’opposons pas la technologie à l’expertise. L’IA comprend. Les règles décident du cadre. L’expertise humaine intervient lorsque c’est nécessaire."
            />
            <div className="mt-8 grid gap-4">
              {whyPoints.map((item) => (
                <div key={item.title} className="rounded-2xl border border-line p-5">
                  <h3 className="font-semibold text-night">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem]">
            <Image
              src="/images/expertise-human.jpg"
              alt="Accompagnement humain CARRIOVA : une professionnelle examine un dossier de carrière"
              width={900}
              height={1100}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="Opportunités"
            title="Des pistes d’emploi à relier à votre profil."
            text="Le site public présente les opportunités. L’espace CARRIOVA vous aidera ensuite à adapter CV et candidature."
          />
          <ButtonLink href="/emploi" variant="secondary">
            Voir les opportunités
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredJobs.length ? (
            featuredJobs.map((job) => (
              <Link key={job.slug} href={`/emploi/${job.slug}`}>
                <Card className="h-full transition hover:border-bright">
                  <Badge>{job.contractType}</Badge>
                  <h3 className="mt-4 text-lg font-bold text-night">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {job.company} · {job.location}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{job.description}</p>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="md:col-span-3">
              <p className="text-sm text-muted">
                Les opportunités publiées apparaîtront ici dès qu’elles seront validées dans l’espace
                d’administration CARRIOVA.
              </p>
            </Card>
          )}
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem]">
            <Image
              src="/images/coaching-session.jpg"
              alt="Séance de coaching carrière CARRIOVA"
              width={1000}
              height={750}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <SectionHeader
              eyebrow="Coaching"
              title="Un regard humain, au bon moment."
              text="Orientation, employabilité, entretien, positionnement ou progression : les séances se planifient selon les disponibilités."
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/solutions/coaching" variant="orange">
                Réserver une séance
              </ButtonLink>
              <ButtonLink href="/solutions/expertise" variant="secondary">
                Découvrir l’expertise
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeader
          eyebrow="Publics"
          title="Plusieurs audiences. Un même niveau d’exigence."
          text="Chercheurs d’emploi, professionnels, étudiants, diaspora : chaque parcours reste distinct."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {audiences.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_rgba(0,18,82,0.06)]">
              <h3 className="font-bold text-night">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="Ressources"
            title="Des contenus utiles, pas du remplissage."
            text="CV, emploi, lettre, coaching : des articles pensés pour répondre à une intention de recherche réelle."
          />
          <ButtonLink href="/blog" variant="secondary">
            Lire le blog
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featuredPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full">
                <Badge tone="orange">{post.category}</Badge>
                <h3 className="mt-4 text-lg font-bold text-night">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>
                <p className="mt-4 text-xs text-bright">{post.readingTime} min de lecture</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeader
          eyebrow="FAQ"
          title="Des réponses claires, sans surpromesse."
        />
        <div className="mt-10">
          <FaqList items={homeFaqs} />
        </div>
        <div className="mt-6">
          <Link href="/faq" className="text-sm font-semibold text-bright">
            Voir toutes les questions →
          </Link>
        </div>
      </Section>

      <Section tone="night" className="relative overflow-hidden">
        <div className="relative">
          <SectionHeader
            eyebrow="Prochain pas"
            title="Révélez votre potentiel. Boostez votre carrière."
            text="Créez votre compte, construisez votre CV, explorez les opportunités ou parlez à un expert. Un pas après l’autre, dans le même écosystème."
            light
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/compte/creer" variant="orange" size="lg">
              Commencer maintenant
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" size="lg">
              Parler à un expert
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
