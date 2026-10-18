"use client";

import { useActionState, useEffect, useRef } from "react";
import { activateStaffInvitation } from "@/lib/staff-invite-actions";
import type { ActionState } from "@/lib/actions";

const initialState: ActionState = { ok: false, message: "" };
export function StaffActivationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateStaffInvitation, initialState);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.message) errorRef.current?.focus(); }, [state]);
  return <form action={action} aria-busy={pending} className="mt-7 space-y-5">
    <input type="hidden" name="token" value={token} />
    {state.message ? <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-orange/30 bg-[#fff7f0] p-4 text-xs leading-6 text-orange outline-none">{state.message}</div> : null}
    <fieldset disabled={pending} className="space-y-5">
      <label className="block text-xs font-semibold text-night">Votre mot de passe<input name="password" type="password" autoComplete="new-password" required minLength={15} maxLength={256} aria-invalid={state.fieldErrors?.password ? true : undefined} aria-describedby={state.fieldErrors?.password ? "activation-password-error activation-password-help" : "activation-password-help"} className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-4 text-sm font-normal" /><span id="activation-password-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">Au moins 15 caractères. Vous pouvez utiliser une phrase facile à retenir.</span>{state.fieldErrors?.password ? <span id="activation-password-error" className="mt-2 block text-xs font-normal text-orange">{state.fieldErrors.password}</span> : null}</label>
      <label className="block text-xs font-semibold text-night">Confirmer le mot de passe<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={15} maxLength={256} aria-invalid={state.fieldErrors?.confirmPassword ? true : undefined} aria-describedby={state.fieldErrors?.confirmPassword ? "activation-confirm-error" : undefined} className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-4 text-sm font-normal" />{state.fieldErrors?.confirmPassword ? <span id="activation-confirm-error" className="mt-2 block text-xs font-normal text-orange">{state.fieldErrors.confirmPassword}</span> : null}</label>
    </fieldset>
    <button type="submit" disabled={pending} className="flex min-h-12 w-full items-center justify-between gap-4 rounded-lg bg-orange px-5 py-3 text-sm font-semibold text-white hover:bg-[#9e3708] disabled:cursor-wait disabled:opacity-60">{pending ? "Activation…" : "Activer mon accès équipe"}<span aria-hidden="true">→</span></button>
    <p className="text-[11px] leading-6 text-muted">Après l’activation, connectez-vous avec l’adresse qui a reçu l’invitation et ce mot de passe.</p>
  </form>;
}
