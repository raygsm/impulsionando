import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CreditCard, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSubscription } from "@/hooks/useSubscription";
import {
  changeMyPlan, cancelMySubscription, openMyPortal, reactivateMySubscription,
} from "@/lib/billing-self.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/minha-assinatura")({
  component: MinhaAssinaturaPage,
});

const PLANS = [
  { product: "essencial_plan", name: "Essencial", monthly: 697, annual: 581, modules: "1 módulo (CRM)" },
  { product: "integrado_plan", name: "Integrado", monthly: 997.9, annual: 831, modules: "2 módulos (CRM + Agenda)" },
  { product: "avancado_plan", name: "Avançado", monthly: 1497.97, annual: 1248, modules: "3 módulos + BI" },
];

const PRICE_ID: Record<string, { monthly: string; annual: string }> = {
  essencial_plan: { monthly: "essencial_monthly", annual: "essencial_annual" },
  integrado_plan: { monthly: "integrado_monthly", annual: "integrado_annual" },
  avancado_plan: { monthly: "avancado_monthly", annual: "avancado_annual" },
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function StatusBadge({ status, willCancel }: { status: string; willCancel: boolean }) {
  if (willCancel) return <Badge variant="outline" className="border-amber-500 text-amber-700">Cancelamento agendado</Badge>;
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Ativa", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    trialing: { label: "Em teste", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    past_due: { label: "Pagamento pendente", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    suspended: { label: "Suspensa", cls: "bg-red-100 text-red-700 border-red-200" },
    canceled: { label: "Cancelada", cls: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  };
  const m = map[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-700 border-zinc-200" };
  return <Badge variant="outline" className={m.cls}>{m.label}</Badge>;
}

function MinhaAssinaturaPage() {
  const qc = useQueryClient();
  const { subscription, planName, cycle, isActive, isPastDue, willCancel, isLoading } = useSubscription();
  const [changeOpen, setChangeOpen] = useState(false);
  const [annualSelected, setAnnualSelected] = useState(cycle === "anual");
  const [cancelOpen, setCancelOpen] = useState(false);

  const changeFn = useServerFn(changeMyPlan);
  const cancelFn = useServerFn(cancelMySubscription);
  const portalFn = useServerFn(openMyPortal);
  const reactivateFn = useServerFn(reactivateMySubscription);

  const mChange = useMutation({
    mutationFn: (newPriceId: string) => changeFn({ data: { newPriceId } as any }),
    onSuccess: (r: any) => {
      toast.success(r?.isUpgrade ? "Upgrade aplicado (cobrança prorata)" : "Downgrade agendado para o próximo ciclo");
      setChangeOpen(false);
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao trocar de plano"),
  });

  const mCancel = useMutation({
    mutationFn: () => cancelFn(),
    onSuccess: () => {
      toast.success("Cancelamento agendado para o fim do período atual");
      setCancelOpen(false);
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao cancelar"),
  });

  const mPortal = useMutation({
    mutationFn: () => portalFn(),
    onSuccess: (r: any) => {
      const url = r?.overviewUrl ?? r?.subscriptionUrls?.[0]?.cancelSubscription ?? null;
      if (url) window.open(url, "_blank");
      else toast.error("Portal indisponível no momento");
    },
    onError: (e: any) => toast.error(e.message || "Falha ao abrir portal"),
  });

  const mReactivate = useMutation({
    mutationFn: () => reactivateFn(),
    onSuccess: () => {
      toast.success("Assinatura reativada — renovação automática voltou a valer");
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao reativar"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minha assinatura</h1>
          <p className="text-muted-foreground mt-1">Você ainda não tem uma assinatura ativa.</p>
        </div>
        <Card className="p-8 text-center space-y-4">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Comece agora</h2>
            <p className="text-sm text-muted-foreground">
              Escolha um plano e desbloqueie os módulos do sistema.
            </p>
          </div>
          <Button asChild>
            <a href="/planos">Ver planos</a>
          </Button>
        </Card>
      </div>
    );
  }

  const currentProduct = subscription.product_id;
  const currentPriceMonthly = subscription.price_id.endsWith("_monthly");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha assinatura</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu plano, pagamento e cobranças.</p>
      </div>

      {/* Status card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{planName ?? subscription.product_id}</h2>
              <StatusBadge status={subscription.status} willCancel={willCancel} />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Ciclo: <span className="font-medium text-foreground capitalize">{cycle ?? "—"}</span></div>
              <div>Próxima cobrança: <span className="font-medium text-foreground">{formatDate(subscription.current_period_end)}</span></div>
              {willCancel && (
                <div className="text-amber-700">Acesso até {formatDate(subscription.current_period_end)} — sem renovação.</div>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {willCancel ? (
              <Button
                onClick={() => mReactivate.mutate()}
                disabled={mReactivate.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {mReactivate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Reativar assinatura
              </Button>
            ) : (
              <Button onClick={() => setChangeOpen(true)} disabled={!isActive}>
                Trocar de plano
              </Button>
            )}
            <Button variant="outline" onClick={() => mPortal.mutate()} disabled={mPortal.isPending}>
              {mPortal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              Atualizar pagamento
            </Button>
            {!willCancel && subscription.status !== "canceled" && (
              <Button variant="ghost" onClick={() => setCancelOpen(true)} className="text-destructive hover:text-destructive">
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {isPastDue && (
          <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <strong>Pagamento recusado.</strong> Atualize seu método de pagamento o quanto antes para evitar a suspensão do acesso (3 dias de tolerância).
            </div>
          </div>
        )}
        {subscription.status === "suspended" && (
          <div className="mt-5 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
            <div className="text-sm text-red-900">
              <strong>Acesso suspenso.</strong> Regularize a cobrança no portal de pagamento para reativar os módulos.
            </div>
          </div>
        )}
      </Card>

      {/* Trocar de plano */}
      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trocar de plano</DialogTitle>
            <DialogDescription>
              Upgrades são cobrados proporcionalmente. Downgrades entram em vigor no próximo ciclo.
            </DialogDescription>
          </DialogHeader>

          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted self-center">
            <button
              onClick={() => setAnnualSelected(false)}
              className={cn("px-4 py-1.5 rounded-full text-sm transition-colors", !annualSelected && "bg-background shadow-sm font-medium")}
            >Mensal</button>
            <button
              onClick={() => setAnnualSelected(true)}
              className={cn("px-4 py-1.5 rounded-full text-sm transition-colors inline-flex items-center gap-1.5", annualSelected && "bg-background shadow-sm font-medium")}
            >Anual <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">-17%</span></button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            {PLANS.map((p) => {
              const isCurrent = p.product === currentProduct && (annualSelected ? !currentPriceMonthly : currentPriceMonthly);
              const newPriceId = annualSelected ? PRICE_ID[p.product].annual : PRICE_ID[p.product].monthly;
              const price = annualSelected ? p.annual : p.monthly;
              return (
                <Card key={p.product} className={cn("p-4 flex flex-col gap-2", isCurrent && "border-primary ring-1 ring-primary/30")}>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-2xl font-bold">{formatBRL(price)}<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                  <div className="text-xs text-muted-foreground">{p.modules}</div>
                  <Button
                    size="sm"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || mChange.isPending}
                    onClick={() => mChange.mutate(newPriceId)}
                    className="mt-auto"
                  >
                    {mChange.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1" />Plano atual</>
                    ) : "Selecionar"}
                  </Button>
                </Card>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setChangeOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancelar */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              O cancelamento será efetivado no final do período já pago ({formatDate(subscription.current_period_end)}).
              Você mantém o acesso até essa data e pode reativar antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mCancel.mutate()}
              disabled={mCancel.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {mCancel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
