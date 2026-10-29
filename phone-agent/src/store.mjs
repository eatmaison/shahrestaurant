import pg from 'pg';
import { readFileSync } from 'node:fs';
import { SITE, availability, clock, normalizePhone, validateSlot } from './domain.mjs';
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
  async findMenu(search) {
    if (typeof search !== 'string' || search.trim().length < 2 || search.length > 80) return {ok:false,error:'invalid_search'};
    const result = await this.pool.query("SELECT id,name,price,category,bogo_enabled FROM products WHERE brand='tandoor' AND position(lower($1) in lower(name))>0 ORDER BY name LIMIT 21", [search.trim()]);
    return {ok:true,items:result.rows.slice(0,20).map(p=>({id:p.id,name:p.name,price:Number(p.price),category:p.category,sideRequired:p.category.trim().toLowerCase()==='grill dishes',buyOneGetOne:!!p.bogo_enabled})),more:result.rows.length>20};
  }
  async quotePickup(input, client=this.pool, lock=false) {
    const slotError = validateSlot({...input,guests:1});
    if (slotError) return {ok:false,error:slotError};
    if (typeof input.guestName !== 'string' || !input.guestName.trim() || input.guestName.length > 100 || /[\u0000-\u001f]/.test(input.guestName)) return {ok:false,error:'invalid_name'};
    const phone = normalizePhone(input.phone);
    if (!phone) return {ok:false,error:'invalid_phone'};
    if (input.note != null && (typeof input.note !== 'string' || input.note.length>300 || /[\u0000-\u001f]/.test(input.note))) return {ok:false,error:'invalid_note'};
    if (!Array.isArray(input.items) || input.items.length<1 || input.items.length>30 || input.items.some(i=>!i || typeof i.productId!=='string' || i.productId.length>100 || !Number.isInteger(i.qty) || i.qty<1 || i.qty>20 || (i.sideChoice && !['rice','fries'].includes(i.sideChoice)))) return {ok:false,error:'invalid_items'};
    const ids=[...new Set(input.items.map(i=>i.productId))];
    const rows=await client.query("SELECT id,name,price,brand,category,bogo_enabled FROM products WHERE brand='tandoor' AND id=ANY($1::text[])"+(lock?' FOR SHARE':''),[ids]);
    const products=new Map(rows.rows.map(row=>[row.id,row]));
    const items=[];let cents=0;
    for(const request of input.items){
      const product=products.get(request.productId);
      if(!product)return {ok:false,error:'product_unavailable'};
      const sideRequired=product.category.trim().toLowerCase()==='grill dishes';
      if(sideRequired && !['rice','fries'].includes(request.sideChoice))return {ok:false,error:'side_required',product:product.name};
      if(!sideRequired && request.sideChoice)return {ok:false,error:'side_not_applicable',product:product.name};
      const priceCents=Math.round(Number(product.price)*100);
      if(!Number.isSafeInteger(priceCents) || priceCents<0)return {ok:false,error:'invalid_price'};
      const item={productId:product.id,name:product.name,price:priceCents/100,qty:request.qty,brand:product.brand,category:product.category,sideChoice:request.sideChoice||null,sideLabel:request.sideChoice==='rice'?'Rice':request.sideChoice==='fries'?'Fries':null};
      items.push(item);cents+=priceCents*request.qty;
      if(product.bogo_enabled)items.push({...item,productId:'bogo-free:'+product.id,name:product.name+' (FREE)',price:0});
    }
    if(cents>99999999)return {ok:false,error:'invalid_total'};
    return {ok:true,data:{date:input.date,time:input.time,guestName:input.guestName.trim(),phone,note:input.note?.trim()||'',requestedItems:input.items,items,subtotal:cents/100}};
  }
  async pickup(callId, data) {
    return this.transaction(async client=>{
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",['phone-order:'+callId]);
      const existing=await client.query('SELECT o.order_number,o.total FROM phone_agent_orders p JOIN orders o ON o.id=p.order_id WHERE p.call_id=$1',[callId]);
      if(existing.rowCount)return {ok:true,duplicate:true,number:'ETG-'+existing.rows[0].order_number,total:Number(existing.rows[0].total)};
      const quote=await this.quotePickup({...data,items:data.requestedItems},client,true);
      if(!quote.ok)return quote;
      if(JSON.stringify(quote.data.items)!==JSON.stringify(data.items) || quote.data.subtotal!==data.subtotal)return {ok:false,error:'menu_changed',action:'Quote and confirm the updated menu and price again.'};
      const schedule=JSON.stringify({type:'once',date:data.date,time:data.time});
      const note='[AI telefoon: betalen bij afhalen / pay on pickup]'+(data.note?' '+data.note:'');
      const order=await client.query("INSERT INTO orders(customer_name,address,postcode,phone,subtotal,discount,points_used,points_earned,delivery,total,status,paid,account_type,invoice_sent,customer_effects_applied,note,schedule,fulfillment,payment_method) VALUES($1,'','',$2,$3,0,0,0,0,$3,'new',false,'personal',false,false,$4,$5::jsonb,'pickup','pay_on_pickup') RETURNING id,order_number,total",[data.guestName,data.phone,data.subtotal,note,schedule]);
      for(const item of data.items)await client.query('INSERT INTO order_items(order_id,product_id,name,price,qty,brand,category,side_choice,side_label) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[order.rows[0].id,item.productId,item.name,item.price,item.qty,item.brand,item.category,item.sideChoice,item.sideLabel]);
      await client.query('INSERT INTO phone_agent_orders(call_id,order_id) VALUES($1,$2)',[callId,order.rows[0].id]);
      return {ok:true,number:'ETG-'+order.rows[0].order_number,total:Number(order.rows[0].total),date:data.date,time:data.time,payment:'pay_on_pickup'};
    });
  }
  async setDay(input) {
    const { date, capacity, externalGuests, limitEnabled } = input || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(date)) || new Date(date+'T00:00:00Z').toISOString().slice(0,10) !== date || !Number.isInteger(capacity) || capacity < 0 || capacity > 35 || !Number.isInteger(externalGuests) || externalGuests < 0 || externalGuests > 1000 || typeof limitEnabled !== 'boolean') return { ok:false,error:'invalid_policy' };
    await this.pool.query('INSERT INTO phone_agent_days(date,capacity,external_guests,limit_enabled) VALUES($1,$2,$3,$4) ON CONFLICT(date) DO UPDATE SET capacity=$2,external_guests=$3,limit_enabled=$4,updated_at=now()', [date,capacity,externalGuests,limitEnabled]);
    return { ok:true,...await this.day(date) };
  }
}
