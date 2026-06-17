/**
 * Painel do Salão — fila de pedidos por mesa para o garçom/cozinha.
 * - getKitchenBoard: snapshot da fila ao vivo (RPC restaurant_kitchen_board).
 * - setItemStatus: marca item como em_preparo / entregue / cancelado.
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

    // Notifica o cliente quando o item fica pronto (entregue).
    if (data.status === "entregue") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("sales_order_items")
          .select(
            `description, quantity, order_id, company_id,
             order:order_id ( id ),
             company:company_id ( name, trade_name )`,
          )
          .eq("id", data.item_id)
          .maybeSingle();
        if (row) {
          const { data: sess } = await supabaseAdmin
            .from("restaurant_table_sessions")
            .select("customer_email, customer_name, table:table_id ( number )")
            .eq("sales_order_id", (row as any).order_id)
            .maybeSingle();
          const email = (sess as any)?.customer_email as string | null;
          if (email) {
            const { sendRestaurantEmail } = await import("@/lib/restaurant-notify.server");
            await sendRestaurantEmail({
              templateName: "restaurant-order-ready",
              to: email,
              templateData: {
                customerName: (sess as any)?.customer_name ?? undefined,
                itemDescription: `${Number((row as any).quantity)}× ${(row as any).description}`,
                tableNumber: (sess as any)?.table?.number,
                companyName: (row as any).company?.trade_name ?? (row as any).company?.name,
              },
              idempotencyKey: `order-ready:${data.item_id}`,
            });
          }
        }
      } catch (e) {
        console.warn("notify order-ready failed", e);
      }
    }
    return { ok: true };
  });
