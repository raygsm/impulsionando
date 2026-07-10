import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EventPill, StatusBadge, Section, KpiCard } from "@/components/marocas/MarocasUI";
import { MOCK_PRESTADOR_AGENDA, fmtBRL, fmtDateBR } from "@/components/marocas/marocasMockData";
import { CalendarClock, DollarSign, Star } from "lucide-react";

export const Route = createFileRoute("/marocas/app/prestador/")({
  head: () => ({ meta: [{ title: "Minha agenda — Prestador Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AgendaPrestadorPage,
});

function AgendaPrestadorPage() {
  const rows = MOCK_PRESTADOR_AGENDA;
  const proximos = rows.filter((r) => r.status === "confirmado" || r.status === "em_andamento");
  const receitaMes = rows.filter((r) => r.status !== "cancelado").reduce((a, r) => a + r.valor, 0);
  return (
    <MarocasAppShell
      title="Olá, Sandra 👋"
      description="Sua agenda de serviços com a Marocas — hoje, próximos dias e histórico."
      breadcrumbs={[{ label: "Prestador" }]}
      actions={
        <button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">
          Ver serviços disponíveis
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Serviços próximos" value={proximos.length} icon={<CalendarClock className="h-4 w-4" />} />
        <KpiCard label="Receita no mês" value={fmtBRL(receitaMes)} tone="success" icon={<DollarSign className="h-4 w-4" />} />
        <KpiCard label="Sua nota" value="4.9" icon={<Star className="h-4 w-4" />} tone="success" />
        <KpiCard label="Concluídos 30d" value={rows.filter((r) => r.status === "concluido").length} />
      </div>
      <Section title="Próximos serviços">
        <DataTable
          rows={rows}
          columns={[
            { header: "Data", render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtDateBR(r.data)} · {r.hora}</span> },
            { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
            { header: "Imóvel", render: (r) => r.imovelApelido },
            { header: "Bairro", render: (r) => <span className="text-xs">{r.bairro}</span> },
            { header: "Valor", render: (r) => <span className="tabular-nums font-medium">{fmtBRL(r.valor)}</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
