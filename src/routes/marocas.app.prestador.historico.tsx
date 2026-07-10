import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EventPill, StatusBadge, Section } from "@/components/marocas/MarocasUI";
import { MOCK_PRESTADOR_AGENDA, fmtBRL, fmtDateBR } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/prestador/historico")({
  head: () => ({ meta: [{ title: "Histórico — Prestador Marocas" }, { name: "robots", content: "noindex" }] }),
  component: HistoricoPrestadorPage,
});

function HistoricoPrestadorPage() {
  return (
    <MarocasAppShell
      title="Histórico"
      description="Todos os serviços realizados, cancelados ou substituídos."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Histórico" }]}
    >
      <Section title={`${MOCK_PRESTADOR_AGENDA.length} registros`}>
        <DataTable
          rows={MOCK_PRESTADOR_AGENDA}
          columns={[
            { header: "Data", render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtDateBR(r.data)} · {r.hora}</span> },
            { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
            { header: "Imóvel", render: (r) => r.imovelApelido },
            { header: "Valor", render: (r) => <span className="tabular-nums">{fmtBRL(r.valor)}</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
