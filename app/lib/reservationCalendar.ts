import type { Reservation } from "./types";
import { arrivalUtc } from "./restaurantClock";

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
function fold(line: string): string {
  const encoder = new TextEncoder(); let bytes = 0; let result = "";
  for (const character of line) { const size = encoder.encode(character).length; if (bytes + size > 74) { result += "\r\n "; bytes = 1; } result += character; bytes += size; }
  return result;
}

/** RFC 5545; contains booking reference/arrival, never the guest's contact details. */
export function reservationCalendar(reservation: Reservation, now = new Date()): string {
  const status = reservation.status === "pending" ? "TENTATIVE" : ["cancelled", "declined"].includes(reservation.status) ? "CANCELLED" : "CONFIRMED";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shah Restaurant//Reservations//NL", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${escapeText(reservation.id)}@shahrestaurant.nl`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(arrivalUtc(reservation.date, reservation.time))}`,
    `SUMMARY:${escapeText(`Shah Restaurant - RSV-${reservation.reservationNumber}`)}`,
    `LOCATION:${escapeText("Klaprozenweg 36a, 1032 KL Amsterdam")}`, `DESCRIPTION:${escapeText(`${reservation.guests} gasten. Tel: +31 20 341 2995.`)}`,
    `STATUS:${status}`, "URL:https://shahrestaurant.nl/reservations", "END:VEVENT", "END:VCALENDAR", ""].map(fold).join("\r\n");
}

export function downloadReservationCalendar(reservation: Reservation): void {
  const url = URL.createObjectURL(new Blob([reservationCalendar(reservation)], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `shah-reservering-${reservation.reservationNumber}.ics`;
  document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
