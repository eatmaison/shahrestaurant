import { adminMatches } from "./adminList";
import type { RecentVisitor } from "./types";

export interface VisitorFilters {
  kind: "all" | "user" | "guest";
  search: string;
  onlineOnly: boolean;
  sort: "recent" | "online" | "visits" | "firstSeen";
}
/** Filter the complete list before paging; never let guests displace registered users. */
export function filterVisitors(visitors: RecentVisitor[], filters: VisitorFilters): RecentVisitor[] {
  const query = filters.search.trim().toLowerCase();
  const list = visitors.filter((entry) => {
    if (filters.kind !== "all" && entry.kind !== filters.kind) return false;
    if (filters.onlineOnly && !entry.isOnline) return false;
    return adminMatches(query, [entry.name, entry.email, entry.phone, entry.sessionId, entry.id, entry.observation?.source.label,
      entry.observation?.source.referrerHost, entry.observation?.source.campaign, entry.observation?.source.medium,
      entry.observation?.lastPath]);
  });
  const recent = (a: RecentVisitor, b: RecentVisitor) => b.lastSeenAt - a.lastSeenAt || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id);
  const visits = (entry: RecentVisitor) => entry.visitCount ?? (entry.kind === "user" ? entry.orderCount ?? 0 : 1);
  return list.sort((a, b) => {
    if (filters.sort === "online") return Number(b.isOnline) - Number(a.isOnline) || recent(a, b);
    if (filters.sort === "visits") return visits(b) - visits(a) || recent(a, b);
    if (filters.sort === "firstSeen") return (a.firstSeenAt || a.lastSeenAt || Infinity) - (b.firstSeenAt || b.lastSeenAt || Infinity) || recent(a, b);
    return recent(a, b);
  });
}
export function paginateVisitors(visitors: RecentVisitor[], requestedPage: number, requestedSize = 50) {
  const pageSize = Number.isFinite(requestedSize) ? Math.max(1, Math.min(100, Math.floor(requestedSize))) : 50;
  const pageCount = Math.max(1, Math.ceil(visitors.length / pageSize));
  const page = Math.max(1, Math.min(pageCount, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const start = (page - 1) * pageSize;
  return { entries: visitors.slice(start, start + pageSize), page, pageCount, total: visitors.length, from: visitors.length ? start + 1 : 0, to: Math.min(start + pageSize, visitors.length) };
}
