import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, ShieldCheck, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/entrar";

export const Route = createFileRoute("/garrido/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Área do cliente e do corretor Garrido" },
      { name: "description", content: "Acesse sua área na Imobiliária Garrido. Cliente, corretor, proprietário e inquilino — autenticação segura pelo Core Impulsionando." },
      { property: "og:title", content: "Entrar — Imobiliária Garrido" },
      { property: "og:description", content: "Acesse cliente, corretor, proprietário ou inquilino." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Entrar" },
      ])),
    }],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Entrar" }]} />

      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
            Autenticação segura
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[color:var(--garrido-ink)] mt-2">
            Entrar na Imobiliária Garrido
          </h1>
          <p className="mt-3 text-slate-600">
            A autenticação da Garrido é feita pelo Core Impulsionando: mesma conta para cliente,
            corretor, proprietário e inquilino, com recuperação de senha em 1 clique.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <a
            href="/auth?redirect=/garrido/area"
            className="group rounded-2xl bg-white p-6 border border-black/5 shadow-sm hover:shadow-lg transition"
          >
            <LogIn className="h-6 w-6 text-[color:var(--garrido-gold)]" aria-hidden />
            <h2 className="mt-3 font-serif text-xl font-bold text-[color:var(--garrido-ink)]">
              Já tenho conta
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cliente, proprietário, inquilino ou corretor: mesma conta para todas as áreas.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--garrido-ink)] group-hover:translate-x-1 transition">
              Entrar <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </a>

          <Link
            to="/garrido/cadastro"
            className="group rounded-2xl bg-[color:var(--garrido-ink)] text-white p-6 shadow-sm hover:shadow-lg transition"
          >
            <UserPlus className="h-6 w-6 text-[color:var(--garrido-gold)]" aria-hidden />
            <h2 className="mt-3 font-serif text-xl font-bold">Criar minha conta</h2>
            <p className="mt-1 text-sm text-white/80">
              Favoritos, propostas, visitas agendadas, contratos e notificações em um só lugar.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--garrido-gold)] group-hover:translate-x-1 transition">
              Cadastrar <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>

        <div className="mt-8 rounded-xl bg-white p-5 border border-black/5 flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheck className="h-5 w-5 text-[color:var(--garrido-gold)] mt-0.5 shrink-0" aria-hidden />
          <div>
            <div className="font-semibold text-[color:var(--garrido-ink)]">Sua conta é segura e portável</div>
            <p className="mt-1 leading-relaxed">
              A conta é gerida pelo Core Impulsionando: mesma identidade em toda a plataforma,
              autenticação em dois fatores opcional e política LGPD ativa. Você pode encerrar
              e portar seus dados a qualquer momento em{" "}
              <Link to="/garrido/politicas" className="underline">Políticas & LGPD</Link>.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link to="/garrido/recuperar" className="inline-flex items-center gap-1 hover:underline">
            <KeyRound className="h-4 w-4" aria-hidden /> Esqueci minha senha
          </Link>
        </div>
      </section>
    </>
  );
}
