import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, AlertTriangle, CheckCircle2, Infinity as InfinityIcon, TrendingUp, Bell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/affiliates/wallet")({
  head: () => ({ meta: [{ title: "Carteira de Afiliados — Impulsionando" }] }),
  component: WalletPage,
});

interface Affiliate {
  id: string; name: string; email: string | null; status: string;
  is_lifetime: boolean; wallet_balance: number; wallet_pending: number;
  wallet_last_movement_at: string | null;
}
interface Alert {
  id: string; affiliate_id: string; kind: string; severity: string;
  title: string; message: string | null; amount: number | null;
  is_read: boolean; created_at: string;
}

async function fetchAffiliates(): Promise<Affiliate[]> {
  const { data, error } = await supabase
    .from("aff_affiliates")
    .select("id,name,email,status,is_lifetime,wallet_balance,wallet_pending,wallet_last_movement_at")
    .order("wallet_balance", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as Affiliate[];
}

async function fetchAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("aff_wallet_alerts")
    .select("id,affiliate_id,kind,severity,title,message,amount,is_read,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Alert[];
}

const KIND_LABEL: Record<string, string> = {
  commission_pending: "Comissão pendente",
  commission_released: "Comissão liberada",
  payout_paid: "Saque pago",
  customer_overdue: "Cliente inadimplente",
  customer_churned: "Cliente cancelou",
  lifetime_granted: "Vitalício concedido",
};

const SEV_STYLE: Record<string, string> = {
  info: "bg-primary/15 text-primary",
  warn: "bg-amber-500 text-white",
  critical: "bg-destructive text-destructive-foreground",
};

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

function WalletPage() {
  const qc = useQueryClient();
  const { data: affs, isLoading: la } = useQuery({ queryKey: ["aff-wallet"], queryFn: fetchAffiliates });
  const { data: alerts, isLoading: lb } = useQuery({ queryKey: ["aff-alerts"], queryFn: fetchAlerts });

  const totalBalance = (affs ?? []).reduce((s, a) => s + Number(a.wallet_balance || 0), 0);
  const totalPending = (affs ?? []).reduce((s, a) => s + Number(a.wallet_pending || 0), 0);
  const lifetimeCount = (affs ?? []).filter((a) => a.is_lifetime).length;
  const unreadAlerts = (alerts ?? []).filter((a) => !a.is_read).length;

  const toggleLifetime = useMutation({
    mutationFn: async (v: { id: string; on: boolean }) => {
      const patch: Partial<Affiliate> & { lifetime_granted_at?: string | null } = {
        is_lifetime: v.on,
        lifetime_granted_at: v.on ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("aff_affiliates").update(patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.on ? "Afiliado marcado como vitalício" : "Vitalício removido");
      qc.invalidateQueries({ queryKey: ["aff-wallet"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aff_wallet_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aff-alerts"] }),
  });

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <PageHeader
        title="Carteira de Afiliados"
        description="Saldo, pendências, vitalícios e alertas — tudo em um lugar."
      />

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Wallet} label="Saldo disponível total" value={brl(totalBalance)} />
        <SummaryCard icon={TrendingUp} label="Pendente de liberação" value={brl(totalPending)} />
        <SummaryCard icon={InfinityIcon} label="Afiliados vitalícios" value={String(lifetimeCount)} />
        <SummaryCard icon={Bell} label="Alertas não lidos" value={String(unreadAlerts)} highlight={unreadAlerts > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Wallet className="h-4 w-4" /> Afiliados</h3>
          {la && <Skeleton className="h-72 w-full" />}
          {!la && (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2">Afiliado</th>
                    <th className="text-right px-3 py-2">Saldo</th>
                    <th className="text-right px-3 py-2">Pendente</th>
                    <th className="text-center px-3 py-2">Vitalício</th>
                    <th className="text-center px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(affs ?? []).map((a) => (
                    <tr key={a.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <div className="font-medium">{a.name}</div>
                        {a.email && <div className="text-xs text-muted-foreground">{a.email}</div>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{brl(Number(a.wallet_balance))}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{brl(Number(a.wallet_pending))}</td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          size="sm"
                          variant={a.is_lifetime ? "default" : "outline"}
                          onClick={() => toggleLifetime.mutate({ id: a.id, on: !a.is_lifetime })}
                          disabled={toggleLifetime.isPending}
                        >
                          <InfinityIcon className="h-3 w-3 mr-1" />
                          {a.is_lifetime ? "Vitalício" : "Conceder"}
                        </Button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="outline">{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {(affs ?? []).length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Nenhum afiliado cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /> Alertas recentes</h3>
          {lb && <Skeleton className="h-72 w-full" />}
          {!lb && (alerts ?? []).length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              Sem alertas no momento.
            </div>
          )}
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {(alerts ?? []).map((al) => (
              <div key={al.id} className={`rounded-md border p-3 ${al.is_read ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge className={SEV_STYLE[al.severity] ?? SEV_STYLE.info}>{KIND_LABEL[al.kind] ?? al.kind}</Badge>
                  {!al.is_read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead.mutate(al.id)}>
                      Marcar lido
                    </Button>
                  )}
                </div>
                <div className="font-medium text-sm">{al.title}</div>
                {al.message && <div className="text-xs text-muted-foreground mt-0.5">{al.message}</div>}
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>{new Date(al.created_at).toLocaleString("pt-BR")}</span>
                  {al.amount != null && <span className="font-mono">{brl(Number(al.amount))}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="h-3 w-3" />
        Vitalício = afiliado recebe comissão recorrente enquanto o cliente indicado estiver ativo, sem prazo de expiração.
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, highlight }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean;
}) {
  return (
    <Card className={`p-4 ${highlight ? "border-destructive/40" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </Card>
  );
}
