"use client";

import { useRef, useState, type FormEvent } from "react";
import { FaCircleCheck, FaPen, FaSpinner, FaXmark } from "react-icons/fa6";
import { useLang } from "../providers";

export function BrandNameEditor({ brandId, name, onSaved }: { brandId: string; name: string; onSaved: () => Promise<void> }) {
  const { t, lang } = useLang();
  const [draft, setDraft] = useState<{ name: string; expectedName: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const label = lang === "nl" ? `Naam wijzigen: ${name}` : `Rename restaurant: ${name}`;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft?.name.trim() || busy.current) return;
    if (draft.name.trim() === draft.expectedName) { setDraft(null); return; }
    busy.current = true; setSaving(true); setError("");
    try {
      const response = await fetch("/api/brands/name", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandId, name: draft.name.trim(), expectedName: draft.expectedName }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setError(result?.error === "brandExists" ? t.admin.brandExists : result?.error === "stale" ? (lang === "nl" ? "De naam is intussen gewijzigd. Annuleer en open opnieuw." : "The name has changed. Cancel and open the editor again.") : t.admin.saveFailed);
        return;
      }
      await onSaved(); setDraft(null);
    } catch { setError(t.admin.saveFailed); }
    finally { busy.current = false; setSaving(false); }
  }

  if (!draft) return <button type="button" aria-label={label} title={label} onClick={() => { setDraft({ name, expectedName: name }); setError(""); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-600"><FaPen className="text-sm" /></button>;

  return <form onSubmit={save} aria-label={label} className="order-last w-full space-y-2 border-t border-slate-200 pt-2.5 dark:border-white/10">
    <div className="flex items-center gap-2">
      <label className="min-w-0 flex-1"><span className="sr-only">{t.admin.restaurantName}</span><input autoFocus required maxLength={60} value={draft.name} disabled={saving} onChange={event => setDraft({ ...draft, name: event.target.value })} onKeyDown={event => { if (event.key === "Escape" && !busy.current) setDraft(null); }} className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-white/20 dark:bg-white/10 dark:text-white" /></label>
      <button type="submit" disabled={!draft.name.trim() || saving} aria-label={t.common.saveChanges} title={t.common.saveChanges} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">{saving ? <FaSpinner className="animate-spin" /> : <FaCircleCheck />}</button>
      <button type="button" disabled={saving} onClick={() => setDraft(null)} aria-label={t.common.cancel} title={t.common.cancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"><FaXmark /></button>
    </div>
    {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
  </form>;
}
