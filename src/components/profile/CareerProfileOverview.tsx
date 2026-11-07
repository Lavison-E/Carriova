import Link from "next/link";
import type { ReactNode } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { countryOptions } from "@/lib/countries";
import {
  careerContractOptions,
  careerWorkModeOptions,
  experienceLevelOptions,
  isProfileReadyForMatching,
  profileCompletion,
  type CareerProfileRecord,
} from "@/lib/career-profile";

const editHref = "/espace/profil/modifier";
const countryLabel = (code: string) => countryOptions.find((country) => country.value === code)?.label ?? code;
const editLink = "inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-orange hover:underline hover:underline-offset-4";

function ProfileSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-line bg-white p-5 sm:p-7">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold tracking-tight text-night">{title}</h2>{action}</div>
    {children}
  </section>;
}

function Detail({ label, value, empty }: { label: string; value?: string; empty: string }) {
  return <div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</dt><dd className={`mt-2 whitespace-pre-line break-words text-sm leading-7 ${value ? "text-night" : "text-muted"}`}>{value || empty}</dd></div>;
}

function Tags({ items }: { items: string[] }) {
  return <ul className="flex flex-wrap gap-2">{items.map((item) => <li key={item} className="max-w-full break-words rounded-lg border border-line bg-paper px-3 py-2 text-xs leading-6 text-night">{item}</li>)}</ul>;
}

export function CareerProfileOverview({ customer, whatsapp, record, cvs, cvsAvailable = true, welcome = false, saved = false }: {
  customer: { name: string; email: string };
  whatsapp: string | null;
  record: CareerProfileRecord;
  cvs: { id: number; title: string }[];
  cvsAvailable?: boolean;
  welcome?: boolean;
  saved?: boolean;
}) {
  const { profile } = record;
  const ready = isProfileReadyForMatching(profile);
  const completion = profileCompletion(profile);
  const initials = customer.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] ?? "").join("").toLocaleUpperCase("fr-FR") || "C";
  const experience = experienceLevelOptions.find((option) => option.value === profile.experienceLevel)?.label;
  const location = [profile.city, profile.countryCode ? countryLabel(profile.countryCode) : ""].filter(Boolean).join(", ");
  const cv = cvs.find((document) => document.id === profile.cvDocumentId);
  const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;
  const updatedLabel = updatedAt && Number.isFinite(updatedAt.getTime()) ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Abidjan" }).format(updatedAt) : null;
  const essentials = [
    { label: "Votre métier cible", done: profile.targetRoles.length > 0 },
    { label: "Votre pays cible", done: profile.targetCountries.length > 0 },
    { label: "Votre niveau d’expérience", done: !!profile.experienceLevel },
  ];
  const remaining = essentials.filter((item) => !item.done).length;

  return <div className="space-y-6">
    {saved ? <div role="status" className="rounded-xl border border-[#c4d6c8] bg-[#edf4ee] px-5 py-4 text-sm leading-7 text-[#285236]">Votre profil a bien été enregistré. Retrouvez ci-dessous les informations sauvegardées.</div> : welcome ? <div role="status" className="rounded-xl border border-[#c4d6c8] bg-[#edf4ee] px-5 py-4 text-sm leading-7 text-[#285236]">Votre compte est créé. Vos coordonnées sont déjà ici ; complétez maintenant votre projet professionnel.</div> : null}

    <section aria-label="Vos informations personnelles" className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="h-2 bg-night" aria-hidden="true" />
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-night text-xl font-semibold tracking-tight text-white">{initials}</div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-orange">Mon profil professionnel</p><h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-night sm:text-3xl">{customer.name}</h2><p className="mt-2 break-words text-sm leading-7 text-muted">{profile.targetRoles.length ? profile.targetRoles.join(" · ") : "Votre projet professionnel reste à préciser."}</p>{location ? <p className="mt-1 break-words text-xs leading-6 text-muted">{location}</p> : null}</div>
          <Link href={editHref} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-lg bg-orange px-4 py-3 text-xs font-semibold text-white hover:bg-[#9e3708]">{record.updatedAt ? "Modifier mon profil" : "Compléter mon profil"}<CareerIcon name="arrow" className="h-4 w-4" /></Link>
        </div>
        <dl className="mt-6 grid min-w-0 gap-5 border-t border-line pt-5 sm:grid-cols-2"><div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Adresse e-mail</dt><dd className="mt-2 break-all text-sm leading-7 text-night">{customer.email}</dd></div><div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Numéro WhatsApp</dt><dd className="mt-2 break-words text-sm leading-7 text-night">{whatsapp || "Numéro à ajouter"}</dd></div></dl>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2"><Link href="/espace/compte" className={editLink}>Gérer mes coordonnées <span aria-hidden="true">→</span></Link><p className="text-[11px] leading-6 text-muted">Profil privé, visible dans votre espace.</p></div>
      </div>
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <aside aria-label="Les prochaines étapes de votre profil" className="min-w-0 space-y-5 xl:col-start-2 xl:row-start-1">
        <section className="rounded-xl bg-night p-5 text-white sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f7bd92]">Votre prochaine étape</p><h2 className="mt-3 text-xl font-semibold leading-7 tracking-tight">{ready ? "Explorez vos opportunités." : "Précisez votre recherche."}</h2><p className="mt-3 text-xs leading-7 text-white/80">{ready ? "Votre métier, vos pays et votre niveau d’expérience sont enregistrés. Découvrez les offres correspondant à ces critères." : `${remaining} ${remaining > 1 ? "informations restent à renseigner" : "information reste à renseigner"} pour orienter vos opportunités. Les autres rubriques peuvent attendre.`}</p>
          <ul className="mt-4 space-y-3">{essentials.map((item) => <li key={item.label} className="flex items-start gap-3 text-xs leading-6"><span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-[#f7bd92] text-night" : "border border-white/40"}`} aria-hidden="true">{item.done ? <CareerIcon name="check" className="h-3 w-3" /> : null}</span><span>{item.label}<span className="sr-only"> : {item.done ? "renseigné" : "à renseigner"}</span></span></li>)}</ul>
          <Link href={ready ? "/espace/opportunites" : editHref} className="mt-6 flex min-h-12 items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-xs font-semibold text-night hover:bg-white/90">{ready ? "Voir mes opportunités" : "Compléter ma recherche"}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></Link>
          <div className="mt-6 border-t border-white/15 pt-5"><div className="flex items-center justify-between gap-3 text-[11px]"><span className="text-white/80">Rubriques renseignées</span><span className="font-semibold">{completion} %</span></div><div role="progressbar" aria-label="Rubriques du profil renseignées" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#f7bd92]" style={{ width: `${completion}%` }} /></div>{updatedLabel ? <p className="mt-3 text-[10px] leading-6 text-white/65">Mis à jour le {updatedLabel}</p> : null}</div>
        </section>
        <section className="rounded-xl border border-line bg-white p-5 sm:p-6"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-orange"><CareerIcon name="document" className="h-5 w-5" /></span><h2 className="mt-4 text-base font-semibold text-night">Mon CV de référence</h2>{!cvsAvailable ? <p className="mt-3 text-xs leading-7 text-muted">Vos CV sont temporairement indisponibles. Réessayez dans un instant.</p> : cv ? <><p className="mt-3 break-words text-sm leading-7 text-night">{cv.title}</p><p className="mt-2 text-xs leading-6 text-muted">Ce CV est associé à votre profil.</p><Link href={`/espace/cv/${cv.id}`} className={`mt-3 ${editLink}`}>Consulter mon CV <span aria-hidden="true">→</span></Link></> : <><p className="mt-3 text-xs leading-7 text-muted">{profile.cvDocumentId !== null ? "Le CV associé n’est plus disponible. Choisissez un autre CV dans votre profil." : cvs.length ? "Vos CV sont dans le studio. Vous pouvez en associer un à votre profil." : "Créez votre CV dans le studio, puis associez-le à votre profil."}</p><Link href={cvs.length ? editHref : "/espace/cv"} className={`mt-3 ${editLink}`}>{cvs.length ? "Associer un CV" : "Ouvrir mon studio CV"}<span aria-hidden="true">→</span></Link></>}</section>
        <p className="px-1 text-[11px] leading-6 text-muted">Vous gardez la main sur vos démarches. Aucune candidature n’est envoyée automatiquement.</p>
      </aside>
      <div className="min-w-0 space-y-6 xl:col-start-1 xl:row-start-1">
        <ProfileSection title="Ce que je recherche" action={<Link href={editHref} className={editLink}>{ready ? "Modifier" : "Renseigner"}<span className="sr-only"> ma recherche</span><span aria-hidden="true">→</span></Link>}>
          <dl className="grid gap-5 sm:grid-cols-2"><div className="min-w-0 sm:col-span-2"><dt className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Métiers ou postes ciblés</dt><dd>{profile.targetRoles.length ? <Tags items={profile.targetRoles} /> : <p className="text-sm leading-7 text-muted">Ajoutez le poste que vous souhaitez occuper.</p>}</dd></div><Detail label="Pays ciblés" value={profile.targetCountries.map(countryLabel).join(", ")} empty="Indiquez où vous souhaitez travailler." /><Detail label="Niveau d’expérience" value={experience} empty="Choisissez le niveau qui décrit votre parcours." /></dl>
        </ProfileSection>

        <ProfileSection title="Mes compétences et mon parcours" action={<Link href={editHref} className={editLink}>Modifier<span className="sr-only"> mon parcours</span><span aria-hidden="true">→</span></Link>}>
          <dl className="space-y-6"><div><dt className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Compétences</dt><dd>{profile.skills.length ? <Tags items={profile.skills} /> : <p className="text-sm leading-7 text-muted">Ajoutez vos compétences pour préciser votre profil.</p>}</dd></div><Detail label="Résumé professionnel" value={profile.professionalSummary} empty="Présentez vos expériences, vos responsabilités et vos points forts." /><Detail label="Formation et diplômes" value={profile.educationSummary} empty="Vos formations et diplômes apparaîtront ici une fois renseignés." /><div><dt className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Langues</dt><dd>{profile.languages.length ? <ul className="space-y-2">{profile.languages.map((language, index) => <li key={index} className="break-words text-sm leading-7 text-night">{language.name || "Langue à préciser"}<span className="text-muted"> · {language.level || "Niveau à préciser"}</span></li>)}</ul> : <p className="text-sm leading-7 text-muted">Ajoutez les langues que vous pratiquez et votre niveau.</p>}</dd></div></dl>
        </ProfileSection>

        <ProfileSection title="Mes préférences de travail" action={<Link href={editHref} className={editLink}>Modifier<span className="sr-only"> mes préférences</span><span aria-hidden="true">→</span></Link>}>
          <dl className="grid gap-5 sm:grid-cols-2"><Detail label="Lieu de résidence" value={location} empty="Ville et pays à renseigner." /><Detail label="Disponibilité" value={profile.availability} empty="Disponibilité à préciser." /><Detail label="Contrats souhaités" value={profile.contractTypes.map((value) => careerContractOptions.find((option) => option.value === value)?.label).filter(Boolean).join(", ")} empty="Aucun type de contrat indiqué." /><Detail label="Modes de travail" value={profile.workModes.map((value) => careerWorkModeOptions.find((option) => option.value === value)?.label).filter(Boolean).join(", ")} empty="Sur site, hybride ou à distance : à préciser." /></dl>
        </ProfileSection>
      </div>


    </div>
  </div>;
}
