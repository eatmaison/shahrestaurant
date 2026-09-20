import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const source = await readFile(new URL('../app/lib/partySchema.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { PARTY_DDL } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const customerSource = await readFile(new URL('../app/parties/PartyExperience.tsx', import.meta.url), 'utf8');
const phonePattern = JSON.parse(customerSource.match(/pattern=\{("[^"]+")\}/)[1]);
const phoneExpression = new RegExp(`^(?:${phonePattern})$`, 'v');
assert.ok(phoneExpression.test('+31 (20) 123-4567'));
assert.ok(!phoneExpression.test('not-a-phone'));
const db = new PGlite();
try {
  for (const statement of PARTY_DDL) await db.exec(statement);
  const { rows: [event] } = await db.query(`INSERT INTO party_events(site,slug,title,description,event_date,start_time,end_time,price_cents,capacity,image,published)
    VALUES ('test','test','Test','Test','2026-10-02','22:00','03:00',1699,100,'/test.jpg',true) RETURNING id`);
  const create = async (quantity, token) => (await db.query(`INSERT INTO party_bookings(event_id,access_token_hash,first_name,last_name,email,phone,quantity,price_cents,event_title,event_date,start_time,end_time)
    VALUES ($1,$2,'Test','Guest','test@example.com','+31000000000',$3,1699,'Test','2026-10-02','22:00','03:00') RETURNING id,total_cents`, [event.id, token, quantity])).rows[0];
  const confirm = (id) => db.query(`UPDATE party_bookings SET payment_status='paid',ticket_status='confirmed' WHERE id=$1 AND ticket_status='pending' RETURNING ticket_status`, [id]);
  for (let index = 0; index < 9; index++) await confirm((await create(10, `seed-${index}`)).id);
  const unpaid = await create(10, 'unpaid');
  assert.equal(unpaid.total_cents, 16990);
  assert.equal((await db.query('SELECT tickets_sold FROM party_events')).rows[0].tickets_sold, 90);
  const first = await create(6, 'first');
  const second = await create(6, 'second');
  const results = await Promise.all([confirm(first.id), confirm(second.id)]);
  assert.deepEqual(results.map(result => result.rows[0].ticket_status).sort(), ['confirmed', 'refund_pending']);
  await confirm(first.id);
  assert.equal((await db.query('SELECT tickets_sold FROM party_events')).rows[0].tickets_sold, 96);
  await assert.rejects(db.query('UPDATE party_events SET capacity=95'));
  await assert.rejects(db.query(`UPDATE party_bookings SET quantity=1 WHERE id=$1`, [first.id]));
  await assert.rejects(db.query(`UPDATE party_bookings SET ticket_status='confirmed' WHERE id=$1`, [unpaid.id]));
  await confirm((await create(4, 'last-four')).id);
  assert.equal((await db.query('SELECT tickets_sold FROM party_events')).rows[0].tickets_sold, 100);
  assert.equal((await confirm((await create(1, 'overflow')).id)).rows[0].ticket_status, 'refund_pending');
  const { rows: [totals] } = await db.query(`SELECT sum(quantity)::integer AS sold, sum(total_cents)::integer AS revenue FROM party_bookings WHERE ticket_status='confirmed'`);
  assert.deepEqual(totals, { sold: 100, revenue: 169900 });
  await assert.rejects(db.query('DELETE FROM party_bookings'));
  console.log('PASS: unpaid capacity, integer totals, competing confirmations, duplicate callbacks, capacity edits, immutable quantity, payment requirement, sold out, derived revenue.');

  const require = createRequire(import.meta.url);
  const paymentRecords = new Map();
  const emails = [];
  let admin = false;
  let refunds = 0;
  let refundStatus = 'pending';
  let emailFailure = true;
  const loadModule = async (filename, mocks) => {
    const text = await readFile(new URL(filename, import.meta.url), 'utf8');
    const code = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const compiledModule = { exports: {} };
    new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), compiledModule, compiledModule.exports);
    return compiledModule.exports;
  };
  const types = await loadModule('../app/lib/partyTypes.ts', {});
  const store = await loadModule('../app/lib/partyStore.ts', {
    './db': { sql: { query: async (statement, values) => (await db.query(statement, values)).rows, transaction: promises => Promise.all(promises) } },
    './data': { SITE_ID: 'party-test' },
    './serverStore': { getCurrentUser: async () => admin ? { role: 'admin' } : null },
    './partySchema': { PARTY_DDL },
    './partyTypes': types,
    './spaces': { storeImage: async image => image },
    './email': { emailEnabled: () => true, sendMail: async email => { if (emailFailure) throw new Error('SMTP unavailable'); emails.push(email); } },
    './mollie': {
      mollieEnabled: () => true,
      createMolliePayment: async args => {
        const id = `tr_test${paymentRecords.size}`;
        paymentRecords.set(id, { status: 'open', amount: { currency: 'EUR', value: args.amount.toFixed(2) }, metadata: args.metadata, redirectUrl: args.redirectUrl });
        return { id, checkoutUrl: `https://example.com/${id}` };
      },
      getMolliePayment: async id => paymentRecords.get(id),
      refundMolliePayment: async () => { refunds++; return { id: 're_test', status: refundStatus }; },
    },
  });
  const [seeded] = await store.listParties();
  assert.equal(seeded.price_cents, 1699);
  assert.equal(seeded.capacity, 100);
  assert.equal(seeded.event_date, '2026-10-02');
  await db.query(`UPDATE party_events SET event_date='2099-10-02' WHERE id=$1`, [seeded.id]);
  await assert.rejects(store.listParties(true), /Administrator access required/);
  await assert.rejects(store.listPartyGuests(), /Administrator access required/);
  const checkout = { eventId: seeded.id, firstName: '<Guest>', lastName: 'Test', email: 'GUEST@example.com', phone: '+31 20 000 0000', quantity: 2, expectedPriceCents: 1699, accepted: true };
  await assert.rejects(store.beginPartyCheckout({ ...checkout, quantity: -1 }, 'https://example.com'));
  await assert.rejects(store.beginPartyCheckout({ ...checkout, expectedPriceCents: 100 }, 'https://example.com'), /price has changed/);
  await db.query('UPDATE party_events SET capacity=2 WHERE id=$1', [seeded.id]);
  const firstCheckout = await store.beginPartyCheckout(checkout, 'https://example.com');
  const losingCheckout = await store.beginPartyCheckout(checkout, 'https://example.com');
  const firstId = firstCheckout.checkoutUrl.split('/').at(-1);
  const losingId = losingCheckout.checkoutUrl.split('/').at(-1);
  assert.equal((await store.listParties())[0].remaining, 2);
  const payment = paymentRecords.get(firstId);
  const token = new URLSearchParams(new URL(payment.redirectUrl).hash.slice(1)).get('token');
  assert.equal((await store.getPartyBooking(token)).ticket_status, 'pending');
  await assert.rejects(store.getPartyBooking('a'.repeat(64)), /not found/);
  payment.status = 'paid';
  payment.amount.value = '0.01';
  await assert.rejects(store.reconcilePartyPayment(firstId), /does not match/);
  assert.equal((await store.listParties())[0].tickets_sold, 0);
  payment.amount.value = '33.98';
  await assert.rejects(store.reconcilePartyPayment(firstId), /SMTP unavailable/);
  assert.equal((await store.listParties())[0].tickets_sold, 2);
  emailFailure = false;
  await store.reconcilePartyPayment(firstId);
  await store.reconcilePartyPayment(firstId);
  assert.equal(emails.length, 1);
  assert.ok(emails[0].html.includes('&lt;Guest&gt;'));
  assert.equal(emails[0].to, 'guest@example.com');
  assert.equal((await store.getPartyBooking(token)).ticket_status, 'confirmed');
  paymentRecords.get(losingId).status = 'paid';
  await store.reconcilePartyPayment(losingId);
  assert.equal(refunds, 1);
  let losingRow = (await db.query('SELECT * FROM party_bookings WHERE mollie_payment_id=$1', [losingId])).rows[0];
  assert.equal(losingRow.ticket_status, 'refund_pending');
  refundStatus = 'refunded';
  await store.reconcilePartyPayment(losingId);
  losingRow = (await db.query('SELECT * FROM party_bookings WHERE mollie_payment_id=$1', [losingId])).rows[0];
  assert.equal(losingRow.ticket_status, 'refunded');
  assert.equal((await store.listParties())[0].revenue_cents, 3398);
  await assert.rejects(store.beginPartyCheckout(checkout, 'https://example.com'), /Availability/);
  await db.query('UPDATE party_events SET capacity=10 WHERE id=$1', [seeded.id]);
  for (const status of ['failed', 'canceled', 'expired']) {
    const result = await store.beginPartyCheckout(checkout, 'https://example.com');
    const paymentId = result.checkoutUrl.split('/').at(-1);
    paymentRecords.get(paymentId).status = status;
    await store.reconcilePartyPayment(paymentId);
    assert.equal((await db.query('SELECT ticket_status FROM party_bookings WHERE mollie_payment_id=$1', [paymentId])).rows[0].ticket_status, 'failed');
  }
  assert.equal((await store.listParties())[0].tickets_sold, 2);
  admin = true;
  assert.equal((await store.listPartyGuests()).length, 5);
  const { id, slug, title, description, event_date, start_time, end_time, price_cents, capacity, image, status, published } = (await store.listParties(true))[0];
  const edited = { id, slug, title, description, event_date, start_time: start_time.slice(0,5), end_time: end_time.slice(0,5), price_cents, capacity, image, status, published };
  await store.saveParty({ ...edited, published: false });
  assert.equal((await store.listParties()).length, 0);
  await assert.rejects(store.beginPartyCheckout(checkout, 'https://example.com'), /Availability/);
  await store.saveParty({ ...edited, status: 'cancelled' });
  await assert.rejects(store.beginPartyCheckout(checkout, 'https://example.com'), /Availability/);
  console.log('PASS: actual store checkout, forged/stale price, private tokens, payment amount verification, unpaid/failed/cancelled/expired states, email retry and escaping, duplicate fulfillment, overflow refund lifecycle, admin authorization, publish/cancel management.');
} finally {
  await db.close();
}