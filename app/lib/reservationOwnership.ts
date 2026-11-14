import type { Reservation, User } from "./types";

type ReservationIdentity = Pick<User, "id" | "email" | "emailVerified" | "role">;
const normalizedEmail = (email: string) => email.trim().toLowerCase();

/** Ordinary accounts verify their address; admins already have reservation read access. */
export function personalReservationEmail(user: ReservationIdentity): string {
  return user.emailVerified || user.role === "admin" ? normalizedEmail(user.email) : "";
}

export function isPersonalReservation(reservation: Pick<Reservation, "userId" | "email">, user: ReservationIdentity | null): boolean {
  if (!user) return false;
  if (reservation.userId === user.id) return true;
  const email = personalReservationEmail(user);
  return email !== "" && normalizedEmail(reservation.email) === email;
}

/** Fixed SQL fragment; values always remain separate query parameters. */
export const PERSONAL_RESERVATION_SQL = `(user_id = $1 OR ($2 <> '' AND LOWER(BTRIM(email)) = $2))`;
