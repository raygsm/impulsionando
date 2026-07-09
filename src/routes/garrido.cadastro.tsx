import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/cadastro";

export const Route = createFileRoute("/garrido/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Imobiliária Garrido" },
      { name: "description", content: "Cadastre-se na Imobiliária Garrido para favoritar imóveis, receber alertas, agendar visitas e acompanhar propostas em um só lugar." },
      { property: "og:title", content: "Criar conta — Imobiliária Garrido" },
      { property: "og:description", content: "Favoritos, alertas, propostas, visitas e contratos em um só lugar." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Cadastro" },
      ])),
    }],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const beneficios = [
    "Favoritar imóveis e receber alertas quando o preço cair",
    "Agendar visitas e acompanhar propostas em tempo real",
    "Assinar contratos digitalmente (venda, locação e temporada)",
    "Guardar documentos e comprovantes em local seguro",
    "Notificações unificadas por e-mail, WhatsApp e app",
  ];
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Cadastro" }]} />

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-start">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
            Criar conta
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[color:var(--garrido-ink)] mt-2">
            Uma conta, todos os fluxos imobiliários
          </h1>
          <p className="mt-3 text-slate-600">
            Mesma conta para cliente, proprietário, inquilino e corretor. O cadastro é gratuito
            e feito pelo Core Impulsionando — os dados ficam disponíveis em toda a plataforma.
          </p>

          <ul className="mt-6 space-y-2">
            {beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--garrido-gold)] mt-0.5 shrink-0" aria-hidden />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-white p-4 border border-black/5 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-[color:var(--garrido-gold)] mt-0.5 shrink-0" aria-hidden />
            <span>
              Cadastro em conformidade com a LGPD. Você pode acessar, corrigir e portar seus dados
              a qualquer momento em <Link to="/garrido/politicas" className="underline">Políticas</Link>.
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-[color:var(--garrido-ink)] text-white p-6 md:p-8 shadow-2xl">
          <h2 className="font-serif text-xl font-bold">Começar em 30 segundos</h2>
          <p className="mt-2 text-white/80 text-sm">
            A tela de cadastro do Core Impulsionando abre com o retorno já configurado para a Área do cliente Garrido.
          </p>
          <a
            href="/auth?tab=signup&redirect=/garrido/area"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold py-3 hover:brightness-110 transition"
          >
            Criar minha conta
          </a>
          <div className="mt-4 text-xs text-white/60 text-center">
            Já tem conta?{" "}
            <Link to="/garrido/entrar" className="underline text-white">
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
