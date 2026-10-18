"use client";

import { useActionState } from "react";
import { retryWorkspaceNotifications } from "@/lib/workspace-notification-actions";

export function NotificationRetry({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(retryWorkspaceNotifications, { ok: false, message: "" });
  return <form action={action} className="space-y-3">
    <button type="submit" disabled={pending || !configured} className="min-h-11 rounded-lg bg-night px-5 text-sm font-semibold text-white hover:bg-royal disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Relance en cours…" : "Réessayer les notifications en attente"}</button>
    {state.message ? <p role="status" className="max-w-2xl text-sm leading-6 text-muted">{state.message}</p> : null}
  </form>;
}
