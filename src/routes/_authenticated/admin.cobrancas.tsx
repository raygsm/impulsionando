import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bell, Loader2, AlertTriangle, DollarSign, Hourglass, Users } from "lucide-react";
import { listAllOpenReceivables, bulkSendReminders } from "@/lib/receivables.functions";

export const Route = createFileRoute("/_authenticated/admin/cobrancas")({
  component: CobrancasPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const kindLabel: Record<string, string> = {
  erp: "ERP / Contrato",
  consumer: "Clube Premium",
  marketplace: "Marketplace B2B",
};
const kindColor: Record<string, string> = {
  erp: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  consumer: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  marketplace: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

function CobrancasPage() {
  const fetchFn = useServerFn(listAllOpenReceivables);
  const bulkFn = useServerFn(bulkSendReminders);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-receivables"],
    queryFn: () => fetchFn(),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((r) => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (filter && !r.payer.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [data, filter, kindFilter]);

  const bulk = useMutation({
    mutationFn: async () => {
      const items = filtered
        .filter((r) => selected[`${r.kind}:${r.id}`] && (r.kind === "erp" || r.kind === "consumer"))
        .map((r) => ({ kind: r.kind as "erp" | "consumer", id: r.id }));
      if (!items.length) throw new Error("Selecione ao menos uma cobrança ERP ou Premium.");
      return bulkFn({ data: { items } });
    },
    onSuccess: (r) => {
      toast.success(`Lembretes enviados: ${r.ok} | falhas: ${r.fail}`);
      setSelected({});
      qc.invalidateQueries({ queryKey: ["admin-receivables"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = data?.totals;
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const selectedTotal = filtered
    .filter((r) => selected[`${r.kind}:${r.id}`])
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Cobranças</h1>
          <p className="text-sm text-muted-foreground">
            Visão unificada de contas a receber: ERP, Clube Premium e Marketplace B2B.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/billing-contracts">Contratos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/core/consumidor-premium">Premium</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" /> Total a receber
          </div>
          <div className="text-2xl font-bold mt-1">{fmt(totals?.total ?? 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">{totals?.count ?? 0} cobranças</div>
        </Card>
        <Card className="p-4 border-destructive/40">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" /> Vencidas
          </div>
          <div className="text-2xl font-bold mt-1 text-destructive">{fmt(totals?.overdue ?? 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">{totals?.overdue_count ?? 0} faturas</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hourglass className="w-3.5 h-3.5" /> Ticket médio
          </div>
          <div className="text-2xl font-bold mt-1">{fmt(totals?.avg_ticket ?? 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> Mix
          </div>
          <div className="text-xs mt-1 space-y-0.5">
            <div>ERP: <span className="font-semibold">{fmt(totals?.by_kind.erp ?? 0)}</span></div>
            <div>Premium: <span className="font-semibold">{fmt(totals?.by_kind.consumer ?? 0)}</span></div>
            <div>MP B2B: <span className="font-semibold">{fmt(totals?.by_kind.marketplace ?? 0)}</span></div>
          </div>
        </Card>
      </section>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Input
            placeholder="Buscar por pagador..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          {["all", "erp", "consumer", "marketplace"].map((k) => (
            <Button
              key={k}
              size="sm"
              variant={kindFilter === k ? "default" : "outline"}
              onClick={() => setKindFilter(k)}
            >
              {k === "all" ? "Todas" : kindLabel[k]}
            </Button>
          ))}
          <div className="flex-1" />
          {selectedCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedCount} selecionadas · {fmt(selectedTotal)}
            </div>
          )}
          <Button
            size="sm"
            disabled={selectedCount === 0 || bulk.isPending}
            onClick={() => bulk.mutate()}
          >
            {bulk.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bell className="w-3.5 h-3.5 mr-1" />}
            Disparar lembretes
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma cobrança em aberto.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 w-8"></th>
                  <th className="text-left py-2">Tipo</th>
                  <th className="text-left py-2">Pagador</th>
                  <th className="text-left py-2">Vencimento</th>
                  <th className="text-right py-2">Valor</th>
                  <th className="text-right py-2">Atraso</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const key = `${r.kind}:${r.id}`;
                  const overdue = r.overdue_days > 0;
                  return (
                    <tr key={key} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2">
                        <Checkbox
                          checked={!!selected[key]}
                          onCheckedChange={(v) => setSelected((s) => ({ ...s, [key]: !!v }))}
                          disabled={r.kind === "marketplace"}
                        />
                      </td>
                      <td className="py-2">
                        <Badge variant="secondary" className={kindColor[r.kind]}>
                          {kindLabel[r.kind]}
                        </Badge>
                      </td>
                      <td className="py-2 font-medium">{r.payer}</td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(r.due_date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2 text-right font-semibold">{fmt(r.amount)}</td>
                      <td className="py-2 text-right">
                        {overdue ? (
                          <Badge variant="destructive">{r.overdue_days}d</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">no prazo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
