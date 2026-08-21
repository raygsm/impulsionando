import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, HeartPulse, LineChart, UsersRound } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/instituto")({ component: InstitutoEvr });

const items = [
  [CalendarClock,"Agenda inteligente","Confirmação, antecipação, remarcação, cancelamento, ocupação e recuperação de vagas."],
  [UsersRound,"Relacionamento","CRM, origem, jornada, recorrência e acompanhamento longitudinal do paciente."],
  [HeartPulse,"Cuidado integrado","Atendimento, documentos, protocolos e continuidade assistencial com acesso por função."],
  [LineChart,"Gestão","Receita clínica, produtividade, ocupação, no-show, retorno e origem de pacientes."],
] as const;

function InstitutoEvr(){return <main className="min-h-screen bg-[#f6f7f4] text-[#17221d]"><section className="bg-[#173e31] px-5 py-16 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/60">Instituto EVR</p><h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-tight">Cuidado conectado à gestão. Gestão conectada à experiência.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">A operação clínica concentra agenda, pacientes, acompanhamento, documentos, jornadas e inteligência de gestão sem misturar dados comerciais da farmácia.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/grupo-evr/agendar" className="rounded-xl bg-[#d5bc75] px-5 py-3 font-semibold text-[#173e31]">Agendar atendimento</Link><Link to="/grupo-evr/gestao" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold">Abrir gestão <ArrowRight className="h-4 w-4"/></Link></div></div></section><section className="mx-auto max-w-6xl px-5 py-12"><div className="grid gap-4 md:grid-cols-2">{items.map(([Icon,title,text])=><article key={title} className="rounded-3xl border border-[#dbe2dc] bg-white p-6"><Icon className="h-6 w-6 text-[#173e31]"/><h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-[#65736b]">{text}</p></article>)}</div></section></main>}
