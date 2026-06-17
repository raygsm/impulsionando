import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finance/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit Financeiro — Impulsionando" }] }),
  component: FinanceCockpit,
});

type Invoice = {
  id: string; amount: number; status: string; due_date: string;
  company_id: string; paid_at: string | null;
  companies: { name: string } | null;
};

type Bucket = "current" | "1-15" | "16-30" | "31-60" | "60+";

const BUCKETS: { key: Bucket; label: string; tone: string; range: [number, number] }[] = [
  { key: "current", label: "Em dia",      tone: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",  range: [-9999, 0] },
  { key: "1-15",    label: "1–15 dias",   tone: "bg-amber-500/15 text-amber-700 border-amber-500/30",        range: [1, 15] },
  { key: "16-30",   label: "16–30 dias",  tone: "bg-orange-500/15 text-orange-700 border-orange-500/30",     range: [16, 30] },
  { key: "31-60",   label: "31–60 dias",  tone: "bg-rose-500/15 text-rose-700 border-rose-500/30",           range: [31, 60] },
  { key: "60+",     label: "60+ dias",    tone: "bg-destructive/15 text-destructive border-destructive/30",  range: [61, 99999] },
];

function bucketOf(daysOverdue: number): Bucket {
  for (const b of BUCKETS) {
    if (daysOverdue >= b.range[0] && daysOverdue <= b.range[1]) return b.key;
  }
  return "current";
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["finance-cockpit"],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 86400_000).toISOString();
      const [openRes, paidRes, suspRes, dunningRes] = await Promise.all([
        supabase.from("billing_invoices")
          .select("id, amount, status, due_date, company_id, paid_at, companies:company_id(name)")
          .in("status", ["open", "overdue", "pending"])
          .order("due_date", { ascending: true })
          .limit(200),
        supabase.from("billing_invoices").select("amount").eq("status", "paid").gte("paid_at", since),
        supabase.from("billing_suspensions").select("id", { count: "exact", head: true }).is("lifted_at", null),
        supabase.from("billing_dunning_runs").select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
      ]);

      const open = (openRes.data ?? []) as unknown as Invoice[];
      const paid90 = (paidRes.data ?? []).reduce((a, b: any) => a + Number(b.amount ?? 0), 0);
      const today = Date.now();
      const buckets: Record<Bucket, { count: number; total: number; items: Invoice[] }> = {
        current: { count: 0, total: 0, items: [] },
        "1-15":   { count: 0, total: 0, items: [] },
        "16-30":  { count: 0, total: 0, items: [] },
        "31-60":  { count: 0, total: 0, items: [] },
        "60+":    { count: 0, total: 0, items: [] },
      };
      for (const inv of open) {
        const days = Math.floor((today - new Date(inv.due_date).getTime()) / 86400_000);
        const b = bucketOf(days);
        buckets[b].count++;
        buckets[b].total += Number(inv.amount ?? 0);
        buckets[b].items.push(inv);
      }
      const overdueTotal = buckets["1-15"].total + buckets["16-30"].total + buckets["31-60"].total + buckets["60+"].total;
      return {
        buckets, overdueTotal,
        openTotal: open.reduce((a, b) => a + Number(b.amount ?? 0), 0),
        paid90,
        suspensions: suspRes.count ?? 0,
        dunning7d: dunningRes.count ?? 0,
        critical: buckets["60+"].items.slice(0, 10),
      };
    },
  });

  const kpis = [
    { label: "Recebido (90d)",       value: data ? brl(data.paid90) : "—",       icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Em aberto",            value: data ? brl(data.openTotal) : "—",     icon: Clock,        color: "text-sky-600" },
    { label: "Inadimplência",        value: data ? brl(data.overdueTotal) : "—",  icon: AlertTriangle, color: "text-destructive" },
    { label: "Suspensões ativas",    value: data?.suspensions ?? "—",             icon: TrendingUp,    color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cockpit Financeiro" description="Régua de inadimplência, recebíveis e ações de cobrança em tempo real." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-24" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      {/* Aging buckets */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Régua de inadimplência (aging)</h2>
          <Badge variant="outline" className="text-xs">
            {data?.dunning7d ?? 0} disparos de cobrança nos últimos 7 dias
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BUCKETS.map((b) => {
            const stats = data?.buckets[b.key];
            return (
              <div key={b.key} className={`rounded-lg border p-4 ${b.tone}`}>
                <div className="text-xs font-semibold uppercase mb-1">{b.label}</div>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-7 w-12" /> : stats?.count ?? 0}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  {isLoading ? "—" : brl(stats?.total ?? 0)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Critical */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Críticos (60+ dias)
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/billing">Gestão de Billing <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        {isLoading ? <Skeleton className="h-32 w-full" /> : data?.critical.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Sem faturas vencidas há mais de 60 dias.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias atraso</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.critical.map((inv) => {
                const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400_000);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.companies?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(inv.due_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30">{days} d</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{brl(Number(inv.amount))}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Atalhos</h3>
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/admin/billing-policy">Régua de cobrança</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/admin/billing-contracts">Contratos</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/finance/webhook-log">Log de webhooks</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/finance/transactions">Transações</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/finance/commissions">Comissões</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/reports/finance">Relatório financeiro</Link></Button>
        </div>
      </Card>
    </div>
  );
}
