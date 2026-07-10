import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter } from "lucide-react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, StatusBadge, Section } from "@/components/marocas/MarocasUI";
import { MOCK_RESERVAS, imovelById, fmtBRL, fmtDateBR, type OperationStatus } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/anfitriao/reservas")({
  head: () => ({ meta: [{ title: "Reservas — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ReservasPage,
});

const FILTERS: (OperationStatus | "todas")[] = ["todas", "confirmado", "pendente", "cancelado"];

function ReservasPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const rows = filter === "todas" ? MOCK_RESERVAS : MOCK_RESERVAS.filter((r) => r.status === filter);

  return (
    <MarocasAppShell
      title="Reservas"
      description="Reservas de todos os canais em uma só fila. Filtre por status ou canal."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Reservas" }]}
      actions={
        <button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Nova reserva direta</button>
      }
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs rounded-full border px-3 py-1 transition ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
          >
            {f === "todas" ? "Todas" : f}
          </button>
        ))}
      </div>

      <Section title={`${rows.length} reservas`}>
        <DataTable
          rows={rows}
          columns={[
            { header: "Código", render: (r) => <span className="font-mono text-xs">{r.codigo}</span> },
            { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
            { header: "Hóspede", render: (r) => r.hospede },
            { header: "Canal", render: (r) => <span className="text-xs px-2 py-0.5 rounded bg-muted">{r.canal}</span> },
            { header: "Check-in → Check-out", render: (r) => <span className="text-xs">{fmtDateBR(r.checkin)} → {fmtDateBR(r.checkout)} <span className="text-muted-foreground">({r.noites}n)</span></span> },
            { header: "Hóspedes", render: (r) => `${r.adultos}+${r.criancas}` },
            { header: "Valor", render: (r) => <span className="tabular-nums font-medium">{fmtBRL(r.valorTotal)}</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
