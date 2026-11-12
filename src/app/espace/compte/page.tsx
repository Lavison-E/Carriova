import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";
import { CustomerWhatsAppForm } from "@/components/forms/WhatsAppField";
import { CustomerPasswordForm } from "@/components/forms/CustomerAuthForms";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { CustomerAvatar } from "@/components/workspace/WorkspaceShell";
import { WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { getCustomerWhatsApp } from "@/lib/career-profile-queries";
import { requireCustomer } from "@/lib/customer-auth";
import { customerLogout } from "@/lib/customer-actions";

export const metadata: Metadata = { title: "Mon compte" };

function Panel({ icon, eyebrow, title, text, children, id }: { icon: CareerIconName; eyebrow: string; title: string; text?: string; children: ReactNode; id: string }) {
  return <section aria-labelledby={id} className="rounded-[1.25rem] border border-night/[0.07] bg-white p-6 shadow-[0_1px_2px_rgba(0,18,82,0.04),0_12px_32px_rgba(0,18,82,0.05)] sm:p-8">
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#fff4ea,#ffe6d2)] text-orange ring-1 ring-orange/10"><CareerIcon name={icon} className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8fa3]">{eyebrow}</p><h2 id={id} className="mt-1 text-[1.15rem] font-semibold tracking-tight text-night">{title}</h2>{text ? <p className="mt-1.5 text-xs leading-6 text-muted">{text}</p> : null}</div>
    </div>
    <div className="mt-7">{children}</div>
  </section>;
}

function InfoRow({ icon, label, value }: { icon: CareerIconName; label: string; value: string }) {
  return <div className="flex items-center gap-4 rounded-xl bg-[#f8f6f1] px-4 py-3.5">
    <CareerIcon name={icon} className="h-[18px] w-[18px] shrink-0 text-night/50" />
    <div className="min-w-0"><dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{label}</dt><dd className="mt-0.5 break-all text-sm font-semibold text-night">{value}</dd></div>
  </div>;
}

export default async function AccountPage() {
  const result = await loadWorkspaceData(async () => { const [customer, whatsapp] = await Promise.all([requireCustomer(), getCustomerWhatsApp()]); return { customer, whatsapp }; });
  if (!result) return <WorkspaceUnavailable href="/espace/compte" />;
  const { customer, whatsapp } = result.data;
  const firstName = customer.name.trim().split(/\s+/)[0] || customer.name;

  return <div className="mx-auto max-w-[1120px]">
    {/* Identity hero */}
    <section aria-labelledby="account-title" className="relative isolate overflow-hidden rounded-[1.5rem] bg-night px-6 py-8 text-white shadow-[0_28px_70px_rgba(0,18,82,0.22)] sm:px-10 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#2449a0] opacity-70 blur-[90px]" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-orange opacity-[0.18] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5 sm:gap-7">
          <CustomerAvatar name={customer.name} size="xl" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Votre compte</p>
            <h1 id="account-title" className="mt-2 break-words font-editorial text-[2.1rem] italic leading-[1.05] tracking-tight sm:text-[2.8rem]">Bonjour, {firstName}.</h1>
            <p className="mt-2 break-all text-sm text-white/65">{customer.email}</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 md:justify-end lg:flex-nowrap">
          {[["shield", "Données protégées"], ["lock", "Accès sécurisé"], ["user", "Espace personnel"]].map(([icon, label]) => <li key={label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur"><CareerIcon name={icon as CareerIconName} className="h-3.5 w-3.5 text-gold" />{label}</li>)}
        </ul>
      </div>
      <nav aria-label="Raccourcis du compte" className="relative mt-8 grid gap-2 border-t border-white/10 pt-6 sm:grid-cols-3">
        {[{ href: "/espace/profil", icon: "user", label: "Profil professionnel" }, { href: "/espace/demandes", icon: "briefcase", label: "Mes demandes" }, { href: "/support", icon: "help", label: "Support & conseiller" }].map((item) => <Link key={item.href} href={item.href} className="group flex min-h-12 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-white/85 transition hover:bg-white/[0.07] hover:text-white"><CareerIcon name={item.icon as CareerIconName} className="h-4 w-4 text-gold" />{item.label}<CareerIcon name="arrow" className="ml-auto h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" /></Link>)}
      </nav>
    </section>

    <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-7">
        <Panel id="account-identity" icon="user" eyebrow="Identité" title="Vos informations" text="Les informations utilisées par l’équipe pour vous accompagner.">
          <dl className="space-y-3"><InfoRow icon="user" label="Nom et prénom" value={customer.name} /><InfoRow icon="mail" label="Adresse e-mail" value={customer.email} /></dl>
          <p className="mt-4 text-[11px] leading-5 text-muted">Pour modifier votre nom ou votre e-mail, <Link href="/support" className="font-semibold text-night underline decoration-night/20 underline-offset-4 hover:decoration-orange">écrivez au support</Link>.</p>
        </Panel>
        <Panel id="account-whatsapp" icon="phone" eyebrow="Contact" title="Numéro WhatsApp">
          <CustomerWhatsAppForm whatsapp={whatsapp} />
        </Panel>
      </div>
      <div className="space-y-7">
        <Panel id="account-security" icon="lock" eyebrow="Sécurité" title="Changer de mot de passe" text="Choisissez un mot de passe personnel que vous n’utilisez sur aucun autre service.">
          <CustomerPasswordForm />
        </Panel>
        <Panel id="account-privacy" icon="shield" eyebrow="Confidentialité" title="Vos données, vos droits" text="Vous pouvez demander l’accès, la correction ou la suppression de vos données à tout moment.">
          <div className="flex flex-wrap gap-3">
            <Link href="/support" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night px-5 text-xs font-semibold text-white transition hover:bg-royal">Exercer mes droits <CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link>
            <Link href="/legal/confidentialite" className="inline-flex min-h-11 items-center rounded-full border border-night/15 px-5 text-xs font-semibold text-night transition hover:border-night">Politique de confidentialité</Link>
          </div>
        </Panel>
        <div className="flex flex-col items-start justify-between gap-4 rounded-[1.25rem] border border-dashed border-night/15 px-6 py-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-semibold text-night">Session en cours</p><p className="mt-0.5 text-xs text-muted">Pensez à vous déconnecter sur un appareil partagé.</p></div>
          <form action={customerLogout}><button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-night/15 bg-white px-5 text-xs font-semibold text-night transition hover:border-orange hover:text-orange"><CareerIcon name="logout" className="h-4 w-4" />Me déconnecter</button></form>
        </div>
      </div>
    </div>
  </div>;
}
