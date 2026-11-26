import { z } from "zod";

export const TAURUS_END_LIMIT = 2000;
export const taurusLine = z.object({
  day: z.iso.date(),
  receipt: z.string().regex(/^\d{6,22}$/),
  line: z.number().int().min(1).max(99999),
  name: z.string().trim().min(1).max(120),
  qty: z.number().int().min(1).max(10000),
}).strict();
export type TaurusLine = z.infer<typeof taurusLine>;
export const taurusKey = (x: Pick<TaurusLine, "day" | "receipt" | "line">) => `${x.day}/${x.receipt}/${x.line}`;
export const taurusName = (s: string) => s.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("nl-NL");

function dayOf(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isInteger(value) && value > 40000 && value < 90000)
    return new Date(Date.UTC(1899, 11, 30 + value)).toISOString().slice(0, 10);
  if (typeof value !== "string") return "";
  const parts = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  return parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : value.trim();
}

function whole(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !/^-?\d+$/.test(value.trim())) return NaN;
  return Number(value.trim());
}

// Only the five required columns are read. Customer, employee, table and price fields never leave the browser.
export function parseTaurusRows(rows: readonly (readonly unknown[])[]) {
  if (rows.length < 2 || rows.length > TAURUS_END_LIMIT + 2) throw Error("rows");
  const at = ["datum", "bonnummer", "regel", "aantal", "omschrijving"].map(
    key => rows[0].findIndex(x => typeof x === "string" && taurusName(x) === key),
  );
  if (at.includes(-1)) throw Error("headers");
  const [d, r, l, q, n] = at;
  let ignored = 0;
  const lines = new Map<string, TaurusLine>();
  for (const row of rows.slice(1)) {
    if (!row[r] && (!row[d] || String(row[d]).toLowerCase().trim() === "totaal")) continue;
    const qty = whole(row[q]), line = whole(row[l]);
    if (qty <= 0 || line === 777777 || row[l] === "+++") { ignored++; continue; }
    const name = typeof row[n] === "string" ? row[n].trim() : "";
    if (/^korting(?:\s|$)/i.test(name)) { ignored++; continue; }
    const receipt = typeof row[r] === "string" ? row[r].trim() :
      typeof row[r] === "number" && Number.isSafeInteger(row[r]) ? String(row[r]) : "";
    const x = taurusLine.parse({ day: dayOf(row[d]), receipt, line, qty, name });
    const k = taurusKey(x), prior = lines.get(k);
    if (prior && (prior.qty !== x.qty || prior.name !== x.name)) throw Error("duplicate_conflict");
    lines.set(k, x);
  }
  return { lines: Array.from(lines.values()), ignored };
}
