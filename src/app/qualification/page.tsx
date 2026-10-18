import Link from "next/link";
import { QualificationForm } from "@/components/forms/QualificationForm";
import { Breadcrumb, JsonLd } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Parlons de votre projet",
  description: "Présentez votre situation et votre besoin en trois étapes. Carriova vous aide à trouver l’accompagnement adapté à votre projet professionnel.",
  path: "/qualification",
});

export default function QualificationPage() {
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/qualification", label: "Votre projet" }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((item) => ({ name: item.label, path: item.href })))} />
      <section className="bg-paper pb-20 pt-7 md:pb-28 md:pt-9">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="border-b border-night/15 pb-5 [&_nav]:text-xs"><Breadcrumb items={crumbs} /></div>
          <div className="grid items-end gap-7 pb-10 pt-10 md:grid-cols-[1.5fr_1fr] md:gap-12 md:pb-14 md:pt-14">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Votre parcours commence par vous</p>
              <h1 className="mt-5 max-w-2xl font-editorial text-[2.9rem] italic leading-[1.06] tracking-tight text-night sm:text-6xl">Faisons le point<br />sur votre projet.</h1>
            </div>
            <div>
              <p className="max-w-lg text-sm leading-7 text-muted">Vous souhaitez décrocher un emploi, améliorer votre CV ou donner un nouvel élan à votre carrière ? Répondez à ces quelques questions pour nous permettre de mieux comprendre votre situation et de vous orienter vers la solution Carriova la plus adaptée à vos besoins.</p>
              <p className="mt-4 text-xs font-medium text-night">3 étapes <span className="px-2 text-orange" aria-hidden="true">/</span> Durée estimée : 2 à 3 minutes</p>
            </div>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)] lg:gap-10">
            <QualificationForm />
            <aside className="space-y-7 lg:sticky lg:top-28">
              <div className="rounded-xl bg-night p-7 text-white sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#edab84]">Votre projet, notre point de départ</p>
                <h2 className="mt-5 font-editorial text-3xl italic leading-tight">La bonne suite<br />se construit ensemble.</h2>
                <p className="mt-5 text-sm leading-7 text-white/70">Votre situation, vos objectifs et vos priorités nous aident à vous orienter vers une prestation adaptée.</p>
                <div className="mt-7 border-t border-white/20 pt-6"><p className="text-xs leading-6 text-white/70">Après l’envoi, notre équipe pourra étudier votre demande et vous recontacter si vous avez demandé un échange.</p></div>
              </div>
              <div className="px-1">
                <h2 className="text-sm font-semibold text-night">Vous gardez le choix.</h2>
                <p className="mt-3 text-xs leading-6 text-muted">Le contact individuel et les communications marketing sont deux choix distincts. Recevoir nos conseils et nos offres reste facultatif.</p>
                <Link href="/legal/confidentialite" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-night underline decoration-line underline-offset-4 hover:text-orange">Notre politique de confidentialité <span aria-hidden="true">↗</span><span className="sr-only">(nouvel onglet)</span></Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
