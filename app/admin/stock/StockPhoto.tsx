"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJSON } from "../../lib/clientFetch";
import shared from "../admin.module.css";
import styles from "./stockPhoto.module.css";
import { prepareStockPhoto, stockPhotoAccept } from "./stockPhotoClient";

const copy = {
  en: {
    manage: "Product photo", add: "Add photo", replace: "Replace photo", remove: "Remove photo", close: "Close",
    saved: "Photo saved.", removed: "Photo removed.", saving: "Saving photo…",
    unavailable: "Could not access the photo. Try again.", invalid: "Choose a JPG, PNG, WebP or AVIF image. If your phone’s HEIC photo cannot be opened, export it as JPG.",
    tooLarge: "That photo is too large. Choose an image under 20 MB.",
    migration: "Product photos are not set up in this database yet.",
  },
  nl: {
    manage: "Productfoto", add: "Foto toevoegen", replace: "Foto vervangen", remove: "Foto verwijderen", close: "Sluiten",
    saved: "Foto opgeslagen.", removed: "Foto verwijderd.", saving: "Foto opslaan…",
    unavailable: "De foto is niet beschikbaar. Probeer het opnieuw.", invalid: "Kies een JPG-, PNG-, WebP- of AVIF-afbeelding. Sla een HEIC-foto die niet opent eerst op als JPG.",
    tooLarge: "Deze foto is te groot. Kies een afbeelding kleiner dan 20 MB.",
    migration: "Productfoto’s zijn nog niet ingesteld in deze database.",
  },
};

type Lang = "en" | "nl";
type Index = Record<string, string>;
const endpoint = "/api/admin/stock/photos";

export function useStockPhotos() {
  const [versions, setVersions] = useState<Index>({});
  const [indexReady, setIndexReady] = useState(false);
  const [indexError, setIndexError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const { response, data } = await fetchJSON<{ photos?: { id: string; version: string }[]; error?: string }>(
          endpoint, { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok || !data.photos) setIndexError(data.error ?? "unavailable");
        else setVersions(Object.fromEntries(data.photos.map(photo => [photo.id, photo.version])));
      } catch {
        if (!controller.signal.aborted) setIndexError("unavailable");
      } finally {
        if (!controller.signal.aborted) setIndexReady(true);
      }
    })();
    return () => controller.abort();
  }, []);
  function update(id: string, version: string | null) {
    setVersions(current => {
      if (version) return { ...current, [id]: version };
      const next = { ...current };
      delete next[id];
      return next;
    });
  }
  return { versions, update, indexReady, indexError };
}

function PhotoIcon() {
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="8.5" cy="9.5" r="1.25" />
    <path d="m4 17 4.3-3.7 3.1 2.5 3.7-4.1 5.8 5.1" />
  </svg>;
}

export function StockPhoto({ id, name, version, lang, disabled, indexError, onChange }: {
  id: string; name: string; version?: string; lang: Lang; disabled?: boolean; indexError: string;
  onChange: (id: string, version: string | null) => void;
}) {
  const labels = copy[lang];
  const url = endpoint + "/" + encodeURIComponent(id);
  const dialog = useRef<HTMLDialogElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [brokenVersion, setBrokenVersion] = useState("");
  const errorText = (code: string) => code === "too_large" ? labels.tooLarge : code === "invalid_image" ? labels.invalid :
    code === "migration_required" ? labels.migration : labels.unavailable;

  async function change(file?: File) {
    setFailure("");
    setNotice("");
    setBusy(true);
    try {
      let body: Blob | undefined;
      if (file) {
        try { body = await prepareStockPhoto(file); }
        catch (error) { setFailure(error instanceof Error && error.message === "too_large" ? "too_large" : "invalid_image"); return; }
      }
      const { response, data } = await fetchJSON<{ version?: string; removed?: boolean; error?: string }>(
        url, file && body ? { method: "PUT", headers: { "Content-Type": body.type }, body } : { method: "DELETE" },
      );
      if (!response.ok || (file ? !data.version : !data.removed)) {
        setFailure(data.error ?? "unavailable");
        return;
      }
      onChange(id, data.version ?? null);
      setNotice(file ? labels.saved : labels.removed);
      dialog.current?.close();
    } catch { setFailure("unavailable"); }
    finally { setBusy(false); }
  }

  return <>
    <button type="button" className={styles.thumb} disabled={disabled}
      aria-label={labels.manage + ": " + name} title={labels.manage + ": " + name}
      aria-haspopup="dialog" onClick={() => { setFailure(""); setNotice(""); dialog.current?.showModal(); }}>
      {version && version !== brokenVersion ? (
        // This authenticated endpoint already delivers a tiny, optimized WebP.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url + "?v=" + encodeURIComponent(version)} alt="" width="48" height="48" loading="lazy" decoding="async"
          onError={() => setBrokenVersion(version)} />
      ) : <PhotoIcon />}
    </button>
    <dialog ref={dialog} className={styles.dialog} aria-label={labels.manage + ": " + name}
      onCancel={event => { if (busy) event.preventDefault(); }}>
      <strong>{labels.manage}</strong>
      <p className={shared.muted}>{name}</p>
      <input type="file" ref={chooser} hidden accept={stockPhotoAccept} onChange={event => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (file) void change(file);
      }} />
      {(failure || indexError) && <p className={styles.error} role="alert">{errorText(failure || indexError)}</p>}
      <div className={styles.actions}>
        <button autoFocus className={shared.button + " " + shared.primary} type="button" disabled={busy}
          onClick={() => chooser.current?.click()}>{version ? labels.replace : labels.add}</button>
        {version && <button type="button" className={shared.button} disabled={busy}
          onClick={() => void change()}>{labels.remove}</button>}
        <button type="button" className={shared.button} disabled={busy} onClick={() => dialog.current?.close()}>{labels.close}</button>
      </div>
      {busy && <p role="status">{labels.saving}</p>}
    </dialog>
    <span role="status" className={styles.visuallyHidden}>{notice}</span>
  </>;
}
