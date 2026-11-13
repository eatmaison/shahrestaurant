import type { Order, Product, User } from "./types";

export type CustomerMetric = {
  key: string; name: string; email?: string; userId?: string;
  basis: "account" | "session" | "order";
  orderCount: number; paidOrders: number; paidValue: number;
  bookedValue: number; unpaidCompanyValue: number; averageValue: number;
  firstOrder: number; lastOrder: number; favourite?: { name: string; quantity: number };
};

export const isBookedOrder = (order: Pick<Order, "paid" | "accountType">) => order.paid || order.accountType === "company";
const cents = (value: number) => Number.isFinite(value) ? Math.round(value * 100) : 0;
const normalized = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

/** Observed order groups, never inferred people. Same-name guests are not merged. */
export function buildCustomerMetrics(orders: readonly Order[], users: readonly User[], matches: (time: number) => boolean): CustomerMetric[] {
  const accounts = new Map(users.map(user => [user.id, user]));
  const groups = new Map<string, { metric: CustomerMetric; names: Set<string>; products: Map<string, { name: string; quantity: number; at: number }> }>();
  for (const order of new Map(orders.map(order => [order.id, order])).values()) {
    if (!isBookedOrder(order) || !matches(order.createdAt)) continue;
    const basis = order.userId ? "account" : order.visitorSessionId ? "session" : "order";
    const key = `${basis}:${order.userId || order.visitorSessionId || order.id}`;
    const account = order.userId ? accounts.get(order.userId) : undefined;
    let group = groups.get(key);
    if (!group) {
      group = { metric: { key, basis, name: account?.name || order.customerName, email: account?.email, userId: order.userId,
        orderCount: 0, paidOrders: 0, paidValue: 0, bookedValue: 0, unpaidCompanyValue: 0, averageValue: 0,
        firstOrder: order.createdAt, lastOrder: order.createdAt }, names: new Set(), products: new Map() };
      groups.set(key, group);
    }
    const metric = group.metric;
    group.names.add(normalized(order.customerName));
    metric.orderCount++;
    metric.bookedValue += cents(order.total);
    if (order.paid) { metric.paidOrders++; metric.paidValue += cents(order.total); }
    else metric.unpaidCompanyValue += cents(order.total);
    metric.firstOrder = Math.min(metric.firstOrder, order.createdAt);
    metric.lastOrder = Math.max(metric.lastOrder, order.createdAt);
    for (const item of order.items) {
      const current = group.products.get(item.productId) || { name: item.name, quantity: 0, at: order.createdAt };
      current.quantity += item.qty;
      if (order.createdAt >= current.at) { current.name = item.name; current.at = order.createdAt; }
      group.products.set(item.productId, current);
    }
  }
  return [...groups.values()].map(({ metric, names, products }) => ({
    ...metric,
    // Conflicting submission names within a browser are not a verified identity.
    name: metric.basis !== "account" && names.size !== 1 ? "" : metric.name,
    bookedValue: metric.bookedValue / 100, paidValue: metric.paidValue / 100,
    unpaidCompanyValue: metric.unpaidCompanyValue / 100,
    averageValue: metric.orderCount ? metric.bookedValue / 100 / metric.orderCount : 0,
    favourite: [...products.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))[0],
  })).sort((a, b) => b.bookedValue - a.bookedValue || b.lastOrder - a.lastOrder || a.key.localeCompare(b.key));
}

export function summarizeOrders(orders: readonly Order[], products: readonly Product[], matches: (time: number) => boolean) {
  const catalogue = new Map(products.map(product => [product.id, product]));
  let paid = 0, company = 0, count = 0, excluded = 0;
  const categories = new Map<string, number>();
  const items = new Map<string, { name: string; quantity: number; gross: number }>();
  for (const order of new Map(orders.map(order => [order.id, order])).values()) {
    if (!matches(order.createdAt)) continue;
    if (!isBookedOrder(order)) { excluded++; continue; }
    count++;
    if (order.paid) paid += cents(order.total); else company += cents(order.total);
    for (const item of order.items) {
      const gross = cents(item.price) * item.qty;
      // Prefer the category captured with the order, not today's renamed catalogue.
      const category = item.category || catalogue.get(item.productId)?.category || "Other";
      categories.set(category, (categories.get(category) || 0) + gross);
      const current = items.get(item.productId) || { name: item.name, quantity: 0, gross: 0 };
      current.quantity += item.qty; current.gross += gross; items.set(item.productId, current);
    }
  }
  return { paidValue: paid / 100, unpaidCompanyValue: company / 100, bookedValue: (paid + company) / 100, count, excluded,
    average: count ? (paid + company) / 100 / count : 0,
    categories: [...categories].map(([name, value]) => ({ name, gross: value / 100 })).sort((a, b) => b.gross - a.gross),
    products: [...items].map(([id, item]) => ({ id, ...item, gross: item.gross / 100 })).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)) };
}
