import Link from "next/link";
export default function UnavailableJob() {
 return <section className="mx-auto max-w-3xl px-5 py-24"><p className="text-xs font-semibold uppercase tracking-widest text-orange">Offres d’emploi</p><h1 className="font-editorial mt-5 text-4xl italic text-night">Cette offre n’est plus disponible.</h1><p className="mt-6 text-base leading-8 text-muted">Elle a pu être retirée par le recruteur ou ne peut plus être vérifiée. Retrouvez les autres offres de notre sélection.</p><Link href="/emploi" className="mt-8 inline-flex rounded-lg bg-night px-6 py-4 text-sm font-semibold text-white">Voir les offres disponibles →</Link></section>;
}
