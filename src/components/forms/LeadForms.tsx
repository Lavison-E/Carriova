"use client";

import { useActionState, useId, type ReactNode } from "react";
import {
  createAccount,
  loginAccount,
  submitCoaching,
  submitLead,
  submitNewsletter,
  type ActionState,
} from "@/lib/actions";
import { Button, cn } from "@/components/ui/primitives";

const initial: ActionState = { ok: false, message: "" };

function Honeypot() {
  return (
    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label>
        Site web
        <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  placeholder,
  autoComplete,
  maxLength = 120,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const uid = useId();
  const id = `${uid}-${name}`;
  const errorId = `${id}-error`;
  return (
    <label className="block text-sm font-medium text-night" htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none ring-bright/30 focus:ring-2"
      />
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-orange">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function Consent({
  name,
  children,
  error,
  required,
}: {
  name: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}) {
  const uid = useId();
  return (
    <label className="flex items-start gap-2 text-xs leading-5 text-muted" htmlFor={uid}>
      <input
        id={uid}
        type="checkbox"
        name={name}
        required={required}
        className="mt-0.5 accent-[#0348D6]"
      />
      <span>
        {children}
        {error ? <span className="mt-1 block text-orange">{error}</span> : null}
      </span>
    </label>
  );
}

export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(submitNewsletter, initial);
  const dark = tone === "dark";

  return (
    <form action={action} className="relative flex w-full max-w-md flex-col gap-3">
      <Honeypot />
      <input type="hidden" name="landingPage" value="/newsletter" />
      <input type="hidden" name="source" value="newsletter" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          maxLength={255}
          aria-label="Adresse e-mail"
          placeholder="Votre e-mail"
          className={cn(
            "h-11 flex-1 rounded-full border px-4 text-sm outline-none",
            dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "border-line bg-white",
          )}
        />
        <Button type="submit" variant="orange" disabled={pending}>
          {pending ? "Envoi…" : "S’inscrire"}
        </Button>
      </div>
      <Consent name="consentPrivacy" required error={state.fieldErrors?.consentPrivacy}>
        J’accepte la{" "}
        <a href="/legal/confidentialite" className={dark ? "underline" : "text-bright underline"}>
          politique de confidentialité
        </a>
        .
      </Consent>
      <Consent name="consentMarketing" required error={state.fieldErrors?.consentMarketing}>
        J’accepte de recevoir des conseils carrière et des informations sur les opportunités CARRIOVA.
      </Consent>
      {state.message ? (
        <p role="status" className={cn("text-xs", state.ok ? "text-gold" : "text-orange")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ContactForm({ defaultInterest }: { defaultInterest?: string }) {
  const [state, action, pending] = useActionState(submitLead, initial);

  return (
    <form action={action} className="relative grid gap-4">
      <Honeypot />
      <input type="hidden" name="type" value="contact" />
      <input type="hidden" name="source" value="contact_page" />
      <input type="hidden" name="landingPage" value="/contact" />
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="firstName" label="Prénom" required error={state.fieldErrors?.firstName} autoComplete="given-name" />
        <Field name="lastName" label="Nom" autoComplete="family-name" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="email" label="E-mail" type="email" required error={state.fieldErrors?.email} autoComplete="email" />
        <Field
          name="whatsapp"
          label="WhatsApp (optionnel)"
          type="tel"
          autoComplete="tel"
          placeholder="+225 07 00 00 00 00"
          maxLength={20}
        />
      </div>
      <label className="block text-sm font-medium text-night">
        Objectif professionnel
        <select
          name="objective"
          defaultValue={defaultInterest ?? ""}
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="">Choisir</option>
          <option value="emploi">Je cherche un emploi</option>
          <option value="cv">Je veux améliorer mon CV</option>
          <option value="reconversion">Je veux évoluer ou me reconvertir</option>
          <option value="coaching">Je veux un coaching</option>
          <option value="recruteur">Je veux recruter</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-night">
        Message
        <textarea
          name="message"
          rows={5}
          maxLength={4000}
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none ring-bright/30 focus:ring-2"
        />
      </label>
      <Consent name="consentPrivacy" required error={state.fieldErrors?.consentPrivacy}>
        J’accepte que CARRIOVA traite ma demande conformément à la{" "}
        <a className="text-bright underline" href="/legal/confidentialite">
          politique de confidentialité
        </a>
        .
      </Consent>
      <Consent name="consentMarketing">
        J’accepte d’être recontacté(e) par e-mail ou WhatsApp au sujet de mon projet carrière.
      </Consent>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </Button>
      {state.message ? (
        <p role="status" className={cn("text-sm", state.ok ? "text-royal" : "text-orange")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function AccountForm() {
  const [state, action, pending] = useActionState(createAccount, initial);
  return (
    <form action={action} className="relative grid gap-4">
      <Honeypot />
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="firstName" label="Prénom" required error={state.fieldErrors?.firstName} />
        <Field name="lastName" label="Nom" required error={state.fieldErrors?.lastName} />
      </div>
      <Field name="email" label="E-mail" type="email" required error={state.fieldErrors?.email} />
      <label className="block text-sm font-medium text-night">
        Votre priorité
        <select name="objective" className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
          <option value="cv">Créer ou améliorer mon CV</option>
          <option value="lettre">Créer une lettre de motivation</option>
          <option value="emploi">Trouver un emploi</option>
          <option value="coaching">Réserver un coaching</option>
        </select>
      </label>
      <Consent name="consentPrivacy" required error={state.fieldErrors?.consentPrivacy}>
        J’accepte la{" "}
        <a className="text-bright underline" href="/legal/confidentialite">
          politique de confidentialité
        </a>{" "}
        et les{" "}
        <a className="text-bright underline" href="/legal/conditions">
          conditions d’utilisation
        </a>
        .
      </Consent>
      <Consent name="consentMarketing">
        Je souhaite recevoir des ressources et opportunités CARRIOVA.
      </Consent>
      <Button type="submit" variant="orange" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      {state.message ? (
        <p role="status" className={cn("text-sm", state.ok ? "text-royal" : "text-orange")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAccount, initial);
  return (
    <form action={action} className="grid gap-4">
      <Field name="email" label="E-mail" type="email" required error={state.fieldErrors?.email} />
      <Button type="submit" disabled={pending}>
        {pending ? "Vérification…" : "Continuer"}
      </Button>
      {state.message ? (
        <p role="status" className={cn("text-sm", state.ok ? "text-royal" : "text-orange")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function CoachingForm() {
  const [state, action, pending] = useActionState(submitCoaching, initial);
  return (
    <form action={action} className="relative grid gap-4">
      <Honeypot />
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="firstName" label="Prénom" required error={state.fieldErrors?.firstName} />
        <Field name="lastName" label="Nom" required error={state.fieldErrors?.lastName} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="email" label="E-mail" type="email" required error={state.fieldErrors?.email} />
        <Field
          name="whatsapp"
          label="WhatsApp (optionnel)"
          type="tel"
          autoComplete="tel"
          placeholder="+225 07 00 00 00 00"
          maxLength={20}
        />
      </div>
      <label className="block text-sm font-medium text-night">
        Type de séance
        <select
          name="coachingType"
          required
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="">Choisir</option>
          <option value="individuel">Coaching individuel</option>
          <option value="orientation">Orientation professionnelle</option>
          <option value="employabilite">Employabilité</option>
          <option value="entretien">Préparation aux entretiens</option>
          <option value="positionnement">Positionnement professionnel</option>
          <option value="progression">Progression de carrière</option>
        </select>
        {state.fieldErrors?.coachingType ? (
          <span className="mt-1 block text-xs text-orange">{state.fieldErrors.coachingType}</span>
        ) : null}
      </label>
      <Field name="availability" label="Disponibilités indicatives" placeholder="Ex. mardi matin, jeudi soir" />
      <label className="block text-sm font-medium text-night">
        Contexte
        <textarea
          name="message"
          rows={4}
          maxLength={4000}
          className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm"
        />
      </label>
      <Consent name="consentPrivacy" required error={state.fieldErrors?.consentPrivacy}>
        J’accepte que CARRIOVA traite cette demande selon la{" "}
        <a className="text-bright underline" href="/legal/confidentialite">
          politique de confidentialité
        </a>
        .
      </Consent>
      <Consent name="consentMarketing">
        J’accepte d’être recontacté(e) par e-mail ou WhatsApp au sujet de ma demande (facultatif).
      </Consent>
      <Button type="submit" variant="orange" disabled={pending}>
        {pending ? "Envoi…" : "Réserver une séance"}
      </Button>
      {state.message ? (
        <p role="status" className={cn("text-sm", state.ok ? "text-royal" : "text-orange")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ResourceLeadForm({ resource }: { resource: string }) {
  const [state, action, pending] = useActionState(submitLead, initial);
  return (
    <form action={action} className="relative grid gap-3">
      <Honeypot />
      <input type="hidden" name="type" value="resource" />
      <input type="hidden" name="interest" value={resource} />
      <input type="hidden" name="source" value="resource_gate" />
      <input type="hidden" name="landingPage" value="/ressources" />
      <Field name="firstName" label="Prénom" required error={state.fieldErrors?.firstName} />
      <Field name="email" label="E-mail" type="email" required error={state.fieldErrors?.email} />
      <Consent name="consentPrivacy" required error={state.fieldErrors?.consentPrivacy}>
        J’accepte la{" "}
        <a className="text-bright underline" href="/legal/confidentialite">
          politique de confidentialité
        </a>
        .
      </Consent>
      <Consent name="consentMarketing">Je souhaite recevoir ce guide et d’autres ressources utiles.</Consent>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir la ressource"}
      </Button>
      {state.message ? (
        <p role="status" className={cn("text-sm", state.ok ? "text-royal" : "text-orange")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
