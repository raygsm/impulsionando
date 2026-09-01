import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";

type Msg={role:"user"|"assistant";text:string};

function getSession(){
  if(typeof window==="undefined")return "web:colors:ssr";
  const key="colors_iris_session";
  let id=window.localStorage.getItem(key);
  if(!id){id=`web:colors:${crypto.randomUUID()}`;window.localStorage.setItem(key,id);}
  return id;
}
function getCheckoutId(){
  if(typeof window==="undefined")return undefined;
  const id=sessionStorage.getItem("color_saude_checkout_id")?.trim()??"";
  return /^col_[A-Za-z0-9_-]{6,100}$/.test(id)?id:undefined;
}

export default function IrisDock(){
  const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [input,setInput]=useState("");
  const [messages,setMessages]=useState<Msg[]>([{role:"assistant",text:"Oi! Eu sou a Íris, da Colors Saúde. Posso te ajudar com produtos, compra, pedido, rastreio, afiliados, eventos, agenda e suporte."}]);
  const session=useMemo(getSession,[]); const endRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages,open]);
  const send=async()=>{const text=input.trim();if(!text||busy)return;const next=[...messages,{role:"user" as const,text}];setMessages(next);setInput("");setBusy(true);try{const res=await fetch("/api/colors/iris/chat",{method:"POST",headers:{"Content-Type":"application/json","x-impulsionando-session":session},body:JSON.stringify({messages:next,pathname:window.location.pathname,colorsCheckoutId:getCheckoutId()})});if(!res.ok||!res.body)throw new Error(`HTTP ${res.status}`);const reader=res.body.getReader();const dec=new TextDecoder();let acc="";setMessages([...next,{role:"assistant",text:""}]);while(true){const {value,done}=await reader.read();if(done)break;acc+=dec.decode(value,{stream:true});setMessages([...next,{role:"assistant",text:acc}]);}}catch{setMessages([...next,{role:"assistant",text:"Não consegui concluir essa resposta agora. Você pode tentar novamente ou abrir um atendimento da Colors Saúde com protocolo."}]);}finally{setBusy(false);}};
  return <><button onClick={()=>setOpen(v=>!v)} className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-400 text-black shadow-2xl shadow-emerald-500/30" aria-label="Abrir Íris"><Bot className="h-6 w-6"/></button>{open&&<div className="fixed bottom-24 right-4 z-50 flex h-[min(640px,76vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#08110d] text-white shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="font-black">Íris · Colors Saúde</p><p className="text-xs text-white/50">Conectada ao Core Impulsionito</p></div><button onClick={()=>setOpen(false)} aria-label="Fechar"><X className="h-5 w-5 text-white/60"/></button></div><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((m,i)=><div key={i} className={m.role==="user"?"ml-10 rounded-2xl bg-emerald-400 p-3 text-sm text-black":"mr-8 rounded-2xl bg-white/[.06] p-3 text-sm text-white/85"}>{m.text}</div>)}{busy&&<div className="mr-8 rounded-2xl bg-white/[.06] p-3 text-sm text-white/50">Íris está pensando…</div>}<div ref={endRef}/></div><div className="border-t border-white/10 p-3"><div className="flex gap-2"><textarea rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="Digite sua mensagem…" className="max-h-28 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-emerald-400/50"/><button disabled={busy||!input.trim()} onClick={()=>void send()} className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400 text-black disabled:opacity-50"><Send className="h-4 w-4"/></button></div><p className="mt-2 px-1 text-[10px] text-white/35">A Íris não substitui avaliação médica e não inventa informações que dependam de validação oficial.</p></div></div>}</>;
}
