import { useEffect, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Disponibilidade ao vivo: assina UPDATE/INSERT/DELETE em uma tabela do Lovable Cloud
 * filtrado por uma coluna (geralmente company_id ou event_id) e mantém o cache do
 * React Query sincronizado, sem precisar refetch. Pensado para PDV, eventos
 * (ingressos restantes), agenda (slots), restaurante (mesas) e marketplace.
 *
 * Retorna `liveOn` para mostrar um indicador "ao vivo" no UI.
 */
export function useRealtimeAvailability<T extends { id: string | number }>(opts: {
  table: string;
  filter: { column: string; value: string | number | null | undefined };
  queryKey: QueryKey;
  enabled?: boolean;
  /** Reduzir a linha do payload para apenas o necessário (default: passa direto) */
  pick?: (row: any) => Partial<T>;
}) {
  const { table, filter, queryKey, enabled = true, pick } = opts;
  const qc = useQueryClient();
  const [liveOn, setLiveOn] = useState(false);

  useEffect(() => {
    if (!enabled || filter.value == null) return;
    const channelName = `live-${table}-${filter.column}-${filter.value}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `${filter.column}=eq.${filter.value}` },
        (payload) => {
          qc.setQueryData(queryKey, (prev: any) => {
            if (!Array.isArray(prev)) return prev;
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as any)?.id;
              return prev.filter((r: any) => r.id !== oldId);
            }
            const row = (pick ? pick(payload.new) : payload.new) as any;
            if (!row?.id) return prev;
            const idx = prev.findIndex((r: any) => r.id === row.id);
            if (idx === -1) return [...prev, row];
            const next = prev.slice();
            next[idx] = { ...next[idx], ...row };
            return next;
          });
        },
      )
      .subscribe((status) => setLiveOn(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [table, filter.column, filter.value, queryKey, enabled, qc, pick]);

  return { liveOn };
}
