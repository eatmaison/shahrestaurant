const clock = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function amsterdamDateTime(date = new Date()): string {
  const parts = Object.fromEntries(clock.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Restaurant arrivals are outside DST's ambiguous night-time transition hours. */
export function arrivalUtc(date: string, time: string): Date {
  const value = `${date}T${time}`;
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error("Invalid arrival");
  const nominal = new Date(value + ":00Z");
  if (!Number.isFinite(nominal.getTime()) || nominal.toISOString().slice(0, 16) !== value) throw new Error("Invalid arrival");
  const represented = new Date(amsterdamDateTime(nominal) + ":00Z");
  const result = new Date(nominal.getTime() * 2 - represented.getTime());
  if (amsterdamDateTime(result) !== value) throw new Error("Ambiguous arrival");
  return result;
}
