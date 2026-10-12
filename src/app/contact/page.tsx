import Link from "next/link";
import { ContactForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { serverEnv } from "@/lib/env";
import { whatsappChatUrl } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contactez CARRIOVA pour un CV, une lettre, un coaching, une opportunité ou un projet recruteur. Formulaire avec consentement.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ objet?: string | string[] }>;
}) {
  const { objet } = await searchParams;
  const requestedInterest = Array.isArray(objet) ? objet[0] : objet;
  const interest = ["emploi", "cv", "audit-cv", "lettre", "reconversion", "coaching", "recruteur"].includes(requestedInterest ?? "") ? requestedInterest : undefined;
  const whatsappUrl = whatsappChatUrl();
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Contact"
        title="Faisons le point sur votre projet."
        text="Un CV à améliorer, une carrière à faire évoluer ou un talent à recruter. Notre équipe vous aide à trouver la prochaine étape."
        crumbs={crumbs}
      />
      <Section tone="paper" className="!pt-10 md:!pt-14">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:gap-10">
          <div className="rounded-xl border border-line bg-white p-6 sm:p-9">
            <div className="mb-8 border-b border-line pb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bd470d]">Votre message</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">Comment pouvons-nous vous aider ?</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted">Présentez-nous votre situation et ce que vous aimeriez accomplir. Quelques mots suffisent pour commencer.</p>
            </div>
            <ContactForm defaultInterest={interest} />
          </div>

          <aside className="space-y-7 lg:sticky lg:top-28">
            <div className="rounded-xl bg-night p-7 text-white sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20" aria-hidden="true">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
              </span>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">Un échange, simplement.</h2>
              <p className="mt-3 text-sm leading-7 text-white/75">Vous préférez nous écrire directement ? Retrouvez l’équipe CARRIOVA par e-mail.</p>
              <a className="mt-5 inline-block max-w-full break-all text-base font-semibold text-white underline decoration-white/40 underline-offset-8 transition-colors hover:decoration-white" href={`mailto:${serverEnv.CONTACT_EMAIL}`}>
                {serverEnv.CONTACT_EMAIL}
              </a>
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-7 flex min-h-12 w-full items-center justify-between gap-4 rounded-lg border border-white/30 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                  Écrire sur WhatsApp <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              <p className="mt-7 border-t border-white/20 pt-5 text-xs leading-6 text-white/65">Carrière, emploi et recrutement en Côte d’Ivoire.</p>
            </div>

            <div className="px-1 sm:px-2">
              <h2 className="text-base font-semibold text-night">Et après votre message ?</h2>
              <ol className="mt-5 space-y-5">
                {[
                  { title: "Nous prenons connaissance de votre besoin", text: "Votre situation et votre objectif guident notre réponse." },
                  { title: "Nous échangeons sur la suite", text: "Nous vous orientons vers l’accompagnement adapté à votre projet." },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-xs font-semibold text-[#bd470d]" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <div className="pt-0.5">
                      <h3 className="text-sm font-medium leading-6 text-night">{step.title}</h3>
                      <p className="mt-1 text-xs leading-6 text-muted">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs leading-6 text-muted">Vos informations nous permettent de répondre à votre demande. Vous gardez le choix de recevoir ou non nos conseils et actualités.</p>
                <Link href="/legal/confidentialite" className="mt-3 inline-block text-xs font-medium text-night underline decoration-line underline-offset-4 hover:text-[#bd470d]">Notre politique de confidentialité</Link>
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
