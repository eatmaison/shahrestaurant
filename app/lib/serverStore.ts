import bcrypt from "bcryptjs";
import { ensureReady, sql } from "./db";
import {
  ADMIN_CODE,
  COMPANY_DISCOUNT_PCT,
  COMPANY_MIN_ORDER,
  DELIVERY_FEE,
  DEFAULT_BRAND_CONFIGS,
  DRINK_SUBCATEGORIES,
  FREE_DELIVERY_FROM,
  formatOrderNumber,
  isDrinkCategory,
  isMenuEligibleCategory,
  isPostcodeInDeliveryArea,
  isSoftDrinkProduct,
  MENU_UPGRADE_CATEGORY,
  MENU_UPGRADE_PRICE,
  MIN_ORDER,
  normalizePostcode,
  POINTS_EARN_EVERY,
  SITE_ID,
  VIP_DISCOUNT_PCT,
  VIP_SALE_PRICE,
} from "./data";
import { createMolliePayment, getMolliePayment, mollieEnabled } from "./mollie";
import { amsterdamNow, isOpenAt, isScheduleSlotOpen, restaurantStatus as getRestaurantStatus, timeToMinutes, type RestaurantOpenOverride, type RestaurantStatus } from "./openingHours";
import { companyInvoiceEmail, passwordResetEmail, reservationEmail, sendMail, verificationEmail } from "./email";
import { signToken, verifyToken } from "./tokens";
import { deleteStoredImage, storeImage } from "./spaces";
import { grillSideLabel, isGrillSideRequired, parseCartKey } from "./cart";
import {
  rowToGalleryImage,
  rowToOrder,
  rowToOrderItem,
  rowToProduct,
  rowToReservation,
  rowToReview,
  rowToUser,
  rowToVipRequest,
} from "./mappers";
import { clearSession, createSession, getSessionUserId, getOrCreateVisitorId } from "./session";
import type {
  AccountType,
  BrandCategory,
  BrandConfig,
  BrandSubcategory,
  GalleryImage,
  Lang,
  Order,
  RecentVisitor,
  OrderItem,
  OrderFulfillment,
  OrderSchedule,
  MenuUpgrades,
  Product,
  ProductContent,
  ProductTarget,
  Reservation,
  ReservationStatus,
  Review,
  SocialLink,
  SocialPlatform,
  User,
  VipRequest,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ public site URL */

/**
 * Base URL used in email links and payment redirects.
 * APP_URL (the public domain, set in production) always wins - request-derived
 * origins are only a fallback so a forged Host header can never poison links.
 */
function siteBase(origin?: string): string {
  const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (appUrl) return appUrl;
  return origin?.replace(/\/+$/, "") || "http://localhost:3000";
}

/**
 * Resolve the public origin of an incoming request. Behind a reverse proxy the
 * request URL can look like http://localhost:3000, so trust the standard
 * X-Forwarded-* headers first and fall back to APP_URL via siteBase().
 */
export function publicOrigin(req: { url: string; headers: Headers }): string {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host")?.trim() || "";
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const fromHeaders = host ? `${proto || "https"}://${host}` : new URL(req.url).origin;
  return siteBase(fromHeaders);
}

/* ------------------------------------------------------------------ auth */

export async function getCurrentUser(): Promise<User | null> {
  await ensureReady();
  const userId = await getSessionUserId();
  if (!userId) return null;
  const rows = (await sql.query(`SELECT * FROM users WHERE id = $1`, [userId])) as any[];
  return rows[0] ? rowToUser(rows[0]) : null;
}

export type RegisterError = "emailTaken" | "wrongAdminCode" | "fillFields" | "companyFields" | "agreement";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  adminCode?: string;
  accountType?: AccountType;
  btw?: string;
  kvk?: string;
  agreementAccepted?: boolean;
  origin?: string;
}): Promise<{ ok: boolean; error?: RegisterError; user?: User }> {
  await ensureReady();
  const { name, email, password, phone, adminCode, accountType = "personal", btw, kvk, agreementAccepted, origin } = data;

  if (!name.trim() || !email.trim() || !password.trim()) return { ok: false, error: "fillFields" };
  if (accountType === "company") {
    if (!btw?.trim() || !kvk?.trim()) return { ok: false, error: "companyFields" };
    if (!agreementAccepted) return { ok: false, error: "agreement" };
  }

  const normalized = email.trim().toLowerCase();
  const existing = (await sql.query(`SELECT 1 FROM users WHERE email = $1`, [normalized])) as any[];
  if (existing.length > 0) return { ok: false, error: "emailTaken" };

  let role: User["role"] = "user";
  if (adminCode && adminCode.trim()) {
    if (adminCode.trim() !== ADMIN_CODE) return { ok: false, error: "wrongAdminCode" };
    role = "admin";
  }

  const hash = await bcrypt.hash(password, 10);
  const rows = (await sql.query(
    `INSERT INTO users (name, email, password_hash, phone, role, account_type, btw, kvk)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      name.trim(),
      normalized,
      hash,
      phone?.trim() || null,
      role,
      accountType,
      accountType === "company" ? btw?.trim() : null,
      accountType === "company" ? kvk?.trim() : null,
    ]
  )) as any[];

  const user = rowToUser(rows[0]);
  await createSession(user.id);
  // Send the branded email-verification message (never block registration on it).
  void sendVerificationEmail(user, origin);
  return { ok: true, user };
}

async function sendVerificationEmail(user: User, origin?: string): Promise<void> {
  try {
    const base = siteBase(origin);
    const token = await signToken({ sub: user.id, purpose: "verify" }, "2d");
    const { subject, html } = verificationEmail(user.name, `${base}/verify-email?token=${token}`, base);
    await sendMail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[email] verification send failed:", err);
  }
}

/** Confirm a user's email via the token from the verification link. */
export async function verifyEmail(token: string): Promise<{ ok: boolean }> {
  await ensureReady();
  const payload = await verifyToken<{ sub: string; purpose: string }>(token);
  if (!payload || payload.purpose !== "verify") return { ok: false };
  await sql.query(`UPDATE users SET email_verified = true WHERE id = $1`, [payload.sub]);
  return { ok: true };
}

/** Resend the verification email to the logged-in user. */
export async function resendVerification(origin?: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || user.emailVerified) return { ok: false };
  await sendVerificationEmail(user, origin);
  return { ok: true };
}

/** Start a password reset. Always returns ok so we don't reveal which emails exist. */
export async function requestPasswordReset(email: string, origin?: string): Promise<{ ok: boolean }> {
  await ensureReady();
  const normalized = email.trim().toLowerCase();
  const rows = (await sql.query(`SELECT * FROM users WHERE email = $1`, [normalized])) as any[];
  if (rows[0]) {
    try {
      const user = rowToUser(rows[0]);
      const base = siteBase(origin);
      const token = await signToken({ sub: user.id, purpose: "reset" }, "1h");
      const { subject, html } = passwordResetEmail(user.name, `${base}/reset-password?token=${token}`, base);
      await sendMail({ to: user.email, subject, html });
    } catch (err) {
      console.error("[email] password reset send failed:", err);
    }
  }
  return { ok: true };
}

/** Complete a password reset using the token from the email link. */
export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; error?: "invalid" | "weak" }> {
  await ensureReady();
  if (!password || password.trim().length < 6) return { ok: false, error: "weak" };
  const payload = await verifyToken<{ sub: string; purpose: string }>(token);
  if (!payload || payload.purpose !== "reset") return { ok: false, error: "invalid" };
  const hash = await bcrypt.hash(password, 10);
  await sql.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, payload.sub]);
  return { ok: true };
}

export async function loginUser(email: string, password: string): Promise<{ ok: boolean; error?: "invalidLogin"; user?: User }> {
  await ensureReady();
  const normalized = email.trim().toLowerCase();
  const rows = (await sql.query(`SELECT * FROM users WHERE email = $1`, [normalized])) as any[];
  const row = rows[0];
  if (!row) return { ok: false, error: "invalidLogin" };
  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return { ok: false, error: "invalidLogin" };
  await createSession(row.id);
  return { ok: true, user: rowToUser(row) };
}

export async function logoutUser(): Promise<void> {
  await clearSession();
}

/* ------------------------------------------------------------------ bootstrap (initial load) */

export interface Bootstrap {
  currentUser: User | null;
  products: Product[];
  brands: BrandConfig[];
  reviews: Review[];
  orders: Order[];
  users: User[];
  vipRequests: VipRequest[];
  socialLinks: SocialLink[];
  reservations: Reservation[];
  restaurantStatus: RestaurantStatus;
  /** Anonymous guests active within the last 5 minutes (admin only, else 0). */
  onlineVisitors: number;
  /** Signed-in users and anonymous guest sessions seen recently by the admin. */
  recentVisitors: RecentVisitor[];
}

export async function loadRestaurantStatus(): Promise<RestaurantStatus> {
  await ensureReady();
  const { localDate } = amsterdamNow();
  const rows = (await sql.query(`SELECT mode, local_date FROM restaurant_open_overrides WHERE site = $1`, [SITE_ID])) as any[];
  const override = (rows[0]?.mode ?? "auto") as RestaurantOpenOverride;
  const overrideDate = rows[0]?.local_date || undefined;
  const status = getRestaurantStatus(override, overrideDate);

  if (override !== "auto" && (overrideDate !== localDate || !status.canOverride)) {
    await sql.query(
      `INSERT INTO restaurant_open_overrides (site, mode, local_date, updated_at)
       VALUES ($1, 'auto', $2, now())
       ON CONFLICT (site) DO UPDATE SET mode = 'auto', local_date = $2, updated_at = now()`,
      [SITE_ID, localDate]
    );
    return getRestaurantStatus("auto", localDate);
  }

  return status;
}

export async function setRestaurantOpenOverride(override: RestaurantOpenOverride): Promise<RestaurantStatus> {
  await requireAdmin();
  const { localDate } = amsterdamNow();
  const status = getRestaurantStatus(override, localDate);
  const mode = status.canOverride ? override : "auto";
  await sql.query(
    `INSERT INTO restaurant_open_overrides (site, mode, local_date, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (site) DO UPDATE SET mode = $2, local_date = $3, updated_at = now()`,
    [SITE_ID, mode, localDate]
  );
  return loadRestaurantStatus();
}

export async function bootstrap(): Promise<Bootstrap> {
  await ensureReady();
  await backfillPaymentAttemptOrders();
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Track when the user was last active on the site (shown to admins). Signed-in
  // users are tracked on the users table; anonymous guests get a cookie-based id
  // recorded in visitor_sessions so admins can see live guest activity too.
  const visitorId = await getOrCreateVisitorId();
  if (currentUser) {
    await sql.query(`UPDATE users SET last_seen_at = now(), last_seen_site = $2 WHERE id = $1`, [currentUser.id, SITE_ID]);
    // A signed-in visitor should not also be counted as an anonymous guest.
    await sql.query(`DELETE FROM visitor_sessions WHERE id = $1`, [visitorId]);
  } else {
    await sql.query(
      `INSERT INTO visitor_sessions (id, last_seen_at, last_seen_site, created_at, visit_count)
       VALUES ($1, now(), $2, now(), 1)
       ON CONFLICT (id) DO UPDATE SET last_seen_at = now(), last_seen_site = $2, visit_count = visitor_sessions.visit_count + 1`,
      [visitorId, SITE_ID]
    );
  }

  const productRows = (await sql.query(`SELECT * FROM products ORDER BY sort_order ASC, created_at ASC, id ASC`)) as any[];
  const products = productRows.map(rowToProduct);

  const brands = await loadBrands();
  const restaurantStatus = await loadRestaurantStatus();

  const reviewRows = (await sql.query(`SELECT * FROM reviews ORDER BY created_at DESC`)) as any[];
  const reviews = reviewRows.map(rowToReview);

  const socialRows = (await sql.query(`SELECT * FROM social_links`)) as any[];
  const socialLinks: SocialLink[] = socialRows.map((r) => ({
    platform: r.platform as SocialPlatform,
    url: r.url,
    enabled: r.enabled,
  }));

  let orders: Order[] = [];
  let users: User[] = [];
  let vipRequests: VipRequest[] = [];
  let reservations: Reservation[] = [];
  let onlineVisitors = 0;
  let recentVisitors: RecentVisitor[] = [];

  if (isAdmin) {
    orders = await loadOrders();
    users = ((await sql.query(`SELECT * FROM users ORDER BY created_at ASC`)) as any[]).map(rowToUser);
    vipRequests = ((await sql.query(`SELECT * FROM vip_requests ORDER BY created_at DESC`)) as any[]).map(rowToVipRequest);
    reservations = ((await sql.query(`SELECT * FROM reservations ORDER BY date ASC, time ASC`)) as any[]).map(rowToReservation);
    const visitorRows = (await sql.query(
      `SELECT count(*)::int AS n FROM visitor_sessions WHERE last_seen_site = $1 AND last_seen_at > now() - interval '5 minutes'`,
      [SITE_ID]
    )) as any[];
    onlineVisitors = visitorRows[0]?.n ?? 0;

    const recentGuestRows = (await sql.query(
      `SELECT id, created_at, last_seen_at, last_seen_site, visit_count
       FROM visitor_sessions
       WHERE last_seen_site = $1 AND last_seen_at > now() - interval '24 hours'
       ORDER BY last_seen_at DESC
       LIMIT 150`,
      [SITE_ID]
    )) as any[];

    const nowMs = Date.now();
    const signedInVisitors: RecentVisitor[] = users
      .filter((u) => u.lastSeenAt && nowMs - u.lastSeenAt < 86_400_000)
      .map((u) => ({
        id: u.id,
        kind: "user",
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        accountType: u.accountType,
        isVip: u.isVip,
        lastSeenAt: u.lastSeenAt!,
        lastSeenSite: u.lastSeenSite,
        isOnline: nowMs - (u.lastSeenAt ?? 0) < 5 * 60_000,
        orderCount: u.orderCount,
      }));

    const guestVisitors: RecentVisitor[] = recentGuestRows.map((row) => {
      const lastSeenAt = new Date(row.last_seen_at).getTime();
      return {
        id: row.id,
        kind: "guest",
        name: "Guest",
        email: `Guest session ${String(row.id).slice(0, 8)}`,
        role: "guest",
        accountType: "guest",
        lastSeenAt,
        lastSeenSite: row.last_seen_site ?? undefined,
        isOnline: nowMs - lastSeenAt < 5 * 60_000,
        sessionId: row.id,
        visitCount: Number(row.visit_count ?? 1),
        firstSeenAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
      };
    });

    recentVisitors = [...signedInVisitors, ...guestVisitors]
      .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
      .slice(0, 150);
  } else if (currentUser) {
    orders = await loadOrders(currentUser.id);
    vipRequests = ((await sql.query(`SELECT * FROM vip_requests WHERE user_id = $1 ORDER BY created_at DESC`, [currentUser.id])) as any[]).map(rowToVipRequest);
    reservations = ((await sql.query(`SELECT * FROM reservations WHERE user_id = $1 ORDER BY date DESC, time DESC`, [currentUser.id])) as any[]).map(rowToReservation);
  }

  return { currentUser, products, brands, reviews, orders, users, vipRequests, socialLinks, reservations, restaurantStatus, onlineVisitors, recentVisitors };
}

/** Load orders (optionally for a single user) with their line items. */
async function loadOrders(userId?: string): Promise<Order[]> {
  const orderRows = userId
    ? ((await sql.query(
        `SELECT o.*, p.status AS payment_status, p.failure_reason AS payment_failure_reason, p.mollie_payment_id
         FROM orders o
         LEFT JOIN LATERAL (
           SELECT status, failure_reason, mollie_payment_id
           FROM payments
           WHERE payments.order_id = o.id AND payments.kind = 'order'
           ORDER BY created_at DESC
           LIMIT 1
         ) p ON true
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC`,
        [userId]
      )) as any[])
    : ((await sql.query(
        `SELECT o.*, p.status AS payment_status, p.failure_reason AS payment_failure_reason, p.mollie_payment_id
         FROM orders o
         LEFT JOIN LATERAL (
           SELECT status, failure_reason, mollie_payment_id
           FROM payments
           WHERE payments.order_id = o.id AND payments.kind = 'order'
           ORDER BY created_at DESC
           LIMIT 1
         ) p ON true
         ORDER BY o.created_at DESC`
      )) as any[]);
  if (orderRows.length === 0) return [];

  const ids = orderRows.map((o) => o.id);
  const itemRows = (await sql.query(`SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])`, [ids])) as any[];
  const byOrder = new Map<string, OrderItem[]>();
  for (const it of itemRows) {
    const list = byOrder.get(it.order_id) ?? [];
    list.push(rowToOrderItem(it));
    byOrder.set(it.order_id, list);
  }
  return orderRows.map((o) => rowToOrder(o, byOrder.get(o.id) ?? []));
}

/* ------------------------------------------------------------------ orders */

export async function placeOrder(details: {
  customerName: string;
  address: string;
  postcode: string;
  phone: string;
  note?: string;
  cart: Record<string, number>;
  pointsToUse?: number;
  menuUpgrades?: MenuUpgrades;
  schedule?: OrderSchedule;
  fulfillment?: OrderFulfillment;
  origin?: string;
}): Promise<{ ok: boolean; error?: "minOrder" | "empty" | "outsideArea" | "closed"; order?: Order; checkoutUrl?: string }> {
  await ensureReady();
  const currentUser = await getCurrentUser();
  const { customerName, address, postcode, phone, note, cart, pointsToUse = 0, menuUpgrades = {}, schedule, origin } = details;
  const fulfillment: OrderFulfillment = details.fulfillment === "pickup" ? "pickup" : "delivery";

  // Orders may be placed while closed - the kitchen starts preparing them at
  // the next opening (the customer is informed in the UI). Scheduled (planned)
  // deliveries must still target a slot within opening hours.
  if (schedule && !isScheduleSlotOpen(schedule)) {
    return { ok: false, error: "closed" };
  }

  const cartEntries = Object.entries(cart)
    .map(([key, qty]) => ({ key, qty, ...parseCartKey(key) }))
    .filter((entry) => entry.qty > 0);
  const productIds = [...new Set(cartEntries.map((entry) => entry.productId))];
  if (productIds.length === 0) return { ok: false, error: "empty" };

  // Pickup orders skip the delivery-area check (the customer collects it in person).
  if (fulfillment === "delivery" && !isPostcodeInDeliveryArea(postcode)) return { ok: false, error: "outsideArea" };

  const drinkIds = [...new Set(Object.values(menuUpgrades).filter(Boolean))];
  const productRows = (await sql.query(`SELECT * FROM products WHERE id = ANY($1::text[])`, [[...new Set([...productIds, ...drinkIds])]])) as any[];
  const products = productRows.map(rowToProduct);
  const productById = new Map(products.map((product) => [product.id, product]));

  const items: OrderItem[] = cartEntries
    .flatMap((entry) => {
      const product = productById.get(entry.productId);
      if (!product) return [];
      const sideChoice = isGrillSideRequired(product) ? entry.sideChoice : undefined;
      if (isGrillSideRequired(product) && !sideChoice) return [];
      return [{
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: entry.qty,
        brand: product.brand,
        category: product.category,
        sideChoice,
        sideLabel: grillSideLabel(sideChoice),
      }];
    });
  if (items.length === 0) return { ok: false, error: "empty" };

  for (const productId of productIds) {
    const food = productById.get(productId);
    const drink = productById.get(menuUpgrades[productId]);
    const qty = cartEntries.filter((entry) => entry.productId === productId).reduce((sum, entry) => sum + entry.qty, 0);
    if (!food || qty <= 0 || !isMenuEligibleCategory(food.category) || !drink || !isSoftDrinkProduct(drink)) continue;
    items.push(
      { productId: `menu-upgrade:${food.id}`, name: `Full menu upgrade for ${food.name}`, price: MENU_UPGRADE_PRICE, qty, brand: food.brand, category: MENU_UPGRADE_CATEGORY },
      { productId: `menu-fries:${food.id}`, name: `Fries included with ${food.name}`, price: 0, qty, brand: food.brand, category: MENU_UPGRADE_CATEGORY },
      { productId: `menu-drink:${food.id}:${drink.id}`, name: `Free soft drink: ${drink.name}`, price: 0, qty, brand: drink.brand, category: "Drinks" }
    );
  }

  const subtotal = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);

  const isCompany = currentUser?.accountType === "company";
  const minOrder = isCompany ? COMPANY_MIN_ORDER : MIN_ORDER;
  if (fulfillment === "delivery" && subtotal < minOrder) return { ok: false, error: "minOrder" };

  const foodSubtotal = items.reduce((s, i) => (isDrinkCategory(i.category) ? s : s + i.price * i.qty), 0);
  const discountPct = isCompany ? COMPANY_DISCOUNT_PCT : currentUser?.isVip ? VIP_DISCOUNT_PCT : 0;
  const discount = +(foodSubtotal * (discountPct / 100)).toFixed(2);

  const payableBeforePoints = +(subtotal - discount).toFixed(2);
  const pointsUsed = Math.min(Math.max(0, Math.floor(pointsToUse)), currentUser?.points ?? 0, Math.floor(payableBeforePoints));
  // Pickup is always free of delivery charge; otherwise companies + large orders ship free.
  const delivery = fulfillment === "pickup" ? 0 : isCompany ? 0 : payableBeforePoints >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const paidAmount = +(payableBeforePoints - pointsUsed).toFixed(2);
  const total = +(paidAmount + delivery).toFixed(2);
  const pointsEarned = Math.floor(paidAmount / POINTS_EARN_EVERY);
  const accountType: AccountType = currentUser?.accountType ?? "personal";

  const computed: ComputedOrder = {
    userId: currentUser?.id,
    customerName,
    address,
    postcode: fulfillment === "pickup" ? normalizePostcode(postcode || "") : normalizePostcode(postcode),
    phone,
    note: note?.trim() || undefined,
    items,
    subtotal,
    discount,
    pointsUsed,
    pointsEarned,
    delivery,
    total,
    accountType,
    schedule,
    fulfillment,
  };

  // Company accounts pay by invoice; personal customers pay online via Mollie.
  // When Mollie isn't configured, fall back to the previous "instant paid" behaviour.
  if (isCompany || !mollieEnabled() || total <= 0) {
    const paid = accountType !== "company" && (!mollieEnabled() || total <= 0);
    const order = await insertOrder(computed, paid);
    if (isCompany && currentUser) {
      // Email the invoice automatically and record that it was sent.
      await sendCompanyInvoice(order, currentUser, origin);
      await sql.query(`UPDATE orders SET invoice_sent = true WHERE id = $1`, [order.id]);
      order.invoiceSent = true;
    }
    return { ok: true, order };
  }

  // Personal + Mollie enabled: store the attempt immediately so failed or
  // cancelled payments remain visible in admin, but defer loyalty effects until paid.
  const order = await insertOrder(computed, false, { applyCustomerEffects: false });
  const recRows = (await sql.query(
    `INSERT INTO payments (kind, user_id, order_id, amount, status, payload)
     VALUES ('order', $1, $2, $3, 'open', $4::jsonb) RETURNING id`,
    [computed.userId ?? null, order.id, total, JSON.stringify(computed)]
  )) as any[];
  const recordId = recRows[0].id as string;

  const { base, webhookUrl } = paymentUrls(origin);
  let checkoutUrl = "";
  try {
    const payment = await createMolliePayment({
      amount: total,
      description: `The Tandoor Company order ${formatOrderNumber(order.orderNumber)}`,
      redirectUrl: `${base}/pay/complete?p=${recordId}`,
      webhookUrl,
      metadata: { p: recordId, kind: "order", orderId: order.id },
    });
    checkoutUrl = payment.checkoutUrl;
    await sql.query(`UPDATE payments SET mollie_payment_id = $1, updated_at = now() WHERE id = $2`, [payment.id, recordId]);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Mollie create payment failed";
    await sql.query(`UPDATE payments SET status = 'failed', failure_reason = $1, updated_at = now() WHERE id = $2`, [reason, recordId]);
    throw err;
  }

  return { ok: true, checkoutUrl };
}

interface ComputedOrder {
  userId?: string;
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
}

/** Insert an order + its items, and (for logged-in users) update loyalty balance and saved delivery details. */
async function insertOrder(c: ComputedOrder, paid: boolean, options: { applyCustomerEffects?: boolean } = {}): Promise<Order> {
  const orderRows = (await sql.query(
    `INSERT INTO orders
       (user_id, customer_name, address, postcode, phone, subtotal, discount, points_used, points_earned, delivery, total, status, paid, account_type, invoice_sent, customer_effects_applied, note, schedule, fulfillment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'new',$12,$13,false,false,$14,$15::jsonb,$16)
     RETURNING *`,
    [
      c.userId ?? null,
      c.customerName,
      c.address,
      c.postcode,
      c.phone,
      c.subtotal,
      c.discount,
      c.pointsUsed,
      c.pointsEarned,
      c.delivery,
      c.total,
      paid,
      c.accountType,
      c.note ?? null,
      c.schedule ? JSON.stringify(c.schedule) : null,
      c.fulfillment,
    ]
  )) as any[];
  const orderRow = orderRows[0];

  for (const it of c.items) {
    await sql.query(
      `INSERT INTO order_items (order_id, product_id, name, price, qty, brand, category, side_choice, side_label)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [orderRow.id, it.productId, it.name, it.price, it.qty, it.brand, it.category, it.sideChoice ?? null, it.sideLabel ?? null]
    );
  }

  const order = rowToOrder(orderRow, c.items);
  if (options.applyCustomerEffects ?? true) await applyOrderCustomerEffects(order);

  return order;
}

async function applyOrderCustomerEffects(order: Order): Promise<void> {
  if (!order.userId) return;
  const claimed = (await sql.query(
    `UPDATE orders SET customer_effects_applied = true WHERE id = $1 AND customer_effects_applied = false RETURNING id`,
    [order.id]
  )) as any[];
  if (claimed.length === 0) return;
  await sql.query(
    `UPDATE users
       SET points = points - $1 + $2, order_count = order_count + 1, phone = $4, address = $5, postcode = $6
     WHERE id = $3`,
    [order.pointsUsed, order.pointsEarned, order.userId, order.phone, order.address, order.postcode]
  );
}

async function backfillPaymentAttemptOrders(): Promise<void> {
  const migrationId = "20260726_payment_attempt_orders";
  const done = (await sql.query(`SELECT 1 FROM app_migrations WHERE id = $1`, [migrationId])) as unknown[];
  if (done.length > 0) return;

  const rows = (await sql.query(
    `SELECT id, payload
     FROM payments
     WHERE kind = 'order' AND order_id IS NULL AND status <> 'paid' AND payload IS NOT NULL
     ORDER BY created_at ASC`
  )) as { id: string; payload: ComputedOrder | null }[];

  for (const row of rows) {
    const computed = row.payload;
    if (!computed?.items?.length) continue;
    const order = await insertOrder(computed, false, { applyCustomerEffects: false });
    await sql.query(`UPDATE payments SET order_id = $1, updated_at = now() WHERE id = $2 AND order_id IS NULL`, [order.id, row.id]);
  }

  await sql.query(`INSERT INTO app_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [migrationId]);
}

/** Build the redirect base + webhook URL for a payment. Webhook is omitted on localhost. */
function paymentUrls(origin?: string): { base: string; webhookUrl?: string } {
  const base = siteBase(origin);
  const isLocal = /localhost|127\.0\.0\.1|\[::1\]/.test(base);
  return { base, webhookUrl: isLocal ? undefined : `${base}/api/mollie/webhook` };
}

/** Email a company its invoice for a placed order (never blocks the order). */
async function sendCompanyInvoice(order: Order, user: User, origin?: string): Promise<void> {
  try {
    const base = siteBase(origin);
    const { subject, html } = companyInvoiceEmail({
      base,
      companyName: user.name,
      orderNumber: formatOrderNumber(order.orderNumber),
      createdAt: order.createdAt,
      address: order.address,
      postcode: order.postcode,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      btw: user.btw,
      kvk: user.kvk,
    });
    await sendMail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[email] invoice send failed:", err);
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await requireAdmin();
  await sql.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, orderId]);
}

export async function deleteExpiredOrder(orderId: string): Promise<boolean> {
  await requireAdmin();
  const rows = (await sql.query(
    `DELETE FROM orders o
     WHERE o.id = $1
       AND o.paid = false
       AND EXISTS (
         SELECT 1
         FROM payments p
         WHERE p.order_id = o.id
           AND p.kind = 'order'
           AND p.status IN ('expired', 'canceled', 'failed')
       )
     RETURNING o.id`,
    [orderId]
  )) as any[];
  return rows.length > 0;
}

export async function setOrderPaid(orderId: string, paid: boolean): Promise<void> {
  await requireAdmin();
  await sql.query(`UPDATE orders SET paid = $1 WHERE id = $2`, [paid, orderId]);
  if (paid) {
    await sql.query(`UPDATE payments SET status = 'paid', updated_at = now() WHERE order_id = $1 AND kind = 'order' AND status <> 'paid'`, [orderId]);
    const orderRows = (await sql.query(`SELECT * FROM orders WHERE id = $1`, [orderId])) as any[];
    if (orderRows[0]) {
      const itemRows = (await sql.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId])) as any[];
      await applyOrderCustomerEffects(rowToOrder(orderRows[0], itemRows.map(rowToOrderItem)));
    }
  } else {
    await sql.query(`UPDATE payments SET status = 'open', updated_at = now() WHERE order_id = $1 AND kind = 'order' AND status = 'paid'`, [orderId]);
  }
}

export async function setInvoiceSent(orderId: string, sent: boolean): Promise<void> {
  await requireAdmin();
  await sql.query(`UPDATE orders SET invoice_sent = $1 WHERE id = $2`, [sent, orderId]);
}

/* ------------------------------------------------------------------ products (admin) */

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function productGroupKey(product: Product): string {
  return `${product.name.trim().toLowerCase().replace(/\s+/g, " ")}|${Number(product.price).toFixed(2)}`;
}

async function loadMatchingProductRows(anchor: Product): Promise<Product[]> {
  const rows = (await sql.query(`SELECT * FROM products ORDER BY sort_order ASC, created_at ASC, id ASC`)) as any[];
  const key = productGroupKey(anchor);
  return rows.map(rowToProduct).filter((product) => productGroupKey(product) === key);
}

async function nextProductSortOrder(): Promise<number> {
  const rows = (await sql.query(`SELECT coalesce(max(sort_order), -1) + 1 AS next FROM products`)) as any[];
  return Number(rows[0]?.next ?? 0);
}

/** Insert a single product row. Assumes the image has already been resolved to a stored value. */
async function insertProductRow(
  id: string,
  groupId: string,
  brand: string,
  target: { category: string; subcategory?: string },
  content: ProductContent,
  image: string | null,
  sortOrder: number
): Promise<Product> {
  const rows = (await sql.query(
    `INSERT INTO products (id, group_id, brand, category, subcategory, name, description, description_nl, price, image, sort_order, detailed_description, ingredients, ingredients_nl, allergens, allergens_nl)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::text[],$14::text[],$15::text[],$16::text[]) RETURNING *`,
    [
      id,
      groupId,
      brand,
      target.category,
      target.subcategory ?? "",
      content.name,
      content.description,
      content.descriptionNl ?? "",
      content.price,
      image,
      sortOrder,
      content.detailedDescription ? JSON.stringify(content.detailedDescription) : null,
      content.ingredients ?? [],
      content.ingredientsNl ?? [],
      content.allergens ?? [],
      content.allergensNl ?? [],
    ]
  )) as any[];
  return rowToProduct(rows[0]);
}

export async function addProduct(p: Omit<Product, "id">): Promise<Product> {
  await requireAdmin();
  const image = (await storeImage(p.image ?? null, "products")) ?? null;
  const { brand, category, subcategory, groupId, ...content } = p;
  return insertProductRow(genId("p"), groupId ?? genId("g"), brand, { category, subcategory }, content, image, await nextProductSortOrder());
}

/**
 * Create the same product at several restaurants at once. Every created row
 * shares one group id so it can later be edited (or removed) as a single unit.
 */
export async function createProductGroup(content: ProductContent, targets: ProductTarget[]): Promise<Product[]> {
  await requireAdmin();
  if (targets.length === 0) throw new Error("No restaurants selected");
  // Upload the photo once and reuse the resulting URL for every restaurant's row.
  const image = (await storeImage(content.image ?? null, "products")) ?? null;
  const groupId = genId("g");
  const sortOrder = await nextProductSortOrder();
  const created: Product[] = [];
  for (const target of targets) {
    created.push(await insertProductRow(genId("p"), groupId, target.brand, target, content, image, sortOrder));
  }
  return created;
}

export async function updateProduct(id: string, patch: Partial<Omit<Product, "id">>): Promise<void> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM products WHERE id = $1`, [id])) as any[];
  if (!rows[0]) return;
  const cur = rowToProduct(rows[0]);
  const next = { ...cur, ...patch };
  // A newly picked photo arrives as a data URL: upload it to Spaces and remove the old file.
  if (patch.image !== undefined && patch.image !== cur.image) {
    next.image = (await storeImage(patch.image, "products")) ?? undefined;
    if (cur.image && cur.image !== next.image) await deleteStoredImage(cur.image);
  }
  await sql.query(
     `UPDATE products SET brand=$2, category=$3, subcategory=$4, name=$5, description=$6, description_nl=$7, price=$8, image=$9,
       detailed_description=$10::jsonb, ingredients=$11::text[], ingredients_nl=$12::text[], allergens=$13::text[], allergens_nl=$14::text[] WHERE id=$1`,
    [
      id,
      next.brand,
      next.category,
      next.subcategory ?? "",
      next.name,
      next.description,
      next.descriptionNl ?? "",
      next.price,
      next.image ?? null,
      next.detailedDescription ? JSON.stringify(next.detailedDescription) : null,
      next.ingredients ?? [],
      next.ingredientsNl ?? [],
      next.allergens ?? [],
      next.allergensNl ?? [],
    ]
  );
}

/**
 * Edit a product across all the restaurants it should be sold at. Starting from
 * `anchorId`, the whole group is updated: restaurants in `targets` are added or
 * updated with the shared `content`, and restaurants no longer listed are removed.
 */
export async function syncProductGroup(anchorId: string, content: ProductContent, targets: ProductTarget[]): Promise<void> {
  await requireAdmin();
  if (targets.length === 0) throw new Error("No restaurants selected");
  const anchorRows = (await sql.query(`SELECT * FROM products WHERE id = $1`, [anchorId])) as any[];
  if (!anchorRows[0]) return;
  const anchor = rowToProduct(anchorRows[0]);
  const groupId = anchor.groupId ?? genId("g");
  const current = await loadMatchingProductRows(anchor);
  const oldImages = new Set(current.map((p) => p.image).filter((v): v is string => Boolean(v)));

  // Resolve the shared photo once (a freshly picked photo arrives as a data URL).
  let image: string | null = content.image ?? null;
  if (image && image.startsWith("data:")) image = (await storeImage(image, "products")) ?? null;
  const sharedContent: ProductContent = { ...content, image: image ?? undefined };

  const targetBrands = new Set(targets.map((t) => t.brand));

  for (const target of targets) {
    const existing = current.find((p) => p.brand === target.brand);
    if (existing) {
      await sql.query(
        `UPDATE products SET group_id=$2, category=$3, subcategory=$4, name=$5, description=$6, description_nl=$7, price=$8, image=$9,
           detailed_description=$10::jsonb, ingredients=$11::text[], ingredients_nl=$12::text[], allergens=$13::text[], allergens_nl=$14::text[] WHERE id=$1`,
        [
          existing.id,
          groupId,
          target.category,
          target.subcategory ?? "",
          sharedContent.name,
          sharedContent.description,
          sharedContent.descriptionNl ?? "",
          sharedContent.price,
          image,
          sharedContent.detailedDescription ? JSON.stringify(sharedContent.detailedDescription) : null,
          sharedContent.ingredients ?? [],
          sharedContent.ingredientsNl ?? [],
          sharedContent.allergens ?? [],
          sharedContent.allergensNl ?? [],
        ]
      );
    } else {
      await insertProductRow(genId("p"), groupId, target.brand, target, sharedContent, image, anchor.sortOrder ?? await nextProductSortOrder());
    }
  }

  // Remove the product from restaurants that are no longer selected.
  const toRemove = current.filter((p) => !targetBrands.has(p.brand));
  for (const p of toRemove) {
    await sql.query(`DELETE FROM products WHERE id = $1`, [p.id]);
  }

  // Delete replaced/orphaned photos from Spaces, but keep the shared one if it is still in use.
  for (const old of oldImages) {
    if (old !== image) {
      const stillUsed = (await sql.query(`SELECT 1 FROM products WHERE image = $1 LIMIT 1`, [old])) as any[];
      if (stillUsed.length === 0) await deleteStoredImage(old);
    }
  }
}

export async function removeProduct(id: string): Promise<void> {
  await requireAdmin();
  const anchorRows = (await sql.query(`SELECT * FROM products WHERE id = $1`, [id])) as any[];
  if (!anchorRows[0]) return;
  const products = await loadMatchingProductRows(rowToProduct(anchorRows[0]));
  const ids = products.map((product) => product.id);
  const images = new Set(products.map((product) => product.image).filter((image): image is string => Boolean(image)));
  await sql.query(`DELETE FROM products WHERE id = ANY($1::text[])`, [ids]);
  // Clean up the product photo in Spaces, unless a sister restaurant's row still uses it.
  for (const image of images) {
    const stillUsed = (await sql.query(`SELECT 1 FROM products WHERE image = $1 LIMIT 1`, [image])) as any[];
    if (stillUsed.length === 0) await deleteStoredImage(image);
  }
}

export async function moveProductGroup(id: string, targetId: string, placement: "before" | "after"): Promise<void> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM products ORDER BY sort_order ASC, created_at ASC, id ASC`)) as any[];
  const groups: { key: string; products: Product[] }[] = [];
  const byKey = new Map<string, { key: string; products: Product[] }>();
  for (const product of rows.map(rowToProduct)) {
    const key = productGroupKey(product);
    const group = byKey.get(key);
    if (group) group.products.push(product);
    else {
      const next = { key, products: [product] };
      byKey.set(key, next);
      groups.push(next);
    }
  }

  const sourceIndex = groups.findIndex((group) => group.products.some((product) => product.id === id));
  const targetIndex = groups.findIndex((group) => group.products.some((product) => product.id === targetId));
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

  const [source] = groups.splice(sourceIndex, 1);
  const nextTargetIndex = groups.findIndex((group) => group.products.some((product) => product.id === targetId));
  groups.splice(placement === "before" ? nextTargetIndex : nextTargetIndex + 1, 0, source);

  for (const [sortOrder, group] of groups.entries()) {
    await sql.query(`UPDATE products SET sort_order = $1 WHERE id = ANY($2::text[])`, [
      sortOrder,
      group.products.map((product) => product.id),
    ]);
  }
}

/* ------------------------------------------------------------------ brands & categories (admin) */

function rowToBrand(r: any): BrandConfig {
  const cats = Array.isArray(r.categories) ? r.categories : JSON.parse(r.categories ?? "[]");
  return {
    id: r.id,
    name: r.name,
    logo: r.logo ?? "",
    categories: (cats as BrandCategory[]).map((c) => ({
      name: String(c.name),
      icon: String(c.icon ?? "utensils"),
      subcategories: Array.isArray(c.subcategories)
        ? c.subcategories.map((s) => ({ name: String(s.name), icon: String(s.icon ?? "glass-water") }))
        : undefined,
    })),
  };
}

function normalizeDrinkSubcategories(categories: BrandCategory[], defaults?: BrandCategory[]): { categories: BrandCategory[]; changed: boolean } {
  const defaultDrinks = defaults?.find((c) => c.name === "Drinks");
  const drinkSubcategoryNames = new Set([...DRINK_SUBCATEGORIES.map((c) => c.toLowerCase()), "lassi"]);
  let changed = false;
  const existingDrinks = categories.find((c) => c.name === "Drinks");
  const flatDrinkCategories = categories.filter((c) => drinkSubcategoryNames.has(c.name.toLowerCase()));
  if (!existingDrinks && flatDrinkCategories.length === 0) return { categories, changed };
  const drinks = existingDrinks
    ? {
        ...existingDrinks,
        subcategories: existingDrinks.subcategories ?? defaultDrinks?.subcategories ?? [],
      }
    : defaultDrinks ?? { name: "Drinks", icon: "glass-water", subcategories: [] };
  const subcategories = new Map<string, BrandSubcategory>();
  for (const sub of drinks.subcategories ?? []) {
    const name = sub.name === "Lassi" ? "Indian Lassi" : sub.name;
    subcategories.set(name.toLowerCase(), { name, icon: sub.icon ?? "glass-water" });
  }
  const nextCategories: BrandCategory[] = [];
  for (const category of categories) {
    if (category.name === "Drinks") continue;
    if (drinkSubcategoryNames.has(category.name.toLowerCase())) {
      const name = category.name === "Lassi" ? "Indian Lassi" : category.name;
      subcategories.set(name.toLowerCase(), { name, icon: category.icon ?? "glass-water" });
      changed = true;
      continue;
    }
    nextCategories.push(category);
  }
  const normalizedDrinks = { ...drinks, subcategories: Array.from(subcategories.values()) };
  const hadDrinks = categories.some((c) => c.name === "Drinks");
  const drinksIndex = categories.findIndex((c) => c.name === "Drinks");
  if (hadDrinks && drinksIndex >= 0) nextCategories.splice(Math.min(drinksIndex, nextCategories.length), 0, normalizedDrinks);
  else {
    nextCategories.push(normalizedDrinks);
    changed = true;
  }
  changed ||= JSON.stringify(nextCategories) !== JSON.stringify(categories);
  return { categories: nextCategories, changed };
}

async function loadBrands(): Promise<BrandConfig[]> {
  const rows = (await sql.query(`SELECT * FROM brands ORDER BY sort ASC, created_at ASC`)) as any[];
  const brands = rows.map(rowToBrand);
  for (const brand of brands) {
    const defaults = DEFAULT_BRAND_CONFIGS.find((b) => b.id === brand.id);
    const normalized = normalizeDrinkSubcategories(brand.categories, defaults?.categories);
    if (!normalized.changed) continue;
    brand.categories = normalized.categories;
    await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brand.id, JSON.stringify(normalized.categories)]);
  }
  return brands;
}

/** Result of a brand/category mutation; `error` is a translation-friendly code. */
type BrandResult = { ok: boolean; error?: string };

export async function addBrand(name: string): Promise<BrandResult> {
  await requireAdmin();
  const trimmed = name.trim();
  const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!id) return { ok: false, error: "invalidInput" };
  const existing = (await sql.query(`SELECT 1 FROM brands WHERE id = $1`, [id])) as any[];
  if (existing.length > 0) return { ok: false, error: "brandExists" };
  const sortRows = (await sql.query(`SELECT coalesce(max(sort), -1) + 1 AS next FROM brands`)) as any[];
  await sql.query(`INSERT INTO brands (id, name, logo, sort, categories) VALUES ($1,$2,'',$3,'[]'::jsonb)`, [
    id,
    trimmed,
    sortRows[0]?.next ?? 0,
  ]);
  return { ok: true };
}

export async function removeBrand(id: string): Promise<BrandResult> {
  await requireAdmin();
  const countRows = (await sql.query(`SELECT count(*)::int AS n FROM brands`)) as { n: number }[];
  if ((countRows[0]?.n ?? 0) <= 1) return { ok: false, error: "lastBrand" };
  const productRows = (await sql.query(`SELECT count(*)::int AS n FROM products WHERE brand = $1`, [id])) as { n: number }[];
  if ((productRows[0]?.n ?? 0) > 0) return { ok: false, error: "brandHasProducts" };
  await sql.query(`DELETE FROM brands WHERE id = $1`, [id]);
  return { ok: true };
}

/** Set (or clear, with an empty string) a restaurant's logo image. */
export async function setBrandLogo(brandId: string, logo: string): Promise<BrandResult> {
  await requireAdmin();
  const prevRows = (await sql.query(`SELECT logo FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!prevRows[0]) return { ok: false, error: "invalidInput" };
  const stored = (await storeImage(logo, "brands")) || "";
  await sql.query(`UPDATE brands SET logo = $2 WHERE id = $1`, [brandId, stored]);
  const prev = (prevRows[0].logo as string) ?? "";
  if (prev && prev !== stored) await deleteStoredImage(prev);
  return { ok: true };
}

export async function addBrandCategory(brandId: string, name: string, icon: string): Promise<BrandResult> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!rows[0]) return { ok: false, error: "invalidInput" };
  const brand = rowToBrand(rows[0]);
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "invalidInput" };
  if (brand.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "categoryExists" };
  }
  const next = [...brand.categories, { name: trimmed, icon }];
  await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brandId, JSON.stringify(next)]);
  return { ok: true };
}

export async function updateBrandCategory(brandId: string, name: string, nextName: string, icon: string): Promise<BrandResult> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!rows[0]) return { ok: false, error: "invalidInput" };
  const brand = rowToBrand(rows[0]);
  const trimmedName = name.trim();
  const trimmedNextName = nextName.trim();
  if (!trimmedName || !trimmedNextName || !icon.trim()) return { ok: false, error: "invalidInput" };
  const current = brand.categories.find((c) => c.name === trimmedName);
  if (!current) return { ok: false, error: "invalidInput" };
  if (brand.categories.some((c) => c.name.toLowerCase() === trimmedNextName.toLowerCase() && c.name !== trimmedName)) {
    return { ok: false, error: "categoryExists" };
  }
  const categories = brand.categories.map((category) =>
    category.name === trimmedName ? { ...category, name: trimmedNextName, icon: icon.trim() } : category
  );
  await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brandId, JSON.stringify(categories)]);
  if (trimmedNextName !== trimmedName) {
    await sql.query(`UPDATE products SET category = $3 WHERE brand = $1 AND category = $2`, [brandId, trimmedName, trimmedNextName]);
  }
  return { ok: true };
}

export async function removeBrandCategory(brandId: string, name: string): Promise<BrandResult> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!rows[0]) return { ok: false, error: "invalidInput" };
  const brand = rowToBrand(rows[0]);
  if (brand.categories.length <= 1) return { ok: false, error: "lastCategory" };
  const productRows = (await sql.query(
    name === "Drinks"
      ? `SELECT count(*)::int AS n FROM products WHERE brand = $1 AND (category = $2 OR category = ANY($3::text[]))`
      : `SELECT count(*)::int AS n FROM products WHERE brand = $1 AND category = $2`,
    name === "Drinks" ? [brandId, name, [...DRINK_SUBCATEGORIES, "Lassi"]] : [brandId, name]
  )) as { n: number }[];
  if ((productRows[0]?.n ?? 0) > 0) return { ok: false, error: "categoryHasProducts" };
  const next = brand.categories.filter((c) => c.name !== name);
  await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brandId, JSON.stringify(next)]);
  return { ok: true };
}

export async function addBrandSubcategory(brandId: string, categoryName: string, name: string, icon: string): Promise<BrandResult> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!rows[0]) return { ok: false, error: "invalidInput" };
  const brand = rowToBrand(rows[0]);
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "invalidInput" };
  const current = brand.categories.find((category) => category.name === categoryName);
  if (!current) return { ok: false, error: "invalidInput" };
  if ((current.subcategories ?? []).some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return { ok: false, error: "categoryExists" };
  const categories = brand.categories.map((category) => {
    if (category.name !== categoryName) return category;
    const subcategories = category.subcategories ?? [];
    if (subcategories.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return category;
    return { ...category, subcategories: [...subcategories, { name: trimmed, icon }] };
  });
  await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brandId, JSON.stringify(categories)]);
  return { ok: true };
}

export async function updateBrandSubcategory(brandId: string, categoryName: string, name: string, nextName: string, icon: string): Promise<BrandResult> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!rows[0]) return { ok: false, error: "invalidInput" };
  const brand = rowToBrand(rows[0]);
  const trimmedName = name.trim();
  const trimmedNextName = nextName.trim();
  if (!categoryName.trim() || !trimmedName || !trimmedNextName || !icon.trim()) return { ok: false, error: "invalidInput" };
  const category = brand.categories.find((c) => c.name === categoryName);
  if (!category) return { ok: false, error: "invalidInput" };
  const subcategories = category.subcategories ?? [];
  const current = subcategories.find((s) => s.name === trimmedName);
  if (!current) return { ok: false, error: "invalidInput" };
  if (subcategories.some((s) => s.name.toLowerCase() === trimmedNextName.toLowerCase() && s.name !== trimmedName)) {
    return { ok: false, error: "categoryExists" };
  }
  const categories = brand.categories.map((category) => {
    if (category.name !== categoryName) return category;
    return {
      ...category,
      subcategories: subcategories.map((subcategory) =>
        subcategory.name === trimmedName ? { ...subcategory, name: trimmedNextName, icon: icon.trim() } : subcategory
      ),
    };
  });
  await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brandId, JSON.stringify(categories)]);
  if (trimmedNextName !== trimmedName) {
    await sql.query(
      `UPDATE products SET subcategory = $4 WHERE brand = $1 AND category = $2 AND subcategory = $3`,
      [brandId, categoryName, trimmedName, trimmedNextName]
    );
    await sql.query(`UPDATE products SET category = $3 WHERE brand = $1 AND category = $2`, [brandId, trimmedName, trimmedNextName]);
  }
  return { ok: true };
}

export async function removeBrandSubcategory(brandId: string, categoryName: string, name: string): Promise<BrandResult> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT * FROM brands WHERE id = $1`, [brandId])) as any[];
  if (!rows[0]) return { ok: false, error: "invalidInput" };
  const brand = rowToBrand(rows[0]);
  const category = brand.categories.find((c) => c.name === categoryName);
  if (!category) return { ok: false, error: "invalidInput" };
  const subcategories = category.subcategories ?? [];
  if (subcategories.length <= 1) return { ok: false, error: "lastCategory" };
  const productRows = (await sql.query(
    `SELECT count(*)::int AS n FROM products WHERE brand = $1 AND ((category = $2 AND subcategory = $3) OR category = $3)`,
    [brandId, categoryName, name]
  )) as { n: number }[];
  if ((productRows[0]?.n ?? 0) > 0) return { ok: false, error: "categoryHasProducts" };
  const categories = brand.categories.map((c) =>
    c.name === categoryName ? { ...c, subcategories: subcategories.filter((s) => s.name !== name) } : c
  );
  await sql.query(`UPDATE brands SET categories = $2::jsonb WHERE id = $1`, [brandId, JSON.stringify(categories)]);
  return { ok: true };
}

/* ------------------------------------------------------------------ reviews */

export async function addReview(data: { orderId: string; rating: number; text: string }): Promise<{ ok: boolean }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { ok: false };
  const orderRows = (await sql.query(`SELECT id FROM orders WHERE id = $1 AND user_id = $2`, [data.orderId, currentUser.id])) as any[];
  if (!orderRows[0]) return { ok: false };
  const existing = (await sql.query(`SELECT 1 FROM reviews WHERE order_id = $1`, [data.orderId])) as any[];
  if (existing.length > 0) return { ok: false };
  const rating = Math.min(5, Math.max(1, Math.round(data.rating)));
  await sql.query(
    `INSERT INTO reviews (order_id, user_id, user_name, rating, text, site) VALUES ($1,$2,$3,$4,$5,$6)`,
    [data.orderId, currentUser.id, currentUser.name, rating, data.text.trim(), SITE_ID]
  );
  return { ok: true };
}

/**
 * Add a review tied to a table reservation. Only allowed when:
 *  - the reservation belongs to the signed-in user,
 *  - its status is `confirmed`,
 *  - the reservation date+time is in the past (so the guest actually visited),
 *  - no review for that reservation exists yet.
 */
export async function addReservationReview(data: {
  reservationId: string;
  rating: number;
  text: string;
}): Promise<{ ok: boolean; error?: "notFound" | "notConfirmed" | "notPast" | "alreadyReviewed" }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { ok: false, error: "notFound" };
  const rows = (await sql.query(
    `SELECT id, status, date, time FROM reservations WHERE id = $1 AND user_id = $2`,
    [data.reservationId, currentUser.id]
  )) as any[];
  const r = rows[0];
  if (!r) return { ok: false, error: "notFound" };
  if (r.status !== "confirmed") return { ok: false, error: "notConfirmed" };
  // Reservation must be in the past (Amsterdam wall-clock).
  const slot = `${r.date}T${r.time}:00`;
  const nowLocal = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam" }).replace(" ", "T");
  if (slot >= nowLocal) return { ok: false, error: "notPast" };
  const existing = (await sql.query(`SELECT 1 FROM reviews WHERE reservation_id = $1`, [data.reservationId])) as any[];
  if (existing.length > 0) return { ok: false, error: "alreadyReviewed" };
  const rating = Math.min(5, Math.max(1, Math.round(data.rating)));
  await sql.query(
    `INSERT INTO reviews (reservation_id, user_id, user_name, rating, text, site) VALUES ($1,$2,$3,$4,$5,$6)`,
    [data.reservationId, currentUser.id, currentUser.name, rating, data.text.trim(), SITE_ID]
  );
  return { ok: true };
}

/* ------------------------------------------------------------------ reservations */

export type ReservationError = "fillFields" | "invalidSlot" | "pastDate";

/** Format a sequential reservation number for display, e.g. 512 -> "RSV-512". */
export function formatReservationNumber(n: number): string {
  return `RSV-${n}`;
}

/**
 * Create a table reservation. Works for signed-in users (linked to their
 * account) and guests alike. Validates that the requested slot falls within
 * opening hours (Tue-Sun, 17:00-22:30) and is not in the past.
 */
export async function createReservation(data: {
  guestName: string;
  email?: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion?: string;
  note?: string;
  lang?: Lang;
  origin?: string;
}): Promise<{ ok: boolean; error?: ReservationError; reservation?: Reservation }> {
  await ensureReady();
  const currentUser = await getCurrentUser();

  const guestName = data.guestName.trim();
  const phone = data.phone.trim();
  if (!guestName || !phone || !data.date || !data.time) return { ok: false, error: "fillFields" };

  const slotMinutes = timeToMinutes(data.time);
  const slotDay = new Date(`${data.date}T00:00:00Z`).getUTCDay();
  if (Number.isNaN(slotMinutes) || !isOpenAt(slotDay, slotMinutes)) {
    return { ok: false, error: "invalidSlot" };
  }

  // No bookings in the past (Amsterdam wall-clock comparison via ISO strings).
  const now = amsterdamNow();
  if (data.date < now.localDate) return { ok: false, error: "pastDate" };
  if (data.date === now.localDate) {
    if (timeToMinutes(data.time) <= now.minutes) return { ok: false, error: "pastDate" };
  }

  const guests = Math.min(40, Math.max(1, Math.round(data.guests)));
  const email = (data.email ?? currentUser?.email ?? "").trim().toLowerCase();

  const rows = (await sql.query(
    `INSERT INTO reservations (user_id, guest_name, email, phone, date, time, guests, occasion, note, status, site)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10) RETURNING *`,
    [
      currentUser?.id ?? null,
      guestName,
      email,
      phone,
      data.date,
      data.time,
      guests,
      data.occasion?.trim() ?? "",
      data.note?.trim() || null,
      SITE_ID,
    ]
  )) as any[];

  const reservation = rowToReservation(rows[0]);

  // Confirmation email. Failures are logged, but the confirmed booking remains saved.
  if (email) {
    try {
      const base = siteBase(data.origin);
      const { subject, html } = reservationEmail({
        base,
        guestName,
        number: formatReservationNumber(reservation.reservationNumber),
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        note: reservation.note,
        lang: data.lang,
      });
      await sendMail({ to: email, subject, html });
    } catch (err) {
      console.error("[email] reservation confirmation failed:", err);
    }
  }

  return { ok: true, reservation };
}

/** Admin: confirm or decline a reservation. */
export async function setReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  await requireAdmin();
  await sql.query(`UPDATE reservations SET status = $1 WHERE id = $2`, [status, id]);
}

/** Customer: cancel their own upcoming reservation (admins can cancel any). */
export async function cancelReservation(id: string): Promise<{ ok: boolean }> {
  await ensureReady();
  const currentUser = await getCurrentUser();
  if (!currentUser) return { ok: false };
  if (currentUser.role === "admin") {
    await sql.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1`, [id]);
    return { ok: true };
  }
  await sql.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1 AND user_id = $2`, [id, currentUser.id]);
  return { ok: true };
}

/* ------------------------------------------------------------------ VIP */

export async function buyVip(origin?: string): Promise<{ ok: boolean; checkoutUrl?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.isVip || currentUser.accountType === "company") return { ok: false };

  // Without Mollie configured, activate VIP instantly (local dev fallback).
  if (!mollieEnabled()) {
    await sql.query(`UPDATE users SET is_vip = true WHERE id = $1`, [currentUser.id]);
    return { ok: true };
  }

  const recRows = (await sql.query(
    `INSERT INTO payments (kind, user_id, amount, status) VALUES ('vip', $1, $2, 'open') RETURNING id`,
    [currentUser.id, VIP_SALE_PRICE]
  )) as any[];
  const recordId = recRows[0].id as string;

  const { base, webhookUrl } = paymentUrls(origin);
  const payment = await createMolliePayment({
    amount: VIP_SALE_PRICE,
    description: "The Tandoor Company VIP membership",
    redirectUrl: `${base}/pay/complete?p=${recordId}`,
    webhookUrl,
    metadata: { p: recordId, kind: "vip" },
  });
  await sql.query(`UPDATE payments SET mollie_payment_id = $1 WHERE id = $2`, [payment.id, recordId]);

  return { ok: true, checkoutUrl: payment.checkoutUrl };
}

/**
 * Reconcile a Mollie payment: check its real status and, when paid, fulfil the
 * order or VIP purchase exactly once. Called from the return page and the webhook.
 */
export async function fulfillPaymentByRecord(recordId: string): Promise<{
  kind: "order" | "vip" | null;
  status: string;
  orderNumber?: number;
}> {
  await ensureReady();
  const rows = (await sql.query(`SELECT * FROM payments WHERE id = $1`, [recordId])) as any[];
  const rec = rows[0];
  if (!rec) return { kind: null, status: "not_found" };
  return fulfillPayment(rec);
}

export async function fulfillPaymentByMollieId(mollieId: string): Promise<void> {
  await ensureReady();
  const rows = (await sql.query(`SELECT * FROM payments WHERE mollie_payment_id = $1`, [mollieId])) as any[];
  if (rows[0]) await fulfillPayment(rows[0]);
}

async function fulfillPayment(rec: any): Promise<{ kind: "order" | "vip"; status: string; orderNumber?: number }> {
  // Already fulfilled - return the linked order number if any.
  if (rec.status === "paid") {
    let orderNumber: number | undefined;
    if (rec.order_id) {
      const orderRows = (await sql.query(`SELECT * FROM orders WHERE id = $1`, [rec.order_id])) as any[];
      if (orderRows[0]) {
        const itemRows = (await sql.query(`SELECT * FROM order_items WHERE order_id = $1`, [rec.order_id])) as any[];
        const order = rowToOrder(orderRows[0], itemRows.map(rowToOrderItem));
        await applyOrderCustomerEffects(order);
        orderNumber = order.orderNumber;
      }
    }
    return { kind: rec.kind, status: "paid", orderNumber };
  }

  const { status, failureReason } = await getMolliePayment(rec.mollie_payment_id);
  if (status !== "paid") {
    await sql.query(`UPDATE payments SET status = $1, failure_reason = $2, updated_at = now() WHERE id = $3 AND status <> 'paid'`, [status, failureReason ?? null, rec.id]);
    return { kind: rec.kind, status };
  }

  // Claim the payment atomically so fulfilment happens exactly once.
  const claim = (await sql.query(
    `UPDATE payments SET status = 'paid' WHERE id = $1 AND status <> 'paid' RETURNING *`,
    [rec.id]
  )) as any[];
  if (claim.length === 0) {
    // Someone else fulfilled it concurrently.
    return fulfillPayment({ ...rec, status: "paid" });
  }

  if (rec.kind === "vip") {
    if (rec.user_id) await sql.query(`UPDATE users SET is_vip = true WHERE id = $1`, [rec.user_id]);
    return { kind: "vip", status: "paid" };
  }

  if (rec.order_id) {
    await sql.query(`UPDATE orders SET paid = true WHERE id = $1`, [rec.order_id]);
    const orderRows = (await sql.query(`SELECT * FROM orders WHERE id = $1`, [rec.order_id])) as any[];
    const itemRows = (await sql.query(`SELECT * FROM order_items WHERE order_id = $1`, [rec.order_id])) as any[];
    const order = rowToOrder(orderRows[0], itemRows.map(rowToOrderItem));
    await applyOrderCustomerEffects(order);
    return { kind: "order", status: "paid", orderNumber: order.orderNumber };
  }

  // Legacy order payment records stored only the payload; create the order now.
  const computed = rec.payload as ComputedOrder;
  const order = await insertOrder(computed, true);
  await sql.query(`UPDATE payments SET order_id = $1 WHERE id = $2`, [order.id, rec.id]);
  return { kind: "order", status: "paid", orderNumber: order.orderNumber };
}

export async function requestVip(image: string): Promise<{ ok: boolean }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.isVip || currentUser.accountType === "company") return { ok: false };
  const pending = (await sql.query(`SELECT 1 FROM vip_requests WHERE user_id = $1 AND status = 'pending'`, [currentUser.id])) as any[];
  if (pending.length > 0) return { ok: false };
  await sql.query(`INSERT INTO vip_requests (user_id, user_name, image) VALUES ($1,$2,$3)`, [
    currentUser.id,
    currentUser.name,
    image,
  ]);
  return { ok: true };
}

export async function approveVipRequest(requestId: string): Promise<void> {
  await requireAdmin();
  const rows = (await sql.query(`SELECT user_id FROM vip_requests WHERE id = $1`, [requestId])) as any[];
  if (rows[0]) {
    await sql.query(`UPDATE users SET is_vip = true WHERE id = $1`, [rows[0].user_id]);
    await sql.query(`UPDATE vip_requests SET status = 'approved' WHERE id = $1`, [requestId]);
  }
}

export async function rejectVipRequest(requestId: string): Promise<void> {
  await requireAdmin();
  await sql.query(`UPDATE vip_requests SET status = 'rejected' WHERE id = $1`, [requestId]);
}

/* ------------------------------------------------------------------ social links */

/** Admin: set the URL and visibility of a footer social media link. */
export async function updateSocialLink(platform: SocialPlatform, url: string, enabled: boolean): Promise<void> {
  await ensureReady();
  await requireAdmin();
  await sql.query(
    `INSERT INTO social_links (platform, url, enabled) VALUES ($1, $2, $3)
     ON CONFLICT (platform) DO UPDATE SET url = $2, enabled = $3, updated_at = now()`,
    [platform, url.trim(), enabled]
  );
}

/* ------------------------------------------------------------------ gallery */

/** Public: all gallery photos of THIS site, newest first. */
export async function listGalleryImages(): Promise<GalleryImage[]> {
  await ensureReady();
  const rows = (await sql.query(
    `SELECT * FROM gallery_images WHERE site = $1 ORDER BY sort ASC, created_at DESC`,
    [SITE_ID]
  )) as any[];
  return rows.map(rowToGalleryImage);
}

/** Admin: upload a photo (data URL) to DigitalOcean Spaces and add it to the gallery. */
export async function addGalleryImage(data: {
  image: string;
  alt?: string;
  altNl?: string;
  category?: string;
  portrait?: boolean;
}): Promise<{ ok: boolean; image?: GalleryImage; error?: string }> {
  await ensureReady();
  await requireAdmin();
  if (!data.image?.startsWith("data:image/")) return { ok: false, error: "invalidInput" };
  // Upload to Spaces (falls back to storing the data URL when Spaces is not configured).
  const url = (await storeImage(data.image, `gallery/${SITE_ID}`)) as string;
  const rows = (await sql.query(
    `INSERT INTO gallery_images (site, url, alt, alt_nl, category, portrait) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [SITE_ID, url, data.alt?.trim() ?? "", data.altNl?.trim() ?? "", data.category?.trim() ?? "", !!data.portrait]
  )) as any[];
  return { ok: true, image: rowToGalleryImage(rows[0]) };
}

/** Admin: remove a gallery photo (also deletes the stored file in Spaces). */
export async function removeGalleryImage(id: string): Promise<{ ok: boolean }> {
  await ensureReady();
  await requireAdmin();
  const rows = (await sql.query(`DELETE FROM gallery_images WHERE id = $1 AND site = $2 RETURNING url`, [
    id,
    SITE_ID,
  ])) as any[];
  await deleteStoredImage(rows[0]?.url);
  return { ok: true };
}

/* ------------------------------------------------------------------ helpers */

async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  return user;
}
