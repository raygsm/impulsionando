import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listBillingContracts,
  markInvoicePaid,
  runBillingCycleNow,
  sendInvoiceReminderNow,
} from "@/lib/billing.functions";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Pause, Play, RefreshCw, CreditCard, Receipt, Bell } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/billing-contracts")({
  head: () => ({ meta: [{ title: "Contratos recorrentes — Impulsionando" }] }),
  component: BillingContractsPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

interface InvoiceRow {
  id: string;
  due_date: string;
  amount: number;
  status: string;
  paid_at: string | null;
}

function BillingContractsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBillingContracts);
  const payFn = useServerFn(markInvoicePaid);
  const runFn = useServerFn(runBillingCycleNow);
  const remindFn = useServerFn(sendInvoiceReminderNow);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-contracts"],
    queryFn: () => listFn(),
  });

  const pay = useMutation({
    mutationFn: (id: string) => payFn({ data: { invoiceId: id } }),
    onSuccess: () => {
      toast.success("Pagamento registrado. Acesso reativado automaticamente.");
      qc.invalidateQueries({ queryKey: ["billing-contracts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const run = useMutation({
    mutationFn: () => runFn(),
    onSuccess: (r) => {
      const res = (r?.result ?? {}) as { generated?: number; sent?: number; suspended?: number };
      toast.success(
        `Ciclo executado · ${res.generated ?? 0} fatura(s), ${res.sent ?? 0} cobrança(s), ${res.suspended ?? 0} suspensão(ões)`,
      );
      qc.invalidateQueries({ queryKey: ["billing-contracts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remind = useMutation({
    mutationFn: (id: string) => remindFn({ data: { invoiceId: id } }),
    onSuccess: (r) => {
      const ch = (r?.channels ?? []) as string[];
      toast.success(`Lembrete enfileirado (${ch.join(" + ") || "—"})`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contracts = data?.contracts ?? [];
  const active = contracts.filter((c) => c.status === "active").length;
  const suspended = contracts.filter((c) => c.status === "suspended").length;
  const mrr = contracts
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + Number(c.recurring_amount), 0);

  return (
    <div>
      <PageHeader
        title="Contratos recorrentes"
        description="Régua de cobrança D-7 / D-1 / D0, suspensão automática D+1 e reativação ao identificar pagamento."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/billing-policy">Editar régua padrão</Link>
            </Button>
            <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
              <RefreshCw className="w-4 h-4 mr-1" /> Rodar ciclo agora
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Contratos ativos" value={active} icon={CheckCircle2} accent />
        <StatCard label="Suspensos" value={suspended} icon={AlertTriangle} />
        <StatCard label="Receita recorrente" value={fmt(mrr)} icon={CreditCard} />
        <StatCard label="Total" value={contracts.length} icon={Receipt} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Plano</th>
                <th className="p-3">Mensalidade</th>
                <th className="p-3">Próx. vencimento</th>
                <th className="p-3">Status</th>
                <th className="p-3">Setup</th>
                <th className="p-3 text-right">Faturas</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && !contracts.length && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum contrato.</td></tr>
              )}
              {contracts.map((c) => {
                const company = (c.companies as { name: string } | null);
                const plan = (c.billing_plans as { name: string; cycle: string } | null);
                const invoices = (c.billing_invoices as InvoiceRow[] | null) ?? [];
                const open = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");
                return (
                  <tr key={c.id} className="border-t align-top">
                    <td className="p-3">
                      <div className="font-medium">{company?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">desde {fmtDate(c.start_date)}</div>
                    </td>
                    <td className="p-3">
                      <div>{plan?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground capitalize">{plan?.cycle ?? ""}</div>
                    </td>
                    <td className="p-3 font-medium">{fmt(Number(c.recurring_amount))}</td>
                    <td className="p-3">{fmtDate(c.next_due_date)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={STATUS_COLOR[c.status] ?? ""}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                      {c.status === "suspended" && <Pause className="w-3.5 h-3.5 inline ml-1 text-red-600" />}
                      {c.status === "active" && <Play className="w-3.5 h-3.5 inline ml-1 text-emerald-600" />}
                    </td>
                    <td className="p-3 text-xs">
                      {c.setup_paid_at ? (
                        <>
                          <div>{fmt(Number(c.setup_amount))}</div>
                          <div className="text-muted-foreground">pago {fmtDate(c.setup_paid_at)}</div>
                          {c.nfe_issued_at && <div className="text-emerald-700">NF {fmtDate(c.nfe_issued_at)}</div>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-y-1">
                      {invoices.length === 0 && <div className="text-xs text-muted-foreground">Sem faturas</div>}
                      {invoices.slice(0, 3).map((i) => (
                        <div key={i.id} className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{fmtDate(i.due_date)}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {i.status}
                          </Badge>
                          <span className="text-xs font-medium">{fmt(Number(i.amount))}</span>
                          {i.status !== "paid" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => remind.mutate(i.id)} disabled={remind.isPending}>
                                <Bell className="w-3 h-3 mr-1" /> Lembrar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => pay.mutate(i.id)} disabled={pay.isPending}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Baixar
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                      {open.length > 0 && (
                        <div className="text-[10px] text-red-600 pt-1">{open.length} em aberto</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
