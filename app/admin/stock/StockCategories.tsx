"use client";

import { useState, type FormEvent } from "react";
import { fetchJSON } from "../../lib/clientFetch";
import { stockCategoryCreate, type StockCategoryOption, type StockItem } from "../../lib/stock";
import shared from "../admin.module.css";
import styles from "./stockCategories.module.css";

const labels = {
  en: {
    manage: "Manage categories", name: "New category name", add: "Add category", remove: "Remove category",
    destination: "Move products to", choose: "Choose another category", cancel: "Cancel",
    empty: "No categories yet. Add one before adding a product.",
    only: "Add another category before removing this one; it still contains products.",
    archived: "Includes archived products.", added: "Category added.", removed: "Category removed.",
    invalid: "Enter a valid category name or choose a different destination.",
    duplicate: "A category with that name already exists.",
    duplicateProduct: "The destination already has an active product with the same name. Choose a different category or rename one of the products first. Nothing was moved.",
    inUse: "This category still contains products. Refresh stock and choose a category to move them to.",
    concurrent: "Stock changed while saving. Refresh stock and try again.",
    stale: "One of these categories no longer exists. Refresh stock and try again.",
    unavailable: "The category change could not be saved. Try again.",
    move: (count: number) => "Move " + count + (count === 1 ? " product" : " products") + " before removing this category. Counts and photos are kept.",
    confirm: (name: string) => 'Remove "' + name + '"?',
  },
  nl: {
    manage: "Categorieën beheren", name: "Naam nieuwe categorie", add: "Categorie toevoegen", remove: "Categorie verwijderen",
    destination: "Producten verplaatsen naar", choose: "Kies een andere categorie", cancel: "Annuleren",
    empty: "Nog geen categorieën. Voeg er een toe voordat je een product toevoegt.",
    only: "Voeg eerst een andere categorie toe; deze categorie bevat nog producten.",
    archived: "Inclusief gearchiveerde producten.", added: "Categorie toegevoegd.", removed: "Categorie verwijderd.",
    invalid: "Voer een geldige categorienaam in of kies een andere bestemming.",
    duplicate: "Er bestaat al een categorie met deze naam.",
    duplicateProduct: "De bestemming bevat al een actief product met dezelfde naam. Kies een andere categorie of hernoem eerst een van de producten. Er is niets verplaatst.",
    inUse: "Deze categorie bevat nog producten. Ververs de voorraad en kies een categorie om ze naartoe te verplaatsen.",
    concurrent: "De voorraad is gewijzigd tijdens het opslaan. Ververs de voorraad en probeer het opnieuw.",
    stale: "Een van deze categorieën bestaat niet meer. Ververs de voorraad en probeer het opnieuw.",
    unavailable: "De wijziging kon niet worden opgeslagen. Probeer het opnieuw.",
    move: (count: number) => "Verplaats " + count + (count === 1 ? " product" : " producten") + " voordat je deze categorie verwijdert. Aantallen en foto's blijven bewaard.",
    confirm: (name: string) => '"' + name + '" verwijderen?',
  },
};

type Props = {
  lang: string;
  categories: StockCategoryOption[];
  items: StockItem[];
  label: (category: StockCategoryOption) => string;
  disabled: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onChanged: (notice: string, removedId?: string) => Promise<void>;
};

export default function StockCategories({ lang, categories, items, label, disabled, busy, onBusy, onChanged }: Props) {
  const copy = lang === "nl" ? labels.nl : labels.en;
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const target = categories.find(category => category.id === removing);
  const count = items.filter(item => item.category === removing).length;
  const replacements = categories.filter(category => category.id !== removing);

  async function submit(method: "POST" | "DELETE", payload: object) {
    if (disabled || busy) return;
    setError(""); onBusy(true);
    try {
      const { response, data } = await fetchJSON<{ error?: string }>("/api/admin/stock/categories", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!response.ok) { setError(data.error ?? "unavailable"); return; }
      if (method === "POST") setName("");
      setRemoving(""); setDestination("");
      await onChanged(method === "POST" ? copy.added : copy.removed, method === "DELETE" ? removing : undefined);
    } catch { setError("unavailable"); }
    finally { onBusy(false); }
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = stockCategoryCreate.safeParse({ name });
    if (!input.success) { setError("invalid_input"); return; }
    void submit("POST", input.data);
  }

  const message = error === "invalid_input" ? copy.invalid : error === "category_duplicate" ? copy.duplicate :
    error === "category_product_duplicate" ? copy.duplicateProduct : error === "category_in_use" ? copy.inUse :
      error === "category_not_found" || error === "replacement_not_found" ? copy.stale :
        error === "category_concurrent" ? copy.concurrent : copy.unavailable;

  return <details className={styles.manager}>
    <summary>{copy.manage}</summary>
    <div className={styles.body}>
      <form className={styles.add} onSubmit={add}>
        <label>{copy.name}<input type="text" value={name} onChange={event => setName(event.target.value)}
          disabled={disabled || busy} maxLength={60} required /></label>
        <button className={shared.button} type="submit" disabled={disabled || busy || !name.trim()}>{copy.add}</button>
      </form>
      {categories.length === 0 ? <p className={shared.muted}>{copy.empty}</p> : <ul className={styles.categories}>
        {categories.map(category => <li key={category.id}>
          <span>{label(category)}</span>
          <button className={shared.button} type="button" aria-label={copy.remove + ": " + label(category)}
            aria-expanded={removing === category.id} disabled={disabled || busy}
            onClick={() => { setRemoving(category.id); setDestination(""); setError(""); }}>{copy.remove}</button>
        </li>)}
      </ul>}
      {target && <form className={styles.confirm} onSubmit={event => {
        event.preventDefault();
        if (count === 0 || replacements.some(category => category.id === destination)) {
          void submit("DELETE", { id: removing, replacement: count > 0 ? destination : null });
        }
      }}>
        <p><strong>{copy.confirm(label(target))}</strong></p>
        {count > 0 && <p>{replacements.length ? copy.move(count) + " " + copy.archived : copy.only}</p>}
        {count > 0 && replacements.length > 0 && <label>{copy.destination}
          <select value={destination} required onChange={event => setDestination(event.target.value)} disabled={disabled || busy}>
            <option value="">{copy.choose}</option>
            {replacements.map(category => <option key={category.id} value={category.id}>{label(category)}</option>)}
          </select>
        </label>}
        <div className={styles.buttons}>
          <button className={shared.button} type="submit" disabled={disabled || busy || (count > 0 && !destination)}>{copy.remove}</button>
          <button className={shared.button} type="button" disabled={busy} onClick={() => { setRemoving(""); setDestination(""); setError(""); }}>{copy.cancel}</button>
        </div>
      </form>}
      {error && <p role="alert" className={styles.error}>{message}</p>}
    </div>
  </details>;
}
