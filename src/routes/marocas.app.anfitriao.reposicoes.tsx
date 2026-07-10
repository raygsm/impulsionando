import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, StatusBadge, Section, KpiCard } from "@/components/marocas/MarocasUI";
import { PackageOpen } from "lucide-react";
import { fmtBRL, type OperationStatus } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/anfitriao/reposicoes")({
  head: () => ({ meta: [{ title: "Reposições — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: ReposicoesPage,
});

interface Item { id: string; produto: string; imovel: string; quantidade: number; valor: number; status: OperationStatus; fornecedor: string }

const ROWS: Item[] = [
  { id: "rp-1", produto: "Kit amenities (shampoo + condicionador + sabonete)", imovel: "Copa Ocean 902", quantidade: 4, valor: 68, status: "confirmado", fornecedor: "Central Marocas" },
  { id: "rp-2", produto: "Papel higiênico premium 12un", imovel: "Leme Studio 305", quantidade: 1, valor: 42, status: "pendente", fornecedor: "Central Marocas" },
  { id: "rp-3", produto: "Café Marocas 250g", imovel: "Copa Ocean 902", quantidade: 2, valor: 56, status: "em_andamento", fornecedor: "Torrefação parceira" },
  { id: "rp-4", produto: "Roupas de cama · queen", imovel: "Ipanema Garden 1101", quantidade: 3, valor: 210, status: "concluido", fornecedor: "LavaJá" },
  { id: "rp-5", produto: "Cápsulas de café Nespresso 20un", imovel: "Botafogo Bay 704", quantidade: 1, valor: 89, status: "cancelado", fornecedor: "Central Marocas" },
];

function ReposicoesPage() {
  const total = ROWS.reduce((a, r) => a + r.valor * r.quantidade, 0);
  return (
    <MarocasAppShell
      title="Reposições de estoque"
      description="Amenities, cama e mesa, café, papelaria — tudo o que precisa voltar para o imóvel entre estadias."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Reposições" }]}
      actions={<button className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Nova reposição</button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Itens no mês" value={ROWS.length} icon={<PackageOpen className="h-4 w-4" />} />
        <KpiCard label="Custo total" value={fmtBRL(total)} />
        <KpiCard label="Reposição automática" value="4 imóveis" hint="Amenities via gatilho" tone="success" />
      </div>
      <Section title="Últimas reposições">
        <DataTable
          rows={ROWS}
          columns={[
            { header: "Produto", render: (r) => r.produto },
            { header: "Imóvel", render: (r) => r.imovel },
            { header: "Qtd", render: (r) => r.quantidade },
            { header: "Fornecedor", render: (r) => <span className="text-xs">{r.fornecedor}</span> },
            { header: "Valor", render: (r) => <span className="tabular-nums">{fmtBRL(r.valor * r.quantidade)}</span> },
            { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Section>
    </MarocasAppShell>
  );
}
