import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EventPill, StatusBadge, Section } from "@/components/marocas/MarocasUI";
import { MOCK_AGENDA, imovelById, fmtDateBR, OP_EVENT_LABEL } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/anfitriao/agenda")({
  head: () => ({ meta: [{ title: "Agenda operacional — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AgendaPage,
});

const TYPE_LEGEND = Object.entries(OP_EVENT_LABEL);

function AgendaPage() {
  return (
    <MarocasAppShell
      title="Agenda operacional"
      description="Check-ins, check-outs, limpezas, vistorias, manutenções, reposições, bloqueios e urgências em um só lugar."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Agenda" }]}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
          <CalendarClock className="h-4 w-4" /> Exportar iCal
        </button>
      }
    >
      <div className="rounded-xl border bg-muted/20 p-3 mb-6 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold uppercase tracking-widest text-muted-foreground">Legenda</span>
        {TYPE_LEGEND.map(([type]) => (
          <EventPill key={type} type={type as any} />
        ))}
      </div>

      <Section title="Próximos eventos">
        <DataTable
          rows={MOCK_AGENDA}
          columns={[
            { header: "Data", render: (r) => <span className="whitespace-nowrap tabular-nums">{fmtDateBR(r.data)} · {r.hora}</span> },
            { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
            { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
            { header: "Responsável", render: (r) => r.responsavel ?? <span className="text-muted-foreground">a definir</span> },
            { header: "Observação", render: (r) => r.observacao ?? "—", className: "max-w-xs truncate" },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>

      <p className="mt-6 text-xs text-muted-foreground">
        Sync bidirecional com Airbnb, Booking e Vrbo (iCal / API) será conectado pelo Codex. Interface pronta para receber eventos externos.
      </p>
    </MarocasAppShell>
  );
}
