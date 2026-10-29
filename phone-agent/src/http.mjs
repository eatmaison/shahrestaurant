import { timingSafeEqual } from 'node:crypto';
import { dialedNumber } from './realtime.mjs';
const authorized=(given,secret)=>{
  const a=Buffer.from(given||'');const b=Buffer.from('Bearer '+secret);
  return secret.length>=32 && a.length===b.length && timingSafeEqual(a,b);
};
async function body(req){
  const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>32768){const e=new Error('too_large');e.status=413;throw e;}chunks.push(chunk);}
  return Buffer.concat(chunks).toString('utf8');
}
export function createHandler({config,client,store,active,startCall,log=console.error}){
  return async(req,res)=>{
    const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});res.end(JSON.stringify(value));};
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/health' && req.method==='GET')return reply(200,{ok:true,enabled:config.enabled,ready:config.ready});
      if(url.pathname.startsWith('/internal/')){
        if(!authorized(req.headers.authorization,config.internalSecret))return reply(403,{ok:false});
        if(url.pathname==='/internal/status'&&req.method==='GET')return reply(200,{ok:true,enabled:config.enabled,ready:config.ready,missing:config.missing,activeCalls:active.size,greeting:'Goedendag, u spreekt met Shah Restaurant!',languages:['nl','en'],maxCallsPerDay:config.maxCallsPerDay,maxSeconds:config.maxSeconds});
        if(!store)return reply(503,{ok:false,error:'database_unavailable'});
        if(url.pathname==='/internal/day'&&req.method==='GET'){
          const date=url.searchParams.get('date')||'';
          if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return reply(400,{ok:false,error:'invalid_date'});
          return reply(200,{ok:true,...await store.day(date)});
        }
        if(url.pathname==='/internal/day'&&req.method==='POST'){
          const result=await store.setDay(JSON.parse(await body(req)));return reply(result.ok?200:400,result);
        }
        return reply(404,{ok:false});
      }
      if(url.pathname!=='/phone-ai/webhook')return reply(404,{ok:false});
      if(req.method!=='POST')return reply(405,{ok:false});
      if(!config.ready)return reply(503,{ok:false,error:'not_configured'});
      let event;
      try{event=await client.webhooks.unwrap(await body(req),req.headers,config.webhookSecret);}
      catch(error){return reply(error.status===413?413:400,{ok:false,error:'invalid_webhook'});}
      if(event.type!=='realtime.call.incoming')return reply(200,{ok:true,ignored:true});
      const callId=event.data?.call_id;
      if(typeof callId!=='string'||!callId||callId.length>256)return reply(400,{ok:false});
      const destination=dialedNumber(event.data.sip_headers);
      if(!config.allowedNumbers.includes(destination)){
        await client.realtime.calls.reject(callId,{status_code:403});return reply(200,{ok:true,rejected:true});
      }
      if(active.has(callId))return reply(200,{ok:true,duplicate:true});
      if(active.size>=config.maxConcurrent){await client.realtime.calls.reject(callId,{status_code:486});return reply(200,{ok:true,busy:true});}
      // Reserve memory before asynchronous SQL so simultaneous webhooks cannot exceed the limit.
      active.set(callId,null);
      let claim;
      try{claim=await store.claimCall(callId,event.id,config.maxCallsPerDay);}
      catch(error){active.delete(callId);throw error;}
      if(claim!=='claimed'){
        active.delete(callId);
        if(claim==='limit')await client.realtime.calls.reject(callId,{status_code:486});
        return reply(200,{ok:true,result:claim});
      }
      void startCall(callId).then(session=>{if(active.has(callId))active.set(callId,session);}).catch(()=>{active.delete(callId);log('[phone-agent] call setup failed');});
      return reply(200,{ok:true});
    }catch(error){log('[phone-agent] request failed:',error.code||'unknown');if(!res.headersSent)reply(error instanceof SyntaxError?400:(error.status||500),{ok:false,error:'temporarily_unavailable'});}
  };
}
