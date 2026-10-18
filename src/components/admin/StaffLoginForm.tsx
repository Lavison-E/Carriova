"use client";
import { useActionState } from "react";
import { staffLogin } from "@/lib/staff-actions";
import { Button } from "@/components/ui/primitives";

export function StaffLoginForm() {
  const [state, action, pending] = useActionState(staffLogin, { ok: false, message: "" });
  return <form action={action} className="mt-8 space-y-5">
    <label className="block text-sm font-semibold text-night">E-mail professionnel<input name="email" type="email" autoComplete="username" required maxLength={255} className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-4 font-normal" /></label>
    <label className="block text-sm font-semibold text-night">Mot de passe<input name="password" type="password" autoComplete="current-password" required maxLength={256} className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-4 font-normal" /></label>
    {state.message ? <p role="alert" className="rounded-lg bg-[#fff1e9] p-4 text-sm leading-6 text-[#9e3708]">{state.message}</p> : null}
    <Button type="submit" variant="orange" disabled={pending} className="w-full">{pending ? "Connexion en cours…" : "Accéder au CRM"} <span aria-hidden="true">→</span></Button>
    <p className="text-xs leading-6 text-muted">Accès réservé aux membres autorisés de l’équipe. Pour obtenir un accès ou réinitialiser votre mot de passe, contactez votre administrateur.</p>
  </form>;
}
