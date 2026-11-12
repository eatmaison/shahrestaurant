/** Optional, additive schema capability. This module never runs DDL. */
export const RESERVATION_SESSION_CAPABILITY_SQL = `SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = current_schema() AND table_name = 'reservations' AND column_name = 'visitor_session_id'
) AS supported`;

/** The session ID must come from the server cookie, never a request-body field. */
export function reservationInsert(supportsSession: boolean, values: unknown[], visitorSessionId?: string) {
  if (values.length !== 10) throw new Error("Expected ten reservation values");
  return {
    text: supportsSession
      ? `INSERT INTO reservations (user_id, guest_name, email, phone, date, time, guests, occasion, note, status, site, visitor_session_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10,$11) RETURNING *`
      : `INSERT INTO reservations (user_id, guest_name, email, phone, date, time, guests, occasion, note, status, site)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10) RETURNING *`,
    params: supportsSession ? [...values, values[0] == null ? visitorSessionId ?? null : null] : [...values],
  };
}
