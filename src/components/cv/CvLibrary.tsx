"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { CvPreview } from "@/components/cv/CvPreview";
import { cvRequest, cvUpdatedAt } from "@/components/cv/cv-client";
import { CV_LIMITS, CV_TEMPLATES, type CvDocument } from "@/lib/cv";

export function CvLibrary({ documents, aiAvailable }: { documents: CvDocument[]; aiAvailable: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | "create" | null>(null);
  const operation = useRef(false);
  const [removed, setRemoved] = useState<number[]>([]);
  const [error, setError] = useState("");
  const feedback = useRef<HTMLDivElement>(null);
  const shown = documents.filter((item) => !removed.includes(item.id));
  useEffect(() => { if (error) feedback.current?.focus(); }, [error]);
  async function create() {
    if (operation.current) return;
    operation.current = true; setBusy("create"); setError("");
    try {
      const { document } = await cvRequest<{ document: CvDocument }>("/api/espace/cv", { method: "POST", body: JSON.stringify({ title: "Mon CV" }) });
      router.push(`/espace/cv/${document.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Votre CV n’a pas pu être créé. Réessayez dans un instant."); setBusy(null); }
    finally { operation.current = false; }
  }
  async function remove(item: CvDocument) {
    if (operation.current || !window.confirm(`Supprimer définitivement « ${item.title} » ? Le CV et son contenu seront supprimés de votre espace.`)) return;
    operation.current = true; setBusy(item.id); setError("");
    try {
      await cvRequest<{ ok: true }>(`/api/espace/cv/${item.id}`, { method: "DELETE", body: JSON.stringify({ version: item.version }) });
      setRemoved((current) => [...current, item.id]); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "La suppression n’a pas pu être effectuée."); }
    finally { operation.current = false; setBusy(null); }
  }
  const createButton = <button type="button" onClick={create} disabled={busy !== null || shown.length >= CV_LIMITS.documents} className="inline-flex min-h-12 items-center justify-center gap-6 rounded-lg bg-orange px-5 text-xs font-semibold text-white hover:bg-[#9e3708] disabled:cursor-not-allowed disabled:opacity-50">{busy === "create" ? "Création du CV…" : "Créer un CV"}<span aria-hidden="true" className="text-xl font-normal">+</span></button>;
  return <>
    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Le studio CARRIOVA</p><h1 className="mt-3 font-editorial text-5xl italic leading-tight tracking-tight text-night">Vos CV, à votre façon.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-muted">Rédigez votre parcours, choisissez une mise en page et téléchargez votre CV en PDF. Vos documents restent modifiables dans votre espace.</p></div><div className="shrink-0">{createButton}</div></div>
    {error ? <div ref={feedback} tabIndex={-1} role="alert" className="mb-6 rounded-xl border border-orange/30 bg-[#fff7f0] p-5 text-xs leading-7 outline-none">{error}<button type="button" onClick={() => router.refresh()} className="ml-3 inline-flex min-h-10 font-semibold text-orange underline underline-offset-4">Actualiser la liste</button></div> : null}
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4"><p className="text-xs font-medium text-night">{shown.length} CV enregistré{shown.length > 1 ? "s" : ""}<span className="ml-2 text-[10px] font-normal text-muted">/ {CV_LIMITS.documents} maximum</span></p><p className="text-[11px] leading-6 text-muted">{aiAvailable ? "Assistant de rédaction facultatif · Suggestions à valider" : "Édition manuelle et PDF disponibles · Assistant indisponible"}</p></div>
    {shown.length ? <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{shown.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-line bg-white"><Link href={`/espace/cv/${item.id}`} aria-label={`Modifier ${item.title}`} className="group block border-b border-line bg-[#eae9e3] px-6 pt-6"><div className="h-56 overflow-hidden rounded-t-md border border-line shadow-sm transition-transform group-hover:-translate-y-1" aria-hidden="true"><CvPreview content={item.content} templateId={item.templateId} accent={item.accent} compact /></div></Link><div className="p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange">{CV_TEMPLATES.find((template) => template.value === item.templateId)?.label}</p><h2 className="mt-2 break-words text-lg font-semibold text-night"><Link href={`/espace/cv/${item.id}`} className="hover:text-orange">{item.title}</Link></h2><p className="mt-2 text-[10px] leading-6 text-muted">Modifié le {cvUpdatedAt(item.updatedAt)}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4"><Link href={`/espace/cv/${item.id}`} className="inline-flex min-h-11 items-center gap-4 text-xs font-semibold text-night">Modifier mon CV<CareerIcon name="arrow" className="h-4 w-4" /></Link><button type="button" onClick={() => remove(item)} disabled={busy !== null} aria-label={`Supprimer ${item.title}`} className="min-h-11 rounded-lg px-2 text-[11px] text-muted hover:bg-paper hover:text-orange disabled:opacity-50">{busy === item.id ? "Suppression…" : "Supprimer"}</button></div></div></article>)}</div> : <section className="overflow-hidden rounded-xl border border-line bg-white"><div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_.9fr]"><div><span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-night"><CareerIcon name="document" className="h-6 w-6" /></span><h2 className="mt-6 text-2xl font-semibold tracking-tight text-night">Une page blanche.<br />Votre prochain chapitre.</h2><p className="mt-4 max-w-md text-sm leading-8 text-muted">Commencez avec vos informations, ajoutez votre expérience et faites évoluer votre CV à votre rythme. Aucun contenu fictif n’est ajouté à votre document.</p><div className="mt-6">{createButton}</div></div><ol className="divide-y divide-line self-center">{[{ title: "Racontez votre parcours", text: "Profil, expériences, formation et compétences." }, { title: "Choisissez votre présentation", text: "Trois modèles et trois couleurs, sans complexité." }, { title: "Relisez et exportez", text: "Un PDF à partager, un CV que vous pouvez continuer à modifier." }].map((step, index) => <li key={step.title} className="flex gap-4 py-5"><span className="pt-1 text-[11px] font-semibold text-orange">0{index + 1}</span><div><h3 className="text-sm font-semibold">{step.title}</h3><p className="mt-2 text-xs leading-7 text-muted">{step.text}</p></div></li>)}</ol></div></section>}
    <div className="mt-7 flex flex-col gap-5 rounded-xl bg-night p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">Vous souhaitez un regard professionnel ?</h2><p className="mt-2 text-xs leading-7 text-white/70">Le studio et l’accompagnement de l’équipe sont deux parcours distincts. Demandez un CV Cleaning pour retravailler votre document avec nous.</p></div><Link href="/espace/nouvelle-demande?service=improve_cv" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-4 rounded-lg border border-white/25 px-4 text-xs font-semibold hover:bg-white/10">Demander un CV Cleaning<CareerIcon name="arrow" className="h-4 w-4" /></Link></div>
  </>;
}
