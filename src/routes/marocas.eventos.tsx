import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_CONTATO,
  MAROCAS_EVENTOS,
  MAROCAS_IMAGENS,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "https://impulsionando.com.br/marocas/eventos";

export const Route = createFileRoute("/marocas/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos privados em Copacabana — Marocas" },
      {
        name: "description",
        content:
          "Aniversários, jantares corporativos, mini weddings e workshops de cozinha em Copacabana. Sem taxa de rolha. Menu personalizado. Chef em casa opcional.",
      },
      { property: "og:title", content: "Eventos privados — Marocas Copacabana" },
      {
        property: "og:description",
        content:
          "Do salão inteiro ao chef em casa. Aniversários, corporativos, casamentos e workshops em Copacabana.",
      },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.eventos },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: EventosPage,
});

function EventosPage() {
  const [form, setForm] = useState({
    tipo: "aniversarios",
    data: "",
    pessoas: 20,
    nome: "",
    contato: "",
    obs: "",
  });
  const [ok, setOk] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO Codex: enviar via createServerFn + notificar time de eventos.
    setOk(true);
  };

  return (
    <MarocasShell
      breadcrumbs={[
        { label: "Marocas", to: "/marocas" },
        { label: "Eventos" },
      ]}
    >
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.eventos}
            alt="Salão da Marocas preparado para evento"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Eventos privados em Copacabana
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mt-4 leading-[1.05]">
            Celebre no bairro mais cosmopolita do Brasil.
          </h1>
          <p className="mt-5 text-lg text-white/85">
            Do salão inteiro ao chef em casa. Aniversários, corporativos, mini
            weddings, confraternizações e workshops de cozinha — todos
            assinados pela mesma cozinha que serve Copacabana desde 2012.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#solicitar"
              className="rounded-full bg-primary text-primary-foreground px-8 py-4 font-semibold hover:opacity-90 transition inline-flex items-center gap-2"
            >
              Solicitar orçamento <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={marocasWhatsAppUrl(
                "Olá! Gostaria de conversar sobre um evento privado na Marocas.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 backdrop-blur border border-white/30 px-8 py-4 font-semibold hover:bg-white/20 transition"
            >
              Falar direto no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* TIPOS DE EVENTO */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Formatos
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3">
            Escolha o formato que combina com você
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MAROCAS_EVENTOS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, tipo: e.id }));
                document
                  .getElementById("solicitar")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`text-left rounded-3xl border p-6 hover:border-primary hover:shadow-lg transition bg-card ${
                form.tipo === e.id ? "border-primary shadow-lg" : ""
              }`}
            >
              <div className="text-4xl">{e.emoji}</div>
              <div className="font-serif font-bold text-xl mt-3">
                {e.titulo}
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {e.resumo}
              </p>
              <div className="mt-4 pt-4 border-t flex justify-between text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">Capacidade:</strong>{" "}
                  {e.capacidade}
                </span>
                <span>
                  <strong className="text-foreground">Duração:</strong>{" "}
                  {e.duracao}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* INCLUSOS */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-center">
            O que já vem incluso
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {[
              "Menu personalizado com a equipe do chef",
              "Sem taxa de rolha (traga o vinho que quiser)",
              "Reserva de área privativa ou salão inteiro",
              "Bolo, decoração e projeção sob demanda",
              "Bilheteria e RSVP digital (via Impulsionando)",
              "Wi-Fi, som e microfone para corporativos",
              "Chef em casa para eventos fora do salão",
              "Cronograma e checklist compartilhados",
            ].map((i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border p-4 bg-card"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section id="solicitar" className="container mx-auto px-4 md:px-6 py-16 max-w-2xl">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center">
          Solicitar orçamento
        </h2>
        <p className="text-center text-muted-foreground mt-3">
          Retornamos em até 24h úteis com um pré-orçamento e horários
          disponíveis.
        </p>

        {ok ? (
          <div className="mt-10 rounded-3xl border p-8 text-center bg-card">
            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600" />
            <h3 className="font-serif text-2xl font-bold mt-4">
              Recebemos seu pedido
            </h3>
            <p className="text-muted-foreground mt-2">
              Nossa equipe de eventos vai retornar para{" "}
              <strong className="text-foreground">{form.contato}</strong> em até
              24h úteis.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setOk(false)}
                className="rounded-full border px-5 py-2 text-sm font-semibold hover:bg-muted"
              >
                Enviar outro
              </button>
              <a
                href={marocasWhatsAppUrl(
                  `Oi! Acabei de enviar o formulário de eventos (${form.tipo}, ${form.pessoas} pessoas).`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:opacity-90"
              >
                Adiantar pelo WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Tipo de evento</span>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {MAROCAS_EVENTOS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.emoji} {e.titulo}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Data desejada</span>
                <input
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Número de pessoas</span>
                <input
                  type="number"
                  min={4}
                  max={200}
                  required
                  value={form.pessoas}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pessoas: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Seu nome</span>
                <input
                  required
                  autoComplete="name"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">WhatsApp / e-mail</span>
                <input
                  required
                  value={form.contato}
                  onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
                  placeholder="(21) 9 0000-0000 ou seu@email.com"
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium">
                Conte um pouco sobre o evento (opcional)
              </span>
              <textarea
                rows={4}
                value={form.obs}
                onChange={(e) =>
                  setForm((f) => ({ ...f, obs: e.target.value.slice(0, 500) }))
                }
                placeholder="Ex.: aniversário de 40 anos, quero salão privativo, menu vegetariano, bolo próprio..."
                className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-4 hover:opacity-90 transition"
            >
              Enviar solicitação
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Ou fale direto:{" "}
              <a
                href={`mailto:${MAROCAS_CONTATO.eventosEmail}`}
                className="underline"
              >
                {MAROCAS_CONTATO.eventosEmail}
              </a>
            </p>
          </form>
        )}
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">
            Prefere ver o cardápio antes?
          </h2>
          <div className="mt-4">
            <Link
              to="/marocas/cardapio"
              className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Ver cardápio completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
