import { createFileRoute } from '@tanstack/react-router';
import { createHmac, timingSafeEqual } from 'crypto';
import { generateText, type ModelMessage } from 'ai';
import { assemblePrompt } from '@/lib/impulsionito/context-engine.server';
import { resolveProvider } from '@/lib/impulsionito/providers.server';
import { listConversationHistory, recordInboundMessage, recordOutboundMessage } from '@/lib/agents/omnichannel.server';

const AGENT_KEY = 'impulsionito-core' as const;
const TENANT = 'impulsionando';

function verify(raw:string, header:string|null){
  const secret=(process.env.IMPULSIONANDO_META_APP_SECRET||'').trim();
  if(!secret||!header?.startsWith('sha256=')) return false;
  const expected=createHmac('sha256',secret).update(raw).digest('hex');
  const supplied=header.slice(7);
  if(expected.length!==supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(supplied,'hex'));
}

function toMessages(history:Awaited<ReturnType<typeof listConversationHistory>>):ModelMessage[]{
  return history.flatMap((m):ModelMessage[]=>{
    const text=String(m.body_text||'').trim();
    if(!text)return[];
    if(m.direction==='INBOUND'||m.author_type==='CONTACT')return[{role:'user',content:text}];
    if(m.direction==='OUTBOUND'&&m.author_type==='AGENT')return[{role:'assistant',content:text}];
    return[];
  }).slice(-30);
}

async function sendInstagram(to:string,text:string){
  const token=(process.env.IMPULSIONANDO_META_IG_TOKEN||'').trim();
  const ig=(process.env.IMPULSIONANDO_META_IG_ACCOUNT_ID||'').trim();
  const version=(process.env.IMPULSIONANDO_META_GRAPH_VERSION||'v23.0').trim();
  if(!token||!ig) throw new Error('instagram_credentials_missing');
  const r=await fetch(`https://graph.instagram.com/${version}/${encodeURIComponent(ig)}/messages`,{
    method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},
    body:JSON.stringify({recipient:{id:to},message:{text:text.slice(0,2000)}}),signal:AbortSignal.timeout(12000),
  });
  const raw=await r.text(); let data:any={}; try{data=raw?JSON.parse(raw):{};}catch{data={raw:raw.slice(0,300)}}
  if(!r.ok) throw new Error(`instagram_send_${r.status}`);
  return data;
}

async function processInstagram(input:{externalUserId:string;text:string;providerMessageId?:string|null;endpointAddress?:string|null}){
  const ledger=await recordInboundMessage({agentKey:AGENT_KEY,channel:'instagram',provider:'meta_graph',externalUserId:input.externalUserId,bodyText:input.text,providerMessageId:input.providerMessageId||null,endpointAddress:input.endpointAddress||null,metadata:{tenant:TENANT,source:'meta_instagram'}});
  const messages=toMessages(await listConversationHistory(ledger.conversation_id,30));
  const assembled=assemblePrompt(undefined,{pathname:'/instagram',channel:'instagram',tenant:TENANT,audience:'instagram_contact'});
  const resolved=resolveProvider({});
  const result=await generateText({model:resolved.model,system:assembled.system,messages,temperature:0.35,maxOutputTokens:900});
  const answer=result.text.trim(); if(!answer)return;
  try{
    const sent=await sendInstagram(input.externalUserId,answer);
    await recordOutboundMessage({conversationId:ledger.conversation_id,bodyText:answer,channel:'instagram',provider:'meta_graph',endpointId:ledger.endpoint_id,status:'SENT',providerMessageId:String(sent?.message_id||sent?.messageId||'')||null,metadata:{tenant:TENANT,agent_key:AGENT_KEY,provider:resolved.provider,model:resolved.modelId}});
  }catch(error){
    await recordOutboundMessage({conversationId:ledger.conversation_id,bodyText:answer,channel:'instagram',provider:'meta_graph',endpointId:ledger.endpoint_id,status:'FAILED',metadata:{tenant:TENANT,agent_key:AGENT_KEY,delivery_error:error instanceof Error?error.message:'unknown'}});
    throw error;
  }
}

function extract(body:any){
  const out:any[]=[];
  if(body?.object!=='instagram') return out;
  for(const entry of body?.entry||[]) for(const ev of entry?.messaging||[]){
    const text=ev?.message?.text;
    if(text&&!ev?.message?.is_echo) out.push({externalUserId:String(ev.sender?.id||''),text:String(text),providerMessageId:ev.message?.mid||null,endpointAddress:String(ev.recipient?.id||'')});
  }
  return out;
}

export const Route=createFileRoute('/api/public/hooks/meta-impulsionando')({server:{handlers:{
  GET:async({request})=>{const u=new URL(request.url);const ok=u.searchParams.get('hub.mode')==='subscribe'&&u.searchParams.get('hub.verify_token')===(process.env.IMPULSIONANDO_META_VERIFY_TOKEN||'')&&u.searchParams.get('hub.challenge');return ok?new Response(String(u.searchParams.get('hub.challenge')),{status:200}):new Response('forbidden',{status:403});},
  POST:async({request})=>{const raw=await request.text();if(!verify(raw,request.headers.get('x-hub-signature-256')))return new Response('invalid signature',{status:401});let body:any;try{body=JSON.parse(raw)}catch{return new Response('invalid json',{status:400})}for(const m of extract(body).filter((x:any)=>x.externalUserId&&x.text)){try{await processInstagram(m)}catch(e){console.error('[meta-impulsionando]',e)}}return new Response('EVENT_RECEIVED',{status:200});}
}}});
