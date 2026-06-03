import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance/commissions")({
  head: () => ({ meta: [{ title: "Comissões — Financeiro" }] }),
  component: CommPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS: Record<string, { l: string; c: string }> = {
  pending: { l: "Pendente", c: "bg-amber-100 text-amber-700" },
  approved: { l: "Aprovada", c: "bg-blue-100 text-blue-700" },
  paid: { l: "Paga", c: "bg-emerald-100 text-emerald-700" },
  canceled: { l: "Cancelada", c: "bg-gray-100 text-gray-700" },
};

function CommPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();

  const { data: rows } = useQuery({
    queryKey: ["fin-comm", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_commissions").select("*").eq("company_id", companyId).order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "paid" | "canceled" }) => {
      const patch: { status: typeof status; paid_at?: string } = { status };
      if (status === "paid") patch.paid_at = new Date().toISOString();
      const { error } = await supabase.from("fin_commissions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-comm"] }); toast.success("Atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Comissões" description="Comissões geradas por agendamentos, vendas e leads." action={<CompanyPicker />} />
      <Card className="shadow-card divide-y">
        {!rows?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem comissões. Elas serão geradas automaticamente quando outros módulos disparem eventos de venda/atendimento.</div>}
        {rows?.map((r) => {
          const s = STATUS[r.status] ?? STATUS.pending;
          return (
            <div key={r.id} className="p-3 flex items-center gap-3">
              <CircleDollarSign className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{r.beneficiary_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  Base {fmt(Number(r.base_amount))} · {Number(r.percentage)}% · ref {r.reference_type}
                </div>
              </div>
              <Badge variant="outline" className={s.c}>{s.l}</Badge>
              <div className="w-28 text-right font-semibold text-sm">{fmt(Number(r.amount))}</div>
              <div className="flex gap-1">
                {r.status === "pending" && <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: "approved" })} title="Aprovar"><CheckCircle2 className="w-4 h-4" /></Button>}
                {(r.status === "pending" || r.status === "approved") && <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: "paid" })} title="Marcar paga"><CircleDollarSign className="w-4 h-4" /></Button>}
                {r.status !== "canceled" && r.status !== "paid" && <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: "canceled" })} title="Cancelar"><XCircle className="w-4 h-4" /></Button>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
