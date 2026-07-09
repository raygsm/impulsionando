import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Heart, FileText, Calendar, Bell, FolderOpen, History,
  ArrowRight, ShieldCheck,
} from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/area";

export const Route = createFileRoute("/garrido/area")({
  head: () => ({
    meta: [
      { title: "Área do cliente — Imobiliária Garrido" },
      { name: "description", content: "Favoritos, propostas, visitas agendadas, documentos, notificações e histórico de imóveis. Área do cliente da Imobiliária Garrido no Core Impulsionando." },
      { property: "og:title", content: "Área do cliente — Imobiliária Garrido" },
      { property: "og:description", content: "Favoritos, propostas, visitas, documentos e notificações em um só lugar." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Área do cliente" },
      ])),
    }],
  }),
  component: AreaClientePage,
});

const AREAS = [
  { icon: Heart, titulo: "Favoritos", desc: "Imóveis salvos e alertas de preço.", cor: "text-rose-500" },
  { icon: FileText, titulo: "Propostas", desc: "Propostas enviadas e recebidas com histórico.", cor: "text-emerald-600" },
  { icon: Calendar, titulo: "Visitas agendadas", desc: "Confirme, remarque ou cancele visitas.", cor: "text-sky-600" },
  { icon: FolderOpen, titulo: "Documentos", desc: "Contratos, comprovantes e certidões.", cor: "text-amber-600" },
  { icon: Bell, titulo: "Notificações", desc: "Alertas por e-mail, WhatsApp e app.", cor: "text-violet-600" },
  { icon: History, titulo: "Histórico", desc: "Imóveis visitados, propostas passadas e transações.", cor: "text-slate-600" },
];

function AreaClientePage() {
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Área do cliente" }]} />

      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="rounded-2xl bg-[color:var(--garrido-ink)] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
              Área do cliente
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold mt-2">
              Sua conta Garrido, tudo em um só lugar
            </h1>
            <p className="mt-2 text-white/80 max-w-2xl">
              Área conectada ao Core Impulsionando. Faça login para acessar favoritos, propostas,
              visitas, documentos e notificações — a mesma conta funciona no site inteiro.
            </p>
          </div>
          <a
            href="/auth?redirect=/garrido/area"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold px-5 py-3 hover:brightness-110 min-h-11"
          >
            Entrar na minha conta <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map((a) => (
            <div
              key={a.titulo}
              className="rounded-xl bg-white p-5 border border-black/5 hover:shadow-lg transition"
            >
              <a.icon className={`h-6 w-6 ${a.cor}`} aria-hidden />
              <div className="mt-3 font-serif text-lg font-bold text-[color:var(--garrido-ink)]">
                {a.titulo}
              </div>
              <p className="text-sm text-slate-500 mt-1">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-white p-5 border border-black/5 flex flex-col md:flex-row md:items-center gap-4">
          <ShieldCheck className="h-6 w-6 text-[color:var(--garrido-gold)] shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="font-semibold text-[color:var(--garrido-ink)]">
              Arquitetura conectada ao Core Impulsionando
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Favoritos ficam sincronizados entre celular e computador; propostas e visitas
              usam as tabelas de CRM imobiliário do Core; documentos residem em armazenamento
              privado por usuário. A Garrido é uma empresa conectada ao Core — sua conta vale
              para todas as marcas do ecossistema.
            </p>
          </div>
          <Link
            to="/garrido/politicas"
            className="shrink-0 rounded-md border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-[color:var(--garrido-cream)] min-h-11 inline-flex items-center"
          >
            Ver políticas
          </Link>
        </div>
      </section>
    </>
  );
}
