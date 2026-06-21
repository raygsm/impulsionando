import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, ShieldAlert, Info, ScrollText } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminActionsCatalog,
  resetDemoTenantFn,
  suspendTenantBillingFn,
  markPayoutPaidFn,
  reTestIntegrationFn,
  expireTrialFn,
} from "@/lib/admin-actions.functions";

export const Route = createFileRoute("/_authenticated/admin/acoes")({
  head: () => ({ meta: [{ title: "Ações Administrativas — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminActionsPage,
});

const SEV_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  info: "outline",
  warn: "secondary",
  danger: "destructive",
};
const SEV_ICON: Record<string, any> = {
  info: Info,
  warn: AlertTriangle,
  danger: ShieldAlert,
};

function AdminActionsPage() {
  const catalogFn = useServerFn(fetchAdminActionsCatalog);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-actions-catalog"],
    queryFn: () => catalogFn(),
    staleTime: 5 * 60_000,
  });

  const resetFn = useServerFn(resetDemoTenantFn);
  const suspendFn = useServerFn(suspendTenantBillingFn);
  const markPaidFn = useServerFn(markPayoutPaidFn);
  const retestFn = useServerFn(reTestIntegrationFn);
  const expireFn = useServerFn(expireTrialFn);

  const [filter, setFilter] = useState<string>("all");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const d = data as any;
  const categories = useMemo(() => {
    if (!d) return [] as string[];
    return Array.from(new Set(d.actions.map((a: any) => a.category))) as string[];
  }, [d]);
  const filtered = useMemo(() => {
    if (!d) return [] as any[];
    return filter === "all" ? d.actions : d.actions.filter((a: any) => a.category === filter);
  }, [d, filter]);

  const current = d?.actions.find((a: any) => a.key === openKey) ?? null;

  function openDialog(action: any) {
    setOpenKey(action.key);
    setForm({});
    setReason("");
  }

  async function submit() {
    if (!current) return;
    if (current.requiresReason && reason.trim().length < 5) {
      toast.error("Motivo obrigatório (mín. 5 caracteres)");
      return;
    }
    for (const i of current.inputs) {
      if (!i.optional && !form[i.key]) {
        toast.error(`Campo obrigatório: ${i.label}`);
        return;
      }
    }
    setBusy(true);
    try {
      let res: any;
      switch (current.key) {
        case "reset_demo":
          res = await resetFn({ data: { companyId: form.companyId, reason } });
          break;
        case "suspend_billing":
          res = await suspendFn({ data: { companyId: form.companyId, reason } });
          break;
        case "mark_payout_paid":
          res = await markPaidFn({ data: { payoutId: form.payoutId, reason, receiptUrl: form.receiptUrl || undefined } });
          break;
        case "retest_integration":
          res = await retestFn({ data: { integrationId: form.integrationId, reason: reason || undefined } });
          break;
        case "expire_trial":
          res = await expireFn({ data: { trialId: form.trialId, reason } });
          break;
      }
      toast.success(res?.message ?? "Ação executada e registrada no audit trail.");
      setOpenKey(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Ações Administrativas"
        description="Catálogo central de ações sensíveis. Toda execução exige motivo e é registrada no Audit Trail."
      />

      <Card className="p-3 flex items-start gap-2 text-sm">
        <ScrollText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div>
          Cada ação grava em <code>audit_logs</code> com seu usuário, motivo e payload. Consulte em <strong>Audit Trail</strong> ou no
          drill-down do tenant. Ações <strong>danger</strong> têm impacto operacional imediato — confirme antes.
        </div>
      </Card>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>}
      {error && <Card className="p-4 text-destructive">{(error as Error).message}</Card>}

      {d && (
        <>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              Todas ({d.actions.length})
            </Button>
            {categories.map((c) => (
              <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>
                {c}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((a: any) => {
              const Icon = SEV_ICON[a.severity] ?? Info;
              return (
                <Card key={a.key} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${
                      a.severity === "danger" ? "text-destructive"
                      : a.severity === "warn" ? "text-amber-500" : "text-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{a.title}</h3>
                        <Badge variant={SEV_BADGE[a.severity]} className="text-xs">{a.severity}</Badge>
                        <Badge variant="outline" className="text-xs">{a.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                    </div>
                  </div>
                  <Button size="sm" variant={a.severity === "danger" ? "destructive" : "default"} onClick={() => openDialog(a)}>
                    Executar…
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!openKey} onOpenChange={(o) => !o && setOpenKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current?.title}</DialogTitle>
            <DialogDescription>{current?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {current?.inputs.map((i: any) => (
              <div key={i.key} className="space-y-1.5">
                <Label htmlFor={i.key}>{i.label}{!i.optional && <span className="text-destructive ml-1">*</span>}</Label>
                <Input
                  id={i.key}
                  value={form[i.key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [i.key]: e.target.value }))}
                  placeholder={i.type === "uuid" ? "00000000-0000-0000-0000-000000000000" : ""}
                />
              </div>
            ))}
            {current?.requiresReason && (
              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo<span className="text-destructive ml-1">*</span></Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explique por que esta ação está sendo executada (mín. 5 caracteres)"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenKey(null)} disabled={busy}>Cancelar</Button>
            <Button
              variant={current?.severity === "danger" ? "destructive" : "default"}
              onClick={submit}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar e registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
