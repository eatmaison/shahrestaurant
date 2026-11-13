import { amsterdamDateKey, shiftCalendarDate, rangeFilterError, type RangeFilter } from "./adminMetrics";
export function rangeBounds(range: RangeFilter, now: number) {
  if (rangeFilterError(range, now)) return;
  const today = amsterdamDateKey(now);
  if (range.preset === "all") return;
  const end = range.preset === "date" ? range.endDate! : today;
  const start = range.preset === "date" ? range.startDate! : shiftCalendarDate(end, range.preset === "7d" ? -6 : range.preset === "30d" ? -29 : 0);
  const days = Math.round((Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 86_400_000) + 1;
  return { start, end, days };
}
export function previousPeriod(range: RangeFilter, now: number): RangeFilter | undefined {
  const bounds = rangeBounds(range, now); if (!bounds) return;
  const endDate = shiftCalendarDate(bounds.start, -1);
  return { preset: "date", startDate: shiftCalendarDate(endDate, 1 - bounds.days), endDate };
}
export function previousMonth(now: number): RangeFilter {
  const endDate = shiftCalendarDate(amsterdamDateKey(now).slice(0, 8) + "01", -1);
  return { preset: "date", startDate: endDate.slice(0, 8) + "01", endDate };
}
export function percentageChange(current: number, previous: number): number | undefined {
  return previous > 0 && Number.isFinite(current) && Number.isFinite(previous) ? (current - previous) / previous * 100 : undefined;
}
export function rangeFilename(range: RangeFilter, now: number) {
  const bounds = rangeBounds(range, now);
  return bounds ? `${bounds.start}_to_${bounds.end}` : `all-through-${amsterdamDateKey(now)}`;
}
