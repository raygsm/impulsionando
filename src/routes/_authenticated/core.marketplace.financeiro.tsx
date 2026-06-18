import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketplaceKPIs, listFeePolicies, listMarketplaceSuppliers } from "@/lib/marketplace.functions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/marketplace/financeiro")({
  component: FinancePage,
  head: () => ({ meta: [{ title: "Financeiro B2B — Marketplace" }] }),
});

function brl(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function FinancePage() {
  const kpisFn = useServerFn(fetchMarketplaceKPIs);
  const policiesFn = useServerFn(listFeePolicies);
  const suppliersFn = useServerFn(listMarketplaceSuppliers);

  const { data: k30 } = useQuery({ queryKey: ["mp-kpis", 30], queryFn: () => kpisFn({ data: { sinceDays: 30 } }) });
  const { data: k90 } = useQuery({ queryKey: ["mp-kpis", 90], queryFn: () => kpisFn({ data: { sinceDays: 90 } }) });
  const { data: policies } = useQuery({ queryKey: ["mp-policies"], queryFn: () => policiesFn() });
  const { data: suppliers } = useQuery({ queryKey: ["mp-suppliers-fin"], queryFn: () => suppliersFn() });

  const supMap = new Map((suppliers ?? []).map((s: any) => [s.id, s.display_name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Banknote className="w-6 h-6 text-primary" /> Financeiro B2B
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <PeriodCard title="Últimos 30 dias" k={k30} />
        <PeriodCard title="Últimos 90 dias" k={k90} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top fornecedores por GMV (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(k30?.top_suppliers ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          )}
          {(k30?.top_suppliers ?? []).map((t: any) => (
            <div key={t.supplier_id} className="flex justify-between text-sm border-b last:border-0 py-2">
              <span>{supMap.get(t.supplier_id) ?? t.supplier_id}</span>
              <span className="font-medium">{brl(t.gmv_cents)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Políticas de Taxa de Intermediação Digital</CardTitle>
          <CardDescription>Default 0,50%. Overrides por nicho ou por fornecedor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(policies ?? []).map((p: any) => (
            <div key={p.id} className="flex justify-between text-sm border-b last:border-0 py-2">
              <div>
                <div className="font-medium">{p.label}</div>
                <div className="text-xs text-muted-foreground">
                  Escopo: {p.scope}{p.niche_slug ? ` · ${p.niche_slug}` : ""}
                </div>
              </div>
              <Badge variant="outline">{(Number(p.fee_pct) * 100).toFixed(2)}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PeriodCard({ title, k }: { title: string; k: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <Row label="GMV" value={brl(k?.gmv_cents ?? 0)} />
        <Row label="Receita Marketplace (taxa)" value={brl(k?.fee_cents ?? 0)} />
        <Row label="Líquido aos fornecedores" value={brl(k?.supplier_net_cents ?? 0)} />
        <Row label="Pedidos concluídos" value={String(k?.orders ?? 0)} />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b last:border-0 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
