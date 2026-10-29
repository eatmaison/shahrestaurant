import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { runCall } from '../src/realtime.mjs';
import { clock } from '../src/domain.mjs';
test('SIP sideband starts Dutch greeting, saves the confirmed booking once and shuts down cleanly',async()=>{
  let socket,accepted,bookings=0,hangups=0,closed=0;
  class FakeSocket extends EventEmitter{
    constructor(){super();socket=this;this.readyState=1;this.sent=[];}
    send(raw){this.sent.push(JSON.parse(raw));}
    close(){this.readyState=3;this.emit('close');}
    receive(event){this.emit('message',Buffer.from(JSON.stringify(event)));}
  }
  const date=new Date(clock().date+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+7);while(date.getUTCDay()!==2)date.setUTCDate(date.getUTCDate()+1);
  const details={date:date.toISOString().slice(0,10),time:'17:00',guests:4,guestName:'Voice Test',phone:'+31612345678',lang:'nl'};
  const client={realtime:{calls:{accept:async(id,body)=>{accepted=body;},hangup:async()=>{hangups++;},refer:async()=>{}}}};
  const store={check:async()=>({ok:true,available:true,status:'confirmed'}),book:async()=>{bookings++;return {ok:true,status:'confirmed',number:'RSV-501'};},finishCall:async()=>{}};
  const config={model:'gpt-realtime-2.1-mini',transcriptionModel:'gpt-transcribe',voice:'marin',apiKey:'unit-test',maxSeconds:60};
  const session=await runCall({callId:'test-call',client,store,config,WebSocketClass:FakeSocket,onClose:()=>{closed++;}});
  const waitFor=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.fail('Expected sideband output');};
  try{
    assert.equal(accepted.model,config.model);assert.match(accepted.instructions,/Goedendag, u spreekt met Shah Restaurant!/);
    socket.emit('open');assert.equal(socket.sent[0].type,'response.create');
    socket.receive({type:'response.done'});
    socket.receive({type:'response.function_call_arguments.done',call_id:'tool-prepare',name:'prepare_reservation',arguments:JSON.stringify(details)});
    await waitFor(()=>socket.sent.some(e=>e.item?.call_id==='tool-prepare'));
    const draft=JSON.parse(socket.sent.find(e=>e.item?.call_id==='tool-prepare').item.output);
    assert.equal(draft.saved,false);
    socket.receive({type:'conversation.item.input_audio_transcription.completed',item_id:'caller-yes',transcript:'Ja dat klopt'});
    const confirm={type:'response.function_call_arguments.done',call_id:'tool-confirm',name:'confirm_reservation',arguments:JSON.stringify({token:draft.token})};
    socket.receive(confirm);socket.receive(confirm);
    await waitFor(()=>socket.sent.some(e=>e.item?.call_id==='tool-confirm'));
    assert.equal(bookings,1);
    assert.equal(JSON.parse(socket.sent.find(e=>e.item?.call_id==='tool-confirm').item.output).status,'confirmed');
  }finally{await session.stop();}
  assert.equal(hangups,1);assert.equal(closed,1);
});
