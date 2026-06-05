import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listSubscriptions,
  cancelSubscriptionAdmin,
  openCustomerPortalAdmin,
  getBillingStats,
} from "@/lib/billing-admin.functions";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/billing")({
  head: () => ({ meta: [{ title: "Billing — Impulsionando Tecnologia" }] }),
  component: AdminBillingPage,
});

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em trial",
  past_due: "Em atraso",
  paused: "Pausada",
  canceled: "Cancelada",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  paused: "outline",
  canceled: "outline",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function AdminBillingPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSubscriptions);
  const statsFn = useServerFn(getBillingStats);
  const cancelFn = useServerFn(cancelSubscriptionAdmin);
  const portalFn = useServerFn(openCustomerPortalAdmin);

  const [statusFilter, setStatusFilter] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);

  const { data: list, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", statusFilter, envFilter],
    queryFn: () =>
      listFn({
        data: {
          status: statusFilter || undefined,
          environment: envFilter || undefined,
        },
      }),
  });
  const { data: stats } = useQuery({
    queryKey: ["admin-billing-stats"],
    queryFn: () => statsFn(),
  });

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    qc.invalidateQueries({ queryKey: ["admin-billing-stats"] });
  };

  const mCancel = useMutation({
    mutationFn: (vars: { id: string; effectiveFrom: "immediately" | "next_billing_period" }) =>
      cancelFn({ data: { subscriptionId: vars.id, effectiveFrom: vars.effectiveFrom } }),
    onSuccess: () => {
      toast.success("Assinatura cancelada");
      setCancelTarget(null);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mPortal = useMutation({
    mutationFn: (id: string) => portalFn({ data: { subscriptionId: id } }),
    onSuccess: (res) => {
      const url =
        res.subscriptionUrls?.[0]?.cancelSubscription ??
        res.subscriptionUrls?.[0]?.updateSubscriptionPaymentMethod ??
        res.overviewUrl;
      if (url) window.open(url, "_blank");
      else toast.error("Portal indisponível");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Billing das assinaturas"
        description="Visão e administração das assinaturas dos clientes vinculados."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={stats?.total ?? 0} icon={CreditCard} accent />
        <StatCard label="Live" value={stats?.liveTotal ?? 0} icon={CreditCard} />
        <StatCard label="Ativas (live)" value={stats?.active ?? 0} icon={CheckCircle2} />
        <StatCard label="Em atraso" value={stats?.pastDue ?? 0} icon={AlertTriangle} />
        <StatCard label="Canceladas" value={stats?.canceled ?? 0} icon={Ban} />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button size="sm" variant={statusFilter === "" ? "default" : "outline"} onClick={() => setStatusFilter("")}>
          Todas
        </Button>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <Button
            key={k}
            size="sm"
            variant={statusFilter === k ? "default" : "outline"}
            onClick={() => setStatusFilter(k)}
          >
            {v}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={envFilter === "" ? "default" : "outline"} onClick={() => setEnvFilter("")}>
            Todos ambientes
          </Button>
          <Button size="sm" variant={envFilter === "live" ? "default" : "outline"} onClick={() => setEnvFilter("live")}>
            Live
          </Button>
          <Button size="sm" variant={envFilter === "sandbox" ? "default" : "outline"} onClick={() => setEnvFilter("sandbox")}>
            Test
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Plano</th>
                <th className="p-3">Ciclo</th>
                <th className="p-3">Status</th>
                <th className="p-3">Período atual</th>
                <th className="p-3">Ambiente</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && (list?.items?.length ?? 0) === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma assinatura encontrada.</td></tr>
              )}
              {(list?.items ?? []).map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{s.user_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.user_email ?? s.user_id}</div>
                  </td>
                  <td className="p-3">{s.planLabel}</td>
                  <td className="p-3 capitalize">{s.cycleLabel}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                    {s.cancel_at_period_end && (
                      <div className="text-xs text-muted-foreground mt-1">Cancela no fim do período</div>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {fmtDate(s.current_period_start)} → {fmtDate(s.current_period_end)}
                  </td>
                  <td className="p-3">
                    <Badge variant={s.environment === "live" ? "default" : "outline"}>
                      {s.environment === "live" ? "Live" : "Test"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => mPortal.mutate(s.id)}
                      disabled={mPortal.isPending}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Portal
                    </Button>
                    {s.status !== "canceled" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={() => setCancelTarget(s)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar assinatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Cliente: <strong>{cancelTarget?.user_email ?? cancelTarget?.user_id}</strong>
            </p>
            <p>
              Plano: <strong>{cancelTarget?.planLabel} ({cancelTarget?.cycleLabel})</strong>
            </p>
            <p className="text-muted-foreground">
              Conforme política definida, o cancelamento padrão é imediato e suspende o acesso.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                cancelTarget &&
                mCancel.mutate({ id: cancelTarget.id, effectiveFrom: "next_billing_period" })
              }
              disabled={mCancel.isPending}
            >
              Ao fim do período
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelTarget && mCancel.mutate({ id: cancelTarget.id, effectiveFrom: "immediately" })
              }
              disabled={mCancel.isPending}
            >
              Cancelar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
