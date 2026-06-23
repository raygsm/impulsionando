/**
 * /riomed/minhas-garantias — Histórico permanente de garantias do cliente.
 *
 * Mostra todos os produtos comprados, com prazo de garantia em contagem
 * regressiva sincronizada (atualiza a cada segundo). Quando vence, exibe
 * "Garantia finalizada em: DD/MM/AAAA".
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, Package, History } from "lucide-react";
import { listMyWarranties } from "@/lib/riomed-warranties.functions";

export const Route = createFileRoute("/_authenticated/riomed/minhas-garantias")({
  head: () => ({
    meta: [{ title: "Minhas garantias — Rio Med" }],
  }),
  component: MinhasGarantiasPage,
});

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("pt-BR");
}

function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function countdown(endsAt: string): { d: number; h: number; m: number; s: number; finished: boolean } {
  const end = new Date(endsAt + "T23:59:59").getTime();
  const diff = end - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, finished: true };
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
    finished: false,
  };
}

function MinhasGarantiasPage() {
  const fetcher = useServerFn(listMyWarranties);
  const q = useQuery({
    queryKey: ["riomed-my-warranties"],
    queryFn: () => fetcher(),
    staleTime: 60_000,
  });
  useTick(1000); // re-render por segundo para o contador

  const items = q.data?.warranties ?? [];
  const active = items.filter((i: any) => !i.is_finished);
  const finished = items.filter((i: any) => i.is_finished);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Minhas garantias</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Histórico permanente das suas compras. O prazo de garantia é informado pela
          logística no momento da entrega e roda em contagem regressiva sincronizada.
        </p>
      </header>

      {q.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
      ) : q.error ? (
        <Card className="p-6 text-sm text-destructive">Não foi possível carregar: {(q.error as any).message}</Card>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <Package className="w-10 h-10 mx-auto text-muted-foreground" />
          <h2 className="font-semibold">Sem compras registradas ainda</h2>
          <p className="text-sm text-muted-foreground">
            Quando a logística entregar um produto seu, ele aparece aqui com o prazo de garantia rodando.
          </p>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Em garantia ({active.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {active.map((w: any) => <WarrantyCard key={w.id} w={w} />)}
              </div>
            </section>
          )}
          {finished.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" /> Garantia finalizada ({finished.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {finished.map((w: any) => <WarrantyCard key={w.id} w={w} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function WarrantyCard({ w }: { w: any }) {
  const cd = countdown(w.ends_at);
  const tone = cd.finished
    ? "from-zinc-500/10 to-zinc-500/5 border-zinc-300"
    : cd.d < 30
      ? "from-amber-500/10 to-amber-500/5 border-amber-300"
      : "from-emerald-500/10 to-emerald-500/5 border-emerald-300";
  return (
    <Card className={`p-5 bg-gradient-to-br ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{w.product_name || "Produto"}</div>
          <div className="text-xs text-muted-foreground">
            {w.product_sku && <>SKU {w.product_sku} · </>}
            {w.serial_number ? <>Série {w.serial_number}</> : <>Sem número de série</>}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Remessa <span className="font-mono">{w.shipment_code ?? "—"}</span> · Entregue em {fmtDate(w.delivered_at)}
          </div>
        </div>
        {cd.finished
          ? <Badge variant="outline" className="border-zinc-400 text-zinc-700"><ShieldOff className="w-3 h-3 mr-1" /> Finalizada</Badge>
          : <Badge className="bg-emerald-600 hover:bg-emerald-700"><ShieldCheck className="w-3 h-3 mr-1" /> Ativa</Badge>}
      </div>

      <div className="mt-4 border-t pt-4">
        {cd.finished ? (
          <div className="text-sm">
            <div className="text-muted-foreground">Garantia finalizada em:</div>
            <div className="font-semibold text-lg">{fmtDate(w.ends_at)}</div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Garantia termina em {fmtDate(w.ends_at)}</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <TimeBox v={cd.d} l="dias" />
              <TimeBox v={cd.h} l="horas" />
              <TimeBox v={cd.m} l="min" />
              <TimeBox v={cd.s} l="seg" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function TimeBox({ v, l }: { v: number; l: string }) {
  return (
    <div className="rounded-lg bg-background/80 border p-2">
      <div className="text-xl font-bold tabular-nums">{String(v).padStart(2, "0")}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
    </div>
  );
}
