import WebSocket from 'ws';
import { Agent, instructions, TOOLS } from './agent.mjs';
export function dialedNumber(headers=[]) {
  for(const name of ['To','P-Called-Party-ID','X-Twilio-Called']){
    const header=headers.find(h=>h.name?.toLowerCase()===name.toLowerCase());
    const match=header?.value?.match(/(?:sip:|tel:)?(\+[1-9]\d{7,14})(?=[@>;:\s]|$)/);
    if(match)return match[1];
  }
  return '';
}
export async function runCall({callId,client,store,config,onClose,WebSocketClass=WebSocket}) {
  let socket;let timer;let finished=false;let queue=Promise.resolve();const executed=new Map();
  const finish=async state=>{
    if(finished)return;finished=true;clearTimeout(timer);socket?.close();
    await store.finishCall(callId,state).catch(()=>{});
    onClose();
  };
  const hangup=async()=>{await client.realtime.calls.hangup(callId);await finish('ended');};
  const agent=new Agent({callId,store,config,hangup,transfer:target=>client.realtime.calls.refer(callId,{target_uri:'tel:'+target})});
  try{
    await client.realtime.calls.accept(callId,{
      type:'realtime',model:config.model,instructions:instructions(),tools:TOOLS,tool_choice:'auto',
      audio:{input:{transcription:{model:config.transcriptionModel},turn_detection:{type:'server_vad',create_response:true,interrupt_response:true}},output:{voice:config.voice}},
    });
    socket=new WebSocketClass('wss://api.openai.com/v1/realtime?call_id='+encodeURIComponent(callId),{headers:{Authorization:'Bearer '+config.apiKey},handshakeTimeout:10000,maxPayload:256*1024});
    const send=event=>{if(socket.readyState===1)socket.send(JSON.stringify(event));};
    let responseActive=false;let responseNeeded=false;
    const requestResponse=()=>{if(responseActive){responseNeeded=true;return;}responseActive=true;send({type:'response.create'});};
    socket.on('open',()=>{responseActive=true;send({type:'response.create',response:{instructions:'Start now with the exact Dutch greeting from your instructions, disclose AI and ask how you can help.'}});});
    socket.on('message',bytes=>{
      let event;try{event=JSON.parse(bytes.toString());}catch{return;}
      // Only caller transcription events can unlock confirmation. Neither tool arguments nor assistant text can do so.
      if(event.type==='conversation.item.input_audio_transcription.completed')agent.heard(event.item_id,event.transcript);
      if(event.type==='response.created')responseActive=true;
      if(event.type==='response.done'){responseActive=false;if(responseNeeded){responseNeeded=false;requestResponse();}}
      if(event.type==='error'){if(event.error?.code!=='response_cancel_not_active')console.error('[phone-agent] realtime event error:',event.error?.code || 'unknown');}
      if(event.type!=='response.function_call_arguments.done')return;
      if(!event.call_id || executed.has(event.call_id))return;
      executed.set(event.call_id,true);
      queue=queue.then(async()=>{
        let output;
        try{output=await agent.execute(event.name,JSON.parse(event.arguments));}
        catch{output={ok:false,error:'temporarily_unavailable'};console.error('[phone-agent] tool failed:',event.name);}
        send({type:'conversation.item.create',item:{type:'function_call_output',call_id:event.call_id,output:JSON.stringify(output)}});
        requestResponse();
      }).catch(()=>finish('failed'));
    });
    socket.on('error',()=>{console.error('[phone-agent] sideband connection failed');void client.realtime.calls.hangup(callId).catch(()=>{}).finally(()=>finish('failed'));});
    socket.on('close',()=>{if(!finished)void client.realtime.calls.hangup(callId).catch(()=>{}).finally(()=>finish('ended'));});
    timer=setTimeout(()=>{void hangup().catch(()=>finish('timeout'));},config.maxSeconds*1000);
    return {stop:()=>hangup().catch(()=>finish('stopped'))};
  }catch(error){
    await client.realtime.calls.hangup(callId).catch(()=>{});
    await finish('failed');
    throw error;
  }
}
