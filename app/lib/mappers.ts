import { isDrinkCategory, normalizeDrinkSubcategory } from "./data";
import type { GalleryImage, Order, OrderItem, Product, Reservation, Review, User, VipRequest } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Postgres `numeric` comes back as a string - convert to a JS number. */
export function toNum(v: unknown): number {
  return typeof v === "string" ? parseFloat(v) : (v as number);
}

/** Convert a timestamptz (Date or ISO string) to epoch milliseconds. */
export function toMs(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  return new Date(v as string).getTime();
}

function inferDrinkSubcategory(r: any): string | undefined {
  const explicit = r.subcategory || normalizeDrinkSubcategory(r.category);
  if (explicit) return explicit;
  const text = `${r.name ?? ""} ${r.description ?? ""}`.toLowerCase();
  if (text.includes("lassi")) return "Indian Lassi";
  if (text.includes("matcha")) return "Matcha's";
  if (text.includes("smoothie")) return "Smoothies";
  if (text.includes("bubble tea")) return "Bubble Tea's";
  if (/(cola|coca|fanta|sprite|fernandes|fuze|tea|water|spa|gingerale|ice tea)/.test(text)) return "Soft Drinks";
  return undefined;
}

export function rowToUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: "", // never expose the hash to the client
    phone: r.phone ?? undefined,
    address: r.address ?? undefined,
    postcode: r.postcode ?? undefined,
    role: r.role,
    createdAt: toMs(r.created_at),
    points: r.points,
    orderCount: r.order_count,
    isVip: r.is_vip,
    accountType: r.account_type,
    btw: r.btw ?? undefined,
    kvk: r.kvk ?? undefined,
    emailVerified: r.email_verified ?? false,
    lastSeenAt: r.last_seen_at ? toMs(r.last_seen_at) : undefined,
    lastSeenSite: r.last_seen_site ?? undefined,
  };
}

export function rowToProduct(r: any): Product {
  const category = isDrinkCategory(r.category) ? "Drinks" : r.category;
  const subcategory = r.subcategory || (category === "Drinks" ? inferDrinkSubcategory(r) : undefined);
  return {
    id: r.id,
    brand: r.brand,
    category,
    subcategory: subcategory || undefined,
    name: r.name,
    description: r.description,
    descriptionNl: r.description_nl || undefined,
    price: toNum(r.price),
    image: r.image ?? undefined,
    detailedDescription: r.detailed_description ?? undefined,
    ingredients: r.ingredients ?? [],
    ingredientsNl: r.ingredients_nl ?? [],
    allergens: r.allergens ?? [],
    allergensNl: r.allergens_nl ?? [],
  };
}

export function rowToOrderItem(r: any): OrderItem {
  return {
    productId: r.product_id,
    name: r.name,
    price: toNum(r.price),
    qty: r.qty,
    brand: r.brand,
    category: r.category ?? "",
  };
}

export function rowToOrder(r: any, items: OrderItem[]): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id ?? undefined,
    customerName: r.customer_name,
    address: r.address,
    postcode: r.postcode ?? "",
    phone: r.phone,
    items,
    subtotal: toNum(r.subtotal),
    discount: toNum(r.discount),
    pointsUsed: r.points_used,
    pointsEarned: r.points_earned,
    delivery: toNum(r.delivery),
    total: toNum(r.total),
    createdAt: toMs(r.created_at),
    status: r.status,
    paid: r.paid,
    accountType: r.account_type,
    invoiceSent: r.invoice_sent,
    note: r.note ?? undefined,
    schedule: r.schedule ?? undefined,
    fulfillment: r.fulfillment ?? "delivery",
  };
}

export function rowToReview(r: any): Review {
  return {
    id: r.id,
    orderId: r.order_id ?? undefined,
    reservationId: r.reservation_id ?? undefined,
    userId: r.user_id ?? "",
    userName: r.user_name,
    rating: r.rating,
    text: r.text ?? "",
    createdAt: toMs(r.created_at),
    site: r.site ?? "eattogo",
  };
}

export function rowToVipRequest(r: any): VipRequest {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    image: r.image,
    status: r.status,
    createdAt: toMs(r.created_at),
  };
}

export function rowToReservation(r: any): Reservation {
  return {
    id: r.id,
    reservationNumber: r.reservation_number,
    userId: r.user_id ?? undefined,
    guestName: r.guest_name,
    email: r.email ?? "",
    phone: r.phone,
    date: r.date,
    time: r.time,
    guests: r.guests,
    occasion: r.occasion || undefined,
    note: r.note ?? undefined,
    status: r.status,
    createdAt: toMs(r.created_at),
  };
}

export function rowToGalleryImage(r: any): GalleryImage {
  return {
    id: r.id,
    url: r.url,
    alt: r.alt ?? "",
    altNl: r.alt_nl ?? "",
    category: r.category ?? "",
    portrait: r.portrait ?? false,
    createdAt: toMs(r.created_at),
  };
}
