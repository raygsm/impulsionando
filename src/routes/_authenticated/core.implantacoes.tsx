import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProvisioningQueue, reprovisionPayment } from "@/lib/provisioning.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageElements";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/implantacoes")({
  component: ImplantacoesPage,
});

function ImplantacoesPage() {
  const qc = useQueryClient();
  const fetchQ = useServerFn(listProvisioningQueue);
  const repro = useServerFn(reprovisionPayment);

  const { data, isLoading } = useQuery({
    queryKey: ["provisioning-queue"],
    queryFn: () => fetchQ(),
    refetchInterval: 15000,
  });

  const reprovision = useMutation({
    mutationFn: (mpPaymentId: string) => repro({ data: { mpPaymentId } }),
    onSuccess: (r) => {
      toast.success(r.ok ? `Provisionamento ok (${r.installedSlugs.join(", ") || "—"})` : `Pulado: ${r.skipped}`);
      qc.invalidateQueries({ queryKey: ["provisioning-queue"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Implantações automáticas"
        description="Cada pagamento aprovado vira uma empresa, usuário gestor, contrato, módulos instalados, checklist e comunicação — sem ação manual."
      />
      <Card className="p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!isLoading && (data?.payments ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum pagamento aprovado ainda.</p>
        )}
        <div className="space-y-2">
          {(data?.payments ?? []).map((p: any) => (
            <div key={p.mp_payment_id} className="border-b last:border-0 py-2 text-sm flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.payer_name ?? "—"} · <span className="text-muted-foreground">{p.payer_email}</span></div>
                <div className="text-xs text-muted-foreground">
                  R$ {(Number(p.amount_cents) / 100).toFixed(2)} · {p.modulo_id ?? (p.module_slugs ?? []).join(", ") ?? "—"} · {p.paid_at || p.approved_at ? new Date(p.paid_at ?? p.approved_at).toLocaleString("pt-BR") : "—"}
                </div>
              </div>
              <Badge variant={p.provisioning_status === "done" ? "default" : p.provisioning_status === "error" ? "destructive" : "outline"}>
                {p.provisioning_status}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => reprovision.mutate(p.mp_payment_id)} disabled={reprovision.isPending}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />Reprocessar
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
