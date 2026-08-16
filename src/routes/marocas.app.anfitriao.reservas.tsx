import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Plus, X } from "lucide-react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, Section } from "@/components/marocas/MarocasUI";
import { listMarocasApartments } from "@/lib/marocas.functions";
import { createMarocasReservation, listMarocasReservations } from "@/lib/marocas-operations.functions";

export const Route = createFileRoute("/marocas/app/anfitriao/reservas")({
  head: () => ({ meta: [{ title: "Reservas — Marocas" }, { name: "robots", content: "noindex" }] }),
  loader: async () => {
    const [reservations, apartments] = await Promise.all([
      listMarocasReservations(),
      listMarocasApartments(),
    ]);
    return { reservations, apartments };
  },
  component: ReservasPage,
});

const FILTERS = ["todas", "provisoria", "confirmada", "check_in", "check_out", "cancelada"] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return ({
    provisoria: "Provisória",
    confirmada: "Confirmada",
    check_in: "Check-in",
    check_out: "Check-out",
    cancelada: "Cancelada",
  } as Record<string, string>)[status] ?? status;
}

function ReservasPage() {
  const router = useRouter();
  const { reservations, apartments } = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    apartmentId: "",
    sourcePlatform: "manual",
    guestName: "",
    guestCount: "",
    checkInAt: "",
    checkOutAt: "",
    notes: "",
  });

  const rows = filter === "todas" ? reservations : reservations.filter((row: any) => row.status === filter);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!form.apartmentId || !form.checkInAt || !form.checkOutAt) throw new Error("Preencha imóvel, check-in e check-out.");
      await createMarocasReservation({ data: {
        apartmentId: form.apartmentId,
        sourcePlatform: form.sourcePlatform as "manual" | "airbnb" | "booking" | "channel_manager" | "corporativo" | "direto" | "outro",
        guestName: form.guestName.trim() || undefined,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        checkInAt: new Date(form.checkInAt).toISOString(),
        checkOutAt: new Date(form.checkOutAt).toISOString(),
        notes: form.notes.trim() || undefined,
        cleaningRequired: true,
      } });
      setOpen(false);
      setForm({ apartmentId: "", sourcePlatform: "manual", guestName: "", guestCount: "", checkInAt: "", checkOutAt: "", notes: "" });
      await router.invalidate();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar a reserva.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MarocasAppShell
      title="Reservas"
      description="Reservas reais do portfólio, com origem, período e geração de giro operacional entre hospedagens."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Reservas" }]}
      actions={
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova reserva direta
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-3 py-1 text-xs transition ${filter === item ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {item === "todas" ? "Todas" : statusLabel(item)}
          </button>
        ))}
      </div>

      <Section title={`${rows.length} reservas`}>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma reserva real cadastrada para este filtro.
          </div>
        ) : (
          <DataTable
            rows={rows}
            columns={[
              { header: "Referência", render: (row: any) => <span className="font-mono text-xs">{row.external_reference || row.id.slice(0, 8)}</span> },
              { header: "Imóvel", render: (row: any) => row.marocas_apartments?.title ?? row.marocas_apartments?.code ?? "—" },
              { header: "Hóspede", render: (row: any) => row.guest_name || <span className="text-muted-foreground">não informado</span> },
              { header: "Canal", render: (row: any) => <span className="rounded bg-muted px-2 py-0.5 text-xs">{row.source_platform}</span> },
              { header: "Check-in → Check-out", render: (row: any) => <span className="text-xs">{formatDate(row.check_in_at)} → {formatDate(row.check_out_at)}</span> },
              { header: "Hóspedes", render: (row: any) => row.guest_count ?? "—" },
              { header: "Status", render: (row: any) => <span className="rounded-full border px-2 py-0.5 text-xs font-medium">{statusLabel(row.status)}</span> },
            ]}
          />
        )}
      </Section>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Nova reserva">
          <form onSubmit={submit} className="w-full max-w-xl rounded-2xl border bg-card p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Nova reserva</h2>
                <p className="text-sm text-muted-foreground">O sistema rejeita sobreposição e cria o giro/limpeza quando houver hospedagem anterior ou seguinte.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted" aria-label="Fechar"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm md:col-span-2">Imóvel
                <select required value={form.apartmentId} onChange={(e) => setForm((value) => ({ ...value, apartmentId: e.target.value }))} className="rounded-md border bg-background px-3 py-2">
                  <option value="">Selecione</option>
                  {apartments.map((apartment: any) => <option key={apartment.id} value={apartment.id}>{apartment.title} · {apartment.code}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">Origem
                <select value={form.sourcePlatform} onChange={(e) => setForm((value) => ({ ...value, sourcePlatform: e.target.value }))} className="rounded-md border bg-background px-3 py-2">
                  <option value="manual">Manual</option><option value="airbnb">Airbnb</option><option value="booking">Booking</option><option value="direto">Direto</option><option value="corporativo">Corporativo</option><option value="channel_manager">Channel manager</option><option value="outro">Outro</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">Hóspedes
                <input type="number" min="1" value={form.guestCount} onChange={(e) => setForm((value) => ({ ...value, guestCount: e.target.value }))} className="rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="grid gap-1.5 text-sm">Check-in
                <input required type="datetime-local" value={form.checkInAt} onChange={(e) => setForm((value) => ({ ...value, checkInAt: e.target.value }))} className="rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="grid gap-1.5 text-sm">Check-out
                <input required type="datetime-local" value={form.checkOutAt} onChange={(e) => setForm((value) => ({ ...value, checkOutAt: e.target.value }))} className="rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">Nome do hóspede <span className="text-xs text-muted-foreground">opcional — colete somente quando necessário</span>
                <input value={form.guestName} onChange={(e) => setForm((value) => ({ ...value, guestName: e.target.value }))} className="rounded-md border bg-background px-3 py-2" />
              </label>
              <label className="grid gap-1.5 text-sm md:col-span-2">Observações
                <textarea rows={3} value={form.notes} onChange={(e) => setForm((value) => ({ ...value, notes: e.target.value }))} className="resize-none rounded-md border bg-background px-3 py-2" />
              </label>
            </div>
            {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Salvando…" : "Criar reserva"}</button>
            </div>
          </form>
        </div>
      )}
    </MarocasAppShell>
  );
}
