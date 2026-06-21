/**
 * /restaurante/salao — Painel ao vivo da fila de pedidos por mesa.
 *
 * Garçom/cozinha veem os pedidos pendentes e em preparo agrupados por mesa.
 * Polling a cada 5s. Botões para avançar status: pendente → em preparo → entregue.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getKitchenBoard, setItemStatus } from "@/lib/restaurant-kitchen.functions";
import { ChefHat, Bell, Check, X, RefreshCw, Clock, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";

export const Route = createFileRoute("/_authenticated/restaurante/salao")({
  component: SalaoPage,
});

type Item = { id: string; description: string; quantity: number; total: number; status: string; updated_at: string };
type TableTicket = {
  session_id: string; table_id: string; table_number: number; table_label: string | null;
  customer_name: string | null; party_size: number; opened_at: string; total: number; items: Item[];
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

function SalaoPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const board = useServerFn(getKitchenBoard);
  const setStatus = useServerFn(setItemStatus);
  const prevPendingRef = useRef<number>(0);
  const [liveOn, setLiveOn] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["kitchen-board"],
    queryFn: () => board(),
    // Fallback de polling reduzido — realtime invalida em tempo real abaixo
    refetchInterval: 30000,
  });

  // Atualização ao vivo: qualquer mudança em sales_order_items ou nas sessões
  // de mesa desta empresa invalida o board imediatamente.
  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`kitchen-live-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_order_items" },
        () => qc.invalidateQueries({ queryKey: ["kitchen-board"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_table_sessions", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["kitchen-board"] }),
      )
      .subscribe((s) => setLiveOn(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(ch); };
  }, [companyId, qc]);

  const tables = (data?.tables ?? []) as TableTicket[];
  const totalPending = tables.reduce(
    (acc, t) => acc + t.items.filter((i) => i.status === "pendente").length, 0,
  );

  // Bell when new pending items arrive
  useEffect(() => {
    if (totalPending > prevPendingRef.current && prevPendingRef.current !== 0) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; g.gain.value = 0.1;
        o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 250);
      } catch {}
      toast.info("Novo pedido na fila!");
    }
    prevPendingRef.current = totalPending;
  }, [totalPending]);

  const mut = useMutation({
    mutationFn: (vars: { item_id: string; status: "em_preparo" | "entregue" | "cancelado" }) =>
      setStatus({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen-board"] }),
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar"),
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="size-8" /> Salão ao Vivo
          </h1>
          <p className="text-muted-foreground mt-1">
            Fila de pedidos por mesa · sincronização em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveOn && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
              <Radio className="size-3 mr-1 animate-pulse" /> Ao vivo
            </Badge>
          )}
          <Badge variant="outline" className="bg-amber-500/15 text-amber-700 text-base px-3 py-1">
            <Bell className="size-4 mr-1" /> {totalPending} pendente{totalPending === 1 ? "" : "s"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
      </div>

      {tables.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum pedido na fila. Quando um cliente fizer um pedido pelo QR Code da mesa, ele aparecerá aqui.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map((t) => (
            <Card key={t.session_id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold">Mesa {t.table_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {t.customer_name ?? "—"} · {t.party_size} pessoa{t.party_size === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="size-3" /> {timeAgo(t.opened_at)}
                  </div>
                  <div className="font-semibold mt-1">
                    R$ {Number(t.total ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {t.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-2 border rounded-md p-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {Number(i.quantity)}× {i.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {i.status === "pendente" ? "Aguardando preparo" : "Em preparo"} · {timeAgo(i.updated_at)}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        i.status === "pendente"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-blue-500/15 text-blue-700"
                      }
                    >
                      {i.status === "pendente" ? "Pendente" : "Em preparo"}
                    </Badge>
                    {i.status === "pendente" ? (
                      <Button
                        size="sm"
                        onClick={() => mut.mutate({ item_id: i.id, status: "em_preparo" })}
                        disabled={mut.isPending}
                      >
                        Iniciar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => mut.mutate({ item_id: i.id, status: "entregue" })}
                        disabled={mut.isPending}
                      >
                        <Check className="size-4 mr-1" /> Entregar
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => mut.mutate({ item_id: i.id, status: "cancelado" })}
                      disabled={mut.isPending}
                      title="Cancelar item"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
