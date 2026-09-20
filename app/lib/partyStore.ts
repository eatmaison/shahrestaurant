import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { sql } from "./db";
import { SITE_ID } from "./data";
import { getCurrentUser } from "./serverStore";
import { createMolliePayment, getMolliePayment, mollieEnabled, refundMolliePayment } from "./mollie";
import { emailEnabled, sendMail } from "./email";
import { storeImage } from "./spaces";
import { PARTY_DDL } from "./partySchema";
import { partyDate, partyMoney, type PartyBooking, type PartyEvent } from "./partyTypes";

let ready: Promise<void> | undefined;
export function ensureParties() {
  if (!ready) ready = (async () => {
    await sql.transaction(PARTY_DDL.map(statement => sql.query(statement)));
    await sql.query(`WITH seed AS (
      INSERT INTO party_migrations(site,name) VALUES ($1,'first-party-2026') ON CONFLICT DO NOTHING RETURNING site
    ) INSERT INTO party_events(site,slug,title,description,event_date,start_time,end_time,price_cents,capacity,image,published)
      SELECT site,'friday-night-party','Friday Night Party',$2,'2026-10-02','22:00','03:00',1699,100,'/photos/687A0343.jpeg',true FROM seed
      ON CONFLICT (site,slug) DO NOTHING`, [SITE_ID, "Dinner ends. The night begins. A live DJ, your first cocktail and a dance floor full of Friday-night energy. Bring your friends, dress to impress and bring your best energy. Only 100 guests. One unforgettable night."]);
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}

export class PartyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function partyAdmin() {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) throw new PartyError("Secure administrator sessions are not configured",503);
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw new PartyError("Administrator access required", 403);
}

const eventSelect = `SELECT e.id,e.slug,e.title,e.description,e.event_date::text,e.start_time::text,e.end_time::text,
  e.price_cents,e.capacity,e.image,e.status,e.published,
  ((e.event_date+e.start_time) AT TIME ZONE 'Europe/Amsterdam' > now()) AS sales_open,
  COALESCE(b.sold,0)::integer AS tickets_sold, (e.capacity-COALESCE(b.sold,0))::integer AS remaining,
  COALESCE(b.revenue,0)::integer AS revenue_cents
  FROM party_events e LEFT JOIN LATERAL (
    SELECT sum(quantity) AS sold,sum(total_cents) AS revenue FROM party_bookings
    WHERE event_id=e.id AND ticket_status='confirmed' AND payment_status='paid'
  ) b ON true`;

export async function listParties(admin = false): Promise<PartyEvent[]> {
  if (admin) await partyAdmin();
  await ensureParties();
  return await sql.query(`${eventSelect} WHERE e.site=$1 ${admin ? "" : "AND e.published AND e.event_date >= (now() AT TIME ZONE 'Europe/Amsterdam')::date"} ORDER BY e.event_date,e.start_time`, [SITE_ID]) as PartyEvent[];
}

export const checkoutSchema = z.object({
  eventId: z.uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,25}$/),
  quantity: z.number().int().min(1).max(10),
  expectedPriceCents: z.number().int().min(100).max(100000),
  accepted: z.literal(true),
});

const imageSchema = z.string().max(3_000_000).refine(value =>
  /^\/photos\/[a-zA-Z0-9_.-]+$/.test(value) || /^https:\/\/[^\s]+$/.test(value) ||
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value), "Use an HTTPS image URL or a JPEG, PNG or WebP upload");
export const partyEventSchema = z.object({
  id: z.uuid().optional(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  event_date: z.iso.date(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  price_cents: z.number().int().min(100).max(100000),
  capacity: z.number().int().min(1).max(10000),
  image: imageSchema,
  status: z.enum(["active", "sold_out", "cancelled"]),
  published: z.boolean(),
});

export async function saveParty(raw: unknown) {
  await partyAdmin();
  const parsed = partyEventSchema.safeParse(raw);
  if (!parsed.success) throw new PartyError(parsed.error.issues[0]?.message ?? "Invalid event");
  const event = parsed.data;
  await ensureParties();
  const image = await storeImage(event.image, `${SITE_ID}/parties`);
  const values = [SITE_ID,event.slug,event.title,event.description,event.event_date,event.start_time,event.end_time,event.price_cents,event.capacity,image,event.status,event.published];
  try {
    if (event.id) {
      const rows = await sql.query(`UPDATE party_events SET slug=$2,title=$3,description=$4,event_date=$5,start_time=$6,end_time=$7,
        price_cents=$8,capacity=$9,image=$10,status=$11,published=$12,updated_at=now() WHERE site=$1 AND id=$13 RETURNING id`, [...values,event.id]);
      if (!rows.length) throw new PartyError("Event not found",404);
    } else {
      await sql.query(`INSERT INTO party_events(site,slug,title,description,event_date,start_time,end_time,price_cents,capacity,image,status,published)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,values);
    }
  } catch (error) {
    if (error instanceof PartyError) throw error;
    throw new PartyError("Could not save. Use a unique slug and a capacity at least as large as tickets already sold.",409);
  }
}

const bookingSelect = `SELECT b.id,b.event_id,b.first_name,b.last_name,b.email,b.phone,b.quantity,b.price_cents,b.total_cents,
  b.event_title,b.event_date::text,b.start_time::text,b.end_time::text,b.payment_status,b.ticket_status,b.mollie_payment_id,
  b.created_at::text,b.email_sent_at::text FROM party_bookings b JOIN party_events e ON e.id=b.event_id`;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function beginPartyCheckout(raw: unknown, origin: string) {
  if (!mollieEnabled()) throw new PartyError("Ticket payments are temporarily unavailable. Please try again later.",503);
  if (process.env.NODE_ENV === "production" && !process.env.APP_URL) throw new PartyError("Ticket checkout is not configured",503);
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) throw new PartyError("Please check your contact details, ticket quantity and agreement.");
  const details = parsed.data;
  await ensureParties();
  const token = randomBytes(32).toString("hex");
  const rows = await sql.query(`INSERT INTO party_bookings(event_id,access_token_hash,first_name,last_name,email,phone,quantity,price_cents,event_title,event_date,start_time,end_time)
    SELECT id,$2,$3,$4,$5,$6,$7,price_cents,title,event_date,start_time,end_time FROM party_events
    WHERE id=$1 AND site=$8 AND published AND status='active' AND tickets_sold+$7<=capacity AND price_cents=$9
      AND (event_date+start_time) AT TIME ZONE 'Europe/Amsterdam' > now()
    RETURNING id,total_cents,event_title`,[details.eventId,tokenHash(token),details.firstName,details.lastName,details.email,details.phone,details.quantity,SITE_ID,details.expectedPriceCents]) as { id: string; total_cents: number; event_title: string }[];
  const booking = rows[0];
  if (!booking) throw new PartyError("Availability or the ticket price has changed. Please refresh the event before paying.",409);
  try {
    const payment = await createMolliePayment({
      amount: booking.total_cents/100, description: `${booking.event_title} - ${details.quantity} ticket(s)`,
      redirectUrl: `${origin}/parties/complete#token=${token}`,
      webhookUrl: origin.startsWith("https://") ? `${origin}/api/parties/webhook` : undefined,
      metadata: { kind: "party", bookingId: booking.id, site: SITE_ID }, idempotencyKey: booking.id,
    });
    await sql.query(`UPDATE party_bookings SET mollie_payment_id=$2,updated_at=now() WHERE id=$1`,[booking.id,payment.id]);
    return { checkoutUrl: payment.checkoutUrl };
  } catch {
    throw new PartyError("Payment could not be started. Please try again.",502);
  }
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[character]!);

async function sendPartyConfirmation(booking: PartyBooking) {
  if (!emailEnabled()) return;
  const claimed = await sql.query(`UPDATE party_bookings SET email_claimed_at=now() WHERE id=$1 AND email_sent_at IS NULL
    AND (email_claimed_at IS NULL OR email_claimed_at<now()-interval '5 minutes') RETURNING id`,[booking.id]);
  if (!claimed.length) return;
  try {
    await sendMail({ to: booking.email, subject: `You're on the list: ${booking.event_title}`, html:
      `<div style="font-family:Georgia,serif;background:#121214;color:#fafafa;padding:36px;max-width:600px;margin:auto"><p style="color:#dfbd70">SHAH RESTAURANT / AFTER HOURS</p><h1>You're on the list.</h1><p>${escapeHtml(booking.first_name)} ${escapeHtml(booking.last_name)}, your night is confirmed.</p><h2>${escapeHtml(booking.event_title)}</h2><p>${partyDate(booking.event_date)}<br>${booking.start_time.slice(0,5)} - ${booking.end_time.slice(0,5)}${booking.end_time < booking.start_time ? " (ends the following day)" : ""}, Amsterdam time</p><p>${booking.quantity} ticket(s) &middot; ${partyMoney(booking.total_cents)} paid</p><p>First cocktail included for every guest. Live DJ. Stylish, party-ready dress code.</p><p>Klaprozenweg 36a, 1032 KL Amsterdam</p><p>Bring this confirmation and your best energy. Your group is booked under the purchaser's name.</p><p>Ticket ID: ${booking.id}</p><p>Questions? info@shahrestaurant.nl / +31 20 341 2995</p></div>` });
    await sql.query(`UPDATE party_bookings SET email_sent_at=now(),email_claimed_at=NULL WHERE id=$1`,[booking.id]);
  } catch (error) {
    await sql.query(`UPDATE party_bookings SET email_claimed_at=NULL WHERE id=$1`,[booking.id]);
    throw error;
  }
}

export async function reconcilePartyPayment(paymentId: string) {
  if (!/^tr_[A-Za-z0-9]+$/.test(paymentId)) throw new PartyError("Invalid payment ID");
  await ensureParties();
  const payment = await getMolliePayment(paymentId);
  if (payment.metadata.kind !== "party" || payment.metadata.site !== SITE_ID || typeof payment.metadata.bookingId !== "string" || !z.uuid().safeParse(payment.metadata.bookingId).success) throw new PartyError("Unknown payment",404);
  const rows = await sql.query(`${bookingSelect} WHERE b.id=$1 AND e.site=$2`,[payment.metadata.bookingId,SITE_ID]) as PartyBooking[];
  let booking = rows[0];
  if (!booking || (booking.mollie_payment_id && booking.mollie_payment_id !== paymentId) || payment.amount.currency !== "EUR" || payment.amount.value !== (booking.total_cents/100).toFixed(2)) throw new PartyError("Payment does not match booking",409);
  await sql.query(`UPDATE party_bookings SET mollie_payment_id=$2 WHERE id=$1 AND mollie_payment_id IS NULL`,[booking.id,paymentId]);
  if (payment.status === "paid") {
    await sql.query(`UPDATE party_bookings SET payment_status='paid',ticket_status='confirmed',updated_at=now()
      WHERE id=$1 AND ticket_status='pending'`,[booking.id]);
  } else if (["failed","canceled","expired"].includes(payment.status)) {
    await sql.query(`UPDATE party_bookings SET payment_status=$2,ticket_status='failed',updated_at=now() WHERE id=$1 AND ticket_status='pending'`,[booking.id,payment.status]);
  } else {
    await sql.query(`UPDATE party_bookings SET payment_status=$2,updated_at=now() WHERE id=$1 AND ticket_status='pending'`,[booking.id,payment.status]);
  }
  booking = (await sql.query(`${bookingSelect} WHERE b.id=$1 AND e.site=$2`,[booking.id,SITE_ID]) as PartyBooking[])[0];
  if (booking.ticket_status === "refund_pending") {
    const refund = await refundMolliePayment(paymentId,booking.id,booking.total_cents/100);
    await sql.query(`UPDATE party_bookings SET refund_id=$2,ticket_status=$3,updated_at=now() WHERE id=$1 AND ticket_status='refund_pending'`,[booking.id,refund.id,refund.status === "refunded" ? "refunded" : "refund_pending"]);
  }
  if (booking.ticket_status === "confirmed") await sendPartyConfirmation(booking);
}

export async function getPartyBooking(token: string): Promise<PartyBooking> {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new PartyError("Invalid booking link",404);
  await ensureParties();
  const values = [tokenHash(token),SITE_ID];
  let rows = await sql.query(`${bookingSelect} WHERE b.access_token_hash=$1 AND e.site=$2`,values) as PartyBooking[];
  if (!rows[0]) throw new PartyError("Booking not found",404);
  if (rows[0].mollie_payment_id && (rows[0].ticket_status === "pending" || rows[0].ticket_status === "refund_pending" || !rows[0].email_sent_at)) {
    try { await reconcilePartyPayment(rows[0].mollie_payment_id); } catch { console.error("[party] Booking reconciliation requires retry",rows[0].id); }
    rows = await sql.query(`${bookingSelect} WHERE b.access_token_hash=$1 AND e.site=$2`,values) as PartyBooking[];
  }
  return rows[0];
}

export async function listPartyGuests() {
  await partyAdmin();
  await ensureParties();
  return await sql.query(`${bookingSelect} WHERE e.site=$1 ORDER BY b.created_at DESC`,[SITE_ID]) as PartyBooking[];
}

export async function retryPartyPayments() {
  await partyAdmin();
  await ensureParties();
  const rows = await sql.query(`SELECT b.mollie_payment_id FROM party_bookings b JOIN party_events e ON e.id=b.event_id
    WHERE e.site=$1 AND b.mollie_payment_id IS NOT NULL AND (b.ticket_status IN ('pending','refund_pending') OR (b.ticket_status='confirmed' AND b.email_sent_at IS NULL))
    ORDER BY b.updated_at ASC LIMIT 30`,[SITE_ID]) as { mollie_payment_id: string }[];
  const results = await Promise.allSettled(rows.map(row => reconcilePartyPayment(row.mollie_payment_id)));
  return { checked: rows.length, failed: results.filter(result => result.status === "rejected").length };
}