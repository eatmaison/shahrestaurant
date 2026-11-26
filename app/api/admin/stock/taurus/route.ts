import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "../../../../lib/db";
import { loadStock } from "../../../../lib/stockStore";
import { canManageStock, readStockPayload, sameOriginJson, stockDatabaseCode, stockJson as json } from "../../../../lib/stockRequest";
import { TAURUS_END_LIMIT, stockEligible, taurusKey, taurusLine, taurusName, taurusSaleBatch } from "../../../../lib/taurusStock";
import { stockAmsterdamDate } from "../../../../lib/stock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({
  mode: z.enum(["preview","apply"]),
  rows: z.array(taurusLine.extend({id:z.uuid(), rev:z.number().int().positive().max(2_147_483_647)})).max(TAURUS_END_LIMIT),
  sales: taurusSaleBatch.optional(),
  confirmed: z.literal(true).optional(),
}).strict();
type Existing = { day: string; receipt: string; line: number; id: string; qty: number };

function errorResponse(error: unknown) {
  const code = stockDatabaseCode(error);
  if (code === "42P01" || code === "42883") return json({error:"migration_required"},503);
  if (code === "40001" || code === "40P01" || code === "23505") return json({error:"conflict"},409);
  return json({error:"unavailable"},503);
}

export async function GET(req: NextRequest) {
  try {
    if (!await canManageStock(req)) return json({error:"forbidden"},403);
    const stats = await sql.query(`
      SELECT to_char(l.business_day, 'YYYY-MM-DD') AS day, i.name,
        sum(l.units)::integer AS units
      FROM shah_taurus_stock_lines l JOIN shah_stock_items i ON i.id=l.item_id
      WHERE l.business_day >= $1::date - 29 AND l.business_day <= $1::date
      GROUP BY l.business_day,i.id,i.name ORDER BY l.business_day DESC, units DESC, i.name
    `,[stockAmsterdamDate()]);
    const mappings = await sql.query("SELECT m.source_name AS name,m.item_id AS id FROM shah_taurus_stock_mappings m JOIN shah_stock_items i ON i.id=m.item_id WHERE i.archived_at IS NULL");
    return json({stats,mappings});
  } catch (error) { return errorResponse(error); }
}

export async function POST(req: NextRequest) {
  try {
    if (!await canManageStock(req) || !sameOriginJson(req)) return json({error:"forbidden"},403);
    const parsed = input.safeParse(await readStockPayload(req, 1_800_000));
    if (!parsed.success) return json({error:"invalid"},400);
    const {rows, mode, sales, confirmed} = parsed.data;
    const day = sales?.lines[0].day ?? rows[0]?.day;
    if (!day || (!sales && !rows.length) || new Set(rows.map(taurusKey)).size !== rows.length ||
        rows.some(x=>x.day!==day) || day > stockAmsterdamDate() || day < "2020-01-01") return json({error:"invalid"},400);
    let saleSummary: { cents:number; receipts:number; lines:number; duplicates:number } | undefined;
    if (sales) {
      const all = new Map(sales.lines.map(x=>[taurusKey(x),x]));
      if (all.size!==sales.lines.length || sales.lines.some(x=>x.day!==day) ||
          sales.lines.reduce((n,x)=>n+x.cents,0)!==sales.footerCents ||
          (mode==="apply"&&!confirmed) ||
          rows.some(x=>{
            const source=all.get(taurusKey(x));
            return !source || !stockEligible(source) || source.qty!==x.qty || source.name!==x.name;
          })) return json({error:"invalid"},400);
      if(mode==="preview") {
        const [counts]=await sql.query(`
          SELECT count(l.line)::integer AS duplicates, count(*) FILTER (WHERE l.line IS NOT NULL AND
            (l.item_name,l.sale_group,l.qty,l.cents,l.adjustment)
              IS DISTINCT FROM (v.name,v."group",v.qty,v.cents,v.adjustment))::integer AS conflicts
          FROM jsonb_to_recordset($1::jsonb) AS v(day date,receipt text,line integer,name text,
            "group" text,qty integer,cents integer,adjustment boolean)
          LEFT JOIN shah_taurus_sale_lines l ON (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line)`,
          [JSON.stringify(sales.lines)]);
        if (counts.conflicts) return json({error:"sales_conflict"},409);
        saleSummary={cents:sales.footerCents,receipts:new Set(sales.lines.map(x=>x.receipt)).size,
          lines:sales.lines.length,duplicates:counts.duplicates};
      }
    }
    const mapped = new Map<string,string>();
    for (const row of rows) {
      const key = taurusName(row.name);
      if (!key || key.length>120 || (mapped.has(key) && mapped.get(key)!==row.id)) return json({error:"invalid"},400);
      mapped.set(key,row.id);
    }
    if (mode === "apply") {
      if(sales){
        const [out]=await sql.query("SELECT * FROM shah_taurus_apply_sales($1::jsonb,$2::jsonb)",
          [JSON.stringify(sales.lines),JSON.stringify(rows.map(row=>({...row,source_name:taurusName(row.name)})))]);
        return json({imported:out.stock_lines,salesImported:out.sale_lines});
      }
      const out = await sql.query("SELECT shah_taurus_apply($1::jsonb) AS imported",[JSON.stringify(rows.map(row=>({...row,source_name:taurusName(row.name)}))) ]);
      return json({imported:out[0]?.imported ?? 0});
    }
    const old = await sql.query(`
      SELECT to_char(l.business_day,'YYYY-MM-DD') AS day,l.receipt,l.line,l.item_id AS id,l.units AS qty
      FROM shah_taurus_stock_lines l
      JOIN jsonb_to_recordset($1::jsonb) AS v(day date,receipt text,line integer)
        ON (l.business_day,l.receipt,l.line)=(v.day,v.receipt,v.line)`,[JSON.stringify(rows)]) as Existing[];
    const before = new Map(old.map(x=>[taurusKey(x),x]));
    const stock = new Map((rows.length ? await loadStock() : []).filter(x=>!x.archived).map(x=>[x.id,x]));
    const grouped = new Map<string,number>();
    for(const row of rows) {
      const prior = before.get(taurusKey(row));
      if (prior) {
        if ((!sales && prior.id !== row.id) || prior.qty !== row.qty) return json({error:"conflict"},409);
        continue;
      }
      const item = stock.get(row.id);
      if (!item || item.revision !== row.rev) return json({error:"conflict"},409);
      grouped.set(row.id, (grouped.get(row.id) ?? 0) + row.qty);
    }
    return json({saleSummary, duplicates:old.length, changes:Array.from(grouped, ([id, units])=>{
      const item=stock.get(id)!;
      return {id, name:item.name, units, before:item.totalUnits, after:item.totalUnits-units};
    })});
  } catch (error) { return errorResponse(error); }
}
