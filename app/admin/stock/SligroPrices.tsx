"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJSON } from "../../lib/clientFetch";
import { normalizeStockSligroLink, type StockItem } from "../../lib/stock";
import { sligroBatches, sligroReviewBatch, type SligroProduct, type SligroUpdateRow } from "../../lib/stockSligro";
import shared from "../admin.module.css";
import styles from "./stock.module.css";

const copy = {
  en: {
    button: "Refresh Sligro prices", cancel: "Cancel", confirm: "Save reviewed prices", noLinks: "Add a Sligro product link to an active item first.",
    partial: "The check stopped early. You can review the prices it verified.", review: "Review Sligro price changes",
    waitingLogin: "Sign in on the official Sligro tab to continue.", reading: "Checking Sligro prices…",
    extension: "The Shah Chrome extension did not respond. Enable it, reload this page and try again.",
    expired: "Price check timed out. Try again.", noRows: "No verified prices were returned. Nothing was changed.",
    skipped: "products were not verified and will keep their old prices.", unchanged: "No changes needed.",
    previous: "Current", updated: "Sligro", regular: "Regular", offer: "Offer", pack: "Pack", dates: "Offer dates",
    saving: "Saving…", saved: "Prices saved:", conflicts: "were not saved because the item changed or was archived.",
    failed: "Saving stopped. Try again to save the remaining prices.", empty: "Not set", warning: "Only purchase prices are updated. No orders are placed.",
  },
  nl: {
    button: "Sligro-prijzen verversen", cancel: "Annuleren", confirm: "Gecontroleerde prijzen opslaan", noLinks: "Voeg eerst een Sligro-productlink toe aan een actief product.",
    partial: "De controle is voortijdig gestopt. Je kunt de gecontroleerde prijzen nog bekijken.", review: "Sligro-prijswijzigingen controleren",
    waitingLogin: "Log in op het officiële Sligro-tabblad om door te gaan.", reading: "Sligro-prijzen controleren…",
    extension: "De Shah Chrome-extensie reageert niet. Schakel de extensie in, vernieuw deze pagina en probeer opnieuw.",
    expired: "De prijscontrole duurde te lang. Probeer het opnieuw.", noRows: "Geen bevestigde prijzen gevonden. Er is niets gewijzigd.",
    skipped: "producten konden niet worden gecontroleerd en behouden hun oude prijs.", unchanged: "Geen wijzigingen nodig.",
    previous: "Huidig", updated: "Sligro", regular: "Normaal", offer: "Actie", pack: "Verpakking", dates: "Actieperiode",
    saving: "Opslaan…", saved: "Prijzen opgeslagen:", conflicts: "zijn niet opgeslagen omdat het product is gewijzigd of gearchiveerd.",
    failed: "Het opslaan is gestopt. Probeer het opnieuw om de resterende prijzen op te slaan.", empty: "Niet ingesteld", warning: "Alleen inkoopprijzen worden gewijzigd. Er wordt niets besteld.",
  },
};

type Batch = { requestId: string; products: SligroProduct[]; ack: number; deadline: number };
type Job = {
  batch: Batch | null;
  rows: SligroUpdateRow[];
  completed: number;
  total: number;
  next: () => void;
  interrupted: () => void;
  finish: (message?: string) => void;
};
type Review = { rows: SligroUpdateRow[]; skipped: number };

export default function SligroPrices({ items, disabled, lang, onSaved }: {
  items: StockItem[]; disabled: boolean; lang: "en" | "nl"; onSaved: (items: StockItem[]) => void;
}) {
  const labels = copy[lang];
  const [status, setStatus] = useState<"reading" | "waitingLogin" | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const job = useRef<Job | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    function receive(event: MessageEvent) {
      const current = job.current;
      const batch = current?.batch;
      const data = event.data;
      if (!current || !batch || event.origin !== location.origin || event.source !== window ||
        !data || typeof data !== "object" || data.source !== "shah-sligro-extension" || data.requestId !== batch.requestId) return;
      if (data.type === "SLIGRO_PRICE_PREVIEW_PROGRESS") {
        if (data.state !== "waiting-login" && data.state !== "reading") return;
        window.clearTimeout(batch.ack);
        setStatus(data.state === "waiting-login" ? "waitingLogin" : "reading");
        const done = Number.isSafeInteger(data.completed) && data.completed >= 0 && data.completed <= batch.products.length ? data.completed : 0;
        const completed = current.completed + done;
        setProgress(previous => previous.completed < completed ? { completed, total: current.total } : previous);
      } else if (data.type === "SLIGRO_PRICE_PREVIEW_RESULT") {
        const result = sligroReviewBatch(data, batch.products, batch.requestId);
        if (!result) return;
        stop(batch);
        current.batch = null;
        current.rows.push(...result.rows);
        current.completed += batch.products.length;
        if (result.interrupted) current.interrupted();
        else current.next();
      }
    }
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      if (job.current?.batch) stop(job.current.batch, true);
      job.current = null;
    };
  }, []);

  const active = items.filter(item => !item.archived && item.sligroUrl && normalizeStockSligroLink(item.sligroUrl) === item.sligroUrl);
  const itemsById = new Map(items.map(item => [item.id, item]));
  const samePrice = (row: SligroUpdateRow) => {
    const current = itemsById.get(row.id)?.purchasePrice;
    const next = row.purchasePrice;
    return current && current.packUnits === next.packUnits && current.regularCents === next.regularCents &&
      current.offerCents === next.offerCents && current.offerStart === next.offerStart && current.offerEnd === next.offerEnd;
  };
  const changes = review?.rows.filter(row => !samePrice(row)) ?? [];

  function start() {
    if (job.current || savingRef.current || disabled || active.length === 0) return;
    setReview(null);
    setMessage("");
    setStatus("reading");
    const products = active.map(item => ({
      id: item.id, url: item.sligroUrl!, packUnits: item.purchasePrice?.packUnits ?? item.caseSize ?? 1, revision: String(item.revision),
    }));
    const batches = sligroBatches(products);
    let offset = 0;
    const run: Job = {
      batch: null, rows: [], completed: 0, total: products.length,
      finish(message) {
        job.current = null;
        setStatus(null);
        setReview({ rows: run.rows, skipped: run.total - run.rows.length });
        if (message) setMessage(message);
      },
      interrupted() { run.finish(labels.partial); },
      next() {
        const products = batches[offset++];
        if (!products) { run.finish(); return; }
        const requestId = crypto.randomUUID();
        const timeout = (expired: boolean) => {
          if (job.current?.batch?.requestId !== requestId) return;
          stop(job.current.batch, true);
          if (run.completed) run.interrupted();
          else {
            job.current = null;
            setStatus(null);
            setMessage(expired ? labels.expired : labels.extension);
          }
        };
        run.batch = {
          requestId, products, ack: window.setTimeout(() => timeout(false), 4500), deadline: window.setTimeout(() => timeout(true), 15 * 60_000),
        };
        setStatus("reading");
        setProgress({ completed: run.completed, total: run.total });
        window.postMessage({ source: "shah-stock", type: "SLIGRO_PRICE_PREVIEW_REQUEST", requestId, products }, location.origin);
      },
    };
    job.current = run;
    run.next();
  }

  function cancel() {
    if (job.current?.batch) stop(job.current.batch, true);
    job.current = null;
    setReview(null);
    setStatus(null);
  }

  async function save() {
    if (savingRef.current || disabled || !review || changes.length === 0) return;
    setMessage("");
    savingRef.current = true;
    setSaving(true);
    const saved: StockItem[] = [];
    const handled = new Set<string>();
    let conflicts = 0;
    try {
      for (const updates of sligroBatches(changes)) {
        const { response, data } = await fetchJSON<{ items?: StockItem[]; skipped?: string[] }>(
          "/api/admin/stock/sligro-prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) },
        );
        if (!response.ok || !Array.isArray(data.items) || !Array.isArray(data.skipped)) throw new Error("Sligro prices were not saved");
        saved.push(...data.items);
        updates.forEach(row => handled.add(row.id));
        conflicts += data.skipped.length;
      }
      setReview(null);
      setMessage(savedMessage());
    } catch {
      setReview({ ...review, rows: review.rows.filter(row => !handled.has(row.id)) });
      setMessage((handled.size ? savedMessage() + " " : "") + labels.failed);
    } finally {
      if (saved.length) onSaved(saved);
      savingRef.current = false;
      setSaving(false);
    }
    function savedMessage() {
      return labels.saved + " " + saved.length + (conflicts ? ". " + conflicts + " " + labels.conflicts : ".");
    }
  }

  const eur = (cents: number) => new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
  const priceText = (price: StockItem["purchasePrice"]) => !price ? labels.empty :
    labels.regular + " " + eur(price.regularCents) +
    (price.offerCents !== null ? " · " + labels.offer + " " + eur(price.offerCents) : "");

  return <section className={styles.sligroPrices} aria-label={labels.button}>
    <div className={styles.actions}>
      <button type="button" className={shared.button} disabled={disabled || saving || !!status || active.length === 0} onClick={start}>{labels.button}</button>
      {status && <button type="button" className={shared.button} onClick={cancel}>{labels.cancel}</button>}
      {active.length === 0 && <small className={shared.muted}>{labels.noLinks}</small>}
    </div>
    {status && <p role="status">{labels[status]} {progress.completed} / {progress.total}</p>}
    {message && <p role="status">{message}</p>}
    {review && <div className={styles.sligroReview}>
      <h3>{labels.review}</h3>
      <p className={shared.muted}>{review.rows.length === 0 ? labels.noRows : changes.length === 0 ? labels.unchanged : labels.warning}</p>
      {review.skipped > 0 && <p className={shared.muted}>{review.skipped} {labels.skipped}</p>}
      {changes.length > 0 && <ul>{changes.map(row => {
        const item = itemsById.get(row.id), price = row.purchasePrice;
        return <li key={row.id}>
          <strong>{item?.name ?? row.sku}</strong> <small>{labels.pack}: {price.packUnits}</small>
          <span>{labels.previous}: {priceText(item?.purchasePrice)} → {labels.updated}: {priceText(price)}</span>
          {(price.offerStart || price.offerEnd) && <small>{labels.dates}: {price.offerStart ?? "–"} / {price.offerEnd ?? "–"}</small>}
        </li>;
      })}</ul>}
      <div className={styles.actions}>
        {changes.length > 0 && <button type="button" className={shared.button + " " + shared.primary} disabled={disabled || saving} onClick={() => void save()}>{saving ? labels.saving : labels.confirm}</button>}
        <button type="button" className={shared.button} disabled={saving} onClick={cancel}>{labels.cancel}</button>
      </div>
    </div>}
  </section>;
}

function stop(job: Batch, cancel = false) {
  window.clearTimeout(job.ack);
  window.clearTimeout(job.deadline);
  if (cancel) window.postMessage({ source: "shah-stock", type: "SLIGRO_PRICE_PREVIEW_CANCEL", requestId: job.requestId }, location.origin);
}
