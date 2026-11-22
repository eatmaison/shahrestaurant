"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "../../providers";
import { fetchJSON } from "../../lib/clientFetch";
import {
  STOCK_MAX_CASE_SIZE, STOCK_MAX_COUNT, stockCategories, stockUnits, stockValues, visibleStockItems,
  type StockCategory, type StockFilter, type StockItem, type StockMutation, type StockValues,
} from "../../lib/stock";
import shared from "../admin.module.css";
import styles from "./stock.module.css";
import photoStyles from "./stockPhoto.module.css";
import { StockPhoto, useStockPhotos } from "./StockPhoto";

const labels = {
  en: {
    heading: "Drinks stock", intro: "Edit a product’s count directly. Lowest stock appears first.",
    categories: { "soft-drinks": "Soft drinks", beer: "Beer", syrups: "Syrups" },
    add: "Add product", refresh: "Refresh stock", loading: "Loading stock…", zero: "Out of stock",
    active: "All stock", archived: "Archived", allCategories: "All categories", category: "Category",
    search: "Find a product", product: "Product", cases: "Full cases", caseSize: "Units per case",
    loose: "Loose units", units: "Total units", save: "Save", saving: "Saving…", cancel: "Cancel",
    edit: "Edit count", details: "Product details", archive: "Archive product", restore: "Restore",
    archivePrompt: "Hide this product from active stock? You can restore it from Archived.",
    noMatches: "No products match the current filters.", noActive: "No active products. Add one to start tracking it.",
    noArchived: "No archived products.", noZero: "No out-of-stock products match these filters.",
    caseHint: "Leave units per case empty for products counted individually. A case size is required if you enter full cases.",
    invalid: "Use a product name and valid whole-number counts. If there are full cases, enter their size.",
    unavailable: "Stock could not be loaded or saved. Try again.", duplicate: "An active product with this name already exists in that category.",
    migration: "Stock is not set up in this database yet. Apply the stock migration before entering counts.",
    forbidden: "Your session does not have access to stock. Sign in as an administrator.",
    notFound: "This product could not be found. Refresh the stock list.",
    conflict: "Another update was saved first. Your entries are still here.",
    serverCount: "Current saved count", useLatest: "Load saved values", keepDraft: "Keep my entries",
    archivedConflict: "This product was archived. Close the edit to see the latest list.",
    saved: "Stock saved.", archivedNotice: "Product archived. You can restore it from Archived.",
    restored: "Product restored.", editFirst: "Save or cancel the current edit before opening another product.",
    totalLabel: "Units in stock", inStock: "Stock count", products: "Products", unitsLabel: "units",
  },
  nl: {
    heading: "Drankvoorraad", intro: "Pas aantallen direct per product aan. De laagste voorraad staat bovenaan.",
    categories: { "soft-drinks": "Frisdrank", beer: "Bier", syrups: "Siropen" },
    add: "Product toevoegen", refresh: "Voorraad verversen", loading: "Voorraad laden…", zero: "Niet op voorraad",
    active: "Alle voorraad", archived: "Gearchiveerd", allCategories: "Alle categorieën", category: "Categorie",
    search: "Product zoeken", product: "Product", cases: "Volle dozen", caseSize: "Stuks per doos",
    loose: "Losse stuks", units: "Totaal stuks", save: "Opslaan", saving: "Opslaan…", cancel: "Annuleren",
    edit: "Aantal aanpassen", details: "Productgegevens", archive: "Product archiveren", restore: "Herstellen",
    archivePrompt: "Dit product verbergen in de actieve voorraad? Je kunt het herstellen via Gearchiveerd.",
    noMatches: "Er zijn geen producten die bij deze filters passen.", noActive: "Geen actieve producten. Voeg een product toe om te beginnen.",
    noArchived: "Geen gearchiveerde producten.", noZero: "Geen producten zonder voorraad die bij deze filters passen.",
    caseHint: "Laat stuks per doos leeg als je alleen losse stuks telt. Vul bij volle dozen altijd de doosinhoud in.",
    invalid: "Vul een productnaam en geldige gehele aantallen in. Vul bij volle dozen ook de doosinhoud in.",
    unavailable: "Voorraad laden of opslaan is mislukt. Probeer het opnieuw.", duplicate: "Er bestaat al een actief product met deze naam in deze categorie.",
    migration: "Voorraad is nog niet ingesteld in deze database. Pas eerst de voorraadmigratie toe.",
    forbidden: "Je sessie heeft geen toegang tot de voorraad. Log in als beheerder.",
    notFound: "Dit product is niet gevonden. Ververs de voorraad.",
    conflict: "Een andere wijziging is eerder opgeslagen. Jouw invoer is bewaard.",
    serverCount: "Huidige opgeslagen voorraad", useLatest: "Opgeslagen waarden laden", keepDraft: "Mijn invoer behouden",
    archivedConflict: "Dit product is gearchiveerd. Sluit de bewerking om de bijgewerkte lijst te zien.",
    saved: "Voorraad opgeslagen.", archivedNotice: "Product gearchiveerd. Je kunt het herstellen via Gearchiveerd.",
    restored: "Product hersteld.", editFirst: "Sla de huidige bewerking op of annuleer deze voordat je een ander product opent.",
    totalLabel: "Stuks op voorraad", inStock: "Voorraadaantal", products: "Producten", unitsLabel: "stuks",
  },
};

type Copy = typeof labels.en;
type Draft = { name: string; category: StockCategory; cases: string; caseSize: string; loose: string };
type Editor = { item: StockItem | null; draft: Draft; conflict?: StockItem };
type Api = { items?: StockItem[]; item?: StockItem; error?: string };

const freshDraft = (category: StockCategory | "all"): Draft => ({
  name: "", category: category === "all" ? "soft-drinks" : category, cases: "0", caseSize: "", loose: "0",
});
const fromItem = (item: StockItem): Draft => ({
  name: item.name, category: item.category, cases: String(item.cases),
  caseSize: item.caseSize === null ? "" : String(item.caseSize), loose: String(item.loose),
});
const readInt = (value: string) => /^[0-9]+$/.test(value) ? Number(value) : NaN;
function draftValues(draft: Draft): StockValues {
  return {
    name: draft.name, category: draft.category, cases: readInt(draft.cases),
    caseSize: draft.caseSize === "" ? null : readInt(draft.caseSize), loose: readInt(draft.loose),
  };
}
function errorMessage(code: string | undefined, copy: Copy) {
  switch (code) {
    case "invalid_input": return copy.invalid;
    case "duplicate": return copy.duplicate;
    case "migration_required": return copy.migration;
    case "forbidden": return copy.forbidden;
    case "not_found": return copy.notFound;
    default: return copy.unavailable;
  }
}
function getPreview(draft: Draft) {
  const { cases, caseSize, loose } = draftValues(draft);
  if (!Number.isInteger(cases) || cases < 0 || cases > STOCK_MAX_COUNT ||
      !Number.isInteger(loose) || loose < 0 || loose > STOCK_MAX_COUNT ||
      (caseSize === null ? cases > 0 : !Number.isInteger(caseSize) || caseSize < 1 || caseSize > STOCK_MAX_CASE_SIZE)) return null;
  return stockUnits(cases, caseSize, loose);
}

export default function AdminStock() {
  const { lang } = useLang();
  const photos = useStockPhotos();
  const copy = lang === "nl" ? labels.nl : labels.en;
  const format = (number: number) => new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-GB").format(number);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<StockCategory | "all">("all");
  const [filter, setFilter] = useState<StockFilter>("active");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const liveNotice = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function initialLoad() {
      try {
        const { response, data } = await fetchJSON<Api>("/api/admin/stock", { cache: "no-store", signal: controller.signal });
        if (!response.ok || !data.items) setFailure(data.error ?? "unavailable");
        else setItems(data.items);
      } catch { if (!controller.signal.aborted) setFailure("unavailable"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void initialLoad();
    return () => controller.abort();
  }, []);

  async function refresh() {
    setLoading(true); setFailure(""); setNotice("");
    try {
      const { response, data } = await fetchJSON<Api>("/api/admin/stock", { cache: "no-store" });
      if (!response.ok || !data.items) setFailure(data.error ?? "unavailable");
      else setItems(data.items);
    } catch { setFailure("unavailable"); }
    finally { setLoading(false); }
  }

  function open(item: StockItem | null) {
    if (editor) return;
    setFailure(""); setNotice(""); setArchiveConfirm(false);
    setEditor({ item, draft: item ? fromItem(item) : freshDraft(category) });
  }

  function close() {
    setEditor(null); setArchiveConfirm(false); setFailure("");
  }

  function mergeItem(item: StockItem) {
    setItems(current => [ ...(current ?? []).filter(other => other.id !== item.id), item ]);
  }

  async function request(method: "POST" | "PATCH", payload: StockValues | StockMutation, success: string) {
    setBusy(true); setFailure(""); setNotice("");
    try {
      const { response, data } = await fetchJSON<Api>("/api/admin/stock", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!response.ok || !data.item) {
        if (data.error === "conflict" && data.item) {
          const latest = data.item;
          if (editor) setEditor(current => current ? { ...current, conflict: latest } : null);
          else mergeItem(latest);
        }
        setFailure(data.error ?? "unavailable");
        return;
      }
      mergeItem(data.item);
      if (method === "POST") {
        setFilter("active"); setCategory("all"); setQuery("");
      }
      close(); setNotice(success);
    } catch { setFailure("unavailable"); }
    finally { setBusy(false); }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || editor.conflict || busy) return;
    const result = stockValues.safeParse(draftValues(editor.draft));
    if (!result.success) { setFailure("invalid_input"); return; }
    if (editor.item) {
      void request("PATCH", { action: "edit", id: editor.item.id, revision: editor.item.revision, values: result.data }, copy.saved);
    } else void request("POST", result.data, copy.saved);
  }

  function resolveConflict(keepDraft: boolean) {
    if (!editor?.conflict || editor.conflict.archived) return;
    const latest = editor.conflict;
    setEditor({ item: latest, draft: keepDraft ? editor.draft : fromItem(latest) });
    setFailure(""); setArchiveConfirm(false);
  }

  function abandonConflict() {
    if (editor?.conflict) mergeItem(editor.conflict);
    else if (editor?.item && items?.some(item => item.id === editor.item?.id && item.revision !== editor.item?.revision)) mergeItem(editor.item);
    close();
  }

  function applyArchive() {
    if (!editor?.item || editor.conflict) return;
    void request("PATCH", { action: "archive", id: editor.item.id, revision: editor.item.revision }, copy.archivedNotice);
  }

  function restore(item: StockItem) {
    void request("PATCH", { action: "restore", id: item.id, revision: item.revision }, copy.restored);
  }

  const active = (items ?? []).filter(item => !item.archived);
  const total = active.reduce((sum, item) => sum + item.totalUnits, 0);
  const zero = active.filter(item => item.totalUnits === 0).length;
  const shown = items ? visibleStockItems(items, filter, category, query) : [];
  const editing = editor !== null;
  const problem = failure === "conflict" ? copy.conflict : failure ? errorMessage(failure, copy) : "";
  const form = editor ? (
    <StockEditor key={editor.item?.id ?? "new"} editor={editor} copy={copy} format={format} busy={busy}
      failure={problem} archiveConfirm={archiveConfirm} onCancel={abandonConflict} onSave={save}
      onChange={draft => setEditor(current => current ? { ...current, draft } : null)}
      onArchive={() => setArchiveConfirm(true)} onCancelArchive={() => setArchiveConfirm(false)}
      onConfirmArchive={applyArchive} onResolveConflict={resolveConflict} />
  ) : null;

  return <section className={styles.stock} aria-labelledby="stock-title" aria-busy={loading || busy}>
    <header className={styles.head}>
      <div><h2 id="stock-title">{copy.heading}</h2><p className={shared.muted}>{copy.intro}</p></div>
      <div className={styles.actions}>
        <button type="button" className={shared.button} onClick={() => void refresh()} disabled={editing || loading || busy}>{copy.refresh}</button>
        <button type="button" className={shared.button + " " + shared.primary} onClick={() => open(null)} disabled={editing || !items || busy}>{copy.add}</button>
      </div>
    </header>
    {items && <dl className={styles.metrics}>
      <div className={shared.metric}><dt>{copy.products}</dt><dd><strong>{format(active.length)}</strong></dd></div>
      <div className={shared.metric}><dt>{copy.totalLabel}</dt><dd><strong>{format(total)}</strong></dd></div>
      <div className={shared.metric}><dt>{copy.zero}</dt><dd><strong>{format(zero)}</strong></dd></div>
    </dl>}
    <p ref={liveNotice} role="status" className={notice ? styles.success : styles.visuallyHidden}>{notice}</p>
    {problem && !editor && <p role="alert" className={styles.problem}>{problem}</p>}
    {editor && !editor.item && <div className={styles.newItem}>{form}</div>}
    {!!items && <div className={styles.filters}>
      <div className={styles.actions} aria-label={copy.inStock}>
        {(["active", "zero", "archived"] as const).map(view => <button key={view} type="button"
          className={shared.button + (filter === view ? " " + styles.selected : "")} aria-pressed={filter === view}
          disabled={editing || busy} onClick={() => { setFilter(view); setFailure(""); }}>
          {view === "active" ? copy.active : view === "zero" ? copy.zero : copy.archived}
        </button>)}
      </div>
      <label>{copy.category}<select value={category} disabled={editing || busy} onChange={event => setCategory(event.target.value as StockCategory | "all")}>
        <option value="all">{copy.allCategories}</option>
        {stockCategories.map(value => <option key={value} value={value}>{copy.categories[value]}</option>)}
      </select></label>
      <label>{copy.search}<input type="search" value={query} disabled={editing || busy} onChange={event => setQuery(event.target.value)} /></label>
    </div>}
    {loading && !items && <p role="status" className={styles.empty}>{copy.loading}</p>}
    {items && shown.length === 0 && <p className={styles.empty}>{filter === "archived" && category === "all" && !query ? copy.noArchived :
      filter === "zero" ? copy.noZero : active.length === 0 ? copy.noActive : copy.noMatches}</p>}
    {shown.length > 0 && <ul className={styles.list}>
      {shown.map(item => {
        const isEditing = editor?.item?.id === item.id;
        return <li key={item.id} className={styles.item}>
          <div className={styles.row}>
            <div className={styles.identity}>
              <StockPhoto id={item.id} name={item.name} version={photos.versions[item.id]} lang={lang === "nl" ? "nl" : "en"}
                disabled={!photos.indexReady || editing || busy || loading} indexError={photos.indexError} onChange={photos.update} />
              <div className={photoStyles.name}><strong>{item.name}</strong><span>{copy.categories[item.category]}</span></div>
            </div>
            <span className={styles.breakdown}>{item.caseSize !== null
              ? format(item.cases) + " × " + format(item.caseSize) + " + " + format(item.loose) + " " + copy.loose.toLowerCase()
              : format(item.loose) + " " + copy.unitsLabel}</span>
            <span className={item.totalUnits === 0 && !item.archived ? styles.zero : styles.total}>
              <strong>{format(item.totalUnits)}</strong> {item.totalUnits === 0 && !item.archived ? copy.zero : copy.unitsLabel}
            </span>
            {item.archived ? <button type="button" className={shared.button} aria-label={copy.restore + ": " + item.name}
              disabled={editing || busy || loading} onClick={() => restore(item)}>{copy.restore}</button> :
              <button type="button" className={shared.button} aria-label={copy.edit + ": " + item.name} aria-expanded={isEditing}
                title={editing && !isEditing ? copy.editFirst : undefined} disabled={(editing && !isEditing) || busy || loading}
                onClick={() => isEditing ? abandonConflict() : open(item)}>{isEditing ? copy.cancel : copy.edit}</button>}
          </div>
          {isEditing && form}
        </li>;
      })}
    </ul>}
  </section>;
}

function StockEditor({ editor, copy, format, busy, failure, archiveConfirm, onCancel, onSave, onChange,
  onArchive, onCancelArchive, onConfirmArchive, onResolveConflict }: {
  editor: Editor; copy: Copy; format: (number: number) => string; busy: boolean; failure: string;
  archiveConfirm: boolean; onCancel: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (draft: Draft) => void; onArchive: () => void; onCancelArchive: () => void;
  onConfirmArchive: () => void; onResolveConflict: (keepDraft: boolean) => void;
}) {
  const { item, draft, conflict } = editor;
  const firstCount = useRef<HTMLInputElement>(null);
  const productName = useRef<HTMLInputElement>(null);
  useEffect(() => { (item ? firstCount : productName).current?.focus(); }, [item]);
  const preview = getPreview(draft);
  const change = (field: keyof Draft, value: string) => onChange({ ...draft, [field]: value });
  const quantity = (field: "cases" | "caseSize" | "loose", text: string, ref?: React.RefObject<HTMLInputElement | null>) =>
    <label>{text}<input ref={ref} type="text" inputMode="numeric" autoComplete="off" maxLength={field === "caseSize" ? 4 : 7}
      value={draft[field]} onFocus={event => event.currentTarget.select()} onChange={event => change(field, event.target.value)} /></label>;
  const metadata = <div className={styles.metaFields}>
    <label>{copy.product}<input ref={productName} type="text" maxLength={100} value={draft.name}
      onChange={event => change("name", event.target.value)} /></label>
    <label>{copy.category}<select value={draft.category} onChange={event => change("category", event.target.value)}>
      {stockCategories.map(value => <option key={value} value={value}>{copy.categories[value]}</option>)}
    </select></label>
  </div>;

  return <form className={styles.editor} onSubmit={onSave} aria-label={item ? copy.edit + ": " + item.name : copy.add}
    onKeyDown={event => { if (event.key === "Escape" && !busy) { event.preventDefault(); onCancel(); } }}>
    <fieldset disabled={busy} className={styles.fields}>
      {!item && metadata}
      <div className={styles.quantities}>
        {quantity("cases", copy.cases, firstCount)}{quantity("caseSize", copy.caseSize)}{quantity("loose", copy.loose)}
        <div className={styles.preview}><span>{copy.units}</span><output>{preview === null ? "–" : format(preview)}</output></div>
      </div>
      <p className={shared.muted}>{copy.caseHint}</p>
      {item && <details className={styles.details}><summary>{copy.details}</summary>{metadata}</details>}
      {failure && <p role="alert" className={styles.problem}>{failure}</p>}
      {conflict && <div className={styles.conflict}>
        {conflict.archived ? <p>{copy.archivedConflict}</p> : <>
          <p>{copy.serverCount}: <strong>{format(conflict.totalUnits)} {copy.unitsLabel}</strong></p>
          <div className={styles.actions}>
            <button type="button" className={shared.button} onClick={() => onResolveConflict(false)}>{copy.useLatest}</button>
            <button type="button" className={shared.button} onClick={() => onResolveConflict(true)}>{copy.keepDraft}</button>
          </div>
        </>}
      </div>}
      {archiveConfirm && !conflict && <div className={styles.conflict}>
        <p>{copy.archivePrompt}</p><div className={styles.actions}>
          <button type="button" className={shared.button + " " + styles.archive} onClick={onConfirmArchive}>{copy.archive}</button>
          <button type="button" className={shared.button} onClick={onCancelArchive}>{copy.cancel}</button>
        </div>
      </div>}
      {(!archiveConfirm || conflict) && <div className={styles.actions}>
        <button type="submit" className={shared.button + " " + shared.primary} disabled={!!conflict}>{busy ? copy.saving : copy.save}</button>
        <button type="button" className={shared.button} onClick={onCancel}>{copy.cancel}</button>
        {item && !conflict && <button type="button" className={shared.button + " " + styles.archive} onClick={onArchive}>{copy.archive}</button>}
      </div>}
    </fieldset>
  </form>;
}
