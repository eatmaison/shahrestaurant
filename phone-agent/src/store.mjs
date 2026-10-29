import pg from 'pg';
import { readFileSync } from 'node:fs';
import { SITE, availability, clock, validateSlot } from './domain.mjs';
export class Store {
  constructor(databaseUrl) { this.pool = new pg.Pool({ connectionString: databaseUrl, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000, statement_timeout: 10000 }); }
  async migrate() { await this.pool.query(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8')); }
  async transaction(fn) {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }
  async claimCall(callId, webhookId, limit) {
    return this.transaction(async client => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('shah-phone-daily-limit'))");
      const existing = await client.query('SELECT call_id FROM phone_agent_calls WHERE call_id=$1 OR webhook_id=$2', [callId, webhookId]);
      if (existing.rowCount) return 'duplicate';
      const count = await client.query("SELECT count(*)::int AS count FROM phone_agent_calls WHERE created_at >= ($1::date::timestamp AT TIME ZONE 'Europe/Amsterdam')", [clock().date]);
      if (count.rows[0].count >= limit) return 'limit';
      await client.query('INSERT INTO phone_agent_calls(call_id,webhook_id) VALUES($1,$2)', [callId, webhookId]);
      return 'claimed';
    });
  }
  async finishCall(callId, state) { await this.pool.query('UPDATE phone_agent_calls SET state=$2,finished_at=now() WHERE call_id=$1', [callId,state]); }
  async day(date, client = this.pool) {
    const policy = await client.query('SELECT date,capacity,external_guests,limit_enabled FROM phone_agent_days WHERE date=$1', [date]);
    const bookings = await client.query("SELECT coalesce(sum(guests),0)::int AS guests FROM reservations WHERE site IN ('tandoor','tandoorcompany','thetandoorcompany') AND date=$1 AND status IN ('pending','confirmed','arrived')", [date]);
    return { date, policy: policy.rows[0] || null, bookedGuests: bookings.rows[0].guests };
  }
  async check(input) {
    const error = validateSlot(input);
    if (error) return { ok:false, error };
    const day = await this.day(input.date);
    return { ok:true, ...availability(day.policy, day.bookedGuests, input.guests), ...input };
  }
  async book(callId, data) {
    return this.transaction(async client => {
      // Serializes concurrent AI confirmations and existing website INSERTs during this decision.
      await client.query('LOCK TABLE reservations IN SHARE ROW EXCLUSIVE MODE');
      const existing = await client.query('SELECT r.reservation_number,r.status,r.date,r.time,r.guests FROM phone_agent_bookings b JOIN reservations r ON r.id=b.reservation_id WHERE b.call_id=$1', [callId]);
      if (existing.rowCount) return { ok:true, duplicate:true, ...existing.rows[0], number:'RSV-' + existing.rows[0].reservation_number };
      const error = validateSlot(data);
      if (error) return { ok:false,error };
      const day = await this.day(data.date, client);
      const decision = availability(day.policy,day.bookedGuests,data.guests);
      if (!decision.available) return { ok:false,error:'fully_booked' };
      const note = '[AI telefoon / AI phone] ' + data.note;
      const result = await client.query("INSERT INTO reservations(guest_name,email,phone,date,time,guests,note,status,site,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'phone_ai') RETURNING id,reservation_number,status,date,time,guests", [data.guestName,data.email,data.phone,data.date,data.time,data.guests,note,decision.status,SITE]);
      const booking = result.rows[0];
      await client.query('INSERT INTO phone_agent_bookings(call_id,reservation_id) VALUES($1,$2)', [callId,booking.id]);
      if (data.email) await client.query('INSERT INTO phone_agent_email_outbox(reservation_id,lang) VALUES($1,$2)', [booking.id,data.lang]);
      return { ok:true,status:booking.status,number:'RSV-' + booking.reservation_number,date:booking.date,time:booking.time,guests:booking.guests };
    });
  }
  async setDay(input) {
    const { date, capacity, externalGuests, limitEnabled } = input || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(date)) || new Date(date+'T00:00:00Z').toISOString().slice(0,10) !== date || !Number.isInteger(capacity) || capacity < 0 || capacity > 35 || !Number.isInteger(externalGuests) || externalGuests < 0 || externalGuests > 1000 || typeof limitEnabled !== 'boolean') return { ok:false,error:'invalid_policy' };
    await this.pool.query('INSERT INTO phone_agent_days(date,capacity,external_guests,limit_enabled) VALUES($1,$2,$3,$4) ON CONFLICT(date) DO UPDATE SET capacity=$2,external_guests=$3,limit_enabled=$4,updated_at=now()', [date,capacity,externalGuests,limitEnabled]);
    return { ok:true,...await this.day(date) };
  }
}
