import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, Section, KpiCard, StatusBadge } from "@/components/marocas/MarocasUI";
import { MOCK_PRESTADORES, type OperationStatus } from "@/components/marocas/marocasMockData";
import { HardHat, Star } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/prestadores")({
  head: () => ({ meta: [{ title: "Prestadores — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: PrestadoresPage,
});

const STATUS_MAP: Record<string, OperationStatus> = { ativo: "confirmado", ferias: "pendente", inativo: "cancelado" };

function PrestadoresPage() {
  const ativos = MOCK_PRESTADORES.filter((p) => p.status === "ativo").length;
  const nota = (MOCK_PRESTADORES.reduce((a, p) => a + p.avaliacao, 0) / MOCK_PRESTADORES.length).toFixed(1);
  return (
    <MarocasAppShell
      title="Prestadores"
      description="Rede de prestadores parceiros (limpeza, manutenção, lavanderia, vistoria)."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Prestadores" }]}
      actions={<button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Convidar prestador</button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Prestadores ativos" value={ativos} icon={<HardHat className="h-4 w-4" />} />
        <KpiCard label="Nota média" value={nota} icon={<Star className="h-4 w-4" />} tone="success" />
        <KpiCard label="Serviços no mês" value={MOCK_PRESTADORES.reduce((a, p) => a + p.servicosMes, 0)} />
      </div>
      <Section title="Prestadores parceiros">
        <DataTable
          rows={MOCK_PRESTADORES}
          columns={[
            { header: "Nome", render: (p) => <span className="font-medium">{p.nome}</span> },
            { header: "Categoria", render: (p) => p.categoria },
            { header: "Nota", render: (p) => <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-500 text-amber-500" />{p.avaliacao.toFixed(1)}</span> },
            { header: "Serviços/mês", render: (p) => p.servicosMes },
            { header: "Regiões", render: (p) => <span className="text-xs text-muted-foreground">{p.regioes.join(", ")}</span> },
            { header: "Status", render: (p) => <StatusBadge status={STATUS_MAP[p.status]} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
