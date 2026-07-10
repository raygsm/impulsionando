import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, MessageCircle, Wrench, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_IMAGENS,
  MAROCAS_JORNADA_HOSPEDE,
  MAROCAS_PERFIS_HOSPEDE,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/hospedes";

export const Route = createFileRoute("/marocas/hospedes")({
  head: () => ({
    meta: [
      { title: "Para hóspedes — Marocas" },
      { name: "description", content: "Chegou seu apartamento Marocas? Encontre senha da porta, regras, roteiros personalizados e suporte 24h." },
      { property: "og:title", content: "Hóspedes Marocas — sua estadia com suporte 24h" },
      { property: "og:description", content: "Boas-vindas, senha da porta, roteiros do bairro, manutenção em 1 clique." },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.hospede },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: HospedesPage,
});

function HospedesPage() {
  const [perfis, setPerfis] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);
  const toggle = (p: string) =>
    setPerfis((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Hóspedes" }]}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={MAROCAS_IMAGENS.quarto} alt="Quarto pronto para hóspede" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-slate-900/30" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-20 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Bem-vindo</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3">
            Sua estadia começa antes mesmo do check-in.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Boas-vindas, senha da porta, roteiros personalizados e suporte 24h — tudo pelo Maroquito ou pelo WhatsApp de suporte.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={marocasWhatsAppUrl("Olá! Sou hóspede Marocas e preciso de ajuda.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-amber-300 text-slate-900 px-6 py-3 font-semibold"
            >
              Falar com suporte agora
            </a>
            <Link to="/marocas/login" className="rounded-full border border-white/40 text-white px-6 py-3 font-semibold hover:bg-white/10 transition">
              Acessar minha reserva
            </Link>
          </div>
        </div>
      </section>

      {/* JORNADA */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center max-w-2xl mx-auto">
          Sua jornada, sem atrito.
        </h2>
        <div className="mt-10 grid md:grid-cols-4 gap-4">
          {MAROCAS_JORNADA_HOSPEDE.map((p) => (
            <div key={p.passo} className="rounded-2xl border bg-card p-5">
              <div className="text-primary text-sm font-bold">{p.passo}</div>
              <div className="font-semibold mt-1">{p.titulo}</div>
              <div className="text-sm text-muted-foreground mt-2">{p.texto}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AÇÕES RÁPIDAS */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <h2 className="text-2xl font-bold text-center">Ações rápidas</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <KeyRound className="h-5 w-5" />, t: "Senha da porta", d: "Recebida 48h antes por WhatsApp e e-mail." },
              { icon: <MessageCircle className="h-5 w-5" />, t: "Suporte 24h", d: "Maroquito responde a qualquer hora." },
              { icon: <Wrench className="h-5 w-5" />, t: "Manutenção 1 clique", d: "Acionamos prestador homologado imediatamente." },
              { icon: <Sparkles className="h-5 w-5" />, t: "Roteiro personalizado", d: "Sugestões do bairro conforme seu perfil." },
            ].map((a) => (
              <div key={a.t} className="rounded-2xl bg-card border p-5">
                <div className="text-primary">{a.icon}</div>
                <div className="font-semibold mt-3">{a.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{a.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERFIL PARA ROTEIROS */}
      <section className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Roteiros personalizados</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Nos conte seu perfil.</h2>
          <p className="mt-3 text-muted-foreground">
            Escolha o que combina com você e receba sugestões prontas para o bairro do seu imóvel.
          </p>
        </div>

        {!enviado ? (
          <>
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {MAROCAS_PERFIS_HOSPEDE.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(p)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    perfis.includes(p)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={() => setEnviado(true)}
                disabled={perfis.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold disabled:opacity-40"
              >
                Gerar meu roteiro <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-2xl border bg-card p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="font-semibold mt-4">Perfil enviado ao Maroquito!</div>
            <p className="text-sm text-muted-foreground mt-2">
              Seu roteiro chega por WhatsApp em minutos. Perfis escolhidos:{" "}
              <span className="text-foreground font-medium">{perfis.join(", ")}</span>.
            </p>
          </div>
        )}
      </section>
    </MarocasShell>
  );
}
