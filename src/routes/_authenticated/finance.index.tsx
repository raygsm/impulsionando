import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatCard } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertCircle, Percent, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finance/")({
  head: () => ({ meta: [{ title: "Financeiro" }] }),
  component: FinanceHome,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceHome() {
  const { companyId } = useActiveCompany();
  const today = new Date().toISOString().slice(0, 10);

  const { data: stats } = useQuery({
    queryKey: ["fin-stats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [accs, recv, payb, overdue, comm] = await Promise.all([
        supabase.from("fin_accounts").select("current_balance").eq("company_id", companyId).eq("is_active", true),
        supabase.from("fin_transactions").select("amount").eq("company_id", companyId).eq("kind", "income").eq("status", "pending"),
        supabase.from("fin_transactions").select("amount").eq("company_id", companyId).eq("kind", "expense").eq("status", "pending"),
        supabase.from("fin_transactions").select("id", { count: "exact", head: true })
          .eq("company_id", companyId).eq("status", "pending").lt("due_date", today),
        supabase.from("fin_commissions").select("amount").eq("company_id", companyId).eq("status", "pending"),
      ]);
      const sum = (a: { amount?: number; current_balance?: number }[] | null, key: "amount" | "current_balance") =>
        (a ?? []).reduce((s, r) => s + Number(r[key] ?? 0), 0);
      return {
        balance: sum(accs.data, "current_balance"),
        toReceive: sum(recv.data, "amount"),
        toPay: sum(payb.data, "amount"),
        overdue: overdue.count ?? 0,
        commissions: sum(comm.data, "amount"),
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["fin-recent", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("fin_transactions")
        .select("id, description, amount, kind, status, due_date")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa para acessar o financeiro." />;

  return (
    <div>
      <PageHeader title="Financeiro" description="Saldo, contas a pagar e receber, comissões." action={<CompanyPicker />} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Saldo total" value={fmt(stats?.balance ?? 0)} icon={Wallet} accent />
        <StatCard label="A receber" value={fmt(stats?.toReceive ?? 0)} icon={ArrowDownCircle} />
        <StatCard label="A pagar" value={fmt(stats?.toPay ?? 0)} icon={ArrowUpCircle} />
        <StatCard label="Vencidos" value={stats?.overdue ?? 0} icon={AlertCircle} />
        <StatCard label="Comissões pendentes" value={fmt(stats?.commissions ?? 0)} icon={Percent} />
      </div>

      <Card className="shadow-card">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium"><ListChecks className="w-4 h-4" />Últimos lançamentos</div>
          <Link to="/finance/transactions" className="text-xs text-primary">Ver todos</Link>
        </div>
        <div className="divide-y">
          {!recent?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem lançamentos.</div>}
          {recent?.map((t) => (
            <div key={t.id} className="p-3 flex items-center gap-3">
              <div className={`w-2 self-stretch rounded-sm ${t.kind === "income" ? "bg-emerald-500" : "bg-red-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{t.description}</div>
                <div className="text-xs text-muted-foreground">Vence {new Date(t.due_date).toLocaleDateString("pt-BR")} · {t.status}</div>
              </div>
              <div className={`text-sm font-semibold ${t.kind === "income" ? "text-emerald-600" : "text-red-600"}`}>
                {t.kind === "income" ? "+" : "-"} {fmt(Number(t.amount))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
