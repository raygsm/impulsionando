import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Users, Clock, CheckCircle2 } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";

const CANONICAL = "/marocas/reservas";

export const Route = createFileRoute("/marocas/reservas")({
  head: () => ({
    meta: [
      { title: "Reservar mesa — Marocas" },
      { name: "description", content: "Reserve sua mesa Marocas em 2 cliques. Confirmação, remarcação e cancelamento sem taxa." },
      { property: "og:title", content: "Reservar mesa — Marocas" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: ReservasPage,
});

const HORARIOS = ["12:00", "12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

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
      <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Reservas" }]}>
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-lg text-center">
          <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-600" />
          <h1 className="text-3xl font-bold mt-4">Reserva solicitada</h1>
          <p className="text-muted-foreground mt-2">
            Enviamos a confirmação para <span className="font-medium text-foreground">{form.telefone}</span>.
            Você pode remarcar ou cancelar até 2h antes.
          </p>
          <div className="mt-6 rounded-xl border p-4 text-left text-sm space-y-1">
            <div><strong>Data:</strong> {new Date(form.data).toLocaleDateString("pt-BR")}</div>
            <div><strong>Horário:</strong> {form.hora}</div>
            <div><strong>Pessoas:</strong> {form.pessoas}</div>
            {form.ocasiao && <div><strong>Ocasião:</strong> {form.ocasiao}</div>}
          </div>
          <button onClick={() => setOk(false)} className="mt-6 text-sm underline">Fazer outra reserva</button>
        </div>
      </MarocasShell>
    );
  }

  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Reservas" }]}>
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold">Reservar mesa</h1>
        <p className="text-muted-foreground mt-2">
          Confirmação em 2 cliques. Sem taxa de reserva. Remarcação e cancelamento até 2h antes.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-2xl border p-5">
            <h2 className="font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Quando</h2>
            <div className="grid sm:grid-cols-[1fr_120px] gap-3 mt-3">
              <label className="block">
                <span className="text-xs font-medium">Data</span>
                <input type="date" required min={hoje} value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Pessoas</span>
                <input type="number" required min={1} max={20} value={form.pessoas}
                  onChange={(e) => setForm((f) => ({ ...f, pessoas: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Horário</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {HORARIOS.map((h) => (
                  <button key={h} type="button" onClick={() => setForm((f) => ({ ...f, hora: h }))}
                    aria-pressed={form.hora === h}
                    className={`rounded-md border px-3 py-1.5 text-sm ${form.hora === h ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Quem</h2>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="block">
                <span className="text-xs font-medium">Nome</span>
                <input required autoComplete="name" value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Telefone / WhatsApp</span>
                <input required inputMode="tel" autoComplete="tel" value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                  placeholder="(21) 9 0000-0000"
                  className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <label className="block mt-3">
              <span className="text-xs font-medium">Ocasião (opcional)</span>
              <select value={form.ocasiao}
                onChange={(e) => setForm((f) => ({ ...f, ocasiao: e.target.value }))}
                className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sem ocasião especial</option>
                <option>Aniversário</option>
                <option>Encontro romântico</option>
                <option>Reunião de trabalho</option>
                <option>Comemoração familiar</option>
              </select>
            </label>
            <label className="block mt-3">
              <span className="text-xs font-medium">Observações</span>
              <textarea rows={2} value={form.obs}
                onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value.slice(0, 200) }))}
                placeholder="Ex.: preferência por área externa, cadeira infantil..."
                className="mt-1 w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
          </section>

          <button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 transition">
            Solicitar reserva
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Confirmação em minutos por WhatsApp. Sem cobrança prévia.
          </p>
        </form>
      </div>
    </MarocasShell>
  );
}
