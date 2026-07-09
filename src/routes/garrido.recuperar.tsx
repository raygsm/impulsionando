import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Mail } from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/recuperar";

export const Route = createFileRoute("/garrido/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Imobiliária Garrido" },
      { name: "description", content: "Recupere sua senha da Imobiliária Garrido. Enviamos um link seguro para o seu e-mail cadastrado no Core Impulsionando." },
      { property: "og:title", content: "Recuperar senha — Imobiliária Garrido" },
      { property: "og:description", content: "Link seguro no e-mail. Suporte pela equipe Garrido caso precise." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Recuperar senha" },
      ])),
    }],
  }),
  component: RecuperarPage,
});

function RecuperarPage() {
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Recuperar senha" }]} />

      <section className="max-w-lg mx-auto px-4 py-12 md:py-16">
        <div className="text-center">
          <KeyRound className="h-8 w-8 text-[color:var(--garrido-gold)] mx-auto" aria-hidden />
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[color:var(--garrido-ink)] mt-2">
            Esqueci minha senha
          </h1>
          <p className="mt-2 text-slate-600 text-sm">
            Enviamos um link seguro para o e-mail cadastrado — clique nele para escolher uma senha nova.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 border border-black/5 shadow-lg">
          <a
            href="/auth?tab=recover&redirect=/garrido/entrar"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--garrido-ink)] text-white font-bold py-3 hover:brightness-125 transition"
          >
            <Mail className="h-4 w-4" aria-hidden /> Abrir recuperação segura
          </a>
          <p className="mt-3 text-xs text-slate-500 text-center">
            A recuperação é feita pelo Core Impulsionando. O link expira em 1 hora por segurança.
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500 flex justify-center gap-4">
          <Link to="/garrido/entrar" className="hover:underline">Voltar para entrar</Link>
          <span aria-hidden>·</span>
          <Link to="/garrido/contato" className="hover:underline">Precisa de ajuda?</Link>
        </div>
      </section>
    </>
  );
}
