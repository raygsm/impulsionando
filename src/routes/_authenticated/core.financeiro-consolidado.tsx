import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/financeiro-consolidado")({
  head: () => ({ meta: [{ title: "Financeiro Consolidado" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: ConsolidadoPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ConsolidadoPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["core-financeiro-consolidado"],
    queryFn: async () => {
      const [companies, invoices] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name, environment, release_channel, is_active")
          .eq("is_active", true)
          .eq("is_master", false)
          .neq("environment", "demo"),
        supabase
          .from("billing_invoices")
          .select("company_id, amount, status, due_date, paid_at")
          .gte("created_at", new Date(Date.now() - 365 * 86400_000).toISOString()),
      ]);

      const byCompany = new Map<string, { paid: number; open: number; overdue: number; count: number }>();
      (invoices.data ?? []).forEach((inv: any) => {
        const m = byCompany.get(inv.company_id) ?? { paid: 0, open: 0, overdue: 0, count: 0 };
        m.count += 1;
        const amt = Number(inv.amount) || 0;
        if (inv.status === "paid") m.paid += amt;
        else if (inv.status === "overdue") m.overdue += amt;
        else if (inv.status === "open") m.open += amt;
        byCompany.set(inv.company_id, m);
      });

      const rows = (companies.data ?? []).map((c: any) => ({
        ...c,
        ...(byCompany.get(c.id) ?? { paid: 0, open: 0, overdue: 0, count: 0 }),
      }));

      const totals = rows.reduce(
        (a, r) => ({
          paid: a.paid + r.paid,
          open: a.open + r.open,
          overdue: a.overdue + r.overdue,
          count: a.count + r.count,
        }),
        { paid: 0, open: 0, overdue: 0, count: 0 },
      );
      return { rows, totals };
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Financeiro Consolidado
        </h1>
        <p className="text-sm text-muted-foreground">
          Faturas dos últimos 12 meses agregadas por tenant. Exclui demos e inativos.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Recebido</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-semibold">{fmt(data?.totals.paid ?? 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Em aberto</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-semibold">{fmt(data?.totals.open ?? 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Vencido</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-semibold">{fmt(data?.totals.overdue ?? 0)}</div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium text-right">Faturas</th>
              <th className="px-4 py-2 font-medium text-right text-emerald-700">Recebido</th>
              <th className="px-4 py-2 font-medium text-right text-amber-700">Aberto</th>
              <th className="px-4 py-2 font-medium text-right text-rose-700">Vencido</th>
              <th className="px-4 py-2 font-medium">Canal</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2">
                  <Link to={"/core/cliente/$id" as any} params={{ id: r.id } as any} className="text-primary hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right">{r.count}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(r.paid)}</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(r.open)}</td>
                <td className="px-4 py-2 text-right font-mono">
                  {r.overdue > 0 ? <span className="text-rose-600">{fmt(r.overdue)}</span> : fmt(0)}
                </td>
                <td className="px-4 py-2"><Badge variant="outline">{r.release_channel}</Badge></td>
              </tr>
            ))}
            {(data?.rows ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum tenant ativo.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
