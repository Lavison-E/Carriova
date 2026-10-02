import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/forms/LeadForms";
import { serverEnv } from "@/lib/env";
import { footerGroups, whatsappChatUrl } from "@/lib/site";

export function SiteFooter() {
  const whatsappUrl = whatsappChatUrl();
  return (
    <footer className="bg-night text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-4">
          <Logo variant="light" withTagline markId="footer" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            CARRIOVA est une plateforme digitale de carrière et d’employabilité. Elle relie
            découverte de profil, intelligence de carrière, candidatures et expertise humaine.
          </p>
          <p className="mt-4 text-sm">
            <a
              href={`mailto:${serverEnv.CONTACT_EMAIL}`}
              className="text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              {serverEnv.CONTACT_EMAIL}
            </a>
          </p>
          {whatsappUrl ? (
            <p className="mt-2 text-sm">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/85 underline-offset-4 hover:text-white hover:underline"
              >
                Écrire sur WhatsApp
              </a>
            </p>
          ) : null}
          <div className="mt-6 flex gap-4 text-sm">
            <a
              href="https://www.linkedin.com/company/carriova"
              className="text-white/80 hover:text-white"
              rel="noopener noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
            <a
              href="https://www.facebook.com/carriova"
              className="text-white/80 hover:text-white"
              rel="noopener noreferrer"
              target="_blank"
            >
              Facebook
            </a>
          </div>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title} className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{group.title}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
          <div className="max-w-md">
            <p className="text-sm font-semibold">Recevez nos conseils carrière et opportunités.</p>
            <p className="mt-1 text-sm text-white/65">
              Un e-mail utile, avec votre consentement. Pas de promesse artificielle.
            </p>
          </div>
          <NewsletterForm tone="dark" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-white/50 md:flex-row md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} CARRIOVA. Tous droits réservés.</p>
          <p>Côte d’Ivoire · Afrique de l’Ouest · Marchés francophones et internationaux</p>
        </div>
      </div>
    </footer>
  );
}
