import { randomUUID } from "node:crypto";
import { sql } from "./db";
import { rowToOrder, rowToOrderItem } from "./mappers";
import type { AccountType, Order, OrderFulfillment, OrderItem, OrderSchedule } from "./types";

export interface ComputedOrder {
  userId?: string;
  visitorSessionId?: string;
  customerName: string;
  address: string;
  postcode: string;
  phone: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsEarned: number;
  delivery: number;
  total: number;
  accountType: AccountType;
  schedule?: OrderSchedule;
  fulfillment: OrderFulfillment;
  requestKey?: string;
  requestFingerprint?: string;
}

/** Commit the receipt, all items and loyalty changes together, once per submission. */
export async function persistOrder(
  c: ComputedOrder,
  paid: boolean,
  options: { applyCustomerEffects?: boolean } = {},
): Promise<Order & { newlyCreated: boolean }> {
  const id = randomUUID();
  const applyEffects = options.applyCustomerEffects ?? true;
  // Shared by all sites. Serializing per customer also covers competing tabs
  // with different request keys during the short accidental-double-click window.
  const owner = c.userId ?? c.visitorSessionId ?? id;
  const queries = [
    sql.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [owner]),
    sql.query(
      `INSERT INTO orders
        (id,user_id,visitor_session_id,customer_name,address,postcode,phone,subtotal,discount,
         points_used,points_earned,delivery,total,status,paid,account_type,invoice_sent,
         customer_effects_applied,note,schedule,fulfillment,request_key,request_fingerprint)
       SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'new',$14,$15,false,false,$16,$17::jsonb,$18,$19,$20
       WHERE NOT EXISTS (
         SELECT 1 FROM orders WHERE request_key = $19
           OR ($15 = 'company' AND request_fingerprint = $20
               AND created_at > now() - interval '90 seconds')
       )
       ON CONFLICT (request_key) DO NOTHING RETURNING id`,
      [id,c.userId ?? null,c.visitorSessionId ?? null,c.customerName,c.address,c.postcode,c.phone,
        c.subtotal,c.discount,c.pointsUsed,c.pointsEarned,c.delivery,c.total,paid,c.accountType,
        c.note ?? null,c.schedule ? JSON.stringify(c.schedule) : null,c.fulfillment,
        c.requestKey ?? null,c.requestFingerprint ?? null],
    ),
    sql.query(
      `INSERT INTO order_items (order_id,product_id,name,price,qty,brand,category,side_choice,side_label)
       SELECT o.id,i."productId",i.name,i.price,i.qty,i.brand,i.category,i."sideChoice",i."sideLabel"
       FROM orders o CROSS JOIN jsonb_to_recordset($2::jsonb)
         AS i("productId" text,name text,price numeric,qty integer,brand text,category text,"sideChoice" text,"sideLabel" text)
       WHERE o.id=$1`, [id,JSON.stringify(c.items)],
    ),
    sql.query(
      `WITH claimed AS (
         UPDATE orders SET customer_effects_applied=true
         WHERE id=$1 AND customer_effects_applied=false AND $2::boolean RETURNING *
       )
       UPDATE users u SET points=u.points-o.points_used+o.points_earned,
         order_count=u.order_count+1, phone=o.phone,address=o.address,postcode=o.postcode
       FROM claimed o WHERE u.id=o.user_id`, [id,applyEffects],
    ),
    sql.query(
      `SELECT * FROM orders WHERE id=$1 OR request_key=$2
         OR ($3='company' AND request_fingerprint=$4 AND created_at > now()-interval '90 seconds')
       ORDER BY created_at DESC LIMIT 1`, [id,c.requestKey ?? null,c.accountType,c.requestFingerprint ?? null],
    ),
  ];
  const results = await sql.transaction(queries);
  const row = results[4][0];
  if (!row) throw new Error("Order could not be saved");
  if (c.requestFingerprint && row.request_fingerprint !== c.requestFingerprint) throw new Error("checkoutChanged");
  const items = row.id === id ? c.items : (await sql.query(`SELECT * FROM order_items WHERE order_id=$1`, [row.id])).map(rowToOrderItem);
  return { ...rowToOrder(row, items), newlyCreated: row.id === id };
}
