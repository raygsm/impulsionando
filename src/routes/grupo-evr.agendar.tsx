import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Clock3, MessageCircleMore, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/agendar")({ component: AgendaEvr });

const steps = [
  ["Escolha do atendimento", "Paciente seleciona serviço, profissional e melhor janela de horário."],
  ["Confirmação inteligente", "Confirmação imediata e régua automática por WhatsApp, e-mail ou SMS conforme consentimento."],
  ["Antecipação opcional", "Paciente pode entrar na fila inteligente para receber oferta quando uma vaga anterior compatível surgir."],
  ["Remarcação sem atrito", "Ao cancelar ou remarcar, a vaga volta ao motor de disponibilidade e pode ser ofertada automaticamente."],
];

function AgendaEvr() {
  return <main className="min-h-screen bg-[#f6f8f6] text-[#17221d]">
    <section className="bg-[#12231d] px-5 py-16 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#c4d3ca]">Grupo EVR · Agenda inteligente</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">Menos ociosidade. Menos no-show. Mais conveniência para o paciente.</h1><p className="mt-5 max-w-3xl text-white/70">A agenda do Grupo EVR combina disponibilidade em tempo real, confirmação, remarcação, cancelamento e uma fila opcional de antecipação para preencher horários vagos com inteligência.</p></div></section>
    <section className="mx-auto max-w-6xl px-5 py-14"><div className="grid gap-5 md:grid-cols-2">{steps.map(([title,text],i)=><article key={title} className="rounded-3xl border border-[#dde4df] bg-white p-7"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e5eee8] font-semibold text-[#163d31]">{i+1}</span><h2 className="text-xl font-semibold">{title}</h2></div><p className="mt-4 leading-7 text-[#5c6a63]">{text}</p></article>)}</div>
    <div className="mt-10 grid gap-4 md:grid-cols-4">{[[CalendarClock,"Ocupação"],[RefreshCw,"Remarcações"],[Clock3,"Antecipações"],[MessageCircleMore,"Confirmações"]].map(([Icon,label]:any)=><div key={label} className="rounded-2xl bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-[#163d31]"/><p className="mt-4 text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-[#708078]">Indicador alimentado pelo Core EVR</p></div>)}</div>
    <div className="mt-10 rounded-3xl border border-[#d9e4dc] bg-[#edf5ef] p-7"><div className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 text-[#24583f]"/><div><h3 className="font-semibold">Regra de experiência</h3><p className="mt-2 text-sm leading-6 text-[#53645b]">A antecipação é sempre opt-in. Cada oferta possui prazo de resposta e idempotência para impedir dupla ocupação do mesmo horário.</p></div></div></div></section>
  </main>;
}
