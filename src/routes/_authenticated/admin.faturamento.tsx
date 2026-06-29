import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/PageElements";
import { DollarSign, FileWarning, CheckCircle2, Wallet } from "lucide-react";
import {
  fetchBillingOverview,
  listAllInvoices,
  type BillingOverviewRow,
  type BillingInvoiceRow,
} from "@/lib/billing-overview.functions";

export const Route = createFileRoute("/_authenticated/admin/faturamento")({
  head: () => ({
    meta: [
      { title: "Faturamento Unificado — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FaturamentoPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "paid") return "default";
  if (s === "overdue") return "destructive";
  if (s === "open" || s === "pending") return "secondary";
  return "outline";
};

function FaturamentoPage() {
  const fetchOverview = useServerFn(fetchBillingOverview);
  const fetchInvoices = useServerFn(listAllInvoices);

  const overviewQ = useQuery({
    queryKey: ["billing-overview"],
    queryFn: () => fetchOverview() as any,
  });
  const invoicesQ = useQuery<BillingInvoiceRow[]>({
    queryKey: ["billing-invoices-all"],
    queryFn: () => fetchInvoices() as any,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const kpis = overviewQ.data?.kpis;
  const rows: BillingOverviewRow[] = overviewQ.data?.rows ?? [];
  const filteredRows = rows.filter((r) =>
    !search || r.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const invRows = (invoicesQ.data ?? []).filter((i) => {
    if (search && !i.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Faturamento Unificado"
        description="Visão consolidada de contratos, MRR e faturas em todos os tenants."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="MRR total" value={brl(kpis?.mrr ?? 0)} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Contratos ativos" value={String(kpis?.active_contracts ?? 0)} />
        <KpiCard icon={<Wallet className="h-4 w-4" />} label="Pago (30d)" value={brl(kpis?.paid_30d ?? 0)} />
        <KpiCard icon={<FileWarning className="h-4 w-4" />} label="Faturas em atraso" value={String(kpis?.overdue_invoices ?? 0)} tone={kpis?.overdue_invoices ? "danger" : "default"} />
      </div>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList>
          <TabsTrigger value="overview">Visão por tenant</TabsTrigger>
          <TabsTrigger value="invoices">Todas as faturas</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Buscar tenant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 max-w-xs"
          />
        </div>

        <TabsContent value="overview">
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Tenant</th>
                    <th className="text-right px-3 py-2">MRR</th>
                    <th className="text-center px-3 py-2">Contrato</th>
                    <th className="text-center px-3 py-2">Próx. venc.</th>
                    <th className="text-right px-3 py-2">Abertas</th>
                    <th className="text-right px-3 py-2">Atraso</th>
                    <th className="text-right px-3 py-2">Pago 30d</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewQ.isLoading && (
                    <tr><td colSpan={7} className="text-center py-4 text-muted-foreground text-xs">Carregando…</td></tr>
                  )}
                  {filteredRows.map((r) => (
                    <tr key={r.company_id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2">
                        {r.public_slug ? (
                          <Link
                            to="/admin/clientes/$slug" as any
                            params={{ slug: r.public_slug }}
                            className="hover:underline font-medium"
                          >
                            {r.company_name}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.company_name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{brl(r.mrr)}</td>
                      <td className="px-3 py-2 text-center">
                        {r.contract_status ? (
                          <Badge variant={r.contract_status === "active" ? "default" : "outline"} className="text-[10px]">
                            {r.contract_status}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {r.next_due_date ? new Date(r.next_due_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{r.open_invoices}</td>
                      <td className={`px-3 py-2 text-right ${r.overdue_invoices > 0 ? "text-destructive font-semibold" : ""}`}>
                        {r.overdue_invoices}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{brl(r.paid_30d)}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && !overviewQ.isLoading && (
                    <tr><td colSpan={7} className="text-center py-4 text-muted-foreground text-xs">Nenhum tenant encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="flex gap-2 mb-3 flex-wrap">
            {["all", "paid", "open", "pending", "overdue"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Tenant</th>
                    <th className="text-left px-3 py-2">Período</th>
                    <th className="text-center px-3 py-2">Vencimento</th>
                    <th className="text-right px-3 py-2">Valor</th>
                    <th className="text-center px-3 py-2">Status</th>
                    <th className="text-center px-3 py-2">Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQ.isLoading && (
                    <tr><td colSpan={6} className="text-center py-4 text-muted-foreground text-xs">Carregando…</td></tr>
                  )}
                  {invRows.map((i) => (
                    <tr key={i.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{i.company_name}</td>
                      <td className="px-3 py-2 text-xs">
                        {i.period_start ? new Date(i.period_start).toLocaleDateString("pt-BR") : "—"}
                        {" → "}
                        {i.period_end ? new Date(i.period_end).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {i.due_date ? new Date(i.due_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{brl(i.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={statusVariant(i.status)} className="text-[10px]">{i.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {i.paid_at ? new Date(i.paid_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
                  {invRows.length === 0 && !invoicesQ.isLoading && (
                    <tr><td colSpan={6} className="text-center py-4 text-muted-foreground text-xs">Nenhuma fatura.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({
  icon, label, value, tone = "default",
}: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
    </Card>
  );
}
