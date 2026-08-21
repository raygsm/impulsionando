import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Activity, BadgeDollarSign, BarChart3, Building2, CalendarDays, PackageX, Repeat2, ShoppingCart, UsersRound } from "lucide-react";
import { useGrupoEvrContext } from "@/hooks/use-grupo-evr-context";

export const Route = createFileRoute("/grupo-evr/gestao")({ component: GestaoEvr });

const KPI = [
  [CalendarDays,"Ocupação e agenda","Ocupação, disponibilidade, cancelamentos, remarcações, antecipações e no-show"],
  [Repeat2,"Origem e destino","Origem do paciente, indicação, campanha, empresa originadora e destino do faturamento"],
  [UsersRound,"Conversão e retenção","Lead → consulta → protocolo → farmácia → recompra → recorrência"],
  [ShoppingCart,"Vendas e pedidos","Pedidos, orçamentos, aprovações, pagamentos, vendas e fechamento"],
  [BadgeDollarSign,"Receita e margem","Receita bruta/líquida, ticket, CMV, margem, desconto e resultado"],
  [PackageX,"Estoque e perdas","Lotes, validade, ruptura, perda, descarte, cobertura e giro"],
  [Activity,"Produtividade e SLA","Tempo de atendimento, execução, produção, entrega e capacidade"],
  [BarChart3,"BI executivo","Empresa, unidade, canal, profissional, serviço, produto, origem e período"],
] as const;

function GestaoEvr(){
 const { context, setContext, options, current } = useGrupoEvrContext();
 const metrics = useMemo(() => {
   if (context === "ativese_pharma") return ["Pedidos recebidos","Orçamentos aprovados","Vendas PDV","Receita farmácia","Margem bruta","Perdas / validade"];
   if (context === "instituto_evr") return ["Consultas realizadas","Vagas recuperadas","No-show","Receita clínica","Pacientes recorrentes","Encaminhamentos autorizados"];
   if (context === "dr_responde") return ["Atendimentos realizados","Origem de pacientes","Conversão","Receita própria","Indicações geradas","Retorno / recorrência"];
   return ["Receita consolidada","Receita Instituto EVR","Receita Dr. Responde","Receita Ative-se","Indicações entre empresas","Conversão intercompany"];
 }, [context]);

 return <main className="min-h-screen bg-[#f5f7f5] text-[#17221d]">
  <section className="border-b border-[#dde4df] bg-white px-5 py-10"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#648071]">Portal Executivo · Grupo EVR</p><h1 className="mt-3 text-4xl font-semibold">Uma entrada. Três empresas. Contextos totalmente separados.</h1><p className="mt-4 max-w-4xl leading-7 text-[#5e6d65]">Escolha a empresa que deseja analisar. O login permanece o mesmo; o contexto escolhido fica persistido no dispositivo, mas dados, jornadas, faturamento e permissões continuam segregados por empresa.</p>
  <div className="mt-8 grid gap-3 md:grid-cols-4">{options.map((item)=>{const active=context===item.key; return <button key={item.key} onClick={()=>setContext(item.key)} className={`rounded-2xl border p-4 text-left transition ${active?"border-[#173e31] bg-[#173e31] text-white":"border-[#dbe2dc] bg-white hover:border-[#8aa093]"}`}><div className="flex items-center gap-2"><Building2 className="h-4 w-4"/><span className="font-semibold">{item.label}</span></div><p className={`mt-2 text-xs leading-5 ${active?"text-white/70":"text-[#708078]"}`}>{item.description}</p></button>})}</div>
  </div></section>
  <section className="mx-auto max-w-7xl px-5 py-10">
   <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#76867d]">Contexto ativo</p><h2 className="mt-1 text-3xl font-semibold">{current.label}</h2><p className="mt-2 text-sm text-[#69786f]">{current.description}</p></div>
   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{KPI.map(([Icon,title,text])=><article key={title} className="rounded-3xl border border-[#dde4df] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-[#163d31]"/><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#8a9890]">BI</span></div><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#637168]">{text}</p></article>)}</div>
   <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-3xl border border-[#dde4df] bg-white p-7"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Painel diário · {current.label}</h2><span className="rounded-full bg-[#edf2ee] px-3 py-1 text-xs font-semibold text-[#3f5c4e]">contexto persistente</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{metrics.map((label)=><Metric key={label} label={label}/>)}</div></section><section className="rounded-3xl bg-[#12231d] p-7 text-white"><h2 className="text-2xl font-semibold">Alertas executivos</h2><ul className="mt-6 space-y-4 text-sm leading-6 text-white/72"><li>• queda de conversão por origem/canal</li><li>• aumento de cancelamentos, remarcações ou no-show</li><li>• indicação entre empresas sem conversão</li><li>• faturamento lançado na empresa incorreta</li><li>• margem abaixo da meta ou desconto excessivo</li><li>• SLA operacional fora do padrão</li></ul></section></div>
  </section>
 </main>
}

function Metric({label}:{label:string}){return <div className="rounded-2xl bg-[#f5f7f5] p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#7c8b83]">{label}</p><p className="mt-3 text-2xl font-semibold text-[#213a2f]">—</p><p className="mt-1 text-xs text-[#8a9890]">Conectado quando houver dados reais deste contexto</p></div>}
