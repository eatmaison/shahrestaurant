import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import OpenAI from 'openai';
import { createHandler } from '../src/http.mjs';
import { dialedNumber } from '../src/realtime.mjs';
const secret='whsec_'+Buffer.from('this-is-a-unit-test-secret-32-bytes').toString('base64');
function signed(payload,id='msg_test',ageSeconds=0){
  const timestamp=String(Math.floor(Date.now()/1000)-ageSeconds);
  const signature=createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(id+'.'+timestamp+'.'+payload).digest('base64');
  return {'Content-Type':'application/json','webhook-id':id,'webhook-timestamp':timestamp,'webhook-signature':'v1,'+signature};
}
test('signed SIP webhooks reject forged/stale events and deduplicate without placing any real call',async()=>{
  let starts=0,rejects=0;
  const config={enabled:true,ready:true,webhookSecret:secret,internalSecret:'a'.repeat(64),allowedNumbers:['+31201234567'],maxConcurrent:1,maxCallsPerDay:60,missing:[]};
  const sdk=new OpenAI({apiKey:'not-a-real-key'});
  const client={webhooks:sdk.webhooks,realtime:{calls:{reject:async()=>{rejects++;}}}};
  const active=new Map();const seen=new Set();
  const store={claimCall:async id=>{if(seen.has(id))return 'duplicate';seen.add(id);return 'claimed';}};
  const server=createServer(createHandler({config,client,store,active,startCall:async()=>{starts++;return {};},log:()=>{}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const event={id:'evt_test',type:'realtime.call.incoming',created_at:Math.floor(Date.now()/1000),data:{call_id:'call_test',sip_headers:[{name:'To',value:'<sip:+31201234567@example.invalid>'}]}};
  const payload=JSON.stringify(event);
  try{
    assert.equal((await fetch(base+'/internal/status')).status,403);
    assert.equal((await fetch(base+'/internal/status',{headers:{Authorization:'Bearer '+config.internalSecret}})).status,200);
    assert.equal((await fetch(base+'/phone-ai/webhook')).status,405);
    assert.equal((await fetch(base+'/phone-ai/webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:payload})).status,400);
    assert.equal((await fetch(base+'/phone-ai/webhook',{method:'POST',headers:signed(payload,'old',600),body:payload})).status,400);
    const first=await fetch(base+'/phone-ai/webhook',{method:'POST',headers:signed(payload),body:payload});assert.equal(first.status,200);
    const repeat=await fetch(base+'/phone-ai/webhook',{method:'POST',headers:signed(payload),body:payload});assert.equal((await repeat.json()).duplicate,true);assert.equal(starts,1);
    const other=JSON.stringify({...event,id:'evt2',data:{...event.data,call_id:'call2'}});
    const busy=await fetch(base+'/phone-ai/webhook',{method:'POST',headers:signed(other,'msg2'),body:other});assert.equal((await busy.json()).busy,true);assert.equal(rejects,1);
    active.clear();
    const wrongNumber=JSON.stringify({...event,id:'evt3',data:{call_id:'call3',sip_headers:[{name:'To',value:'sip:+31999999999@example.invalid'}]}});
    assert.equal((await (await fetch(base+'/phone-ai/webhook',{method:'POST',headers:signed(wrongNumber,'msg3'),body:wrongNumber})).json()).rejected,true);
    assert.equal(starts,1);
    assert.equal(dialedNumber([{name:'To',value:'anonymous'}]),'');
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('disabled service never accepts a call even with a valid webhook',async()=>{
  const server=createServer(createHandler({config:{enabled:false,ready:false,internalSecret:'',missing:[]},active:new Map(),startCall:()=>{throw new Error('must not start');}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    assert.equal((await fetch(base+'/health')).status,200);
    assert.equal((await fetch(base+'/phone-ai/webhook',{method:'POST',body:'{}'})).status,503);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
