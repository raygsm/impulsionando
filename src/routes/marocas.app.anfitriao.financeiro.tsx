import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { DataTable, Section, KpiCard, StatusBadge } from "@/components/marocas/MarocasUI";
import { fmtBRL, fmtDateBR, MOCK_RESERVAS, imovelById, type OperationStatus } from "@/components/marocas/marocasMockData";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/marocas/app/anfitriao/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: FinanceiroPage,
});

interface Lanc { id: string; data: string; descricao: string; tipo: "receita" | "despesa"; valor: number; status: OperationStatus }
const LANC: Lanc[] = [
  { id: "l1", data: "2026-07-10", descricao: "Reserva HMKX-8231 — Copa Ocean 902", tipo: "receita", valor: 4860, status: "confirmado" },
  { id: "l2", data: "2026-07-09", descricao: "Limpeza pós check-out — Leme 305", tipo: "despesa", valor: 150, status: "concluido" },
  { id: "l3", data: "2026-07-08", descricao: "Reserva BKG-55420 — Leme Studio 305", tipo: "receita", valor: 3990, status: "confirmado" },
  { id: "l4", data: "2026-07-07", descricao: "Manutenção AC — Copa Ocean 902", tipo: "despesa", valor: 320, status: "concluido" },
  { id: "l5", data: "2026-07-06", descricao: "Amenities · reposição mensal", tipo: "despesa", valor: 268, status: "concluido" },
  { id: "l6", data: "2026-07-05", descricao: "Taxa de gestão · plano Full", tipo: "despesa", valor: 890, status: "pendente" },
];

function FinanceiroPage() {
  const receita = LANC.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
  const despesa = LANC.filter((l) => l.tipo === "despesa").reduce((a, l) => a + l.valor, 0);
  return (
    <MarocasAppShell
      title="Financeiro"
      description="Repasses, despesas operacionais e faturamento por imóvel."
      breadcrumbs={[{ label: "Anfitrião", to: "/marocas/app/anfitriao" }, { label: "Financeiro" }]}
      actions={<button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Exportar CSV</button>}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Receita 30d" value={fmtBRL(receita)} tone="success" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label="Despesa 30d" value={fmtBRL(despesa)} tone="warn" icon={<TrendingDown className="h-4 w-4" />} />
        <KpiCard label="Resultado" value={fmtBRL(receita - despesa)} tone={receita - despesa > 0 ? "success" : "danger"} icon={<Wallet className="h-4 w-4" />} />
        <KpiCard label="Ticket médio" value={fmtBRL(MOCK_RESERVAS.reduce((a, r) => a + r.valorTotal, 0) / MOCK_RESERVAS.length)} />
      </div>

      <Section title="Últimos lançamentos">
        <DataTable
          rows={LANC}
          columns={[
            { header: "Data", render: (l) => <span className="tabular-nums">{fmtDateBR(l.data)}</span> },
            { header: "Descrição", render: (l) => l.descricao },
            { header: "Tipo", render: (l) => <span className={`text-xs font-medium ${l.tipo === "receita" ? "text-emerald-700" : "text-red-700"}`}>{l.tipo === "receita" ? "Receita" : "Despesa"}</span> },
            { header: "Valor", render: (l) => <span className={`tabular-nums font-medium ${l.tipo === "receita" ? "text-emerald-700" : "text-red-700"}`}>{l.tipo === "receita" ? "+" : "−"} {fmtBRL(l.valor)}</span> },
            { header: "Status", render: (l) => <StatusBadge status={l.status} /> },
          ]}
        />
      </Section>

      <Section title="Faturamento por imóvel">
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from(new Set(MOCK_RESERVAS.map((r) => r.imovelId))).map((id) => {
            const im = imovelById(id);
            const total = MOCK_RESERVAS.filter((r) => r.imovelId === id && r.status !== "cancelado").reduce((a, r) => a + r.valorTotal, 0);
            return (
              <div key={id} className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{im?.apelido}</div>
                  <div className="text-xs text-muted-foreground">{im?.bairro}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold tabular-nums">{fmtBRL(total)}</div>
                  <div className="text-xs text-muted-foreground">últimos 30 dias</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </MarocasAppShell>
  );
}
