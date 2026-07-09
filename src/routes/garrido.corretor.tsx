import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase, Users, Calendar, FileText, PieChart, DollarSign,
  ArrowRight, ShieldCheck,
} from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/corretor";

export const Route = createFileRoute("/garrido/corretor")({
  head: () => ({
    meta: [
      { title: "Área do corretor — Imobiliária Garrido" },
      { name: "description", content: "Carteira de imóveis, leads, visitas, propostas, funil comercial, comissões e indicadores para corretores da Imobiliária Garrido no Core Impulsionando." },
      { property: "og:title", content: "Área do corretor — Imobiliária Garrido" },
      { property: "og:description", content: "Carteira, leads, funil, propostas e comissões em um só painel." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Área do corretor" },
      ])),
    }],
  }),
  component: CorretorPage,
});

const AREAS = [
  { icon: Briefcase, titulo: "Carteira de imóveis", desc: "Publique, edite e gerencie fotos, preço e status dos imóveis captados." },
  { icon: Users, titulo: "Leads e matching", desc: "Leads distribuídos automaticamente por SLA, com matching por perfil e localização." },
  { icon: Calendar, titulo: "Agenda de visitas", desc: "Confirmações, remarcações e feedback pós-visita direto no app." },
  { icon: FileText, titulo: "Propostas & contratos", desc: "Negociação, contra-proposta, assinatura digital e status jurídico." },
  { icon: PieChart, titulo: "Funil comercial", desc: "Kanban de novo → qualificado → visita → proposta → fechamento com SLA." },
  { icon: DollarSign, titulo: "Comissões & indicadores", desc: "Extrato de comissões, metas, conversão e ranking do time." },
];

function CorretorPage() {
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Área do corretor" }]} />

      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="rounded-2xl bg-[color:var(--garrido-ink)] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
              Área do corretor
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold mt-2">
              Painel do corretor Garrido
            </h1>
            <p className="mt-2 text-white/80 max-w-2xl">
              Carteira, leads, visitas, propostas, comissões e indicadores em um só painel
              conectado ao Core Impulsionando. Mobile-first: use no celular durante a visita.
            </p>
          </div>
          <a
            href="/auth?redirect=/garrido/corretor"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold px-5 py-3 hover:brightness-110 min-h-11"
          >
            Entrar no painel <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map((a) => (
            <div
              key={a.titulo}
              className="rounded-xl bg-white p-5 border border-black/5 hover:shadow-lg transition"
            >
              <a.icon className="h-6 w-6 text-[color:var(--garrido-gold)]" aria-hidden />
              <div className="mt-3 font-serif text-lg font-bold text-[color:var(--garrido-ink)]">
                {a.titulo}
              </div>
              <p className="text-sm text-slate-500 mt-1">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-[color:var(--garrido-cream)] p-6 border border-black/5">
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
            Dashboard estratégico
          </div>
          <h2 className="font-serif text-xl font-bold text-[color:var(--garrido-ink)] mt-2">
            Visão comercial em tempo real
          </h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: "Imóveis ativos", v: "carteira em curadoria" },
              { l: "Captações do mês", v: "meta vs realizado" },
              { l: "Visitas agendadas", v: "confirmação em tempo real" },
              { l: "Propostas em aberto", v: "SLA de retorno" },
              { l: "Contratos assinados", v: "digital e presencial" },
              { l: "Funil comercial", v: "conversão por etapa" },
              { l: "Comissões", v: "extrato consolidado" },
              { l: "Ranking do time", v: "metas e reconhecimento" },
            ].map((k) => (
              <div key={k.l} className="rounded-lg bg-white p-3 border border-black/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{k.l}</div>
                <div className="text-sm font-semibold text-[color:var(--garrido-ink)]">{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-5 border border-black/5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[color:var(--garrido-gold)] shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 text-sm text-slate-600">
            <div className="font-semibold text-[color:var(--garrido-ink)]">
              Roles e permissões centralizadas
            </div>
            <p className="mt-1 leading-relaxed">
              Corretores, captadores, gerentes e administradores usam o mesmo painel com escopos
              diferentes, controlado pelo RBAC do Core Impulsionando (tabelas <code>user_roles</code> +
              <code> has_role</code>). Nenhum dado sensível fora do escopo do usuário.
            </p>
            <div className="mt-3">
              <Link
                to="/garrido/contato"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--garrido-ink)] underline"
              >
                Quero me tornar corretor Garrido
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
