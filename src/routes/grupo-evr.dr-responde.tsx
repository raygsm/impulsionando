import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Stethoscope, UsersRound, WalletCards } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/dr-responde")({ component: DrResponde });

const items = [
  [UsersRound,"CRM próprio","Leads, pacientes, origem, conversão, recorrência e histórico de relacionamento."],
  [CalendarDays,"Agenda própria","Disponibilidade, confirmação, remarcação, cancelamento, no-show e produtividade."],
  [Stethoscope,"Operação independente","Fluxos e indicadores próprios, mesmo quando houver integração com outras empresas do grupo."],
  [WalletCards,"Faturamento rastreável","Receita, origem, indicação, empresa faturadora, documentos e repasses quando aplicáveis."],
] as const;

function DrResponde(){return <main className="min-h-screen bg-[#f6f7f4] text-[#17221d]"><section className="bg-white px-5 py-16"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#708078]">Dr. Responde</p><h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-tight">Uma operação médica própria, conectada ao grupo sem perder identidade.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-[#617067]">Agenda, relacionamento, conversão e faturamento permanecem separados. Quando houver indicação entre empresas, o sistema registra origem, destino e resultado econômico.</p><div className="mt-8"><Link to="/grupo-evr/gestao" className="inline-flex items-center gap-2 rounded-xl bg-[#173e31] px-5 py-3 font-semibold text-white">Ver contexto Dr. Responde <ArrowRight className="h-4 w-4"/></Link></div></div></section><section className="mx-auto max-w-6xl px-5 py-12"><div className="grid gap-4 md:grid-cols-2">{items.map(([Icon,title,text])=><article key={title} className="rounded-3xl border border-[#dbe2dc] bg-white p-6"><Icon className="h-6 w-6 text-[#173e31]"/><h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 text-[#65736b]">{text}</p></article>)}</div></section></main>}
