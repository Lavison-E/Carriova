import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/forms/LeadForms";
import { ButtonLink } from "@/components/ui/primitives";
import { serverEnv } from "@/lib/env";
import { footerGroups, whatsappChatUrl } from "@/lib/site";

export function SiteFooter() {
  const whatsappUrl = whatsappChatUrl();
  const navigationGroups = footerGroups.filter((group) => group.title !== "Légal");
  const legalLinks = footerGroups.find((group) => group.title === "Légal")?.links ?? [];

  return (
    <footer className="bg-night pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-white md:pb-0">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 border-b border-white/15 py-14 sm:py-16 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16 lg:py-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#edab84]">Une question. Une envie. Un projet.</p>
            <h2 className="mt-5 max-w-2xl text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.04em] sm:text-5xl lg:text-[3.4rem]">Et si on parlait<br />de la suite ?</h2>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-sm text-sm leading-7 text-white/65">Faisons le point sur votre situation et trouvons le prochain pas qui vous correspond.</p>
            <ButtonLink href="/qualification" variant="orange" size="lg" className="mt-6 w-full justify-between gap-10 rounded-lg sm:w-auto">
              Parlons de mon projet <CareerIcon name="arrow" className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <Logo variant="light" withTagline markId="footer" />
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">Du potentiel au projet professionnel. CARRIOVA accompagne les carrières avec méthode et humanité.</p>
            <a href={`mailto:${serverEnv.CONTACT_EMAIL}`} className="mt-6 inline-flex min-h-10 max-w-full items-center gap-3 break-all text-sm font-medium text-white underline decoration-white/30 underline-offset-8 hover:decoration-white">
              {serverEnv.CONTACT_EMAIL} <CareerIcon name="arrow" className="h-4 w-4 shrink-0 -rotate-45" />
            </a>
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-10 w-fit items-center gap-2 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
                Échanger sur WhatsApp <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            <div className="mt-5 flex gap-6">
              <a href="https://www.linkedin.com/company/carriova" className="inline-flex min-h-10 items-center gap-2 text-xs text-white/70 hover:text-white" rel="noopener noreferrer" target="_blank">LinkedIn <span aria-hidden="true">↗</span></a>
              <a href="https://www.facebook.com/carriova" className="inline-flex min-h-10 items-center gap-2 text-xs text-white/70 hover:text-white" rel="noopener noreferrer" target="_blank">Facebook <span aria-hidden="true">↗</span></a>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3" aria-label="Navigation de pied de page">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <h3 className="border-t border-white/20 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#edab84]">{group.title === "Entreprise" ? "CARRIOVA" : group.title}</h3>
                <ul className="mt-4 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-flex min-h-9 items-center text-[13px] leading-6 text-white/70 underline-offset-4 hover:text-white hover:underline">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="grid gap-8 border-t border-white/15 py-10 sm:py-12 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#edab84]">Gardons le contact</p>
            <h3 className="mt-3 text-2xl font-medium tracking-tight">Des idées pour la suite.</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/65">Conseils carrière et opportunités, directement dans votre boîte mail. Désinscription à tout moment.</p>
          </div>
          <div className="w-full [&_form]:max-w-none [&_input[type=email]]:rounded-lg [&_button]:rounded-lg">
            <NewsletterForm tone="dark" />
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/15 py-7 text-[11px] leading-6 text-white/55 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <p>© {new Date().getFullYear()} CARRIOVA. Tous droits réservés.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Informations légales">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex min-h-8 items-center hover:text-white">{link.label}</Link>
            ))}
          </nav>
          <p>Côte d’Ivoire · Ouvert sur le monde</p>
        </div>
      </div>
    </footer>
  );
}
