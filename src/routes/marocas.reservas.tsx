import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Users,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_CONTATO,
  MAROCAS_IMAGENS,
  marocasWhatsAppUrl,
} from "@/components/marocas/marocasContent";

const CANONICAL = "https://impulsionando.com.br/marocas/reservas";

export const Route = createFileRoute("/marocas/reservas")({
  head: () => ({
    meta: [
      { title: "Reservar mesa em Copacabana — Marocas" },
      {
        name: "description",
        content:
          "Reserve sua mesa Marocas em 2 cliques. Confirmação por WhatsApp, remarcação e cancelamento sem taxa até 2h antes.",
      },
      { property: "og:title", content: "Reservar mesa — Marocas Copacabana" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.mesa },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: ReservasPage,
});

const HORARIOS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

function ReservasPage() {
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    data: hoje,
    hora: "20:00",
    pessoas: 2,
    nome: "",
    telefone: "",
    ocasiao: "",
    obs: "",
  });
  const [ok, setOk] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO Codex: criar reserva via createServerFn + confirmação por WhatsApp/e-mail.
    setOk(true);
  };

  if (ok) {
    return (
      <MarocasShell
        breadcrumbs={[
          { label: "Marocas", to: "/marocas" },
          { label: "Reservas" },
        ]}
      >
        <div className="container mx-auto px-4 md:px-6 py-20 max-w-lg text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
          <h1 className="font-serif text-4xl font-bold mt-5">
            Reserva solicitada
          </h1>
          <p className="text-muted-foreground mt-3">
            Confirmação em minutos por WhatsApp para{" "}
            <span className="font-medium text-foreground">{form.telefone}</span>
            . Você pode remarcar ou cancelar sem taxa até 2h antes.
          </p>
          <div className="mt-8 rounded-2xl border p-5 text-left text-sm space-y-2 bg-card">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data</span>
              <strong>
                {new Date(form.data + "T12:00").toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horário</span>
              <strong>{form.hora}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pessoas</span>
              <strong>{form.pessoas}</strong>
            </div>
            {form.ocasiao && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ocasião</span>
                <strong>{form.ocasiao}</strong>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setOk(false)}
              className="text-sm underline text-muted-foreground"
            >
              Fazer outra reserva
            </button>
            <a
              href={marocasWhatsAppUrl(
                `Oi! Acabei de solicitar reserva para ${form.pessoas} pessoas em ${form.data} às ${form.hora}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold"
            >
              Adiantar pelo WhatsApp
            </a>
          </div>
        </div>
      </MarocasShell>
    );
  }

  return (
    <MarocasShell
      breadcrumbs={[
        { label: "Marocas", to: "/marocas" },
        { label: "Reservas" },
      ]}
    >
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={MAROCAS_IMAGENS.mesa}
            alt="Mesa posta na Marocas"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-20 text-white max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Salão de Copacabana
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-4 leading-tight">
            Sua mesa está esperando.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Confirmação em 2 cliques. Sem taxa de reserva. Remarcação e
            cancelamento sem custo até 2h antes.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Sem cobrança prévia
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Confirmação em minutos
            </span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-3xl border p-6 bg-card">
            <h2 className="font-serif font-bold text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Quando
            </h2>
            <div className="grid sm:grid-cols-[1fr_140px] gap-3 mt-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Data
                </span>
                <input
                  type="date"
                  required
                  min={hoje}
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pessoas
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={form.pessoas}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pessoas: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
            <div className="mt-5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Horário
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {HORARIOS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, hora: h }))}
                    aria-pressed={form.hora === h}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${form.hora === h ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border p-6 bg-card">
            <h2 className="font-serif font-bold text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Quem
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nome
                </span>
                <input
                  required
                  autoComplete="name"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  WhatsApp
                </span>
                <input
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.telefone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telefone: e.target.value }))
                  }
                  placeholder="(21) 9 0000-0000"
                  className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
            <label className="block mt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Ocasião (opcional)
              </span>
              <select
                value={form.ocasiao}
                onChange={(e) => setForm((f) => ({ ...f, ocasiao: e.target.value }))}
                className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sem ocasião especial</option>
                <option>Aniversário</option>
                <option>Encontro romântico</option>
                <option>Reunião de trabalho</option>
                <option>Comemoração familiar</option>
                <option>Visitando o Rio</option>
              </select>
            </label>
            <label className="block mt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Observações
              </span>
              <textarea
                rows={3}
                value={form.obs}
                onChange={(e) =>
                  setForm((f) => ({ ...f, obs: e.target.value.slice(0, 200) }))
                }
                placeholder="Preferência por área externa, cadeira infantil, alergia..."
                className="mt-1 w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </section>

          <button
            type="submit"
            className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-4 text-lg hover:opacity-90 transition"
          >
            Solicitar reserva
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Confirmação em minutos por WhatsApp. Sem cobrança prévia. Ou fale
            direto:{" "}
            <a
              href={`mailto:${MAROCAS_CONTATO.reservasEmail}`}
              className="underline"
            >
              {MAROCAS_CONTATO.reservasEmail}
            </a>
          </p>
        </form>
      </div>
    </MarocasShell>
  );
}
