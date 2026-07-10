import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, EventPill, StatusBadge, Section, KpiCard } from "@/components/marocas/MarocasUI";
import { MOCK_AGENDA, imovelById, fmtDateBR } from "@/components/marocas/marocasMockData";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/limpezas")({
  head: () => ({ meta: [{ title: "Limpezas — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: LimpezasPage,
});

function LimpezasPage() {
  const rows = MOCK_AGENDA.filter((e) => e.tipo === "limpeza" || e.tipo === "vistoria");
  const pendentes = rows.filter((r) => r.status === "pendente").length;
  const concluidas = rows.filter((r) => r.status === "concluido").length;

  return (
    <MarocasAppShell
      title="Limpezas & vistorias"
      description="Turnover pós check-out, vistorias pré check-in e limpezas programadas."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Limpezas" }]}
      actions={<button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Agendar limpeza</button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total no mês" value={rows.length} icon={<Sparkles className="h-4 w-4" />} />
        <KpiCard label="Pendentes" value={pendentes} tone={pendentes > 0 ? "warn" : "default"} />
        <KpiCard label="Concluídas" value={concluidas} tone="success" />
        <KpiCard label="SLA médio" value="2h 12min" hint="Do check-out ao pronto" />
      </div>

      <Section title="Próximas limpezas / vistorias">
        <DataTable
          rows={rows}
          columns={[
            { header: "Data", render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtDateBR(r.data)} · {r.hora}</span> },
            { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
            { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
            { header: "Prestador", render: (r) => r.responsavel ?? <span className="text-muted-foreground">a designar</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
