/**
 * Painel do Salão — fila de pedidos por mesa para o garçom/cozinha.
 * - getKitchenBoard: snapshot da fila ao vivo (RPC restaurant_kitchen_board).
 * - setItemStatus: marca item como em_preparo / entregue / cancelado.
 *
 * IMPORTANTE: ao marcar "entregue", a Impulsionando NÃO envia mensagem ao
 * cliente. Apenas registra um SINAL INTERNO (lock idempotente em
 * sales_order_items.notified_ready_at + retorno para o painel/log).
 * Comunicação com o cliente acontece só em (a) recibo no fechamento e
 * (b) régua pós-visita 24h depois. Ver `restaurant-customer-notify.server.ts`.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getKitchenBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("restaurant_kitchen_board");
    if (error) throw new Error(error.message);
    return (data as { tables: any[] }) ?? { tables: [] };
  });

const StatusInput = z.object({
  item_id: z.string().uuid(),
  status: z.enum(["pendente", "em_preparo", "entregue", "cancelado"]),
});

export const setItemStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("restaurant_set_item_status", {
      _item_id: data.item_id,
      _status: data.status,
    });
    if (error) throw new Error(error.message);
    const r = res as { ok: boolean; error?: string };
    if (!r?.ok) throw new Error(r?.error ?? "fail");

    // Sinal INTERNO de "item pronto": lock idempotente e payload para o painel.
    // Nenhum canal (e-mail / WhatsApp / SMS) é disparado ao cliente.
    let internal: unknown = undefined;
    if (data.status === "entregue") {
      try {
        const { notifyItemReady } = await import(
          "@/lib/restaurant-customer-notify.server"
        );
        internal = await notifyItemReady(data.item_id);
      } catch (e) {
        console.warn("internal salão signal failed", e);
      }
    }
    return { ok: true, internal };
  });
