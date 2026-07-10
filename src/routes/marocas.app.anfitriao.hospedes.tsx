import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, Section, KpiCard } from "@/components/marocas/MarocasUI";
import { Users2, Star } from "lucide-react";
import { MOCK_RESERVAS, imovelById, fmtDateBR } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/anfitriao/hospedes")({
  head: () => ({ meta: [{ title: "Hóspedes — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: HospedesPage,
});

function HospedesPage() {
  const rows = MOCK_RESERVAS;
  return (
    <MarocasAppShell
      title="Hóspedes"
      description="Todos os hóspedes que passaram ou estão para passar pelos seus imóveis."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Hóspedes" }]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Hóspedes únicos" value={new Set(rows.map((r) => r.hospede)).size} icon={<Users2 className="h-4 w-4" />} />
        <KpiCard label="Repeat rate" value="18%" hint="Últimos 12 meses" tone="success" />
        <KpiCard label="Nota média" value="4.9" icon={<Star className="h-4 w-4" />} tone="success" />
      </div>
      <Section title="Lista de hóspedes">
        <DataTable
          rows={rows}
          columns={[
            { header: "Hóspede", render: (r) => r.hospede },
            { header: "Reserva", render: (r) => <span className="font-mono text-xs">{r.codigo}</span> },
            { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
            { header: "Estadia", render: (r) => <span className="text-xs">{fmtDateBR(r.checkin)} → {fmtDateBR(r.checkout)}</span> },
            { header: "Adultos+Crianças", render: (r) => `${r.adultos}+${r.criancas}` },
            { header: "Canal", render: (r) => <span className="text-xs px-2 py-0.5 rounded bg-muted">{r.canal}</span> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
