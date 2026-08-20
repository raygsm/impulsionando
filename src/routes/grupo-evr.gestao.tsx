import { createFileRoute } from "@tanstack/react-router";
import { Activity, BadgeDollarSign, BarChart3, CalendarDays, PackageX, Repeat2, ShoppingCart, UsersRound } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/gestao")({ component: GestaoEvr });

const kpis = [
  [CalendarDays,"Ocupação clínica","Agenda ocupada x disponível, por profissional, serviço e unidade"],
  [Repeat2,"Remarcações e no-show","Perdas de agenda, reagendamentos, cancelamentos e recuperação"],
  [UsersRound,"Conversão e retenção","Lead → consulta → tratamento → recompra → recorrência"],
  [ShoppingCart,"Conversão farmácia","Pedidos recebidos, orçados, aprovados, pagos e concluídos"],
  [BadgeDollarSign,"Receita e margem","Receita, ticket, CMV, margem e resultado por unidade"],
  [PackageX,"Perdas e validade","Quebra, vencimento, descarte, ruptura e estoque parado"],
  [Activity,"Capacidade operacional","Tempo de atendimento, produção, SLA e produtividade"],
  [BarChart3,"Visão consolidada","Grupo, empresa, unidade, canal, campanha, profissional e período"],
];

function GestaoEvr(){
 return <main className="min-h-screen bg-[#f5f7f5] text-[#17221d]">
  <section className="border-b border-[#dde4df] bg-white px-5 py-12"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#648071]">Grupo EVR · Gestão executiva</p><h1 className="mt-3 text-4xl font-semibold">Gestão objetiva para quem administra o negócio de verdade.</h1><p className="mt-4 max-w-4xl leading-7 text-[#5e6d65]">Dashboards desenhados para decisão: poucos indicadores na primeira camada, detalhamento progressivo e filtros por empresa, unidade, profissional, serviço, produto, canal e período.</p></div></section>
  <section className="mx-auto max-w-7xl px-5 py-12"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{kpis.map(([Icon,title,text]:any)=><article key={title} className="rounded-3xl border border-[#dde4df] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-[#163d31]"/><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#8a9890]">BI</span></div><h2 className="mt-8 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#637168]">{text}</p></article>)}</div>
  <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-3xl border border-[#dde4df] bg-white p-7"><h2 className="text-2xl font-semibold">Painel diário</h2><div className="mt-6 grid gap-3 sm:grid-cols-2"><Metric label="Consultas realizadas"/><Metric label="Vagas recuperadas"/><Metric label="Pedidos enviados à farmácia"/><Metric label="Orçamentos aprovados"/><Metric label="Receita clínica"/><Metric label="Receita farmácia"/></div></section><section className="rounded-3xl bg-[#12231d] p-7 text-white"><h2 className="text-2xl font-semibold">Alertas executivos</h2><ul className="mt-6 space-y-4 text-sm leading-6 text-white/72"><li>• agenda com ociosidade acima da meta</li><li>• aumento de no-show por canal ou profissional</li><li>• orçamento farmacêutico parado sem resposta</li><li>• produto/lote próximo ao vencimento</li><li>• queda de margem ou aumento de desconto</li><li>• SLA de produção/entrega fora do padrão</li></ul></section></div></section>
 </main>
}

function Metric({label}:{label:string}){return <div className="rounded-2xl bg-[#f5f7f5] p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#7c8b83]">{label}</p><p className="mt-3 text-2xl font-semibold text-[#213a2f]">—</p><p className="mt-1 text-xs text-[#8a9890]">Conectado quando houver dados reais</p></div>}
