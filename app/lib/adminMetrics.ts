import { uniqueAdminOrders, validOrderAmount } from "./adminOrderQuality";
import { arrivalUtc } from "./restaurantClock";

/** Calendar-day filters use the restaurant's timezone, not the admin device's. */
export type RangeFilter = {
  preset: "all" | "today" | "7d" | "30d" | "date";
  startDate?: string;
  endDate?: string;
};
export type DailyMetric = { date: string; revenue: number; orders: number };
type MetricOrder = { id?: string; createdAt: number; total: number; paid: boolean; accountType: string };

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
});

export function amsterdamDateKey(timestamp: number): string {
  const parts = dateFormatter.formatToParts(timestamp);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function validDate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  try {
    arrivalUtc(value, "00:00");
    return true;
  } catch {
    return false;
  }
}

/** UTC is used only for calendar arithmetic, never to classify an order's day. */
export function shiftCalendarDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function rangeFilterError(filter: RangeFilter, now?: number): "incomplete" | "invalid" | "future" | null {
  if (filter.preset !== "date") return null;
  if (!filter.startDate || !filter.endDate) return "incomplete";
  if (!validDate(filter.startDate) || !validDate(filter.endDate) || filter.startDate > filter.endDate) return "invalid";
  if (!validDate(shiftCalendarDate(filter.endDate, 1))) return "invalid";
  if (now && filter.endDate > amsterdamDateKey(now)) return "future";
  return null;
}

function dateWindow(filter: RangeFilter, now: number): { startDate?: string; endDate: string } | null {
  if (rangeFilterError(filter, now)) return null;
  const today = amsterdamDateKey(now);
  switch (filter.preset) {
    case "all": return { endDate: today };
    case "today": return { startDate: today, endDate: today };
    case "7d": return { startDate: shiftCalendarDate(today, -6), endDate: today };
    case "30d": return { startDate: shiftCalendarDate(today, -29), endDate: today };
    case "date": return { startDate: filter.startDate!, endDate: filter.endDate! };
  }
}

/** An inclusive end date ends at the NEXT Amsterdam midnight, including DST days. */
export function makeRangeCheck(filter: RangeFilter, now: number): (timestamp: number) => boolean {
  const window = dateWindow(filter, now);
  if (!window) return () => false;
  const start = window.startDate ? arrivalUtc(window.startDate, "00:00").getTime() : -Infinity;
  const end = arrivalUtc(shiftCalendarDate(window.endDate, 1), "00:00").getTime();
  return (timestamp) => Number.isFinite(timestamp) && timestamp >= start && timestamp < end && timestamp <= now;
}

/** O(orders + days): no pagination or rolling limit is applied to All time. */
export function buildDailyMetrics(orders: readonly MetricOrder[], filter: RangeFilter, now: number): DailyMetric[] {
  const window = dateWindow(filter, now);
  if (!window) return [];
  let startDate = window.startDate;
  if (!startDate) {
    let first = Infinity;
    for (const order of uniqueAdminOrders(orders)) {
      if (Number.isFinite(order.createdAt) && order.createdAt <= now && order.createdAt < first) first = order.createdAt;
    }
    if (!Number.isFinite(first)) return [];
    // Even an unpaid first order marks the beginning of the restaurant's history.
    startDate = amsterdamDateKey(first);
  }
  const matches = makeRangeCheck(filter, now);
  const totals = new Map<string, DailyMetric>();
  for (let date = startDate; date <= window.endDate; date = shiftCalendarDate(date, 1)) {
    totals.set(date, { date, revenue: 0, orders: 0 });
  }
  for (const order of uniqueAdminOrders(orders)) {
    if (!validOrderAmount(order.total) || !(order.paid || order.accountType === "company") || !matches(order.createdAt)) continue;
    const metric = totals.get(amsterdamDateKey(order.createdAt));
    if (metric) { metric.revenue = Math.round(metric.revenue * 100 + Math.round(order.total * 100)) / 100; metric.orders += 1; }
  }
  return [...totals.values()];
}
