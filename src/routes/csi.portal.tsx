import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Bell, BookOpenCheck, FileText, Gauge, LockKeyhole, Radar, ShieldCheck, TrendingUp, UserRoundCheck } from "lucide-react";

export const Route = createFileRoute("/csi/portal")({ component: CsiInvestorPortal });

const cards = [
  { icon: Gauge, title: "Visão consolidada", text: "Patrimônio, alocação e evolução somente após conexão de fonte financeira validada." },
  { icon: TrendingUp, title: "Mercados", text: "Índices, juros, câmbio e sinais macro com fonte, horário e contexto." },
  { icon: Radar, title: "Radar CSI", text: "Eventos que podem afetar patrimônio, setores e teses acompanhadas." },
  { icon: Bell, title: "Alertas", text: "Preferências pessoais de comunicação e criticidade por tema." },
  { icon: FileText, title: "Documentos", text: "Relatórios, comprovantes, termos e documentos com histórico de acesso." },
  { icon: UserRoundCheck, title: "Perfil & suitability", text: "Objetivos, horizonte, liquidez, conhecimento e tolerância a risco." },
];

function CsiInvestorPortal() {
  return <main className="min-h-screen bg-[#07111b] text-white">
    <header className="border-b border-white/10 bg-[#08141f]/95 backdrop-blur"><div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-amber-300">CSI Invest</p><p className="font-semibold">Área do investidor</p></div><Link to="/csi" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200"><ShieldCheck className="h-3.5 w-3.5"/> Ambiente privado preparado</span><h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight">Seu patrimônio merece contexto, não ruído.</h1><p className="mt-5 max-w-2xl text-lg text-slate-400">Este painel é a camada CSI de relacionamento e inteligência. Dados financeiros reais permanecem bloqueados até integração homologada com instituição/custodiante e autorização do cliente.</p></div>
        <aside className="lg:col-span-4 rounded-3xl border border-amber-300/20 bg-amber-300/[.07] p-6"><LockKeyhole className="h-6 w-6 text-amber-300"/><h2 className="mt-4 font-semibold">Regra de confiança</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">Nenhum saldo, rentabilidade, produto ou posição é inventado. Sem fonte homologada, o sistema exibe estado de integração — nunca números demonstrativos com aparência de dados reais.</p></aside>
      </div>
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">{cards.map(({icon:Icon,title,text})=><article key={title} className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><Icon className="h-6 w-6 text-amber-300"/><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p><div className="mt-5 inline-flex items-center gap-2 text-xs text-slate-600"><AlertTriangle className="h-3.5 w-3.5"/> aguardando fonte/integracao quando aplicável</div></article>)}</div>
      <div className="mt-10 rounded-3xl border border-white/10 bg-[#0b1824] p-7 flex flex-col md:flex-row gap-5 md:items-center md:justify-between"><div className="flex gap-4"><BookOpenCheck className="h-7 w-7 shrink-0 text-amber-300"/><div><h2 className="font-semibold">Jornada de qualificação CSI</h2><p className="mt-1 text-sm text-slate-400">Cadastro → identidade → objetivos → suitability → consentimentos → especialista → instituição/parceiro regulado → acompanhamento.</p></div></div><button className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950">Iniciar perfil de investidor</button></div>
    </section>
  </main>;
}
