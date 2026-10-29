import { randomBytes } from 'node:crypto';
export const SITE = 'tandoor';
export const GREETING = 'Goedendag, u spreekt met Shah Restaurant!';
export function clock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = key => parts.find(p => p.type === key).value;
  return { date: get('year') + '-' + get('month') + '-' + get('day'), time: get('hour') + ':' + get('minute'), timezone: 'Europe/Amsterdam' };
}
export function validateSlot(input, now = new Date()) {
  const { date, time, guests } = input || {};
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) return 'invalid_date';
  if (typeof time !== 'string' || !/^(1[5-9]|2[01]):(00|15|30|45)$/.test(time)) return 'outside_hours';
  if (new Date(date + 'T00:00:00Z').getUTCDay() === 1) return 'closed_monday';
  if (!Number.isInteger(guests) || guests < 1 || guests > 40) return 'invalid_guests';
  const local = clock(now);
  if (date < local.date || (date === local.date && time <= local.time)) return 'past_time';
  if (date > new Date(now.getTime() + 366 * 86400000).toISOString().slice(0, 10)) return 'too_far_ahead';
  return null;
}
export function normalizePhone(value) {
  if (typeof value !== 'string' || value.length > 40) return '';
  let phone = value.replace(/[\s().-]/g, '');
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^0\d{9}$/.test(phone)) phone = '+31' + phone.slice(1);
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
}
export function validateBooking(input, now = new Date()) {
  const slotError = validateSlot(input, now);
  if (slotError) return { error: slotError };
  if (typeof input.guestName !== 'string' || !input.guestName.trim() || input.guestName.length > 100 || /[\u0000-\u001f]/.test(input.guestName)) return { error: 'invalid_name' };
  const phone = normalizePhone(input.phone);
  if (!phone) return { error: 'invalid_phone' };
  if(input.email != null && typeof input.email !== 'string')return {error:'invalid_email'};
  const email = (input.email || '').trim().toLowerCase();
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: 'invalid_email' };
  if (input.note && (typeof input.note !== 'string' || input.note.length > 400)) return { error: 'invalid_note' };
  return { data: { date: input.date, time: input.time, guests: input.guests, guestName: input.guestName.trim(), phone, email, note: input.note || '', lang: input.lang === 'en' ? 'en' : 'nl' } };
}
export function positiveConfirmation(text) {
  if (typeof text !== 'string' || text.length > 250) return false;
  const normalized = text.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s']/gu, ' ').trim().replace(/\s+/g, ' ');
  // Only an unambiguous affirmative turn can authorize a write. A reply like
  // "yes, three people" may be correcting the read-back, even without "but".
  const affirmatives = new Set([
    'ja','jawel','jazeker','ja zeker','ja graag','ja klopt','ja dat klopt',
    'ja dat klopt helemaal','ja klopt helemaal','ja dat is goed','ja dat is juist',
    'ja dat is correct','dat klopt','klopt','klopt helemaal','helemaal juist',
    'dat is juist','dat is correct','akkoord','ik ga akkoord','bevestig',
    'ik bevestig','goed','ok','oke','okay','yes','yep','yeah','yes please',
    'yes correct','yes exactly','yes that is correct',"yes that's correct",
    'yes that is right',"yes that's right",'that is correct',"that's correct",
    'that is right',"that's right",'correct','right','sounds good','confirmed','i confirm',
  ]);
  return affirmatives.has(normalized);
}
export function availability(policy, bookedGuests, requestedGuests) {
  // Restaurant manager explicitly confirms that normal opening-hour reservations are available.
  // A future busy date can be restricted explicitly; absence of a limit never requires staff approval.
  if (!policy?.limit_enabled) return { available: true, status: 'confirmed', reason: 'restaurant_accepts_bookings' };
  const remaining = Math.max(0, Number(policy.capacity) - Number(policy.external_guests) - Number(bookedGuests));
  return { available: requestedGuests <= remaining, status: 'confirmed', reason: requestedGuests <= remaining ? 'available' : 'fully_booked' };
}
export class ReservationDraft {
  constructor() { this.turn = 0; this.confirmedTurn = -1; this.draft = null; }
  heard(text) {
    this.turn += 1;
    this.confirmedTurn = positiveConfirmation(text) ? this.turn : -1;
    // Any non-affirmative reply may contain a correction; never let a later
    // "yes" confirm the old details without preparing and reading them again.
    if (this.draft && this.confirmedTurn < 0) this.draft = null;
  }
  prepare(data) { this.draft = { token: randomBytes(18).toString('hex'), data, preparedTurn: this.turn, expires: Date.now() + 5 * 60000 }; return this.draft; }
  confirm(token) {
    if (!this.draft || this.draft.token !== token || this.draft.expires < Date.now()) return { error: 'draft_expired' };
    if (this.confirmedTurn <= this.draft.preparedTurn) return { error: 'caller_confirmation_required' };
    return { data: this.draft.data };
  }
}
