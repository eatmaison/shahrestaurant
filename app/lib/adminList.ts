/** Admin-only list utilities: normalized display search, no persistence of search text. */
export function searchText(value: unknown): string {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim().replace(/\s+/g, " ");
}
export function adminMatches(query: string, values: readonly unknown[]): boolean {
  const text = searchText(query);
  if (!text) return true;
  const joined = values.map(searchText).join(" ");
  if (text.split(" ").every(part => joined.includes(part))) return true;
  const digits = query.replace(/\D/g, "");
  return digits.length >= 3 && /^[+\d\s().-]+$/.test(query) && values.some(value => String(value ?? "").replace(/\D/g, "").includes(digits));
}
export function listPage<T>(items: readonly T[], requestedPage: number, size: number) {
  const pageSize = [10, 25, 50].includes(size) ? size : 25;
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.max(1, Math.min(pages, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pages, pageSize, total: items.length, from: items.length ? start + 1 : 0, to: Math.min(start + pageSize, items.length) };
}
export function finiteDate(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
export function safeImageUrl(value: string): boolean {
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  if (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
