"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "../../providers";
import { fetchJSON } from "../../lib/clientFetch";
import {
  STOCK_MAX_CASE_SIZE, STOCK_MAX_COUNT, activeStockOffer, parseStockEuro, stockAmsterdamDate, stockCategoryLabel, stockUnits, stockValues, visibleStockItems,
  type StockCategory, type StockCategoryOption, type StockFilter, type StockItem, type StockMutation, type StockValues,
} from "../../lib/stock";
import shared from "../admin.module.css";
import styles from "./stock.module.css";
import photoStyles from "./stockPhoto.module.css";
import { StockPhoto, useStockPhotos } from "./StockPhoto";
import StockCategories from "./StockCategories";
import SligroPrices from "./SligroPrices";
import TaurusStock from "./TaurusStock";

const labels = {
  en: {
    heading: "Drinks stock", intro: "Edit a product’s count directly. Lowest stock appears first.",
    categories: { "soft-drinks": "Soft drinks", beer: "Beer", syrups: "Syrups" },
    add: "Add product", refresh: "Refresh stock", loading: "Loading stock…", zero: "Out of stock",
    active: "All stock", archived: "Archived", allCategories: "All categories", category: "Category",
    search: "Find a product", product: "Product", cases: "Full cases", caseSize: "Units per case",
    loose: "Loose units", units: "Total units", save: "Save", saving: "Saving…", cancel: "Cancel",
    edit: "Edit count", details: "Product details", archive: "Archive product", restore: "Restore",
    sligroUrl: "Sligro product link (optional)", openSligro: "Open in Sligro",
    invalidSligro: "Paste the product page link from sligro.nl, not a search, account or category page.",
    purchase: "Purchase price", purchaseDetails: "Supplier purchase prices", packUnits: "Units in purchase pack",
    regularPrice: "Regular price (€)", offerPrice: "Offer price (€)", deal: "Good time to order",
    offerStart: "Offer starts (optional)", offerEnd: "Offer ends (optional)",
    perUnit: "per unit", forPack: "per pack of", savings: "Save",
    priceHint: "Use prices for the same pack. An end date hides the offer automatically after that date (Amsterdam time).",
    invalidPrice: "Enter a pack size and a regular price. An offer must be lower than the regular price, with valid dates in order.",
    archivePrompt: "Hide this product from active stock? You can restore it from Archived.",
    noMatches: "No products match the current filters.", noActive: "No active products. Add one to start tracking it.",
    noArchived: "No archived products.", noZero: "No out-of-stock products match these filters.",
    caseHint: "Leave units per case empty for products counted individually. A case size is required if you enter full cases.",
    invalid: "Use a product name and valid whole-number counts. If there are full cases, enter their size.",
    unavailable: "Stock could not be loaded or saved. Try again.", duplicate: "An active product with this name already exists in that category.",
    migration: "Stock is not set up in this database yet. Apply the stock migration before entering counts.",
    forbidden: "Your session does not have access to stock. Sign in as an administrator.",
    categoryMissing: "This category no longer exists. Close the edit and refresh Stock before trying again.",
    categoryConcurrent: "Stock changed while saving. Your entries are still here; try saving again.",
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
    sligroUrl: "Sligro-productlink (optioneel)", openSligro: "Openen bij Sligro",
    invalidSligro: "Plak de productlink van sligro.nl, niet een zoek-, account- of categoriepagina.",
    purchase: "Inkoopprijs", purchaseDetails: "Inkoopprijzen leverancier", packUnits: "Stuks in inkoopverpakking",
    regularPrice: "Normale prijs (€)", offerPrice: "Actieprijs (€)", deal: "Voordelig om te bestellen",
    offerStart: "Actie begint (optioneel)", offerEnd: "Actie eindigt (optioneel)",
    perUnit: "per stuk", forPack: "per verpakking van", savings: "Bespaar",
    priceHint: "Gebruik prijzen voor dezelfde verpakking. Met een einddatum verdwijnt de actie daarna automatisch (Amsterdamse tijd).",
    invalidPrice: "Vul een verpakkingsgrootte en een normale prijs in. Een actieprijs moet lager zijn dan de normale prijs, met geldige datums in de juiste volgorde.",
    archivePrompt: "Dit product verbergen in de actieve voorraad? Je kunt het herstellen via Gearchiveerd.",
    noMatches: "Er zijn geen producten die bij deze filters passen.", noActive: "Geen actieve producten. Voeg een product toe om te beginnen.",
    noArchived: "Geen gearchiveerde producten.", noZero: "Geen producten zonder voorraad die bij deze filters passen.",
    caseHint: "Laat stuks per doos leeg als je alleen losse stuks telt. Vul bij volle dozen altijd de doosinhoud in.",
    invalid: "Vul een productnaam en geldige gehele aantallen in. Vul bij volle dozen ook de doosinhoud in.",
    unavailable: "Voorraad laden of opslaan is mislukt. Probeer het opnieuw.", duplicate: "Er bestaat al een actief product met deze naam in deze categorie.",
    migration: "Voorraad is nog niet ingesteld in deze database. Pas eerst de voorraadmigratie toe.",
    forbidden: "Je sessie heeft geen toegang tot de voorraad. Log in als beheerder.",
    categoryMissing: "Deze categorie bestaat niet meer. Sluit de bewerking en ververs de voorraad.",
    categoryConcurrent: "De voorraad is gewijzigd tijdens het opslaan. Je invoer is bewaard; probeer opnieuw op te slaan.",
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
type Draft = { name: string; category: StockCategory; cases: string; caseSize: string; loose: string; packUnits: string; regularPrice: string; offerPrice: string; offerStart: string; offerEnd: string; priceEdited: boolean; sligroUrl: string; sligroEdited: boolean };
type Editor = { item: StockItem | null; draft: Draft; conflict?: StockItem };
type Api = { items?: StockItem[]; categories?: StockCategoryOption[]; item?: StockItem; error?: string };

const freshDraft = (category: StockCategory): Draft => ({
  name: "", category, cases: "0", caseSize: "", loose: "0",
  packUnits: "", regularPrice: "", offerPrice: "", offerStart: "", offerEnd: "", priceEdited: false, sligroUrl: "", sligroEdited: false,
});
const euroDraft = (cents: number | null | undefined) => cents == null ? "" : (cents / 100).toFixed(2);
const fromItem = (item: StockItem): Draft => ({
  name: item.name, category: item.category, cases: String(item.cases),
  caseSize: item.caseSize === null ? "" : String(item.caseSize), loose: String(item.loose),
  packUnits: String(item.purchasePrice?.packUnits ?? item.caseSize ?? 1),
  regularPrice: euroDraft(item.purchasePrice?.regularCents), offerPrice: euroDraft(item.purchasePrice?.offerCents),
  offerStart: item.purchasePrice?.offerStart ?? "", offerEnd: item.purchasePrice?.offerEnd ?? "", priceEdited: false,
  sligroUrl: item.sligroUrl ?? "", sligroEdited: false,
});
const readInt = (value: string) => /^[0-9]+$/.test(value) ? Number(value) : NaN;
function draftValues(draft: Draft): StockValues {
  return {
    name: draft.name, category: draft.category, cases: readInt(draft.cases),
    caseSize: draft.caseSize === "" ? null : readInt(draft.caseSize), loose: readInt(draft.loose),
    ...(draft.sligroEdited ? { sligroUrl: draft.sligroUrl.trim() || null } : {}),
    ...(draft.priceEdited ? {
      purchasePrice: !draft.regularPrice.trim() && !draft.offerPrice.trim() && !draft.offerStart && !draft.offerEnd ? null : {
        packUnits: readInt(draft.packUnits || draft.caseSize || "1"),
        regularCents: parseStockEuro(draft.regularPrice) ?? NaN,
        offerCents: parseStockEuro(draft.offerPrice),
        ...(draft.offerStart ? { offerStart: draft.offerStart } : {}),
        ...(draft.offerEnd ? { offerEnd: draft.offerEnd } : {}),
      },
    } : {}),
  };
}
function errorMessage(code: string | undefined, copy: Copy) {
  switch (code) {
    case "invalid_input": return copy.invalid;
    case "invalid_price": return copy.invalidPrice;
    case "invalid_sligro": return copy.invalidSligro;
    case "duplicate": return copy.duplicate;
    case "migration_required": return copy.migration;
    case "forbidden": return copy.forbidden;
    case "not_found": return copy.notFound;
    case "category_not_found": return copy.categoryMissing;
    case "category_concurrent": return copy.categoryConcurrent;
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
  const euro = (cents: number) => new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [categories, setCategories] = useState<StockCategoryOption[]>([]);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<StockCategory | "all">("all");
  const [filter, setFilter] = useState<StockFilter>("active");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [today, setToday] = useState(stockAmsterdamDate);
  const liveNotice = useRef<HTMLParagraphElement>(null);
  const labelCategory = (option: StockCategoryOption) => stockCategoryLabel(option, copy.categories);
  const sortedCategories = [...categories].sort((a, b) => labelCategory(a).localeCompare(labelCategory(b), lang));

  useEffect(() => {
    const controller = new AbortController();
    async function initialLoad() {
      try {
        const { response, data } = await fetchJSON<Api>("/api/admin/stock", { cache: "no-store", signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!response.ok || !data.items || !data.categories) setFailure(data.error ?? "unavailable");
        else { setItems(data.items); setCategories(data.categories); }
      } catch { if (!controller.signal.aborted) setFailure("unavailable"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void initialLoad();
    return () => controller.abort();
  }, []);

  const hasDatedOffers = items?.some(item => item.purchasePrice?.offerStart || item.purchasePrice?.offerEnd) ?? false;
  useEffect(() => {
    if (!hasDatedOffers) return;
    const updateDate = () => setToday(stockAmsterdamDate());
    updateDate();
    const interval = window.setInterval(updateDate, 15_000);
    window.addEventListener("focus", updateDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateDate);
    };
  }, [hasDatedOffers]);

  async function refresh(success = "") {
    setLoading(true); setFailure(""); setNotice("");
    try {
      const { response, data } = await fetchJSON<Api>("/api/admin/stock", { cache: "no-store" });
      if (!response.ok || !data.items || !data.categories) setFailure(data.error ?? "unavailable");
      else {
        const available = data.categories;
        setItems(data.items); setCategories(available);
        setCategory(previous => available.some(option => option.id === previous) ? previous : "all");
      }
      setNotice(success);
    } catch { setFailure("unavailable"); }
    finally { setLoading(false); }
  }

  function open(item: StockItem | null) {
    if (editor || categoryBusy || (!item && !categories.length)) return;
    setFailure(""); setNotice(""); setArchiveConfirm(false);
    const initialCategory = categories.find(option => option.id === category) ??
      categories.find(option => option.id === "soft-drinks") ?? sortedCategories[0];
    setEditor({ item, draft: item ? fromItem(item) : freshDraft(initialCategory.id) });
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
    if (!result.success) {
      const paths = result.error.issues.map(issue => issue.path[0]);
      setFailure(paths.includes("purchasePrice") ? "invalid_price" : paths.includes("sligroUrl") ? "invalid_sligro" : "invalid_input");
      return;
    }
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
    if (categoryBusy) return;
    void request("PATCH", { action: "restore", id: item.id, revision: item.revision }, copy.restored);
  }

  const active = (items ?? []).filter(item => !item.archived);
  const total = active.reduce((sum, item) => sum + item.totalUnits, 0);
  const zero = active.filter(item => item.totalUnits === 0).length;
  const low = active.filter(item=>item.totalUnits>0&&item.totalUnits<=(item.caseSize??6)).length;
  const lowLabel = lang==="nl"?"Bijbestellen":"Reorder";
  const shown = items ? visibleStockItems(items, filter, category, query) : [];
  const editing = editor !== null;
  const problem = failure === "conflict" ? copy.conflict : failure ? errorMessage(failure, copy) : "";
  const form = editor ? (
    <StockEditor key={editor.item?.id ?? "new"} editor={editor} copy={copy} format={format} busy={busy}
      categories={sortedCategories} labelCategory={labelCategory}
      failure={problem} archiveConfirm={archiveConfirm} onCancel={abandonConflict} onSave={save}
      onChange={draft => setEditor(current => current ? { ...current, draft } : null)}
      onArchive={() => setArchiveConfirm(true)} onCancelArchive={() => setArchiveConfirm(false)}
      onConfirmArchive={applyArchive} onResolveConflict={resolveConflict} />
  ) : null;

  return <section className={styles.stock} aria-labelledby="stock-title" aria-busy={loading || busy || categoryBusy}>
    <header className={styles.head}>
      <div><h2 id="stock-title">{copy.heading}</h2><p className={shared.muted}>{copy.intro}</p></div>
      <div className={styles.actions}>
        <button type="button" className={shared.button} onClick={() => void refresh()} disabled={editing || loading || busy || categoryBusy}>{copy.refresh}</button>
        <button type="button" className={shared.button + " " + shared.primary} onClick={() => open(null)} disabled={editing || !items || busy || categoryBusy || loading || categories.length === 0}>{copy.add}</button>
      </div>
    </header>
    {items && <SligroPrices items={items} lang={lang === "nl" ? "nl" : "en"}
      disabled={editing || loading || busy || categoryBusy} onSaved={changed => {
        const byId = new Map(changed.map(item => [item.id, item]));
        setItems(current => current?.map(item => {
          const next = byId.get(item.id);
          return next && next.revision > item.revision ? next : item;
        }) ?? null);
      }}/>}
    {items && <TaurusStock items={items} lang={lang === "nl" ? "nl" : "en"} disabled={editing || loading || busy || categoryBusy} onSaved={()=>void refresh()}/>}
    {items && <dl className={styles.metrics}>
      <div className={shared.metric}><dt>{copy.products}</dt><dd><strong>{format(active.length)}</strong></dd></div>
      <div className={shared.metric}><dt>{copy.totalLabel}</dt><dd><strong>{format(total)}</strong></dd></div>
      <div className={shared.metric}><dt>{copy.zero}</dt><dd><strong>{format(zero)}</strong></dd></div>
      <div className={shared.metric}><dt>{lowLabel}</dt><dd><strong>{format(low)}</strong></dd></div>
    </dl>}
    <p ref={liveNotice} role="status" className={notice ? styles.success : styles.visuallyHidden}>{notice}</p>
    {problem && !editor && <p role="alert" className={styles.problem}>{problem}</p>}
    {items && <StockCategories lang={lang} categories={sortedCategories} items={items} label={labelCategory}
      disabled={editing || loading || busy} busy={categoryBusy} onBusy={setCategoryBusy}
      onChanged={async (success, removedId) => {
        if (removedId && category === removedId) setCategory("all");
        await refresh(success);
      }} />}
    {editor && !editor.item && <div className={styles.newItem}>{form}</div>}
    {!!items && <div className={styles.filters}>
      <div className={styles.actions} aria-label={copy.inStock}>
        {(["active", "zero", "archived"] as const).map(view => <button key={view} type="button"
          className={shared.button + (filter === view ? " " + styles.selected : "")} aria-pressed={filter === view}
          disabled={editing || busy || categoryBusy} onClick={() => { setFilter(view); setFailure(""); }}>
          {view === "active" ? copy.active : view === "zero" ? copy.zero : copy.archived}
        </button>)}
      </div>
      <label>{copy.category}<select value={category} disabled={editing || busy || categoryBusy} onChange={event => setCategory(event.target.value as StockCategory | "all")}>
        <option value="all">{copy.allCategories}</option>
        {sortedCategories.map(option => <option key={option.id} value={option.id}>{labelCategory(option)}</option>)}
      </select></label>
      <label>{copy.search}<input type="search" value={query} disabled={editing || busy || categoryBusy} onChange={event => setQuery(event.target.value)} /></label>
    </div>}
    {loading && !items && <p role="status" className={styles.empty}>{copy.loading}</p>}
    {items && shown.length === 0 && <p className={styles.empty}>{filter === "archived" && category === "all" && !query ? copy.noArchived :
      filter === "zero" ? copy.noZero : active.length === 0 ? copy.noActive : copy.noMatches}</p>}
    {shown.length > 0 && <ul className={styles.list}>
      {shown.map(item => {
        const isEditing = editor?.item?.id === item.id;
        const itemCategory = categories.find(option => option.id === item.category);
        return <li key={item.id} className={styles.item}>
          <div className={styles.row}>
            <div className={styles.photo}>
              <StockPhoto id={item.id} name={item.name} version={photos.versions[item.id]} lang={lang === "nl" ? "nl" : "en"}
                disabled={!photos.indexReady || editing || busy || loading} indexError={photos.indexError} onChange={photos.update} />
            </div>
            <div className={styles.identity + " " + photoStyles.name}>
              <strong>{item.name}</strong><span>{itemCategory ? labelCategory(itemCategory) : copy.category}</span>
              {item.purchasePrice && <PurchaseSummary price={item.purchasePrice} today={today} euro={euro} copy={copy} />}
            </div>
            <div className={styles.count}>
              <span className={styles.breakdown}>{item.caseSize !== null
                ? format(item.cases) + " × " + format(item.caseSize) + " + " + format(item.loose) + " " + copy.loose.toLowerCase()
                : format(item.loose) + " " + copy.unitsLabel}</span>
              <span className={item.totalUnits === 0 && !item.archived ? styles.zero : styles.total}>
                <strong>{format(item.totalUnits)}</strong> {item.totalUnits === 0 && !item.archived ? copy.zero : copy.unitsLabel}
              </span>
              {!item.archived&&item.totalUnits>0&&item.totalUnits<=(item.caseSize??6)&&<span className={styles.reorder}>{lowLabel}</span>}
            </div>
            <div className={styles.itemActions}>
              {item.archived ? <button type="button" className={shared.button} aria-label={copy.restore + ": " + item.name}
                disabled={editing || busy || categoryBusy || loading} onClick={() => restore(item)}>{copy.restore}</button> :
                <button type="button" className={shared.button} aria-label={copy.edit + ": " + item.name} aria-expanded={isEditing}
                  title={editing && !isEditing ? copy.editFirst : undefined} disabled={(editing && !isEditing) || busy || categoryBusy || loading}
                  onClick={() => isEditing ? abandonConflict() : open(item)}>{isEditing ? copy.cancel : copy.edit}</button>}
              {item.sligroUrl && <a href={item.sligroUrl} target="_blank" rel="noopener noreferrer"
                className={styles.sligroLink} aria-label={copy.openSligro + ": " + item.name}>{copy.openSligro}<span aria-hidden="true"> ↗</span></a>}
            </div>
          </div>
          {isEditing && form}
        </li>;
      })}
    </ul>}
  </section>;
}

function PurchaseSummary({ price, today, euro, copy }: {
  price: NonNullable<StockItem["purchasePrice"]>; today: string; euro: (cents: number) => string; copy: Copy;
}) {
  const offer = activeStockOffer(price, today);
  return <span className={styles.purchase}>
    <span>{copy.purchase}: {offer !== null && <><del>{euro(price.regularCents)}</del>{" "}</>}
      <b>{euro(offer ?? price.regularCents)}</b>{" "}{price.packUnits === 1 ? copy.perUnit : copy.forPack + " " + price.packUnits}
    </span>
    {offer !== null && <span className={styles.offer}>{copy.deal} · {copy.savings} {euro(price.regularCents - offer)}</span>}
  </span>;
}

function StockEditor({ editor, copy, format, busy, categories, labelCategory, failure, archiveConfirm, onCancel, onSave, onChange,
  onArchive, onCancelArchive, onConfirmArchive, onResolveConflict }: {
  editor: Editor; copy: Copy; format: (number: number) => string; busy: boolean; failure: string;
  categories: StockCategoryOption[]; labelCategory: (category: StockCategoryOption) => string;
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
  const priceField = (field: "packUnits" | "regularPrice" | "offerPrice", text: string) =>
    <label>{text}<input type="text" inputMode={field === "packUnits" ? "numeric" : "decimal"}
      autoComplete="off" maxLength={field === "packUnits" ? 4 : 8}
      value={field === "packUnits" ? draft.packUnits || "" : draft[field]}
      placeholder={field === "packUnits" ? draft.caseSize || "1" : undefined}
      onChange={event => {
        const value = event.target.value;
        onChange({ ...draft, [field]: value, priceEdited: true, ...(field === "offerPrice" && !value.trim() ? { offerStart: "", offerEnd: "" } : {}) });
      }} /></label>;
  const dateField = (field: "offerStart" | "offerEnd", label: string) =>
    <label>{label}<input type="date" value={draft[field]} max="9999-12-31"
      onChange={event => onChange({ ...draft, [field]: event.target.value, priceEdited: true })} /></label>;
  const metadata = <div className={styles.metaFields}>
    <label>{copy.product}<input ref={productName} type="text" maxLength={100} value={draft.name}
      onChange={event => change("name", event.target.value)} /></label>
    <label>{copy.category}<select value={draft.category} onChange={event => change("category", event.target.value)}>
      {categories.map(option => <option key={option.id} value={option.id}>{labelCategory(option)}</option>)}
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
      <details className={styles.details}>
        <summary>{copy.purchaseDetails}</summary>
        <p className={shared.muted}>{copy.priceHint}</p>
        <div className={styles.purchaseFields}>
          {priceField("packUnits", copy.packUnits)}
          {priceField("regularPrice", copy.regularPrice)}
          {priceField("offerPrice", copy.offerPrice)}
        </div>
        {draft.offerPrice.trim() && <div className={styles.offerDates}>
          {dateField("offerStart", copy.offerStart)}{dateField("offerEnd", copy.offerEnd)}
        </div>}
        <label className={styles.sligroField}>{copy.sligroUrl}<input type="text" inputMode="url" autoComplete="off" maxLength={2048}
          spellCheck={false} value={draft.sligroUrl} onChange={event => onChange({ ...draft, sligroUrl: event.target.value, sligroEdited: true })} /></label>
      </details>
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
