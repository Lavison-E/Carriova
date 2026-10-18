"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { ButtonLink, cn } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/actions";
import { submitQualification } from "@/lib/qualification-actions";
import { QUALIFICATION_PRIVACY_NOTICE, qualificationOptions, validateQualification, type QualificationNeed } from "@/lib/qualification";

const initialState: ActionState = { ok: false, message: "" };

const steps = [
  {
    label: "Votre profil",
    title: "Faisons connaissance.",
    description: "Ces premières informations nous permettront de mieux comprendre votre profil.",
    fields: ["fullName", "whatsapp", "country", "profile", "discoverySource"],
  },
  {
    label: "Votre besoin",
    title: "Comprenons votre besoin.",
    description: "Votre objectif nous aidera à identifier la prestation la plus adaptée.",
    fields: ["need", "cvStatus", "timeline", "targetOffer", "difficulty"],
  },
  {
    label: "Votre demande",
    title: "Précisons votre demande.",
    description: "Quelques dernières précisions pour mieux vous orienter.",
    fields: ["budget", "paymentReadiness", "contactWhatsApp", "message", "consentPrivacy", "consentMarketing"],
  },
];

const fieldLabels: Record<string, string> = {
  fullName: "Nom et prénom", whatsapp: "Numéro WhatsApp", country: "Pays de résidence",
  profile: "Situation professionnelle", discoverySource: "Découverte de Carriova",
  need: "Besoin principal", cvStatus: "Votre CV", timeline: "Délai souhaité",
  targetOffer: "Offre ciblée", difficulty: "Difficulté principale", budget: "Budget",
  paymentReadiness: "Votre intention", contactWhatsApp: "Contact sur WhatsApp",
  message: "Précision sur votre besoin", consentPrivacy: "Confidentialité", consentMarketing: "Communications Carriova",
};

function firstErrorStep(errors: Record<string, string>) {
  return steps.findIndex((step) => step.fields.some((name) => Boolean(errors[name])));
}

function QuestionLabel({ number, title, required }: { number: number; title: string; required?: boolean }) {
  return (
    <span className="flex items-start gap-3 text-sm font-semibold leading-6 text-night">
      <span className="pt-0.5 text-[10px] font-medium tabular-nums text-orange" aria-hidden="true">{String(number).padStart(2, "0")} /</span>
      <span>{title}{required ? <span className="ml-1 text-orange" aria-hidden="true">*</span> : <span className="ml-1 text-xs font-normal text-muted">(facultatif)</span>}</span>
    </span>
  );
}

function Choices({ name, title, number, value, onChange, error, required = true, columns = 2 }: {
  name: Exclude<keyof typeof qualificationOptions, "country">;
  title: string;
  number: number;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  columns?: 1 | 2;
}) {
  const errorId = `qualification-${name}-error`;
  return (
    <fieldset id={`qualification-${name}`} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-3"><QuestionLabel number={number} title={title} required={required} /></legend>
      <div className={cn("grid gap-2.5", columns === 2 && "sm:grid-cols-2")}>
        {(qualificationOptions[name] ?? []).map((option) => (
          <label key={option.value} className={cn("flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-[13px] leading-6 transition-colors", value === option.value ? "border-night bg-soft text-night" : "border-line bg-white text-muted hover:border-night/35", error && "border-orange/55")}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(event) => onChange(name, event.target.value)}
              required={required}
              aria-describedby={error ? errorId : undefined}
              className="mt-1 h-4 w-4 shrink-0 accent-night"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {!required && value ? <button type="button" onClick={() => onChange(name, "")} className="mt-2 min-h-8 text-xs text-muted underline underline-offset-4 hover:text-night">Effacer ma réponse</button> : null}
      {error ? <p id={errorId} className="mt-2 text-xs leading-5 text-orange">{error}</p> : null}
    </fieldset>
  );
}

export function QualificationForm({ initialNeed = null }: { initialNeed?: QualificationNeed | null }) {
  const [state, action, pending] = useActionState(submitQualification, initialState);
  const [lastResponse, setLastResponse] = useState(state);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>((): Record<string, string> => initialNeed ? { need: initialNeed } : {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResponse, setShowResponse] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ target: "heading" | "error"; revision: number } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // A new server response may point to an earlier step. Keep the user's answers intact.
  if (state !== lastResponse) {
    setLastResponse(state);
    setErrors(state.fieldErrors ?? {});
    setShowResponse(Boolean(state.message));
    const invalidStep = firstErrorStep(state.fieldErrors ?? {});
    if (!state.ok && invalidStep >= 0) setStep(invalidStep);
  }

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) successRef.current?.focus();
    else errorRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.target === "error") errorRef.current?.focus();
    else headingRef.current?.focus();
  }, [focusRequest]);

  function requestFocus(target: "heading" | "error") {
    setFocusRequest((previous) => ({ target, revision: (previous?.revision ?? 0) + 1 }));
  }

  function updateValue(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
    setShowResponse(false);
  }

  function goBack(target: number) {
    setStep(target);
    setErrors({});
    setShowResponse(false);
    requestFocus("heading");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    const validation = validateQualification(new FormData(event.currentTarget));
    const currentErrors = step < 2
      ? Object.fromEntries(Object.entries(validation.fieldErrors).filter(([name]) => steps[step].fields.includes(name)))
      : validation.fieldErrors;
    setErrors(currentErrors);
    setShowResponse(false);

    if (Object.keys(currentErrors).length > 0) {
      event.preventDefault();
      const invalidStep = firstErrorStep(currentErrors);
      if (invalidStep >= 0) setStep(invalidStep);
      requestFocus("error");
      return;
    }
    if (step < 2) {
      event.preventDefault();
      setStep((current) => current + 1);
      requestFocus("heading");
    }
  }

  function focusField(name: string) {
    const targetStep = steps.findIndex((item) => item.fields.includes(name));
    if (targetStep >= 0 && targetStep !== step) {
      setStep(targetStep);
      requestFocus("heading");
      return;
    }
    const field = formRef.current?.elements.namedItem(name);
    if (field instanceof RadioNodeList) {
      const first = field.item(0);
      if (first instanceof HTMLElement) first.focus();
    } else if (field instanceof HTMLElement) field.focus();
  }

  if (state.ok) {
    return (
      <div className="rounded-xl border border-line bg-white px-6 py-10 sm:p-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-soft text-night"><CareerIcon name="check" className="h-7 w-7" /></span>
        <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Demande reçue</p>
        <h2 ref={successRef} tabIndex={-1} className="mt-4 scroll-mt-28 text-3xl font-semibold tracking-tight text-night outline-none sm:text-4xl">Merci pour votre confiance !</h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-muted">Votre demande a bien été reçue. L’équipe Carriova pourra étudier votre besoin et vous recontacter si vous avez demandé un échange.</p>
        <p className="mt-6 font-editorial text-2xl italic text-night">Révélez votre potentiel. Boostez votre carrière.</p>
        <div className="mt-9 flex flex-col flex-wrap gap-3 sm:flex-row"><ButtonLink href="/compte/creer" variant="orange">Créer mon espace et suivre ma demande <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink><ButtonLink href="/" variant="secondary">Retour à l’accueil</ButtonLink></div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const feedback = showResponse && state.message ? state.message : "Merci de compléter ou de corriger les informations ci-dessous.";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="qualification-js-only border-b border-line bg-[#fafaf7] px-5 py-6 sm:px-8">
        <ol className="grid grid-cols-3 gap-3" aria-label="Étapes de votre demande">
          {steps.map((item, index) => (
            <li key={item.label} aria-current={index === step ? "step" : undefined}>
              <button type="button" disabled={index >= step || pending} onClick={() => goBack(index)} className={cn("flex w-full flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:gap-3", index > step ? "text-muted" : "text-night", index >= step && "cursor-default")}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", index <= step ? "bg-night text-white" : "border border-line bg-white text-muted")}>{index < step ? <CareerIcon name="check" className="h-4 w-4" /> : `0${index + 1}`}</span>
                <span className="text-[11px] font-medium sm:text-xs">{item.label}<span className="sr-only">{index < step ? ", étape terminée, revenir à cette étape" : index === step ? ", étape actuelle" : ", étape à venir"}</span></span>
              </button>
            </li>
          ))}
        </ol>
        <div role="progressbar" aria-label="Progression du formulaire" aria-valuemin={0} aria-valuemax={3} aria-valuenow={step + 1} aria-valuetext={`Étape ${step + 1} sur 3 : ${steps[step].label}`} className="mt-5 h-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-orange transition-[width] motion-reduce:transition-none" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      </div>

      <form ref={formRef} action={action} noValidate onSubmit={handleSubmit} onReset={(event) => event.preventDefault()} aria-busy={pending} className="relative p-5 sm:p-8 lg:p-10">
        <noscript><style>{`[data-qualification-step][hidden]{display:block!important}[data-qualification-step]+[data-qualification-step]{margin-top:3rem}.qualification-js-only{display:none!important}.qualification-no-js{display:block!important}`}</style><p className="mb-6 rounded-lg border border-line bg-paper p-4 text-sm leading-6">Vous pouvez remplir les trois étapes ci-dessous, puis envoyer votre demande en bas du formulaire.</p></noscript>
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Site web<input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>

        <div className="qualification-js-only mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Étape {step + 1} sur 3</p>
          <h2 ref={headingRef} tabIndex={-1} className="mt-3 scroll-mt-28 text-2xl font-semibold tracking-tight text-night outline-none sm:text-3xl">{steps[step].title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted">{steps[step].description}</p>
          <p className="mt-4 text-xs text-muted">Les champs marqués d’un <span className="font-semibold text-orange">*</span> sont obligatoires.</p>
        </div>

        {hasErrors || showResponse ? (
          <div ref={errorRef} tabIndex={-1} role="alert" className="mb-7 scroll-mt-28 rounded-lg border border-orange/30 bg-[#fff7f0] p-4 text-sm text-night outline-none">
            <p className="font-medium leading-6">{feedback}</p>
            {hasErrors ? <ul className="mt-2 space-y-1">{Object.entries(errors).map(([name, message]) => <li key={name}><button type="button" onClick={() => focusField(name)} className="py-1 text-left text-xs leading-5 text-orange underline underline-offset-4">{fieldLabels[name] ?? name} : {message}</button></li>)}</ul> : <p className="mt-2 text-xs leading-6 text-muted">Vos réponses sont conservées sur cette page. Vous pouvez réessayer.</p>}
          </div>
        ) : null}

        <fieldset disabled={pending} className="min-w-0">
          <div data-qualification-step hidden={step !== 0} className="space-y-7">
            <h3 className="qualification-no-js hidden text-xl font-semibold text-night">Étape 1 — Faisons connaissance</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="qualification-fullName"><QuestionLabel number={1} title="Quel est votre nom et prénom ?" required /></label>
                <input id="qualification-fullName" name="fullName" type="text" autoComplete="name" required maxLength={120} value={values.fullName ?? ""} onChange={(event) => updateValue("fullName", event.target.value)} aria-invalid={errors.fullName ? true : undefined} aria-describedby={errors.fullName ? "qualification-fullName-error" : undefined} className="mt-3 h-12 w-full rounded-lg border border-line bg-white px-4 text-sm text-night focus:border-night" />
                {errors.fullName ? <p id="qualification-fullName-error" className="mt-2 text-xs leading-5 text-orange">{errors.fullName}</p> : null}
              </div>
              <div>
                <label htmlFor="qualification-whatsapp"><QuestionLabel number={2} title="Quel est votre numéro WhatsApp ?" required /></label>
                <input id="qualification-whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required maxLength={32} placeholder="+225 07 00 00 00 00" value={values.whatsapp ?? ""} onChange={(event) => updateValue("whatsapp", event.target.value)} aria-invalid={errors.whatsapp ? true : undefined} aria-describedby={`qualification-whatsapp-help${errors.whatsapp ? " qualification-whatsapp-error" : ""}`} className="mt-3 h-12 w-full rounded-lg border border-line bg-white px-4 text-sm text-night placeholder:text-muted/75 focus:border-night" />
                <p id="qualification-whatsapp-help" className="mt-2 text-xs leading-5 text-muted">Indiquez le numéro avec l’indicatif international, par exemple +225.</p>
                {errors.whatsapp ? <p id="qualification-whatsapp-error" className="mt-2 text-xs leading-5 text-orange">{errors.whatsapp}</p> : null}
              </div>
            </div>
            <div>
              <label htmlFor="qualification-country"><QuestionLabel number={3} title="Dans quel pays résidez-vous ?" required /></label>
              <select id="qualification-country" name="country" autoComplete="country" required value={values.country ?? ""} onChange={(event) => updateValue("country", event.target.value)} aria-invalid={errors.country ? true : undefined} aria-describedby={errors.country ? "qualification-country-error" : undefined} className="mt-3 min-h-12 w-full rounded-lg border border-line bg-white px-4 py-3 text-base text-night focus:border-night">
                <option value="" disabled>Sélectionnez votre pays de résidence</option>
                <option value="CI">Côte d’Ivoire</option>
                <optgroup label="Autres pays et territoires">
                  {qualificationOptions.country.filter((option) => option.value !== "CI").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </optgroup>
              </select>
              {errors.country ? <p id="qualification-country-error" className="mt-2 text-xs leading-5 text-orange">{errors.country}</p> : null}
            </div>
            <Choices name="profile" number={4} title="Quelle est votre situation professionnelle actuelle ?" value={values.profile ?? ""} onChange={updateValue} error={errors.profile} />
            <Choices name="discoverySource" number={5} title="Où avez-vous découvert Carriova ?" value={values.discoverySource ?? ""} onChange={updateValue} error={errors.discoverySource} />
          </div>

          <div data-qualification-step hidden={step !== 1} className="space-y-7">
            <h3 className="qualification-no-js hidden text-xl font-semibold text-night">Étape 2 — Comprenons votre besoin</h3>
            <Choices name="need" number={6} title="Quel est votre principal besoin aujourd’hui ?" value={values.need ?? ""} onChange={updateValue} error={errors.need} />
            <Choices name="cvStatus" number={7} title="Avez-vous déjà un CV à jour ?" value={values.cvStatus ?? ""} onChange={updateValue} error={errors.cvStatus} columns={1} />
            <Choices name="timeline" number={8} title="Quand souhaitez-vous obtenir de l’aide ?" value={values.timeline ?? ""} onChange={updateValue} error={errors.timeline} />
            <Choices name="targetOffer" number={9} title="Avez-vous déjà une offre d’emploi ciblée ?" value={values.targetOffer ?? ""} onChange={updateValue} error={errors.targetOffer} required={false} columns={1} />
            <Choices name="difficulty" number={10} title="Quelle est votre principale difficulté ?" value={values.difficulty ?? ""} onChange={updateValue} error={errors.difficulty} required={false} columns={1} />
          </div>

          <div data-qualification-step hidden={step !== 2} className="space-y-7">
            <h3 className="qualification-no-js hidden text-xl font-semibold text-night">Étape 3 — Votre demande</h3>
            <Choices name="budget" number={11} title="Quel budget pourriez-vous consacrer à cette prestation si elle répond à votre besoin ?" value={values.budget ?? ""} onChange={updateValue} error={errors.budget} />
            <Choices name="paymentReadiness" number={12} title="Si une solution adaptée vous est proposée, seriez-vous prêt(e) à payer pour en bénéficier ?" value={values.paymentReadiness ?? ""} onChange={updateValue} error={errors.paymentReadiness} columns={1} />
            <Choices name="contactWhatsApp" number={13} title="Souhaitez-vous être contacté(e) sur WhatsApp pour discuter de votre besoin ?" value={values.contactWhatsApp ?? ""} onChange={updateValue} error={errors.contactWhatsApp} columns={1} />
            <div>
              <label htmlFor="qualification-message"><QuestionLabel number={14} title="Une précision sur votre besoin ?" /></label>
              <textarea id="qualification-message" name="message" rows={4} maxLength={4000} value={values.message ?? ""} onChange={(event) => updateValue("message", event.target.value)} aria-invalid={errors.message ? true : undefined} aria-describedby={errors.message ? "qualification-message-error" : undefined} className="mt-3 w-full resize-y rounded-lg border border-line bg-white px-4 py-3 text-sm leading-7 text-night focus:border-night" />
              {errors.message ? <p id="qualification-message-error" className="mt-2 text-xs leading-5 text-orange">{errors.message}</p> : null}
            </div>
            <fieldset className="space-y-4 border-t border-line pt-6">
              <legend className="px-0 pr-4 text-sm font-semibold text-night">Consentement et confidentialité</legend>
              <div>
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-muted"><input type="checkbox" name="consentPrivacy" required checked={values.consentPrivacy === "on"} onChange={(event) => updateValue("consentPrivacy", event.target.checked ? "on" : "")} aria-invalid={errors.consentPrivacy ? true : undefined} aria-describedby={errors.consentPrivacy ? "qualification-consentPrivacy-error" : undefined} className="mt-1 h-4 w-4 shrink-0 accent-night" /><span>{QUALIFICATION_PRIVACY_NOTICE} <span className="font-semibold text-orange" aria-hidden="true">*</span></span></label>
                {errors.consentPrivacy ? <p id="qualification-consentPrivacy-error" className="mt-2 text-xs leading-5 text-orange">{errors.consentPrivacy}</p> : null}
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-muted"><input type="checkbox" name="consentMarketing" checked={values.consentMarketing === "on"} onChange={(event) => updateValue("consentMarketing", event.target.checked ? "on" : "")} className="mt-1 h-4 w-4 shrink-0 accent-night" /><span>Je souhaite recevoir des conseils, actualités et offres de Carriova par WhatsApp ou e-mail. <span className="font-medium">(Facultatif)</span></span></label>
              <Link href="/legal/confidentialite" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-night underline decoration-line underline-offset-4 hover:text-orange">Lire la politique de confidentialité <span aria-hidden="true">↗</span><span className="sr-only">(nouvel onglet)</span></Link>
            </fieldset>
          </div>
        </fieldset>

        <div className="qualification-js-only mt-9 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? <button type="button" disabled={pending} onClick={() => goBack(step - 1)} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-line px-5 text-sm font-semibold text-night hover:border-night disabled:cursor-wait disabled:opacity-60"><CareerIcon name="arrow" className="h-4 w-4 rotate-180" />Retour</button> : <p className="text-center text-xs leading-6 text-muted sm:text-left">À votre rythme, une étape à la fois.</p>}
          <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-7 rounded-lg bg-orange px-6 py-3 text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60">{pending ? "Envoi en cours…" : step === 2 ? "Envoyer ma demande" : "Continuer"}{!pending ? <CareerIcon name="arrow" className="h-4 w-4" /> : null}</button>
        </div>
        <noscript><button type="submit" className="mt-8 min-h-12 w-full rounded-lg bg-orange px-6 py-3 text-sm font-semibold text-white">Envoyer ma demande</button></noscript>
        {step === 2 ? <p className="mt-4 text-center text-[11px] leading-6 text-muted">Ce formulaire ne déclenche aucun paiement.</p> : null}
      </form>
    </div>
  );
}
