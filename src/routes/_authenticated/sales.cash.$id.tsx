import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sales/cash/$id")({
  head: () => ({ meta: [{ title: "Detalhe — Sessão de caixa" }] }),
  component: Page,
});

const fmt = (n: number) => Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const { id } = Route.useParams();

  const { data: session } = useQuery({
    queryKey: ["cash-session-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_cash_sessions").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["cash-session-counts", id],
    queryFn: async () => (await supabase.from("sales_cash_session_counts")
      .select("payment_method_id, expected_amount, counted_amount, difference, fin_payment_methods(name)")
      .eq("session_id", id)).data ?? [],
  });

  const { data: orders } = useQuery({
    queryKey: ["cash-session-orders", id, session?.opened_at, session?.closed_at, session?.opened_by, session?.account_id],
    enabled: !!session,
    queryFn: async () => {
      const upTo = session!.closed_at ?? new Date().toISOString();
      const { data, error } = await supabase.from("sales_orders")
        .select("id, number, total, customer_name, confirmed_at, sales_payments!inner(account_id)")
        .eq("company_id", session!.company_id).eq("status", "confirmed")
        .eq("created_by", session!.opened_by)
        .eq("sales_payments.account_id", session!.account_id)
        .gte("confirmed_at", session!.opened_at).lte("confirmed_at", upTo)
        .order("confirmed_at", { ascending: false });
      if (error) throw error;
      const seen = new Set<string>();
      return (data ?? []).filter((o) => seen.has(o.id) ? false : (seen.add(o.id), true));
    },
  });

  if (!session) return <EmptyState title="Carregando..." />;

  const diff = Number(session.difference_total ?? 0);
  const diffColor = diff === 0 ? "text-emerald-600" : diff > 0 ? "text-amber-600" : "text-red-600";

  return (
    <div>
      <PageHeader title={`Sessão #${session.id.slice(0, 8)}`} description={
        `Aberta em ${new Date(session.opened_at).toLocaleString("pt-BR")}${session.closed_at ? ` · Fechada em ${new Date(session.closed_at).toLocaleString("pt-BR")}` : ""}`
      } action={
        <Button variant="outline" asChild><Link to="/sales/cash"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Link></Button>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Status" value={<Badge variant={session.status === "open" ? "default" : "secondary"}>{session.status === "open" ? "Aberto" : "Fechado"}</Badge>} icon={Wallet} />
        <StatCard label="Abertura" value={fmt(Number(session.opening_amount))} icon={Wallet} />
        <StatCard label="Esperado" value={fmt(Number(session.expected_total ?? 0))} icon={TrendingUp} />
        <StatCard label={`Divergência`} value={<span className={diffColor}>{diff >= 0 ? "+" : ""}{fmt(diff)}</span>} icon={TrendingDown} />
      </div>

      <Card className="shadow-card mb-6">
        <div className="p-4 border-b text-sm font-semibold">Resumo por método de pagamento</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Esperado</TableHead>
              <TableHead className="text-right">Contado</TableHead>
              <TableHead className="text-right">Divergência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!counts?.length && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">Sem contagens (sessão aberta).</TableCell></TableRow>}
            {counts?.map((c) => {
              const d = Number(c.difference);
              const cl = d === 0 ? "text-emerald-600" : d > 0 ? "text-amber-600" : "text-red-600";
              return (
                <TableRow key={c.payment_method_id}>
                  <TableCell>{c.fin_payment_methods?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{fmt(Number(c.expected_amount))}</TableCell>
                  <TableCell className="text-right">{fmt(Number(c.counted_amount))}</TableCell>
                  <TableCell className={`text-right font-semibold ${cl}`}>{d >= 0 ? "+" : ""}{fmt(d)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="shadow-card">
        <div className="p-4 border-b text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4" />Vendas da sessão</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!orders?.length && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">Sem vendas.</TableCell></TableRow>}
            {orders?.map((o) => (
              <TableRow key={o.id}>
                <TableCell>#{o.number}</TableCell>
                <TableCell>{o.customer_name ?? "—"}</TableCell>
                <TableCell>{o.confirmed_at ? new Date(o.confirmed_at).toLocaleString("pt-BR") : "—"}</TableCell>
                <TableCell className="text-right font-medium">{fmt(Number(o.total))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {session.notes && (
        <Card className="shadow-card mt-4 p-4">
          <div className="text-xs text-muted-foreground mb-1">Observações</div>
          <div className="text-sm">{session.notes}</div>
        </Card>
      )}
    </div>
  );
}
