import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Home as HomeIcon,
  Users,
  Wrench,
  Calendar,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_BRAND,
  MAROCAS_IMAGENS,
  MAROCAS_SERVICOS,
  MAROCAS_JORNADA_ANFITRIAO,
  MAROCAS_PROVA_SOCIAL,
  MAROCAS_CONTATO,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";
import { marocasPlanos } from "@/components/marocas/marocasPlanos";

const CANONICAL = "/marocas";

export const Route = createFileRoute("/marocas")({
  head: () => ({
    meta: [
      { title: "Marocas — Gestão de imóveis de locação por temporada" },
      {
        name: "description",
        content:
          "Marocas cuida da operação do seu imóvel de temporada: limpeza, reposição, manutenção, comunicação com hóspedes e agenda. Para anfitriões que querem profissionalizar sem cuidar da operação todos os dias.",
      },
      { property: "og:title", content: "Marocas — gestão premium de locação por temporada" },
      { property: "og:description", content: "Limpeza, manutenção, comunicação com hóspedes e agenda em uma só plataforma." },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.heroApto },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: MarocasHome,
});

function MarocasHome() {
  return (
    <MarocasShell transparentHeader>
      {/* HERO */}
      <section className="relative min-h-[92dvh] flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.heroApto}
            alt="Sala clara de apartamento em Copacabana"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/55 to-slate-900/20" />
        </div>

        <div className="container mx-auto px-4 md:px-6 py-24 text-white">
          <div className="max-w-3xl">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
              {MAROCAS_BRAND.vertical}
            </p>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Seu imóvel de temporada, <span className="text-amber-300">operado</span> com padrão de hotelaria.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl">
              {MAROCAS_BRAND.slogan} Limpeza, reposição, manutenção, comunicação
              com hóspedes e agenda — em uma só plataforma para anfitriões
              e proprietários.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/marocas/cadastrar-imovel"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold shadow-xl hover:opacity-90 transition"
              >
                Cadastrar meu imóvel <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/marocas/planos"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 text-white px-6 py-3 font-semibold backdrop-blur hover:bg-white/10 transition"
              >
                Ver planos e preços
              </Link>
              <Link
                to="/marocas/hospedes"
                className="inline-flex items-center gap-2 rounded-full text-white/85 px-4 py-3 font-medium hover:text-white transition"
              >
                Sou hóspede →
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
              {MAROCAS_PROVA_SOCIAL.map((k) => (
                <div key={k.label} className="rounded-lg bg-white/10 backdrop-blur border border-white/15 px-4 py-3">
                  <div className="text-2xl font-bold text-amber-300">{k.valor}</div>
                  <div className="text-xs text-white/80 mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROMESSA */}
      <section className="container mx-auto px-4 md:px-6 py-20 max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Para anfitriões</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
          Você tem o imóvel. Nós temos a operação.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {MAROCAS_BRAND.promessa}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
          {["Sem taxa por reserva", "Prestadores homologados", "Checklist fotográfico", "Relatório mensal"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 bg-card">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* SERVIÇOS OPERACIONAIS */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">O que a Marocas executa</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Operação completa do imóvel</h2>
            <p className="mt-3 text-muted-foreground">
              Cada serviço com padrão auditado, prestadores homologados e checklist obrigatório. Você acompanha tudo no painel do proprietário.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MAROCAS_SERVICOS.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card border p-5 hover:shadow-md transition">
                <div className="text-3xl">{s.emoji}</div>
                <h3 className="font-semibold mt-3">{s.titulo}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.resumo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JORNADA DO ANFITRIÃO */}
      <section className="container mx-auto px-4 md:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Jornada do anfitrião</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Do cadastro à operação no piloto automático em 7 dias.</h2>
            <p className="mt-4 text-muted-foreground">
              Nossa equipe cuida do onboarding, cria o kit de boas-vindas do hóspede e configura toda a comunicação automatizada do seu imóvel.
            </p>
            <ol className="mt-8 space-y-6">
              {MAROCAS_JORNADA_ANFITRIAO.map((p) => (
                <li key={p.passo} className="flex gap-4">
                  <div className="grid place-items-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {p.passo}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{p.titulo}</div>
                    <div className="text-sm text-muted-foreground mt-1">{p.texto}</div>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              to="/marocas/cadastrar-imovel"
              className="inline-flex items-center gap-2 mt-8 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Solicitar gestão do meu apartamento <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <img
              src={MAROCAS_IMAGENS.sala}
              alt="Sala de apartamento pronta para hóspedes"
              className="rounded-3xl shadow-2xl w-full aspect-[4/5] object-cover"
            />
            <div className="hidden md:block absolute -bottom-6 -left-6 bg-card border rounded-2xl p-4 shadow-xl max-w-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="h-4 w-4" /> Padrão auditado
              </div>
              <div className="text-sm font-medium mt-1">
                Checklist fotográfico obrigatório em toda limpeza e vistoria.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MÓDULOS FULL (visualização) */}
      <section className="bg-[oklch(0.15_0.02_240)] text-white py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Plano Full</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Painel completo para operar um portfólio de imóveis.</h2>
            <p className="mt-3 text-white/75">
              CRM, ERP operacional, agenda, automações N8N, Cérebro IA por
              imóvel, dashboards financeiros e permissões por perfil — habilitados
              visualmente para o cliente Full.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              { icon: <HomeIcon className="h-5 w-5" />, t: "Cadastro de imóveis", d: "Regras, capacidade, fotos, tarifas." },
              { icon: <Users className="h-5 w-5" />, t: "Hóspedes & CRM", d: "Perfil, histórico e preferências." },
              { icon: <Wrench className="h-5 w-5" />, t: "Prestadores", d: "Rede homologada, agenda, avaliações." },
              { icon: <Calendar className="h-5 w-5" />, t: "Agenda operacional", d: "Reservas, limpezas, manutenções." },
              { icon: <MessageCircle className="h-5 w-5" />, t: "Automações N8N", d: "Réguas por evento e canal." },
              { icon: <Sparkles className="h-5 w-5" />, t: "Cérebro IA por imóvel", d: "Respostas 24h para o hóspede." },
              { icon: <BarChart3 className="h-5 w-5" />, t: "Dashboards", d: "Ocupação, receita, custo por unidade." },
              { icon: <ShieldCheck className="h-5 w-5" />, t: "Permissões", d: "Proprietário, gestor, prestador, hóspede." },
            ].map((m) => (
              <div key={m.t} className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition">
                <div className="text-amber-300">{m.icon}</div>
                <div className="font-semibold mt-3">{m.t}</div>
                <div className="text-white/70 text-xs mt-1">{m.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/marocas/planos"
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-slate-900 px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Ver plano Full <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/marocas/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10 transition"
            >
              Acessar painel
            </Link>
          </div>
        </div>
      </section>

      {/* PLANOS RESUMO */}
      <section className="container mx-auto px-4 md:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Planos e preços</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Escolha até onde vai a nossa operação.</h2>
          <p className="mt-3 text-muted-foreground">
            Do plano Essencial (comunicação + agenda) ao Full (gestão completa + captação + IA).
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {marocasPlanos.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl bg-card border p-6 flex flex-col ${p.destaque ? "border-2 border-primary shadow-xl relative" : ""}`}
            >
              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Mais escolhido
                </span>
              )}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.tagline}</div>
              <h3 className="text-2xl font-bold mt-1">{p.nome}</h3>
              <p className="text-sm text-muted-foreground mt-2">{p.resumo}</p>
              <div className="mt-4 text-xl font-bold">{p.preco}</div>
              {p.precoNota && <div className="text-xs text-muted-foreground">{p.precoNota}</div>}
              <Link
                to="/marocas/planos"
                className={`mt-6 block text-center rounded-md px-4 py-2.5 font-semibold transition ${p.destaque ? "bg-primary text-primary-foreground hover:opacity-90" : "border hover:bg-muted"}`}
              >
                {p.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.heroCopacabana}
            alt="Vista de Copacabana"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/40" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-24 text-white text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Pronto para profissionalizar seu imóvel de temporada?
          </h2>
          <p className="mt-4 text-white/85 text-lg">
            Diagnóstico gratuito. Onboarding em 7 dias. Sem fidelidade.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/marocas/cadastrar-imovel"
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 text-slate-900 px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Quero ser anfitrião Marocas <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={marocasWhatsAppUrl("Olá Marocas! Quero falar com um consultor sobre gestão do meu imóvel.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10 transition"
            >
              Falar com consultor
            </a>
          </div>
          <p className="mt-6 text-xs text-white/60">
            {MAROCAS_CONTATO.enderecoLinha1} · {MAROCAS_CONTATO.enderecoLinha2}
          </p>
        </div>
      </section>
    </MarocasShell>
  );
}
