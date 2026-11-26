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

export const taurusSaleLine = taurusLine.extend({
  line: z.number().int().min(1).max(99999999),
  qty: z.number().int().min(-10000).max(10000),
  cents: z.number().int().min(-100000000).max(100000000),
  group: z.string().trim().max(120),
  adjustment: z.boolean(),
});
export type TaurusSaleLine = z.infer<typeof taurusSaleLine>;
export const taurusSaleBatch = z.object({
  lines:z.array(taurusSaleLine).min(1).max(TAURUS_END_LIMIT),
  footerCents:z.number().int().min(-200000000000).max(200000000000),
}).strict();

function centsOf(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value * 100);
    if (Math.abs(value * 100 - rounded) < 0.00001) return rounded;
  }
  if (typeof value === "string") {
    const s=value.trim();
    if (/^-?\d+(?:[.,]\d{1,2})?$/.test(s)) return centsOf(Number(s.replace(",", ".")));
  }
  throw Error("amount");
}

// Bedrag is the extended settlement line value. Never multiply it by Aantal or
// sum Prijs. The export footer is required and reconciled before importing.
export function parseTaurusSales(rows: readonly (readonly unknown[])[]) {
  if (rows.length < 3 || rows.length > TAURUS_END_LIMIT + 2) throw Error("rows");
  const headers=rows[0].map(v=>typeof v==="string"?taurusName(v):"");
  const required=["datum","bonnummer","regel","aantal","omschrijving","bedrag"];
  if (required.some(h=>headers.filter(x=>x===h).length!==1)) throw Error("headers");
  const [d,r,l,q,n,a]=required.map(h=>headers.indexOf(h));
  const g=headers.indexOf("omschrijving omzetgroep");
  const lines=new Map<string,TaurusSaleLine>();
  let footerCents:number|undefined;
  for(const row of rows.slice(1)) {
    if(!row.some(v=>v!==null&&v!==undefined&&v!=="")) continue;
    if(!row[r]&&typeof row[d]==="string"&&taurusName(row[d])==="totaal"){
      if(footerCents!==undefined)throw Error("footer");
      footerCents=centsOf(row[a]); continue;
    }
    if(footerCents!==undefined)throw Error("footer");
    const receipt=typeof row[r]==="string"?row[r].trim():
      typeof row[r]==="number"&&Number.isSafeInteger(row[r])?String(row[r]):"";
    const group=typeof row[g]==="string"?row[g].trim():"";
    const rawName=typeof row[n]==="string"?row[n].trim():"";
    const line=whole(row[l]), qty=whole(row[q]), cents=centsOf(row[a]);
    const adjustment=line>=777777||/^korting(?:\s|$)/i.test(rawName)||taurusName(group)==="korting";
    const x=taurusSaleLine.parse({day:dayOf(row[d]),receipt,line,qty,
      name:adjustment?"Adjustment":rawName,group:adjustment?"":group,cents,adjustment});
    const key=taurusKey(x), prior=lines.get(key);
    if(prior&&JSON.stringify(prior)!==JSON.stringify(x))throw Error("duplicate_conflict");
    lines.set(key,x);
  }
  const values=[...lines.values()];
  if(footerCents===undefined||!values.length||new Set(values.map(l=>l.day)).size!==1||
    values.reduce((sum,x)=>sum+x.cents,0)!==footerCents)throw Error("reconcile");
  return {lines:values,footerCents};
}

export function stockEligible(x:TaurusSaleLine) {
  return !x.adjustment&&x.qty>0&&x.line<=99999&&x.cents>=0;
}
