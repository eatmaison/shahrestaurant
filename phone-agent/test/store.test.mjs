import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { Store } from '../src/store.mjs';
import { Agent } from '../src/agent.mjs';
import { clock } from '../src/domain.mjs';
import { deliverEmails } from '../src/email.mjs';
async function fixture(){
  const db=new PGlite();
  await db.exec("CREATE TABLE reservations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reservation_number integer GENERATED ALWAYS AS IDENTITY (START WITH 501),guest_name text NOT NULL,email text NOT NULL DEFAULT '',phone text NOT NULL,date text NOT NULL,time text NOT NULL,guests integer NOT NULL CHECK(guests BETWEEN 1 AND 40),note text,status text NOT NULL,site text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())");
  await db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const query=async(sql,params)=>{const r=await db.query(sql,params);return {rows:r.rows,rowCount:r.rows.length || r.affectedRows || 0};};
  const client={query,release(){}};
  const store=Object.create(Store.prototype);store.pool={query,connect:async()=>client};
  const date=new Date(clock().date+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+7);
  while(date.getUTCDay()!==2)date.setUTCDate(date.getUTCDate()+1);
  const data={date:date.toISOString().slice(0,10),time:'17:00',guests:4,guestName:'Database Test',phone:'+31612345678',email:'test@example.invalid',lang:'nl',note:''};
  return {db,store,data};
}
test('SQL stores phone bookings in the shared table once and reserves email outbox once',async()=>{
  const {db,store,data}=await fixture();
  try{
    assert.equal(await store.claimCall('call1','event1',60),'claimed');
    assert.equal(await store.claimCall('call1','event1',60),'duplicate');
    assert.equal((await store.check(data)).status,'confirmed');
    await store.setDay({date:data.date,capacity:35,externalGuests:20,limitEnabled:true});
    await db.query("INSERT INTO reservations(guest_name,phone,date,time,guests,status,site) VALUES('Other website','n/a',$1,'18:00',10,'confirmed','tandoor')",[data.date]);
    const result=await store.book('call1',data);assert.equal(result.ok,true);assert.equal(result.status,'confirmed');
    const duplicate=await store.book('call1',data);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.number,result.number);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM reservations WHERE source='phone_ai'")).rows[0].n,1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM phone_agent_email_outbox')).rows[0].n,1);
    assert.equal(await store.claimCall('call2','event2',60),'claimed');
    assert.equal((await store.book('call2',data)).error,'fully_booked');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM phone_agent_bookings')).rows[0].n,1);
    assert.equal((await store.setDay({date:'2026-02-30',capacity:35,externalGuests:0,limitEnabled:true})).error,'invalid_policy');
  }finally{await db.close();}
});
test('agent requires caller read-back confirmation, handles corrected drafts and idempotent retries',async()=>{
  const {db,store,data}=await fixture();
  try{
    await store.claimCall('call-agent','event-agent',60);
    let inserts=0;
    const recordingStore={check:input=>store.check(input),book:async(...args)=>{inserts++;return store.book(...args);}};
    const agent=new Agent({callId:'call-agent',store:recordingStore,config:{resendKey:'test',emailFrom:'test@example.invalid'},transfer:()=>{},hangup:()=>{}});
    agent.heard('early-yes','ja');
    let prepared=await agent.execute('prepare_reservation',data);
    assert.equal(prepared.status,'confirmed');assert.equal(prepared.saved,false);
    assert.equal((await agent.execute('confirm_reservation',{token:prepared.token})).error,'caller_confirmation_required');
    agent.heard('turn2','ja maar voor drie personen');
    assert.equal((await agent.execute('confirm_reservation',{token:prepared.token})).error,'draft_expired');
    prepared=await agent.execute('prepare_reservation',{...data,guests:3});
    agent.heard('turn2','yes'); // Duplicate transcript ID cannot grant consent.
    assert.equal((await agent.execute('confirm_reservation',{token:prepared.token})).error,'caller_confirmation_required');
    agent.heard('turn3','yes correct');
    const result=await agent.execute('confirm_reservation',{token:prepared.token});assert.equal(result.ok,true);assert.equal(result.status,'confirmed');
    const repeated=await agent.execute('confirm_reservation',{token:prepared.token});assert.equal(repeated.number,result.number);assert.equal(inserts,1);
    assert.equal((await agent.execute('delete_all_reservations',{})).error,'unknown_tool');
    assert.equal((await agent.execute('transfer_to_staff',{})).error,'transfer_unavailable');
  }finally{await db.close();}
});
test('daily call limit and SQL rollback prevent partial reservations on missing call identity',async()=>{
  const {db,store,data}=await fixture();
  try{
    assert.equal(await store.claimCall('daily1','event1',1),'claimed');
    assert.equal(await store.claimCall('daily2','event2',1),'limit');
    await assert.rejects(()=>store.book('unregistered-call',data));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM reservations')).rows[0].n,0);
  }finally{await db.close();}
});
test('email outbox retries use the same idempotency key and stop after successful delivery',async()=>{
  const {db,store,data}=await fixture();
  try{
    await store.claimCall('email-call','email-event',60);await store.book('email-call',data);
    const requests=[];const config={resendKey:'unit-test',emailFrom:'Shah <test@example.invalid>'};
    await deliverEmails(store,config,async(url,options)=>{requests.push(options);return {ok:false};});
    assert.equal((await db.query('SELECT attempts,sent_at FROM phone_agent_email_outbox')).rows[0].attempts,1);
    await db.query('UPDATE phone_agent_email_outbox SET next_attempt_at=now()');
    await deliverEmails(store,config,async(url,options)=>{requests.push(options);return {ok:true};});
    await deliverEmails(store,config,async()=>{throw new Error('must not send again');});
    assert.equal(requests.length,2);
    assert.equal(requests[0].headers['Idempotency-Key'],requests[1].headers['Idempotency-Key']);
    assert.match(JSON.parse(requests[1].body).html,/reservering is bevestigd/);
    assert((await db.query('SELECT sent_at FROM phone_agent_email_outbox')).rows[0].sent_at);
  }finally{await db.close();}
});
