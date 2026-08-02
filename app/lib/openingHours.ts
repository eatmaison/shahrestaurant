/**
 * Opening hours (Europe/Amsterdam time):
 * - Monday: closed (nobody works)
 * - Tuesday–Sunday: 17:00–22:30
 * Order/status cutoff is 21:30; table reservations can still use the full window.
 */

/** Day the shop is fully closed. 0 = Sunday … 1 = Monday … 6 = Saturday. */
export const CLOSED_DAY = 1;

/** Daily opening window in minutes since midnight (17:00–22:30). */
export const OPEN_FROM_MIN = 17 * 60;
export const OPEN_UNTIL_MIN = 22 * 60 + 30;
export const ORDER_UNTIL_MIN = 21 * 60 + 30;

/** Human-readable strings for display. */
export const OPEN_FROM = "17:00";
export const OPEN_UNTIL = "22:30";

export type RestaurantOpenOverride = "auto" | "open" | "closed";

export interface RestaurantStatus {
  isOpen: boolean;
  override: RestaurantOpenOverride;
  activeOverride: RestaurantOpenOverride;
  overrideDate?: string;
  canOverride: boolean;
  nextOpening: { daysAhead: number; weekday: number } | null;
}

/** Current weekday (0-6, Sunday = 0) and minutes since midnight in Amsterdam. */
export function amsterdamNow(date: Date = new Date()): { day: number; minutes: number; localDate: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = dayNames.indexOf(get("weekday"));
  const hour = parseInt(get("hour"), 10) % 24; // "24" can appear for midnight
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  const localDate = `${get("year")}-${get("month")}-${get("day")}`;
  return { day, minutes, localDate };
}

/** Whether the shop is open on the given weekday at the given minute of day. */
export function isOpenAt(day: number, minutes: number): boolean {
  if (day === CLOSED_DAY) return false;
  return minutes >= OPEN_FROM_MIN && minutes < OPEN_UNTIL_MIN;
}

function isTakingOrdersAt(day: number, minutes: number): boolean {
  if (day === CLOSED_DAY) return false;
  return minutes >= OPEN_FROM_MIN && minutes < ORDER_UNTIL_MIN;
}

/** Whether the shop is open right now (Amsterdam time). */
export function isOpenNow(date: Date = new Date()): boolean {
  const { day, minutes } = amsterdamNow(date);
  return isOpenAt(day, minutes);
}

/**
 * When the kitchen next starts preparing orders (Amsterdam time).
 * Returns null while open; otherwise the number of days ahead (0 = later
 * today) and the weekday (0-6, Sunday = 0) of the next opening at 17:00.
 */
export function nextOpening(date: Date = new Date()): { daysAhead: number; weekday: number } | null {
  const { day, minutes } = amsterdamNow(date);
  if (isOpenAt(day, minutes)) return null;
  if (day !== CLOSED_DAY && minutes < OPEN_FROM_MIN) return { daysAhead: 0, weekday: day };
  let weekday = (day + 1) % 7;
  let daysAhead = 1;
  while (weekday === CLOSED_DAY) {
    weekday = (weekday + 1) % 7;
    daysAhead++;
  }
  return { daysAhead, weekday };
}

function nextOrderOpening(date: Date = new Date()): { daysAhead: number; weekday: number } | null {
  const { day, minutes } = amsterdamNow(date);
  if (isTakingOrdersAt(day, minutes)) return null;
  if (day !== CLOSED_DAY && minutes < OPEN_FROM_MIN) return { daysAhead: 0, weekday: day };
  let weekday = (day + 1) % 7;
  let daysAhead = 1;
  while (weekday === CLOSED_DAY) {
    weekday = (weekday + 1) % 7;
    daysAhead++;
  }
  return { daysAhead, weekday };
}

/** Effective customer-facing status, including today's admin override. */
export function restaurantStatus(override: RestaurantOpenOverride = "auto", overrideDate?: string, date: Date = new Date()): RestaurantStatus {
  const { day, minutes, localDate } = amsterdamNow(date);
  const canOverride = day !== CLOSED_DAY && minutes < ORDER_UNTIL_MIN;
  const activeOverride = overrideDate === localDate ? override : "auto";
  const scheduledOpen = isTakingOrdersAt(day, minutes);
  const isOpen = canOverride && (activeOverride === "open" || (activeOverride !== "closed" && scheduledOpen));
  return {
    isOpen,
    override,
    activeOverride,
    overrideDate,
    canOverride,
    nextOpening: isOpen ? null : nextOrderOpening(date),
  };
}

/** Parse "HH:mm" into minutes since midnight (NaN when malformed). */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

/** Whether a scheduled delivery slot falls within opening hours. */
export function isScheduleSlotOpen(schedule: { type: "once" | "workdays"; date?: string; time: string }): boolean {
  const minutes = timeToMinutes(schedule.time);
  if (Number.isNaN(minutes) || minutes < OPEN_FROM_MIN || minutes >= ORDER_UNTIL_MIN) return false;
  if (schedule.type === "once" && schedule.date) {
    // Date-only strings parse as UTC midnight; getUTCDay gives the calendar weekday.
    const day = new Date(`${schedule.date}T00:00:00Z`).getUTCDay();
    if (day === CLOSED_DAY) return false;
  }
  return true;
}
