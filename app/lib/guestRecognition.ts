import type { RecentVisitor, User } from "./types";

/** Admin-only input. Never attach these raw identity records to a public response. */
export interface GuestOrderIdentity {
  id: string;
  user_id?: string | null;
  visitor_session_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  address: string;
  postcode: string;
  fulfillment: string;
  paid: boolean;
}
export interface GuestReservationIdentity {
  id: string;
  user_id?: string | null;
  visitor_session_id?: string | null;
  guest_name: string;
  email?: string | null;
}
export interface GuestSessionRecord {
  id: string;
  created_at?: string | number | Date;
  last_seen_at: string | number | Date;
  last_seen_site?: string;
  visit_count?: number;
  active_seconds?: number;
}
export interface ReservationCounts {
  maison: number;
  tandoor: number;
  maisonArrived: number;
  tandoorArrived: number;
}
const normalize = (value?: string | null) => (value ?? "").normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase();
const isUsefulName = (name: string) => !!name && !["guest", "anonymous", "unknown", "n/a", "-"].includes(name);
const emailKey = (value?: string | null) => (value ?? "").trim().toLowerCase();
const timestamp = (value?: string | number | Date) => {
  const time = value == null ? 0 : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

/** Exact, complete delivery fields only. Never use IP, partial addresses or fuzzy names. */
function deliveryKey(order: GuestOrderIdentity): string | undefined {
  if (order.fulfillment !== "delivery") return;
  const name = normalize(order.customer_name);
  const address = normalize(order.address);
  const postcode = (order.postcode ?? "").replace(/\s/gu, "").toUpperCase();
  if (!isUsefulName(name) || !/\p{L}/u.test(address) || !/\d/u.test(address) || !/^[1-9]\d{3}[A-Z]{2}$/.test(postcode)) return;
  // JSON preserves field boundaries, house numbers, suffixes and unit numbers.
  return JSON.stringify([name, address, postcode]);
}

/** All accounts, including old/never-seen ones. No guest traffic can displace them. */
export function buildRegisteredVisitors(users: User[], counts: Map<string, ReservationCounts>, nowMs: number): RecentVisitor[] {
  return users.map((user) => ({
    id: user.id, kind: "user", name: user.name, email: user.email, phone: user.phone,
    role: user.role, accountType: user.accountType, isVip: user.isVip,
    lastSeenAt: user.lastSeenAt ?? 0, lastSeenSite: user.lastSeenSite,
    firstSeenAt: user.createdAt, activeSeconds: user.activeSeconds,
    maisonReservationCount: counts.get(user.id)?.maison ?? 0,
    tandoorReservationCount: counts.get(user.id)?.tandoor ?? 0,
    maisonArrivedCount: counts.get(user.id)?.maisonArrived ?? 0,
    tandoorArrivedCount: counts.get(user.id)?.tandoorArrived ?? 0,
    isOnline: !!user.lastSeenAt && nowMs >= user.lastSeenAt && nowMs - user.lastSeenAt < 5 * 60_000,
    orderCount: user.orderCount,
  }));
}

/** Recognition is descriptive admin analytics, never authentication or a customer merge. */
export function buildGuestVisitors(
  sessions: GuestSessionRecord[], allOrders: GuestOrderIdentity[],
  allReservations: GuestReservationIdentity[], nowMs: number,
): RecentVisitor[] {
  const ordersBySession = new Map<string, GuestOrderIdentity[]>();
  const reservationsBySession = new Map<string, GuestReservationIdentity[]>();
  const deliveryGroups = new Map<string, GuestOrderIdentity[]>();
  // Deduplicate by source record, not by customer name or session.
  for (const order of new Map(allOrders.map((order) => [order.id, order])).values()) {
    if (order.user_id) continue;
    if (order.visitor_session_id) {
      const records = ordersBySession.get(order.visitor_session_id) ?? [];
      records.push(order); ordersBySession.set(order.visitor_session_id, records);
    }
    const key = deliveryKey(order);
    if (key) {
      const records = deliveryGroups.get(key) ?? [];
      records.push(order); deliveryGroups.set(key, records);
    }
  }
  for (const reservation of new Map(allReservations.map((row) => [row.id, row])).values()) {
    if (reservation.user_id || !reservation.visitor_session_id) continue;
    const records = reservationsBySession.get(reservation.visitor_session_id) ?? [];
    records.push(reservation); reservationsBySession.set(reservation.visitor_session_id, records);
  }
  return sessions.map((row) => {
    const orders = ordersBySession.get(row.id) ?? [];
    const reservations = reservationsBySession.get(row.id) ?? [];
    const identities = [
      ...orders.map((order) => ({ name: order.customer_name, email: order.customer_email })),
      ...reservations.map((reservation) => ({ name: reservation.guest_name, email: reservation.email })),
    ];
    const names = new Set(identities.map((identity) => normalize(identity.name)));
    const emails = new Set(identities.map((identity) => emailKey(identity.email)).filter(Boolean));
    const identified = identities.length > 0 && names.size === 1 && [...names].every(isUsefulName) && emails.size <= 1;
    const matching = new Map<string, GuestOrderIdentity>();
    const deliveryKeys = new Set(orders.map(deliveryKey).filter((key): key is string => !!key));
    // One displayed total describes one exact address, never a union of households.
    // A session with multiple complete delivery keys needs per-address analysis instead.
    if (identified && deliveryKeys.size === 1) {
      const candidates = deliveryGroups.get([...deliveryKeys][0]) ?? [];
      const candidateEmails = new Set([...emails, ...candidates.map((candidate) => emailKey(candidate.customer_email))].filter(Boolean));
      // A shared name/address with conflicting contacts is not a repeat customer.
      if (candidateEmails.size <= 1) {
        for (const candidate of candidates) matching.set(candidate.id, candidate);
      }
    }
    const lastSeenAt = timestamp(row.last_seen_at);
    return {
      id: row.id, kind: "guest", name: identified ? identities[0].name.trim() : "Guest",
      email: identified ? identities.find((identity) => emailKey(identity.email))?.email?.trim() : undefined,
      role: "guest", accountType: "guest", lastSeenAt, lastSeenSite: row.last_seen_site,
      isOnline: lastSeenAt > 0 && nowMs >= lastSeenAt && nowMs - lastSeenAt < 5 * 60_000,
      sessionId: row.id, visitCount: Number(row.visit_count ?? 1),
      orderCount: orders.length, paidOrderCount: orders.filter((order) => order.paid).length,
      reservationCount: reservations.length,
      identityStatus: identified ? "identified" : identities.length ? "ambiguous" : "unknown",
      identitySource: identified ? (orders.length && reservations.length ? "order_and_reservation" : orders.length ? "order" : "reservation") : undefined,
      matchingOrderCount: identified && matching.size > 1 ? matching.size : undefined,
      matchingPaidOrderCount: identified && matching.size > 1 ? [...matching.values()].filter((order) => order.paid).length : undefined,
      activeSeconds: Number(row.active_seconds ?? 0), firstSeenAt: timestamp(row.created_at) || undefined,
    };
  });
}
