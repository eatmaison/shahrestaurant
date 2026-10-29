import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clock, validateSlot, validateBooking, normalizePhone, availability, ReservationDraft, positiveConfirmation } from '../src/domain.mjs';
import { reservationMessage } from '../src/email.mjs';
const now=new Date('2026-10-29T12:00:00Z');
const input={date:'2026-11-03',time:'17:00',guests:4,guestName:'Zoë Test',phone:'0612345678',email:'',lang:'nl'};
test('Amsterdam calendar uses daylight-saving transitions and restaurant hours',()=>{
  assert.deepEqual(clock(new Date('2026-10-25T00:30:00Z')),{date:'2026-10-25',time:'02:30',timezone:'Europe/Amsterdam'});
  assert.equal(clock(new Date('2026-10-25T01:30:00Z')).time,'02:30');
  assert.equal(clock(new Date('2026-07-01T22:30:00Z')).date,'2026-07-02');
  assert.equal(validateSlot(input,now),null);
  for(const date of ['2026-02-30','2026-11-31','no-date'])assert.equal(validateSlot({...input,date},now),'invalid_date');
  assert.equal(validateSlot({...input,date:'2026-11-02'},now),'closed_monday');
  for(const time of ['12:00','14:00','22:00','25:00','17:03'])assert.equal(validateSlot({...input,time},now),'outside_hours');
  assert.equal(validateSlot({...input,date:'2026-10-28'},now),'past_time');
  assert.equal(validateSlot({...input,guests:2.5},now),'invalid_guests');
});
test('phone details validate without requiring registration or email',()=>{
  assert.equal(normalizePhone('06 1234 5678'),'+31612345678');
  assert.equal(normalizePhone('0031 6 1234 5678'),'+31612345678');
  assert.equal(normalizePhone('+44 (20) 1234-5678'),'+442012345678');
  for(const phone of ['12345','anonymous','+abc'])assert.equal(normalizePhone(phone),'');
  assert.equal(validateBooking(input,now).data.guestName,'Zoë Test');
  assert.equal(validateBooking({...input,email:'bad'},now).error,'invalid_email');
  assert.equal(validateBooking({...input,guestName:''},now).error,'invalid_name');
});
test('manager-authorized availability confirms normally and optional day limits are respected',()=>{
  assert.equal(availability(null,0,4).status,'confirmed');
  assert.equal(availability({limit_enabled:false},0,4).status,'confirmed');
  assert.equal(availability({limit_enabled:true,capacity:35,external_guests:20},11,4).available,true);
  assert.equal(availability({limit_enabled:true,capacity:35,external_guests:20},12,4).available,false);
  assert.equal(availability({limit_enabled:true,capacity:0,external_guests:0},0,1).available,false);
});
test('booking requires a fresh affirmative caller turn after each draft',()=>{
  const draft=new ReservationDraft();draft.heard('ja');
  let prepared=draft.prepare(input);
  assert.equal(draft.confirm(prepared.token).error,'caller_confirmation_required');
  draft.heard('Nee, dat klopt niet');assert.equal(draft.confirm(prepared.token).error,'draft_expired');
  prepared=draft.prepare(input);
  draft.heard('Ja, dat klopt');assert.deepEqual(draft.confirm(prepared.token).data,input);
  prepared=draft.prepare({...input,guests:3});
  assert.equal(draft.confirm(prepared.token).error,'caller_confirmation_required');
  draft.heard('Yes, correct');assert.equal(draft.confirm(prepared.token).data.guests,3);
  assert.equal(draft.confirm('invented-token').error,'draft_expired');
  draft.draft.expires=0;assert.equal(draft.confirm(prepared.token).error,'draft_expired');
  for(const text of ['no','yes but change the time','ja maar niet vier','nee akkoord',''])assert.equal(positiveConfirmation(text),false);
});
test('email distinguishes requests and confirmations and escapes caller content',()=>{
  const row={lang:'nl',status:'pending',reservation_number:501,guest_name:'<script>guest</script>',date:input.date,time:input.time,guests:4};
  const pending=reservationMessage(row);assert.match(pending.html,/NIET bevestigd/);assert(!pending.html.includes('<script>'));assert(pending.html.includes('&lt;script&gt;'));
  assert.match(reservationMessage({...row,status:'confirmed',lang:'en'}).html,/reservation is confirmed/);
});
