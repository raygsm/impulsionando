/**
 * Notificações ao cliente do restaurante (e-mail + WhatsApp), com
 * dedupe persistido em colunas da própria sessão/item.
 *
 * - `notifyItemReady(item_id)` → notifica que aquele prato ficou pronto.
 * - `notifyTableBillClosed(session_id)` → recibo com itens e total.
 *
 * Idempotente: marca `sales_order_items.notified_ready_at` /
 * `restaurant_table_sessions.bill_notified_at` no primeiro disparo. Se
 * já estiver preenchido, vira no-op (não duplica e-mail/WhatsApp).
 */
import { sendRestaurantEmail } from "@/lib/restaurant-notify.server";
import { sendWhatsappText } from "@/lib/whatsapp-notify.server";

const fmtBRL = (cents: number) =>
  (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export async function notifyItemReady(itemId: string): Promise<{
  email?: unknown;
  whatsapp?: unknown;
  skipped?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("sales_order_items")
    .select(
      `id, description, quantity, order_id, company_id, notified_ready_at,
       company:company_id ( name, trade_name )`,
    )
    .eq("id", itemId)
    .maybeSingle();
  if (!row) return { skipped: "item_not_found" };
  if ((row as any).notified_ready_at) return { skipped: "already_notified" };

  const { data: sess } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .select("customer_email, customer_phone, customer_name, table:table_id ( number )")
    .eq("sales_order_id", (row as any).order_id)
    .maybeSingle();

  const customerName = (sess as any)?.customer_name as string | undefined;
  const tableNumber = (sess as any)?.table?.number as number | undefined;
  const companyName =
    (row as any).company?.trade_name ?? (row as any).company?.name ?? undefined;
  const description = `${Number((row as any).quantity)}× ${(row as any).description}`;

  // Marca primeiro para evitar corrida em re-disparos paralelos.
  const { error: updErr } = await supabaseAdmin
    .from("sales_order_items")
    .update({ notified_ready_at: new Date().toISOString() })
    .eq("id", itemId)
    .is("notified_ready_at", null);
  if (updErr) return { skipped: "lock_failed" };

  let emailRes: unknown;
  let whatsappRes: unknown;

  const email = ((sess as any)?.customer_email ?? "").trim();
  if (email) {
    emailRes = await sendRestaurantEmail({
      templateName: "restaurant-order-ready",
      to: email,
      templateData: { customerName, itemDescription: description, tableNumber, companyName },
      idempotencyKey: `order-ready:${itemId}`,
    });
  }

  const phone = (sess as any)?.customer_phone as string | undefined;
  if (phone) {
    const lines = [
      `🍽️ ${customerName ? customerName + ", o" : "Seu"} pedido ficou pronto!`,
      tableNumber ? `Mesa ${tableNumber}` : null,
      description,
      companyName ? `— ${companyName}` : null,
    ].filter(Boolean);
    whatsappRes = await sendWhatsappText({ to: phone, message: lines.join("\n") });
  }

  return { email: emailRes, whatsapp: whatsappRes };
}

export async function notifyTableBillClosed(sessionId: string): Promise<{
  email?: unknown;
  whatsapp?: unknown;
  skipped?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: sess } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .select(
      `id, customer_email, customer_phone, customer_name, total, sales_order_id,
       bill_notified_at,
       table:table_id ( number ),
       company:company_id ( name, trade_name )`,
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (!sess) return { skipped: "session_not_found" };
  if ((sess as any).bill_notified_at) return { skipped: "already_notified" };

  // Lock first (idempotência forte mesmo com múltiplos webhooks paralelos)
  const { error: updErr } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .update({ bill_notified_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("bill_notified_at", null);
  if (updErr) return { skipped: "lock_failed" };

  const { data: items } = await supabaseAdmin
    .from("sales_order_items")
    .select("description, quantity, total, kitchen_status")
    .eq("order_id", (sess as any).sales_order_id);

  const billItems = (items ?? [])
    .filter((i: any) => i.kitchen_status !== "cancelado")
    .map((i: any) => ({
      description: i.description,
      quantity: Number(i.quantity),
      total: Number(i.total),
    }));

  const total = Number((sess as any).total ?? 0);
  const tableNumber = (sess as any)?.table?.number as number | undefined;
  const customerName = (sess as any)?.customer_name as string | undefined;
  const companyName =
    (sess as any).company?.trade_name ?? (sess as any).company?.name ?? undefined;

  let emailRes: unknown;
  let whatsappRes: unknown;

  const email = ((sess as any).customer_email ?? "").trim();
  if (email) {
    emailRes = await sendRestaurantEmail({
      templateName: "restaurant-bill-closed",
      to: email,
      templateData: {
        customerName,
        tableNumber,
        total,
        items: billItems,
        companyName,
      },
      idempotencyKey: `bill-closed:${sessionId}`,
    });
  }

  const phone = (sess as any).customer_phone as string | undefined;
  if (phone) {
    const lines = [
      `✨ ${customerName ? customerName + ", sua" : "Sua"} conta foi fechada!`,
      tableNumber ? `Mesa ${tableNumber}` : null,
      `Total: ${fmtBRL(Math.round(total * 100))}`,
      companyName ? `Obrigado pela visita — ${companyName}` : "Obrigado pela visita!",
    ].filter(Boolean);
    whatsappRes = await sendWhatsappText({ to: phone, message: lines.join("\n") });
  }

  return { email: emailRes, whatsapp: whatsappRes };
}
