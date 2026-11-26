import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "../../../../../lib/db";
import { canManageStock, stockDatabaseCode, stockJson as json } from "../../../../../lib/stockRequest";
import { stockAmsterdamDate } from "../../../../../lib/stock";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:NextRequest) {
  try {
    if(!await canManageStock(req))return json({error:"forbidden"},403);
    const q=new URL(req.url).searchParams, today=stockAmsterdamDate();
    const days=Number(q.get("days")??30), selected=q.get("day");
    if(![7,30,90,365].includes(days)||(selected&&(!z.iso.date().safeParse(selected).success||selected>today)))
      return json({error:"invalid"},400);
    // One snapshot: adjustments are included in daily totals but not attributed to items.
    const [data]=await sql.query(`
      WITH base AS (
        SELECT * FROM shah_taurus_sale_lines WHERE business_day BETWEEN $1::date - ($2::integer - 1) AND $1::date
      ), daily AS (
        SELECT business_day AS day, sum(cents)::float8 AS cents,
          count(DISTINCT receipt)::integer AS receipts,
          coalesce(sum(cents) FILTER (WHERE adjustment),0)::float8 AS adjustments
        FROM base GROUP BY business_day
      ), products AS (
        SELECT coalesce(i.name, b.item_name) AS name, sale_group AS "group", sum(qty)::float8 AS units, sum(cents)::float8 AS cents
        FROM base b LEFT JOIN shah_taurus_stock_lines st USING (business_day, receipt, line)
        LEFT JOIN shah_stock_items i ON i.id=st.item_id
        WHERE NOT adjustment AND ($3::date IS NULL OR b.business_day=$3::date)
        GROUP BY coalesce(i.name,b.item_name),sale_group
      ) SELECT
        coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.day) FROM daily d),'[]'::jsonb) AS daily,
        coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.cents DESC,p.name,p."group") FROM products p),'[]'::jsonb) AS products
    `,[today,days,selected]);
    return json({...data, through:today});
  }catch(error){
    return json({error:stockDatabaseCode(error)==="42P01"?"migration_required":"unavailable"},503);
  }
}
