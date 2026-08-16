import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BriefcaseMedical,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  HeartPulse,
  Network,
  ShieldCheck,
  Stethoscope,
  TimerReset,
  Users,
} from "lucide-react";
import { ChrismedShell } from "@/components/chrismed/ChrismedShell";

export const Route = createFileRoute("/chrismed/medicina-ocupacional")({
  head: () => ({
    meta: [
      { title: "Medicina Ocupacional CHRISMED · Gestão, PCMSO, ASO e SST" },
      {
        name: "description",
        content:
          "Medicina Ocupacional CHRISMED para empresas: gestão integrada de PCMSO, ASO, riscos ocupacionais, documentos e acompanhamento de SST.",
      },
    ],
  }),
  component: MedicinaOcupacionalPage,
});

const programs = [
  { icon: ShieldCheck, title: "GRO e PGR", text: "Organização da gestão de riscos ocupacionais, inventário, plano de ação, responsáveis e acompanhamento das medidas preventivas." },
  { icon: HeartPulse, title: "PCMSO e ASO", text: "Programa médico coordenado, exames ocupacionais e acompanhamento dos ASOs em uma jornada rastreável para empresa e profissionais." },
  { icon: Network, title: "eSocial SST", text: "Estrutura operacional para integrar os dados de saúde e segurança necessários às rotinas de SST e reduzir perda de informação entre áreas." },
  { icon: FileCheck2, title: "Gestão documental", text: "Documentos, anexos, versões, vencimentos e histórico organizados para consulta rápida, governança e auditoria operacional." },
];

const lifecycle = [
  ["Admissional", "Antes do início das atividades, com fluxo claro de solicitação, atendimento e retorno para a empresa."],
  ["Periódico", "Controle recorrente conforme programa médico, função, riscos e periodicidades aplicáveis."],
  ["Retorno ao trabalho", "Acompanhamento da avaliação necessária no retorno após afastamentos enquadrados nas regras ocupacionais."],
  ["Mudança de riscos", "Reavaliação quando a mudança de atividade ou ambiente altera a exposição ocupacional relevante."],
  ["Demissional", "Fluxo de encerramento com rastreabilidade do exame, ASO e documentação vinculada ao trabalhador."],
  ["Monitoração", "Acompanhamento longitudinal de exames, indicadores e pendências para apoiar prevenção e gestão."],
] as const;

function MedicinaOcupacionalPage() {
  return (
    <ChrismedShell>
      <main className="bg-[var(--chrismed-ivory)] text-[var(--chrismed-forest-deep)]">
        <section className="relative overflow-hidden bg-[var(--chrismed-forest-deep)] text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_15%,white_0,transparent_28%),radial-gradient(circle_at_85%_25%,#e6c16a_0,transparent_25%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:py-28">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--chrismed-amber-soft)]">CHRISMED · Saúde ocupacional para empresas</p>
              <h1 className="chrismed-serif mt-5 text-5xl leading-[.98] md:text-7xl">Medicina ocupacional não deve ser uma pilha de documentos.</h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/78 md:text-xl">Deve funcionar como um sistema de prevenção, acompanhamento e decisão. A CHRISMED organiza programas, exames, ASOs, riscos, documentos e comunicação para que a empresa enxergue o que está acontecendo em tempo real.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/agendar?service=aso" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--chrismed-amber-soft)] px-6 py-3 text-sm font-bold text-[var(--chrismed-forest-deep)]">Agendar ASO →</a>
                <a href="/agendar?service=pericia" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold">Agendar entrevista para laudo</a>
                <Link to="/chrismed/contato" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold">Falar com a CHRISMED<ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="grid content-center gap-4">
              <StatusCard icon={Building2} label="Empresa" value="Visão centralizada" detail="Unidades, trabalhadores, funções e pendências" />
              <StatusCard icon={Gauge} label="Gestão" value="Acompanhamento contínuo" detail="ASO, exames, vencimentos e indicadores" />
              <StatusCard icon={TimerReset} label="Operação" value="Menos retrabalho" detail="Fluxos, alertas, histórico e responsabilidades" />
            </div>
          </div>
        </section>

        <section id="solucao" className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--chrismed-mustard-deep)]">Programas integrados</p>
          <h2 className="chrismed-serif mt-3 max-w-4xl text-4xl md:text-5xl">Da obrigação legal à gestão efetiva da saúde ocupacional.</h2>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-[var(--chrismed-graphite)]">Cumprir os programas ocupacionais não é apenas produzir documentos. É manter riscos conhecidos, exames coerentes com as exposições, informações atualizadas e evidências organizadas para proteger pessoas e reduzir vulnerabilidades da empresa.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">{programs.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[1.7rem] border border-[var(--chrismed-sand)] bg-white p-7 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--chrismed-forest-deep)] text-[var(--chrismed-amber-soft)]"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-relaxed text-[var(--chrismed-graphite)]">{text}</p></article>)}</div>
        </section>

        <section className="border-y border-[var(--chrismed-sand)] bg-[#f4efdf]"><div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20"><div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--chrismed-mustard-deep)]">Ciclo ocupacional</p><h2 className="chrismed-serif mt-3 text-4xl md:text-5xl">Cada trabalhador, cada etapa, um histórico coerente.</h2><p className="mt-5 leading-relaxed text-[var(--chrismed-graphite)]">A empresa acompanha o status das jornadas sem depender de planilhas dispersas ou trocas intermináveis de mensagens.</p></div><div className="grid gap-4 sm:grid-cols-2">{lifecycle.map(([title, text]) => <article key={title} className="rounded-2xl border border-[var(--chrismed-sand)] bg-white p-5"><div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5 text-[var(--chrismed-mustard-deep)]" />{title}</div><p className="mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">{text}</p></article>)}</div></div></div></section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20"><div className="grid gap-8 md:grid-cols-2"><div className="rounded-[2rem] bg-[var(--chrismed-forest-deep)] p-8 text-white md:p-10"><Activity className="h-8 w-8 text-[var(--chrismed-amber-soft)]" /><h2 className="chrismed-serif mt-5 text-4xl">Transparência para a empresa em tempo real.</h2><p className="mt-5 leading-relaxed text-white/75">A proposta operacional é permitir que o contratante acompanhe, em um único ambiente, o que foi solicitado, agendado, realizado, concluído ou está pendente.</p><ul className="mt-7 space-y-3 text-sm text-white/85">{["Admissional: solicitado, agendado, atendido e concluído","Periódico: trabalhadores previstos, convocados e pendentes","Demissional: fluxo e documentação de encerramento","ASOs e exames: status, histórico e disponibilidade documental","Indicadores: volumes, pendências, vencimentos e acompanhamento por unidade"].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--chrismed-amber-soft)]" />{item}</li>)}</ul></div><div className="rounded-[2rem] border border-[var(--chrismed-sand)] bg-white p-8 md:p-10"><ClipboardCheck className="h-8 w-8 text-[var(--chrismed-mustard-deep)]" /><h2 className="chrismed-serif mt-5 text-4xl">Conformidade começa com processo bem controlado.</h2><p className="mt-5 leading-relaxed text-[var(--chrismed-graphite)]">NR-1, GRO/PGR, NR-7/PCMSO e obrigações de SST exigem informação consistente, responsabilidades definidas e acompanhamento contínuo. A tecnologia não substitui o responsável técnico: ela ajuda a garantir que a execução seja organizada, rastreável e auditável.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><Mini icon={Stethoscope} text="Gestão médica" /><Mini icon={Users} text="Trabalhadores" /><Mini icon={BriefcaseMedical} text="Funções e riscos" /><Mini icon={FileCheck2} text="Documentos e evidências" /></div></div></div></section>

        <section className="bg-[var(--chrismed-forest-deep)] text-white"><div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-6 md:py-20"><p className="text-xs font-bold uppercase tracking-[.22em] text-[var(--chrismed-amber-soft)]">CHRISMED</p><h2 className="chrismed-serif mx-auto mt-4 max-w-4xl text-4xl md:text-5xl">Uma operação ocupacional desenhada para funcionar como sistema — não como arquivo morto.</h2><p className="mx-auto mt-5 max-w-3xl text-white/72">Cadastros, riscos, programas, agenda, exames, ASOs, documentos, comunicação e indicadores trabalhando na mesma jornada operacional.</p><Link to="/chrismed/contato" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--chrismed-amber-soft)] px-7 py-3 text-sm font-bold text-[var(--chrismed-forest-deep)]">Solicitar apresentação<ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
    </ChrismedShell>
  );
}

function StatusCard({ icon: Icon, label, value, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; detail: string }) {
  return <div className="rounded-[1.6rem] border border-white/14 bg-white/8 p-6 backdrop-blur"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--chrismed-amber-soft)]"><Icon className="h-5 w-5" /></div><div><p className="text-xs uppercase tracking-[.16em] text-white/55">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-1 text-sm text-white/60">{detail}</p></div></div></div>;
}

function Mini({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-[#f4efdf] p-4 text-sm font-semibold"><Icon className="h-5 w-5 text-[var(--chrismed-mustard-deep)]" />{text}</div>;
}
