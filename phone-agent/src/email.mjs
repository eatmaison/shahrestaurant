const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reservationMessage(row) {
  const nl=row.lang!=='en';const confirmed=row.status==='confirmed'||row.status==='arrived';
  const number='RSV-'+row.reservation_number;
  const status=confirmed?(nl?'Uw reservering is bevestigd.':'Your reservation is confirmed.'):(nl?'Wij hebben uw reserveringsaanvraag ontvangen. Deze is nog NIET bevestigd; ons team neemt contact met u op.':'We received your reservation request. It is NOT confirmed yet; our team will contact you.');
  return {subject:(nl?'Shah Restaurant — reservering ':'Shah Restaurant — reservation ')+number,
    html:'<!doctype html><html lang="'+(nl?'nl':'en')+'"><body style="font-family:Arial,sans-serif;color:#1b3028;line-height:1.6"><h1>Shah Restaurant</h1><p>'+escape(row.guest_name)+',</p><p>'+status+'</p><p>'+escape(number)+'<br>'+escape(row.date)+' '+escape(row.time)+'<br>'+escape(row.guests)+' '+(nl?'gasten':'guests')+'</p><p>Klaprozenweg 36a, 1032 KL Amsterdam</p><p>'+(nl?'Wijzigen of annuleren? Bel ':'Changes or cancellation? Call ')+'<a href="tel:+31203412995">020 341 2995</a>.</p><p><a href="https://shahrestaurant.nl/">Shah Restaurant</a></p></body></html>'};
}
export async function deliverEmails(store,config,fetcher=fetch) {
  if(!config.resendKey||!config.emailFrom)return;
  const rows=await store.pool.query("SELECT o.reservation_id,o.lang,o.attempts,r.guest_name,r.email,r.date,r.time,r.guests,r.status,r.reservation_number FROM phone_agent_email_outbox o JOIN reservations r ON r.id=o.reservation_id WHERE o.sent_at IS NULL AND o.attempts<5 AND o.next_attempt_at<=now() AND o.created_at>now()-interval '23 hours' LIMIT 5");
  for(const row of rows.rows){
    // Claim before sending. Failed/abandoned claims become retryable with the same Resend idempotency key.
    const claim=await store.pool.query("UPDATE phone_agent_email_outbox SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes' WHERE reservation_id=$1 AND next_attempt_at<=now() AND sent_at IS NULL RETURNING reservation_id",[row.reservation_id]);
    if(!claim.rowCount)continue;
    if(['cancelled','declined','no_show'].includes(row.status)){await store.pool.query('UPDATE phone_agent_email_outbox SET sent_at=now() WHERE reservation_id=$1',[row.reservation_id]);continue;}
    try{
      const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.resendKey,'Content-Type':'application/json','Idempotency-Key':'phone-reservation-'+row.reservation_id},body:JSON.stringify({from:config.emailFrom,to:[row.email],...reservationMessage(row)}),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('delivery_failed');
      await store.pool.query('UPDATE phone_agent_email_outbox SET sent_at=now() WHERE reservation_id=$1',[row.reservation_id]);
    }catch{console.error('[phone-agent] confirmation email deferred');}
  }
}
