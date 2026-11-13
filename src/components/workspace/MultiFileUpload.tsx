"use client";

import { useId, useRef, useState, useTransition, type DragEvent } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import type { ActionState } from "@/lib/actions";
import { uploadRequestFile } from "@/lib/workspace-actions";
import { WORKSPACE_FILE_ACCEPT, WORKSPACE_MAX_FILE_BYTES } from "@/lib/workspace";

type ItemStatus = "ready" | "uploading" | "done" | "error";
type Item = { key: string; file: File; status: ItemStatus; message?: string };
const extensions = WORKSPACE_FILE_ACCEPT.split(",");
const size = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
function precheck(file: File) {
  const name = file.name.toLowerCase();
  if (!extensions.some((extension) => name.endsWith(extension))) return "Format non accepté (PDF, DOCX, JPG ou PNG).";
  if (file.size > WORKSPACE_MAX_FILE_BYTES) return "Fichier trop lourd (3 Mo maximum).";
  if (file.size === 0) return "Fichier vide.";
  return undefined;
}

/**
 * Select or drop several files and upload them one by one with the existing server action,
 * so every file keeps the same server-side checks. Versioned kinds advance the version after each file.
 */
export function MultiFileUpload({ fields, version, remaining, label, buttonLabel, disabled = false, tone = "light", onStart, onFinish, onFileUploaded }: {
  fields: { context: "team" | "customer"; requestId: number; kind: "brief" | "review" | "delivery" };
  version?: number; remaining: number; label: string; buttonLabel: string; disabled?: boolean; tone?: "light" | "paper";
  onStart?: () => void; onFinish?: () => void; onFileUploaded?: (versionUsed: number | undefined, result: ActionState) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const queued = items.filter((item) => item.status === "ready" && !item.message);
  const busy = pending || disabled;

  function add(list: FileList | File[]) {
    const incoming = Array.from(list);
    setNotice("");
    setItems((current) => {
      const kept = current.filter((item) => item.status !== "done");
      const free = Math.max(0, remaining - kept.filter((item) => !item.message).length);
      const next = incoming.map((file, index) => {
        const problem = precheck(file);
        return { key: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`, file, status: problem ? "error" as const : "ready" as const, message: problem };
      });
      const valid = next.filter((item) => !item.message);
      if (valid.length > free) setNotice(`Il reste ${free} emplacement${free > 1 ? "s" : ""} : seuls les ${free} premiers fichiers valides sont retenus.`);
      let slots = free;
      return [...kept, ...next.filter((item) => item.message || slots-- > 0)];
    });
    if (inputRef.current) inputRef.current.value = "";
  }
  function remove(key: string) { setItems((current) => current.filter((item) => item.key !== key)); }
  function drop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); setDragging(false); if (!busy && event.dataTransfer.files.length) add(event.dataTransfer.files); }

  function upload() {
    const batch = queued;
    if (!batch.length) return;
    onStart?.();
    startTransition(async () => {
      let currentVersion = version;
      let succeeded = 0;
      for (const item of batch) {
        setItems((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: "uploading" } : entry));
        const data = new FormData();
        data.set("context", fields.context); data.set("requestId", String(fields.requestId)); data.set("kind", fields.kind);
        if (currentVersion !== undefined) data.set("version", String(currentVersion));
        data.set("file", item.file);
        let result: ActionState;
        try { result = await uploadRequestFile({ ok: false, message: "" }, data); }
        catch { result = { ok: false, message: "Envoi interrompu. Vérifiez votre connexion et réessayez." }; }
        if (result.ok) { succeeded += 1; onFileUploaded?.(currentVersion, result); if (currentVersion !== undefined) currentVersion += 1; }
        setItems((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: result.ok ? "done" : "error", message: result.ok ? undefined : result.fieldErrors?.file ?? result.message } : entry));
        // A stale version means someone else changed the order: stop and let the page refresh.
        if (!result.ok && currentVersion !== undefined) break;
      }
      const failed = batch.length - succeeded;
      setNotice(succeeded ? `${succeeded} fichier${succeeded > 1 ? "s" : ""} ajouté${succeeded > 1 ? "s" : ""}${failed ? `, ${failed} non envoyé${failed > 1 ? "s" : ""} (voir ci-dessous)` : "."}` : "Aucun fichier n’a pu être envoyé.");
      onFinish?.();
    });
  }

  const full = remaining <= 0;
  return <div className="space-y-3">
    <label htmlFor={id} onDragOver={(event) => { event.preventDefault(); if (!busy && !full) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-7 text-center transition-colors ${busy || full ? "cursor-not-allowed opacity-60" : ""} ${dragging ? "border-orange bg-[#fff4ea]" : `border-night/15 ${tone === "paper" ? "bg-paper" : "bg-white"} hover:border-night/40`}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-night/[0.05] text-night"><CareerIcon name="document" className="h-5 w-5" /></span>
      <span className="text-sm font-semibold text-night">{label}</span>
      <span className="text-[11px] leading-5 text-muted">Glissez vos fichiers ici ou <span className="font-semibold text-orange underline underline-offset-2">parcourez</span> · plusieurs fichiers possibles</span>
      <span className="text-[10px] leading-5 text-muted">PDF, DOCX, JPG ou PNG · 3 Mo maximum par fichier · {Math.max(0, remaining)} emplacement{remaining > 1 ? "s" : ""} libre{remaining > 1 ? "s" : ""}</span>
      <input ref={inputRef} id={id} type="file" multiple accept={WORKSPACE_FILE_ACCEPT} disabled={busy || full} onChange={(event) => event.target.files && add(event.target.files)} className="sr-only" />
    </label>
    {items.length ? <ul className="divide-y divide-night/[0.06] rounded-xl border border-night/[0.08] bg-white" aria-label="Fichiers sélectionnés">{items.map((item) => <li key={item.key} className="flex items-center gap-3 px-3 py-2.5 text-xs">
      <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold uppercase ${item.status === "done" ? "bg-[#edf6f0] text-[#285236]" : item.status === "error" ? "bg-[#fbeeee] text-[#8a3a33]" : "bg-paper text-night"}`}>{item.status === "done" ? "✓" : item.status === "error" ? "!" : item.file.name.split(".").pop()?.slice(0, 4)}</span>
      <div className="min-w-0 flex-1"><p className="truncate font-medium text-night">{item.file.name}</p><p className={`text-[10px] ${item.status === "error" ? "text-[#8a3a33]" : "text-muted"}`}>{item.message ?? (item.status === "uploading" ? "Envoi en cours…" : item.status === "done" ? "Ajouté" : size(item.file.size))}</p></div>
      {item.status === "uploading" ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-night/20 border-t-night" /> : item.status !== "done" && !pending ? <button type="button" onClick={() => remove(item.key)} className="min-h-8 rounded-md px-2 text-[11px] text-muted hover:bg-paper hover:text-night" aria-label={`Retirer ${item.file.name}`}>Retirer</button> : null}
    </li>)}</ul> : null}
    {notice ? <p role="status" className="text-xs leading-5 text-night">{notice}</p> : null}
    <button type="button" onClick={upload} disabled={busy || !queued.length} className="inline-flex min-h-12 w-full items-center justify-between gap-4 rounded-xl bg-night px-5 text-sm font-semibold text-white transition hover:bg-royal disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Envoi en cours…" : queued.length > 1 ? `${buttonLabel} (${queued.length} fichiers)` : buttonLabel}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" />
    </button>
  </div>;
}
