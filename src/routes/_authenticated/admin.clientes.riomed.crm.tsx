import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getRiomedCommercialOverview,
  listRiomedQuotes,
  confirmRiomedQuote,
  updateRiomedQuoteStatus,
} from "@/lib/riomed-commercial.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, Loader2, CheckCircle2, XCircle, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/crm")({
  head: () => ({ meta: [{ title: "Rio Med · CRM Comercial" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='crm' title='CRM RioMed'><Page /></TenantModuleShell>),
});

const STAGES = [
  { key: "draft", label: "Rascunho" },
  { key: "sent", label: "Enviada" },
  { key: "negotiating", label: "Negociando" },
  { key: "won", label: "Ganha" },
  { key: "lost", label: "Perdida" },
];

function fmt(v: number, c = "BOB") {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: c }).format(v || 0);
}

function Page() {
  const overviewFn = useServerFn(getRiomedCommercialOverview);
  const listFn = useServerFn(listRiomedQuotes);
  const confirmFn = useServerFn(confirmRiomedQuote);
  const updateFn = useServerFn(updateRiomedQuoteStatus);

  const overview = useQuery({ queryKey: ["riomed-crm-overview"], queryFn: () => overviewFn() });
  const quotes = useQuery({ queryKey: ["riomed-quotes"], queryFn: () => listFn({ data: { limit: 100 } }) });
  const [busy, setBusy] = useState<string | null>(null);

  async function act(quoteId: string, action: "confirm" | "send" | "lost" | "cancelled") {
    setBusy(quoteId);
    try {
      if (action === "confirm") {
        const r = await confirmFn({ data: { quoteId } });
        toast.success(`Ordem criada: ${r.orderId.slice(0, 8)}…`);
      } else {
        const map: any = { send: "sent", lost: "lost", cancelled: "cancelled" };
        await updateFn({ data: { quoteId, status: map[action] } });
        toast.success("Status atualizado");
      }
      overview.refetch(); quotes.refetch();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }

  const o = overview.data;
  const all = quotes.data ?? [];
  const byStage = (k: string) => all.filter((q: any) => q.status === k);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> CRM Comercial — Rio Med
        </h1>
        <p className="text-sm text-muted-foreground">
          Cotações, pipeline e conversão em pedido com baixa automática de estoque.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardHeader><CardTitle className="text-sm">Abertas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{o?.openCount ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{o ? fmt(o.openValue) : ""}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Ganhas (30d)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{o?.wonCount ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{o ? fmt(o.wonValue) : ""}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Perdidas (30d)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{o?.lostCount ?? "—"}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Win rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{o ? `${(o.winRate * 100).toFixed(0)}%` : "—"}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Minhas vendas (30d)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{o ? fmt(o.myWonValue) : "—"}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {STAGES.map(s => {
          const col = byStage(s.key);
          const total = col.reduce((acc: number, q: any) => acc + Number(q.total || 0), 0);
          return (
            <Card key={s.key} className="min-h-[300px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  {s.label} <Badge variant="secondary">{col.length}</Badge>
                </CardTitle>
                <div className="text-xs text-muted-foreground">{fmt(total)}</div>
              </CardHeader>
              <CardContent className="space-y-2">
                {col.map((q: any) => (
                  <div key={q.id} className="border rounded p-2 text-xs space-y-1">
                    <div className="font-mono font-semibold">{q.code}</div>
                    <div className="text-muted-foreground">{fmt(Number(q.total), q.currency)}</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">{q.channel}</Badge>
                    </div>
                    {q.status === "draft" && (
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs"
                        disabled={busy === q.id} onClick={() => act(q.id, "send")}>
                        {busy === q.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" />Enviar</>}
                      </Button>
                    )}
                    {["sent", "negotiating"].includes(q.status) && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="flex-1 h-7 text-xs"
                          disabled={busy === q.id} onClick={() => act(q.id, "confirm")}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />Ganhar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          disabled={busy === q.id} onClick={() => act(q.id, "lost")}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {col.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">vazio</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
