"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../providers";
import { FaImage, FaPlus, FaTrash, FaSpinner, FaCircleCheck, FaCircleExclamation, FaXmark } from "react-icons/fa6";
import { WorkspaceDialog } from "../components/WorkspaceDialog";
import { fetchJSON } from "../lib/clientFetch";
import adminStyles from "./admin.module.css";
import { processImageFile } from "./adminImage";
type SaveState = { status: "idle" | "saving" | "success" | "error"; message?: string };

type AdminGalleryImage = {
  id: string;
  url: string;
  alt: string;
  altNl: string;
  category: string;
  portrait: boolean;
  createdAt: number;
};

/** Upload, list and delete the photos shown on /events/gallery. */
export default function GalleryManager() {
  const { lang } = useLang();
  const nl = lang === "nl";
  const [images, setImages] = useState<AdminGalleryImage[]>([]);
  const [draft, setDraft] = useState({ image: "", alt: "", altNl: "", category: "ambiance", portrait: false });
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminGalleryImage>();
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(false), [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    void fetchJSON<{ ok: boolean; images: AdminGalleryImage[] }>("/api/gallery", { cache: "no-store", signal: controller.signal }).then(({ response, data }) => {
      if (!response.ok || !data?.ok || !Array.isArray(data.images)) throw new Error("load");
      if (mounted) { setImages(data.images); setLoadError(false); }
    }).catch(() => { if (mounted) setLoadError(true); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; controller.abort(); };
  }, [loadVersion]);

  const catLabel = (key: string): string =>
    (
      {
        dishes: nl ? "Gerechten" : "Dishes",
        interior: nl ? "Interieur" : "Interior",
        bar: nl ? "Bar & Drankjes" : "Bar & Drinks",
        ambiance: nl ? "Sfeer" : "Ambiance",
      } as Record<string, string>
    )[key] ?? key;

  const onPick = async (file?: File) => {
    if (!file) return;
    try {
      const image = await processImageFile(file, { maxDim: 1600 });
      setDraft((d) => ({ ...d, image }));
      setState({ status: "idle" });
    } catch {
      if (pickRef.current) pickRef.current.value = "";
      setState({ status: "error", message: nl ? "Kon de foto niet lezen." : "Could not read the photo." });
    }
  };

  const upload = async () => {
    if (!draft.image || state.status === "saving") return;
    setState({ status: "saving" });
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.image) throw new Error(data.error || "error");
      setImages((list) => [data.image, ...list]);
      setDraft({ image: "", alt: "", altNl: "", category: "ambiance", portrait: false });
      if (pickRef.current) pickRef.current.value = "";
      setState({ status: "success", message: nl ? "Foto toegevoegd aan de galerij." : "Photo added to the gallery." });
      setTimeout(() => setState((s) => (s.status === "success" ? { status: "idle" } : s)), 4000);
    } catch {
      setState({ status: "error", message: nl ? "Uploaden mislukt. Probeer het opnieuw." : "Upload failed. Please try again." });
    }
  };

  const remove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { response, data } = await fetchJSON<{ ok: boolean }>(`/api/gallery?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok || !data?.ok) throw new Error("delete");
      setImages(list => list.filter(image => image.id !== id));
      setConfirmDelete(undefined);
      setState({ status: "success", message: nl ? "Foto verwijderd." : "Photo deleted." });
    } catch {
      setState({ status: "error", message: nl ? "Verwijderen mislukt. De foto blijft zichtbaar." : "Deletion failed. The photo remains visible." });
    } finally { setDeletingId(null); }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <FaImage className="text-emerald-600 dark:text-emerald-400" /> {nl ? "Galerij" : "Gallery"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {nl
              ? "Beheer de foto's op de openbare galerijpagina. Foto's worden opgeslagen in DigitalOcean Spaces."
              : "Manage the photos on the public gallery page. Photos are stored in DigitalOcean Spaces."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {loading || loadError ? "—" : images.length}
        </span>
      </div>

      {loading && <p role="status">{nl ? "Foto's laden." : "Loading photos."}</p>}
      {loadError && <div role="alert" className={adminStyles.notice}>{nl ? "Foto's konden niet worden geladen. Dit betekent niet dat de galerij leeg is." : "Photos could not be loaded. This does not mean the gallery is empty."}<button type="button" className={adminStyles.button} onClick={() => { setLoading(true); setLoadVersion(value => value + 1); }}>{nl ? "Opnieuw proberen" : "Try again"}</button></div>}
      {/* Upload form */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => pickRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:text-slate-300"
          >
            <FaPlus /> {nl ? "Foto kiezen" : "Choose photo"}
          </button>
          {draft.image && (
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <Image src={draft.image} alt="preview" fill sizes="48px" className="object-cover" />
              <button
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, image: "" }));
                  if (pickRef.current) pickRef.current.value = "";
                }}
                className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl-lg bg-black/60 text-[10px] text-white transition hover:bg-red-600"
                aria-label="remove"
              >
                <FaXmark />
              </button>
            </span>
          )}
          <input ref={pickRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            aria-label={nl ? "Beschrijving (Engels)" : "Description (English)"}
            value={draft.alt}
            onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
            placeholder={nl ? "Beschrijving (Engels)" : "Description (English)"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
          <input
            aria-label={nl ? "Beschrijving (Nederlands)" : "Description (Dutch)"}
            value={draft.altNl}
            onChange={(e) => setDraft({ ...draft, altNl: e.target.value })}
            placeholder={nl ? "Beschrijving (Nederlands)" : "Description (Dutch)"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            aria-label={nl ? "Categorie" : "Category"}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            {["ambiance", "dishes", "interior", "bar"].map((c) => (
              <option key={c} value={c}>
                {catLabel(c)}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={draft.portrait}
              onChange={(e) => setDraft({ ...draft, portrait: e.target.checked })}
              className="h-4 w-4 accent-emerald-600"
            />
            {nl ? "Staande foto (portret)" : "Portrait photo (tall)"}
          </label>
        </div>

        {state.status === "error" && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <FaCircleExclamation className="mt-0.5 shrink-0" /> {state.message}
          </p>
        )}
        {state.status === "success" && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <FaCircleCheck className="shrink-0" /> {state.message}
          </p>
        )}

        <button
          onClick={upload}
          disabled={!draft.image || state.status === "saving"}
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "saving" ? (
            <span className="inline-flex items-center gap-2">
              <FaSpinner className="animate-spin" /> {nl ? "Uploaden…" : "Uploading…"}
            </span>
          ) : nl ? (
            "Toevoegen aan galerij"
          ) : (
            "Add to gallery"
          )}
        </button>
      </div>

      {/* Existing photos */}
      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-black/20">
                <Image src={img.url} alt={img.alt || "gallery"} fill sizes="200px" className="object-cover" />
              </div>
              <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                {catLabel(img.category)}
              </span>
              <button
                onClick={() => { setState({ status: "idle" }); setConfirmDelete(img); }}
                disabled={deletingId === img.id}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-xs text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-60"
                aria-label={nl ? "Verwijderen" : "Delete"}
                title={nl ? "Verwijderen" : "Delete"}
              >
                {deletingId === img.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              </button>
            </div>
          ))}
        </div>
      )}
      {confirmDelete && <WorkspaceDialog titleId="gallery-delete-title" onClose={() => { if (!deletingId) setConfirmDelete(undefined); }}><div className={adminStyles.dialogBody}><h2 id="gallery-delete-title">{nl ? "Foto verwijderen?" : "Delete photo?"}</h2><p>{nl ? "Dit verwijdert de foto uit de openbare galerij en de opgeslagen upload." : "This removes the photo from the public gallery and deletes the stored upload."}</p><p>{confirmDelete.alt || confirmDelete.altNl || catLabel(confirmDelete.category)}</p>{state.status === "error" && <p role="alert" className={adminStyles.error}>{state.message}</p>}<div className={adminStyles.actions}><button type="button" className={adminStyles.button} disabled={!!deletingId} onClick={() => setConfirmDelete(undefined)}>{nl ? "Annuleren" : "Cancel"}</button><button type="button" className={adminStyles.button} disabled={!!deletingId} onClick={() => void remove(confirmDelete.id)}>{deletingId ? (nl ? "Verwijderen." : "Deleting.") : (nl ? "Verwijderen" : "Delete")}</button></div></div></WorkspaceDialog>}
    </div>
  );
}
