import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CalendarClock, CheckCircle2, HeartPulse, Layers3, PackageCheck, Pill, ShieldCheck, Sparkles, Stethoscope, Users2 } from "lucide-react";

export const Route = createFileRoute("/grupo-evr/")({
  head: () => ({ meta: [
    { title: "Grupo EVR — Saúde, ciência e gestão integrada" },
    { name: "description", content: "Grupo EVR: ecossistema integrado de saúde, atendimento, serviços e varejo farmacêutico, com gestão orientada por dados." },
  ] }),
  component: GrupoEvrHome,
});

const companies = [
  { name: "Instituto EVR", icon: HeartPulse, text: "Cuidado, acompanhamento e experiência assistencial conectados a uma operação clínica de alta organização." },
  { name: "Dr. Responde", icon: Stethoscope, text: "Relacionamento e orientação em saúde com jornadas claras, histórico integrado e continuidade de atendimento." },
  { name: "Ativese Pharma", icon: Pill, text: "Varejo farmacêutico conectado ao ecossistema: PDV, estoque, compras, vendas, margem, perdas, lotes e validade." },
];

const capabilities = [
  [CalendarClock, "Agenda inteligente", "Confirmação, lembretes, remarcação, cancelamento, fila de interesse e antecipação automática quando um horário elegível ficar livre."],
  [Users2, "CRM e jornada única", "Uma visão longitudinal do relacionamento, com permissões por operação e trilhas de auditoria para não misturar dados clínicos e comerciais."],
  [PackageCheck, "Farmácia e PDV", "Frente de caixa, estoque em tempo real, giro, ruptura, lote, validade, perdas, compras, margem e integração financeira."],
  [BarChart3, "BI executivo", "Indicadores objetivos de ocupação, no-show, remarcações, receita, ticket, margem, perdas, estoque, conversão e retenção."],
  [Layers3, "ERP + operação", "Financeiro, compras, fornecedores, contas, centros de resultado, conciliação e visão consolidada por empresa do grupo."],
  [ShieldCheck, "Governança e segurança", "Acessos por papel, segregação de contexto, logs, consentimentos e desenho orientado à LGPD e à minimização de dados."],
] as const;

function GrupoEvrHome() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#12231d] text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_70%_20%,#78b58f_0,transparent_35%),radial-gradient(circle_at_20%_90%,#a99155_0,transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#cbd7cf]"><Sparkles className="h-4 w-4" /> Grupo empresarial integrado</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-tight md:text-6xl">Saúde com autoridade. Operação com inteligência. Gestão com visão de grupo.</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/72">O Grupo EVR conecta atendimento, relacionamento, serviços e varejo farmacêutico em uma mesma inteligência operacional — preservando a identidade e as responsabilidades de cada empresa.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/grupo-evr/agendar" className="inline-flex items-center gap-2 rounded-xl bg-[#d5bc75] px-5 py-3 font-semibold text-[#12231d]">Agendar atendimento <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/grupo-evr/gestao" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-semibold text-white">Visão de gestão <BarChart3 className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="grid content-center gap-4 sm:grid-cols-2">
            {["Atendimento conectado", "Dados acionáveis", "Operação auditável", "Experiência contínua"].map((item) => <div key={item} className="rounded-3xl border border-white/12 bg-white/7 p-6 backdrop-blur"><CheckCircle2 className="mb-8 h-5 w-5 text-[#d5bc75]" /><p className="text-lg font-semibold">{item}</p></div>)}
          </div>
        </div>
      </section>

      <section id="autoridades" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#648071]">Lideranças médicas</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight">Autoridade profissional no centro da experiência. Gestão de excelência por trás de cada jornada.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-[2rem] border border-[#dbe2dc] bg-white p-8 shadow-sm"><div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-[#e5eee8] text-[#163d31]"><Stethoscope className="h-7 w-7" /></div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7e75]">Dra. Camila Perroni</p><h3 className="mt-2 text-3xl font-semibold">Liderança médica e experiência assistencial</h3><p className="mt-5 leading-7 text-[#53645b]">Sua autoridade é apresentada pelo cuidado, pela consistência da experiência clínica e pela continuidade do acompanhamento — com tecnologia apoiando, nunca substituindo, a relação profissional-paciente.</p></article>
          <article className="rounded-[2rem] border border-[#dbe2dc] bg-white p-8 shadow-sm"><div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-[#f1ead8] text-[#775f25]"><BarChart3 className="h-7 w-7" /></div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7e75]">Dr. Márcio</p><h3 className="mt-2 text-3xl font-semibold">Liderança médica, estratégia e gestão</h3><p className="mt-5 leading-7 text-[#53645b]">Posicionamento de autoridade aliado a uma visão executiva de operação: indicadores objetivos, capacidade, produtividade, qualidade, experiência do paciente e desempenho das empresas do grupo.</p></article>
        </div>
      </section>

      <section id="empresas" className="border-y border-[#dbe2dc] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#648071]">Pool de empresas</p><h2 className="mt-3 text-4xl font-semibold">Um grupo. Operações especializadas. Inteligência compartilhada.</h2><div className="mt-10 grid gap-5 lg:grid-cols-3">{companies.map(({name, icon: Icon, text}) => <article key={name} className="rounded-3xl bg-[#f7f8f6] p-7"><Icon className="h-7 w-7 text-[#163d31]" /><h3 className="mt-8 text-2xl font-semibold">{name}</h3><p className="mt-3 leading-7 text-[#5b6a62]">{text}</p></article>)}</div></div>
      </section>

      <section id="grupo" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(([Icon,title,text]) => <article key={title} className="rounded-3xl border border-[#dbe2dc] bg-white p-7"><Icon className="h-6 w-6 text-[#163d31]" /><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#5b6a62]">{text}</p></article>)}</div></section>
    </>
  );
}
