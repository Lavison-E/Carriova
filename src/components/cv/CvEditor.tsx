"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { CvFields, CvField, CvText, type CvSection } from "@/components/cv/CvFields";
import { CvPreview } from "@/components/cv/CvPreview";
import { cvRequest, CvRequestError, cvUpdatedAt } from "@/components/cv/cv-client";
import { CV_TEMPLATES, CV_ACCENTS, CV_LIMITS, type CvContent, type CvDocument } from "@/lib/cv";

type Draft = Pick<CvDocument, "title" | "content" | "templateId" | "accent">;
type Suggestion = { content: CvContent; sourceVersion: number };
type Notice = { text: string; error: boolean; fields?: Record<string, string>; unauthorized?: boolean };
const sections: { id: CvSection; label: string; title: string; description: string }[] = [
  { id: "profile", label: "Profil", title: "Commençons par vous.", description: "Vos coordonnées et quelques lignes pour présenter votre objectif." },
  { id: "experience", label: "Expériences", title: "Ce que vous avez accompli.", description: "Faites ressortir vos missions et les résultats de votre travail." },
  { id: "education", label: "Formation", title: "Les bases de votre parcours.", description: "Diplômes, formations et certifications utiles à votre candidature." },
  { id: "skills", label: "Compétences", title: "Vos points forts, clairement.", description: "Des compétences précises et des niveaux de langue sincères." },
  { id: "projects", label: "Projets", title: "Ce qui vous distingue.", description: "Un projet ou un engagement peut apporter une preuve concrète de vos compétences." },
  { id: "design", label: "Mise en page", title: "Une forme à votre image.", description: "Trois modèles lisibles à une colonne, avec la même attention portée au contenu." },
  { id: "assistant", label: "Assistant", title: "Un coup de main pour les mots.", description: "Partez de faits réels. L’assistant vous propose une version que vous relisez avant de l’appliquer." },
];
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#9e3708] disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-xs font-semibold text-night hover:border-night disabled:cursor-not-allowed disabled:opacity-50";
function editable(document: CvDocument): Draft { return { title: document.title, content: document.content, templateId: document.templateId, accent: document.accent }; }
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function useUnsavedWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const confirmLeave = () => window.confirm("Votre CV contient des modifications non enregistrées. Voulez-vous quitter cet écran ?");
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || link.target === "_blank") return;
      const destination = new URL(link.href, window.location.href);
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      if (!confirmLeave()) { event.preventDefault(); event.stopPropagation(); }
    };
    // The Navigation API also lets supported browsers cancel a history traversal.
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const navigate = (event: Event) => {
      const transition = event as Event & { canIntercept?: boolean; navigationType?: string };
      if (transition.canIntercept && transition.navigationType === "traverse" && !confirmLeave()) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    navigation?.addEventListener("navigate", navigate);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", click, true); navigation?.removeEventListener("navigate", navigate); };
  }, [active]);
}

export function CvEditor({ initialDocument, aiAvailable }: { initialDocument: CvDocument; aiAvailable: boolean }) {
  const [saved, setSaved] = useState(initialDocument);
  const [draft, setDraft] = useState(() => editable(initialDocument));
  const [section, setSection] = useState<CvSection>("profile");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<"save" | "assistant" | "pdf" | "reload" | null>(null);
  const operation = useRef(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [conflict, setConflict] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [facts, setFacts] = useState("");
  const [target, setTarget] = useState("");
  const [consent, setConsent] = useState(false);
  const assistantAttempt = useRef<{ key: string; id: string } | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(editable(saved));
  const locked = !!busy || conflict || !!suggestion;
  const currentSection = sections.find((item) => item.id === section)!;
  useUnsavedWarning(dirty || !!suggestion || !!busy);
  useEffect(() => { if (notice || conflict) feedbackRef.current?.focus(); }, [notice, conflict]);

  function failure(error: unknown) {
    if (error instanceof CvRequestError) {
      if (error.code === "VERSION_CONFLICT") setConflict(true);
      setNotice({ text: error.message, error: true, fields: error.fields, unauthorized: error.status === 401 });
    } else setNotice({ text: "La connexion a été interrompue. Votre travail reste dans cet écran ; réessayez sans le fermer.", error: true });
  }
  async function saveCurrent() {
    if (!dirty) return saved;
    const { document } = await cvRequest<{ document: CvDocument }>(`/api/espace/cv/${saved.id}`, { method: "PATCH", body: JSON.stringify({ version: saved.version, ...draft }) });
    setSaved(document); setDraft(editable(document));
    return document;
  }
  async function run(kind: "save" | "assistant" | "pdf") {
    if (operation.current || conflict || suggestion) return;
    operation.current = true; setBusy(kind); setNotice(null);
    try {
      const document = await saveCurrent();
      if (kind === "save") setNotice({ text: "Votre CV est enregistré dans votre espace.", error: false });
      if (kind === "assistant") {
        const key = JSON.stringify({ version: document.version, facts, target });
        if (assistantAttempt.current?.key !== key) assistantAttempt.current = { key, id: crypto.randomUUID() };
        const result = await cvRequest<{ suggestion: CvContent; sourceVersion: number; requestId: string }>(`/api/espace/cv/${saved.id}/assistant`, { method: "POST", body: JSON.stringify({ version: document.version, requestId: assistantAttempt.current.id, facts, target, consent: true }) });
        if (result.sourceVersion !== document.version) throw new CvRequestError("Le CV a changé pendant la préparation de la suggestion. Rechargez la version enregistrée avant de réessayer.", 409, {}, "VERSION_CONFLICT");
        assistantAttempt.current = null;
        setSuggestion({ content: result.suggestion, sourceVersion: result.sourceVersion }); setShowSuggestion(true); setMobileView("preview");
        setNotice({ text: "La suggestion est prête. Vérifiez chaque information avant de l’appliquer ; votre version enregistrée reste inchangée.", error: false });
      }
      if (kind === "pdf") {
        const response = await fetch(`/api/espace/cv/${saved.id}/pdf?version=${document.version}`, { cache: "no-store" });
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new CvRequestError(result?.error || "Le PDF n’a pas pu être préparé. Votre CV reste enregistré.", response.status, {}, result?.code || "");
        }
        if (!response.headers.get("content-type")?.includes("application/pdf")) throw new CvRequestError("Le PDF n’a pas pu être préparé. Réessayez dans un instant.", 502);
        download(await response.blob(), `${document.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "Mon CV"}.pdf`);
        setNotice({ text: "Le PDF est prêt. Son téléchargement a été lancé.", error: false });
      }
    } catch (error) {
      if (kind === "assistant" && error instanceof CvRequestError) {
        if (error.code !== "AI_IN_PROGRESS" && error.code !== "VERSION_CONFLICT") assistantAttempt.current = null;
        if (error.code === "REQUEST_REUSED") {
          setNotice({ text: "Cette demande a déjà été traitée. Relancez explicitement si nécessaire ; aucun nouvel appel n’a été effectué.", error: true });
        } else failure(error);
      } else failure(error);
    }
    finally { operation.current = false; setBusy(null); }
  }
  async function reload() {
    if (operation.current || !window.confirm("Charger la dernière version enregistrée remplacera les modifications présentes dans cet écran. Téléchargez d’abord une copie si vous souhaitez les conserver.")) return;
    operation.current = true; setBusy("reload");
    try {
      const { document } = await cvRequest<{ document: CvDocument }>(`/api/espace/cv/${saved.id}`);
      setSaved(document); setDraft(editable(document)); setSuggestion(null); setConflict(false);
      setNotice({ text: "La dernière version enregistrée est chargée. Vous pouvez reprendre l’édition.", error: false });
    } catch (error) { failure(error); }
    finally { operation.current = false; setBusy(null); }
  }
  function applySuggestion() {
    if (!suggestion || suggestion.sourceVersion !== saved.version || dirty) { setConflict(true); return; }
    setDraft((current) => ({ ...current, content: suggestion.content })); setSuggestion(null); setMobileView("edit");
    setNotice({ text: "Suggestion appliquée à votre brouillon. Vous pouvez la modifier puis enregistrer votre CV.", error: false });
  }

  return <div className="min-w-0">
    <Link href="/espace/cv" className="mb-5 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-muted hover:text-night"><CareerIcon name="arrow" className="h-3.5 w-3.5 rotate-180" />Mes CV</Link>
    <div className="mb-6 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Le studio CV</p><h1 className="mt-3 font-editorial text-4xl italic leading-tight tracking-tight sm:text-5xl">Votre parcours prend forme.</h1><p className="mt-3 text-xs leading-7 text-muted">Écrivez, ajustez et préparez un document qui vous ressemble.</p></div><span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-md bg-white px-3 py-2 text-[10px] font-medium text-muted"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-orange" : "bg-[#477656]"}`} />{dirty ? "Modifications à enregistrer" : "Version enregistrée"}</span></div>
    <div className="mb-6 rounded-xl border border-line bg-white p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><CvField id="cv-document-title" label="Nom de ce CV" maxLength={CV_LIMITS.title} value={draft.title} disabled={locked} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></div><div className="grid grid-cols-2 gap-2 sm:flex"><button type="button" onClick={() => run("save")} disabled={locked || !dirty} className={secondary}>{busy === "save" ? "Enregistrement…" : "Enregistrer"}</button><button type="button" onClick={() => run("pdf")} disabled={locked} className={primary}>{busy === "pdf" ? "Préparation…" : "Télécharger le PDF"}<CareerIcon name="arrow" className="hidden h-4 w-4 -rotate-45 sm:block" /></button></div></div><p className="mt-3 text-[10px] leading-6 text-muted">Dernier enregistrement : {cvUpdatedAt(saved.updatedAt)} · Le CV est enregistré avant un export ou une demande à l’assistant.</p></div>
    {notice || conflict ? <div ref={feedbackRef} tabIndex={-1} role={notice?.error || conflict ? "alert" : "status"} className={`mb-6 scroll-mt-24 rounded-xl border p-5 text-xs leading-7 outline-none ${notice?.error || conflict ? "border-orange/30 bg-[#fff7f0] text-night" : "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]"}`}>
      {notice ? <p>{notice.text}</p> : null}{notice?.fields && Object.keys(notice.fields).length ? <ul className="mt-2 list-disc space-y-1 pl-4">{Object.entries(notice.fields).map(([key, text]) => <li key={key}>{text}</li>)}</ul> : null}{notice?.unauthorized ? <Link href="/compte/connexion" className="mt-3 inline-flex min-h-10 font-semibold underline underline-offset-4">Se reconnecter</Link> : null}
      {conflict ? <div className="mt-3"><p className="font-semibold">Une autre version existe. Vos modifications sont conservées ici.</p><p className="mt-1">Pour éviter d’écraser un travail plus récent, l’édition reste suspendue jusqu’au chargement de cette version.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => download(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }), "brouillon-cv.json")} className={secondary}>Télécharger mon brouillon (.json)</button><button type="button" onClick={reload} disabled={!!busy} className={primary}>{busy === "reload" ? "Chargement…" : "Charger la version enregistrée"}</button></div></div> : null}
    </div> : null}
    {suggestion ? <section aria-labelledby="cv-suggestion-title" className="mb-6 rounded-xl border border-night/20 bg-night p-5 text-white sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f7bd92]">À vous de décider</p><h2 id="cv-suggestion-title" className="mt-3 text-lg font-semibold">Relisez la suggestion avant de l’appliquer.</h2><p className="mt-3 max-w-2xl text-xs leading-7 text-white/75">Vérifiez les dates, les missions, les compétences et les résultats. L’assistant peut se tromper. Aucune expérience ou qualification ne doit être ajoutée si elle ne correspond pas à votre parcours.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={applySuggestion} disabled={conflict || !!busy} className={primary}>Appliquer à mon brouillon</button><button type="button" onClick={() => { setSuggestion(null); setNotice({ text: "Suggestion écartée. Votre CV n’a pas été modifié.", error: false }); }} className="min-h-11 rounded-lg border border-white/25 px-4 text-xs font-semibold hover:bg-white/10">Garder ma version</button></div></section> : null}
    <div className="mb-5 grid grid-cols-2 rounded-lg border border-line bg-white p-1 xl:hidden" aria-label="Affichage du studio"><button type="button" aria-pressed={mobileView === "edit"} onClick={() => setMobileView("edit")} className={`min-h-11 rounded-md text-xs font-semibold ${mobileView === "edit" ? "bg-night text-white" : "text-muted"}`}>Modifier mon CV</button><button type="button" aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")} className={`min-h-11 rounded-md text-xs font-semibold ${mobileView === "preview" ? "bg-night text-white" : "text-muted"}`}>Voir l’aperçu</button></div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className={`${mobileView === "edit" ? "block" : "hidden"} min-w-0 xl:block`}>
        <nav aria-label="Rubriques du CV" className="mb-4 flex flex-wrap gap-2">{sections.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? "step" : undefined} onClick={() => setSection(item.id)} className={`min-h-10 rounded-lg border px-3 text-[11px] font-semibold ${section === item.id ? "border-night bg-night text-white" : "border-line bg-white text-muted hover:text-night"}`}>{item.label}</button>)}</nav>
        <section aria-labelledby="cv-section-title" className="min-w-0 rounded-xl border border-line bg-white p-5 sm:p-6"><h2 id="cv-section-title" className="text-xl font-semibold tracking-tight">{currentSection.title}</h2><p className="mb-6 mt-3 text-xs leading-7 text-muted">{currentSection.description}</p>
          {section !== "design" && section !== "assistant" ? <CvFields content={draft.content} onChange={(content) => setDraft((current) => ({ ...current, content }))} section={section} disabled={locked} /> : null}
          {section === "design" ? <fieldset disabled={locked} className="min-w-0 space-y-6"><div><p className="mb-4 text-xs font-semibold">Choisissez votre modèle</p><div className="space-y-3">{CV_TEMPLATES.map((template) => <label key={template.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${draft.templateId === template.value ? "border-night bg-paper" : "border-line"}`}><input type="radio" name="cv-template" value={template.value} checked={draft.templateId === template.value} onChange={() => setDraft((current) => ({ ...current, templateId: template.value }))} className="mt-1 h-4 w-4 accent-night" /><span><span className="block text-sm font-semibold">{template.label}</span><span className="mt-1 block text-xs leading-6 text-muted">{template.description}</span></span></label>)}</div></div><div><p className="mb-3 text-xs font-semibold">Couleur d’accent</p><div className="flex flex-wrap gap-3">{CV_ACCENTS.map((accent) => <label key={accent.value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[11px] ${draft.accent === accent.value ? "border-night bg-paper font-semibold" : "border-line"}`}><input type="radio" name="cv-accent" checked={draft.accent === accent.value} onChange={() => setDraft((current) => ({ ...current, accent: accent.value }))} className="h-4 w-4 accent-night" /><span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: accent.color }} />{accent.label}</label>)}</div></div><p className="rounded-lg bg-paper p-4 text-xs leading-7 text-muted">Les rubriques vides sont masquées. Le PDF adapte les sauts de page à la longueur de votre contenu.</p></fieldset> : null}
          {section === "assistant" ? <div className="space-y-5">{!aiAvailable ? <p role="status" className="rounded-lg border border-line bg-paper p-4 text-xs leading-7 text-muted">L’assistant n’est pas disponible pour le moment. Vous pouvez rédiger votre CV, choisir sa mise en page et télécharger le PDF sans l’utiliser.</p> : null}<fieldset disabled={locked || !aiAvailable} className="min-w-0 space-y-5"><CvText id="cv-assistant-facts" label="Votre parcours en quelques mots" value={facts} onChange={setFacts} maxLength={4000} rows={7} hint="Complétez au besoin les éléments déjà saisis dans votre CV : missions, projets, outils, dates et résultats vérifiables. N’ajoutez pas vos coordonnées ni de données sensibles." /><CvText id="cv-assistant-target" label="Poste ou objectif visé (facultatif)" value={target} onChange={setTarget} maxLength={4000} rows={4} hint="Vous pouvez préciser le métier recherché ou les attentes importantes d’une offre." /><label className="flex items-start gap-3 text-xs leading-7 text-muted"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-night" /><span>J’accepte de transmettre à Groq les éléments professionnels de mon CV et les informations saisies ici pour obtenir une suggestion. Les champs de coordonnées ne sont pas envoyés. Cet assistant est facultatif.</span></label><button type="button" onClick={() => run("assistant")} disabled={!consent || !aiAvailable || locked} className={`${primary} w-full`}>{busy === "assistant" ? "Préparation de la suggestion…" : "Préparer une suggestion"}<CareerIcon name="arrow" className="h-4 w-4" /></button></fieldset><p className="text-[10px] leading-6 text-muted">Votre CV est d’abord enregistré. La suggestion reste séparée jusqu’à votre validation.</p></div> : null}
        </section>
      </div>
      <div className={`${mobileView === "preview" ? "block" : "hidden"} min-w-0 xl:sticky xl:top-24 xl:block`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{suggestion && showSuggestion ? "Suggestion à relire" : "Votre aperçu"}</p>{suggestion ? <div className="flex gap-1 rounded-lg border border-line bg-white p-1"><button type="button" onClick={() => setShowSuggestion(false)} aria-pressed={!showSuggestion} className={`min-h-9 rounded-md px-3 text-[10px] font-medium ${!showSuggestion ? "bg-night text-white" : "text-muted"}`}>Ma version</button><button type="button" onClick={() => setShowSuggestion(true)} aria-pressed={showSuggestion} className={`min-h-9 rounded-md px-3 text-[10px] font-medium ${showSuggestion ? "bg-night text-white" : "text-muted"}`}>Suggestion</button></div> : <span className="text-[10px] text-muted">{CV_TEMPLATES.find((item) => item.value === draft.templateId)?.label}</span>}</div>
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_12px_35px_rgba(0,18,82,0.06)] xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto" tabIndex={0} aria-label="Aperçu du contenu du CV, défilement possible"><CvPreview content={suggestion && showSuggestion ? suggestion.content : draft.content} templateId={draft.templateId} accent={draft.accent} /></div><p className="mt-3 text-center text-[10px] leading-6 text-muted">Aperçu du contenu · Pagination adaptée à l’export PDF</p>
      </div>
    </div>
  </div>;
}
