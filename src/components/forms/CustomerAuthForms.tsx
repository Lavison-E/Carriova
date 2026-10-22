"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { customerSignup, customerLogin, customerChangePassword, customerRequestReset, customerResetPassword } from "@/lib/customer-actions";
import { WhatsAppField } from "@/components/forms/WhatsAppField";
import type { ActionState } from "@/lib/actions";
import { CareerIcon } from "@/components/brand/CareerIcon";

const initial: ActionState = { ok: false, message: "" };
type Mode = "signup" | "login" | "changePassword" | "requestReset" | "resetPassword";
const actions = { signup: customerSignup, login: customerLogin, changePassword: customerChangePassword, requestReset: customerRequestReset, resetPassword: customerResetPassword };

function AuthField({ name, label, type = "text", autoComplete, minLength, error, help }: { name: string; label: string; type?: string; autoComplete?: string; minLength?: number; error?: string; help?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return <div><label htmlFor={id} className="text-xs font-semibold text-night">{label}</label><div className="relative mt-2"><input id={id} name={name} required type={password && visible ? "text" : type} autoComplete={autoComplete} minLength={minLength} maxLength={password ? 256 : name === "name" ? 120 : 255} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined} className={`h-12 w-full rounded-lg border border-line bg-white px-3 text-sm text-night focus:border-night ${password ? "pr-20" : ""}`} />{password ? <button type="button" onClick={() => setVisible((value) => !value)} aria-label={`${visible ? "Masquer" : "Afficher"} ${label.toLocaleLowerCase("fr")}`} aria-pressed={visible} className="absolute inset-y-0 right-0 min-w-16 px-3 text-[10px] font-medium text-muted hover:text-night">{visible ? "Masquer" : "Afficher"}</button> : null}</div>{help ? <p id={`${id}-help`} className="mt-2 text-[11px] leading-5 text-muted">{help}</p> : null}{error ? <p id={`${id}-error`} className="mt-2 text-xs leading-5 text-orange">{error}</p> : null}</div>;
}

function AuthForm({ mode, token }: { mode: Mode; token?: string }) {
  const [state, action, pending] = useActionState(actions[mode], initial);
  const [response, setResponse] = useState({ state, revision: 0 });
  const feedbackRef = useRef<HTMLDivElement>(null);
  const privacyId = useId();
  if (response.state !== state) setResponse({ state, revision: response.revision + (state.ok ? 1 : 0) });
  useEffect(() => { if (state.message) feedbackRef.current?.focus(); }, [state]);
  const passwordHelp = "Au moins 8 caractères. Vous pouvez choisir une phrase facile à retenir.";
  const completeReset = mode === "resetPassword" && state.ok;
  const title = { signup: "Créer mon espace", login: "Me connecter", changePassword: "Modifier mon mot de passe", requestReset: "Recevoir un lien de réinitialisation", resetPassword: "Enregistrer mon mot de passe" }[mode];

  return <div>
    {state.message ? <div ref={feedbackRef} tabIndex={-1} role="status" className={`mb-6 scroll-mt-24 rounded-lg border p-4 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div> : null}
    {completeReset ? <Link href="/compte/connexion" className="inline-flex min-h-12 items-center gap-5 rounded-lg bg-night px-5 text-sm font-semibold text-white">Me connecter <CareerIcon name="arrow" className="h-4 w-4" /></Link> : <form key={response.revision} action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="space-y-5">
      {token ? <input type="hidden" name="token" value={token} /> : null}
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        {mode === "signup" ? <AuthField name="name" label="Nom et prénom" autoComplete="name" error={state.fieldErrors?.name} /> : null}
        {["signup", "login", "requestReset"].includes(mode) ? <AuthField name="email" label="Adresse e-mail" type="email" autoComplete={mode === "login" ? "username" : "email"} error={state.fieldErrors?.email} /> : null}
        {mode === "signup" ? <WhatsAppField error={state.fieldErrors?.whatsapp} /> : null}
        {mode === "changePassword" ? <AuthField name="currentPassword" label="Mot de passe actuel" type="password" autoComplete="current-password" error={state.fieldErrors?.currentPassword} /> : null}
        {mode !== "requestReset" ? <AuthField name={mode === "changePassword" ? "newPassword" : "password"} label={mode === "changePassword" || mode === "resetPassword" ? "Nouveau mot de passe" : "Mot de passe"} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 8} help={mode === "login" ? undefined : passwordHelp} error={state.fieldErrors?.[mode === "changePassword" ? "newPassword" : "password"]} /> : null}
        {["signup", "changePassword", "resetPassword"].includes(mode) ? <AuthField name="confirmPassword" label="Confirmer le mot de passe" type="password" autoComplete="new-password" minLength={8} error={state.fieldErrors?.confirmPassword} /> : null}
        {mode === "signup" ? <div className="space-y-4 border-t border-line pt-5"><label className="flex items-start gap-3 text-[11px] leading-6 text-muted"><input type="checkbox" name="consentPrivacy" required aria-invalid={state.fieldErrors?.consentPrivacy ? true : undefined} aria-describedby={state.fieldErrors?.consentPrivacy ? privacyId : undefined} className="mt-1 h-4 w-4 shrink-0 accent-night" /><span>J’accepte les <Link href="/legal/conditions" target="_blank" rel="noopener noreferrer" className="text-night underline underline-offset-4">conditions d’utilisation</Link> et la <Link href="/legal/confidentialite" target="_blank" rel="noopener noreferrer" className="text-night underline underline-offset-4">politique de confidentialité</Link>. <span aria-hidden="true" className="text-orange">*</span></span></label>{state.fieldErrors?.consentPrivacy ? <p id={privacyId} className="text-xs text-orange">{state.fieldErrors.consentPrivacy}</p> : null}<label className="flex items-start gap-3 text-[11px] leading-6 text-muted"><input type="checkbox" name="consentMarketing" className="mt-1 h-4 w-4 shrink-0 accent-night" /><span>Je souhaite recevoir les conseils et actualités de CARRIOVA. <span className="font-medium">Facultatif.</span></span></label></div> : null}
      </fieldset>
      {mode === "login" ? <div className="text-right"><Link href="/compte/recuperer" className="inline-flex min-h-9 items-center text-xs font-medium text-night underline decoration-line underline-offset-4">Mot de passe oublié ?</Link></div> : null}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-between gap-5 rounded-lg bg-orange px-5 py-3 text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60">{pending ? "Veuillez patienter…" : title}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></button>
    </form>}
  </div>;
}

export function CustomerSignupForm() { return <AuthForm mode="signup" />; }
export function CustomerLoginForm() { return <AuthForm mode="login" />; }
export function CustomerPasswordForm() { return <AuthForm mode="changePassword" />; }
export function CustomerRecoveryForm({ token }: { token?: string }) { return <AuthForm mode={token ? "resetPassword" : "requestReset"} token={token} />; }
