import { finiteDate } from "../lib/adminList";
export function money(value: number, lang: "en" | "nl") {
  return new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-IE", { style: "currency", currency: "EUR" }).format(value);
}
export function absoluteTime(value: number | undefined, lang: "en" | "nl") {
  return finiteDate(value) ? new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", {
    timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short",
  }).format(value) : lang === "nl" ? "Nog niet waargenomen" : "Not yet observed";
}
export function relativeTime(value: number | undefined, now: number, lang: "en" | "nl") {
  if (!finiteDate(value)) return lang === "nl" ? "Niet waargenomen" : "Not observed";
  if (!now) return absoluteTime(value, lang);
  if (value! > now + 60_000) return lang === "nl" ? "Tijdstip in de toekomst" : "Timestamp is in the future";
  const minutes = Math.max(0, Math.floor((now - value!) / 60_000));
  if (!minutes) return lang === "nl" ? "Zojuist" : "Just now";
  if (minutes < 60) return lang === "nl" ? `${minutes} min geleden` : `${minutes} min ago`;
  if (minutes < 1440) return lang === "nl" ? `${Math.floor(minutes / 60)} u geleden` : `${Math.floor(minutes / 60)} h ago`;
  return lang === "nl" ? `${Math.floor(minutes / 1440)} d geleden` : `${Math.floor(minutes / 1440)} d ago`;
}
/** Quoting alone does not prevent spreadsheet formulas in user-supplied cells. */
export function csvText(rows: readonly (readonly unknown[])[]) {
  return rows.map(row => row.map(cell => {
    const value = String(cell ?? "");
    const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
}
export function downloadCsv(filename: string, rows: readonly (readonly unknown[])[]) {
  const url = URL.createObjectURL(new Blob(["\ufeff" + csvText(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
