import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EventPill, StatusBadge, Section, KpiCard } from "@/components/marocas/MarocasUI";
import { MOCK_AGENDA, imovelById, fmtDateBR } from "@/components/marocas/marocasMockData";
import { Wrench, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/manutencoes")({
  head: () => ({ meta: [{ title: "Manutenções — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ManutencoesPage,
});

function ManutencoesPage() {
  const rows = MOCK_AGENDA.filter((e) => e.tipo === "manutencao" || e.tipo === "urgencia");
  const abertos = rows.filter((r) => r.status !== "concluido").length;
  const urgentes = rows.filter((r) => r.status === "urgente").length;
  return (
    <MarocasAppShell
      title="Manutenções"
      description="Chamados abertos, em andamento e urgências. SLA rastreado por criticidade."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Manutenções" }]}
      actions={<button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Abrir chamado</button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Chamados abertos" value={abertos} tone={abertos > 0 ? "warn" : "default"} icon={<Wrench className="h-4 w-4" />} />
        <KpiCard label="Urgências ativas" value={urgentes} tone={urgentes > 0 ? "danger" : "default"} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="SLA urgências" value="< 45min" hint="Meta comprometida" tone="success" />
        <KpiCard label="Custo médio" value="R$ 240" hint="Últimos 30 dias" />
      </div>

      <Section title="Chamados">
        <DataTable
          rows={rows}
          columns={[
            { header: "Data", render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtDateBR(r.data)} · {r.hora}</span> },
            { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
            { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
            { header: "Descrição", render: (r) => r.observacao ?? "—", className: "max-w-xs" },
            { header: "Responsável", render: (r) => r.responsavel ?? <span className="text-muted-foreground">a designar</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
