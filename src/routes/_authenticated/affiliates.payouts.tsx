import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/affiliates/payouts")({
  component: PayoutsPage,
});

type Row = { id: string; recipient_kind: string; amount: number; status: string; requested_at: string; approved_at: string | null; paid_at: string | null; pix_key: string | null };

function PayoutsPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const { data, isLoading } = useQuery({
    queryKey: ["aff_payouts", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("aff_payouts").select("*").eq("company_id", companyId!).order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aprovado" | "pago" | "rejeitado" | "cancelado" }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "aprovado") patch.approved_at = new Date().toISOString();
      if (status === "pago") patch.paid_at = new Date().toISOString();
      const { error } = await supabase.from("aff_payouts").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["aff_payouts", companyId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dt = (s: string | null) => s ? new Date(s).toLocaleString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Saques e Repasses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicitações de saque dos afiliados, coprodutores e gerentes. Aprovação e pagamento são manuais até integração com gateway de PIX/TED.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitado em</TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Pix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aprovado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Nenhuma solicitação de saque ainda.</TableCell></TableRow>}
              {data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{dt(r.requested_at)}</TableCell>
                  <TableCell>{r.recipient_kind}</TableCell>
                  <TableCell className="text-right font-medium">{brl(r.amount)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.pix_key ?? "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "pago" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{dt(r.approved_at)}</TableCell>
                  <TableCell className="whitespace-nowrap">{dt(r.paid_at)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {r.status === "solicitado" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "aprovado" })}>Aprovar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: "rejeitado" })}>Rejeitar</Button>
                      </>
                    )}
                    {r.status === "aprovado" && (
                      <Button size="sm" onClick={() => setStatus.mutate({ id: r.id, status: "pago" })}>Marcar como pago</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
