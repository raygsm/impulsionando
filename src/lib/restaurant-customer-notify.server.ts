/**
 * Notificações ao cliente do restaurante por múltiplos canais
 * (e-mail + WhatsApp + SMS), com dedupe persistido por canal.
 *
 * - `notifyItemReady(item_id)` → notifica que aquele prato ficou pronto.
 * - `notifyTableBillClosed(session_id)` → recibo com itens e total.
 *
 * Dedupe:
 *   - E-mail/WhatsApp: usam `notified_ready_at` / `bill_notified_at`.
 *   - SMS: usam colunas dedicadas `notified_ready_sms_at` /
 *     `bill_notified_sms_at`, para que cada canal tenha lock próprio
 *     (envio independente, sem duplicação).
 */
import { sendRestaurantEmail } from "@/lib/restaurant-notify.server";
import { sendWhatsappText } from "@/lib/whatsapp-notify.server";
import { sendSms } from "@/lib/sms-notify.server";

const fmtBRL = (cents: number) =>
  (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export async function notifyItemReady(itemId: string): Promise<{
  email?: unknown;
  whatsapp?: unknown;
  sms?: unknown;
  skipped?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("sales_order_items")
    .select(
      `id, description, quantity, order_id, company_id, notified_ready_at, notified_ready_sms_at,
       company:company_id ( name, trade_name )`,
    )
    .eq("id", itemId)
    .maybeSingle();
  if (!row) return { skipped: "item_not_found" };

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
  const phone = (sess as any)?.customer_phone as string | undefined;
  const email = ((sess as any)?.customer_email ?? "").trim();

  let emailRes: unknown;
  let whatsappRes: unknown;
  let smsRes: unknown;

  // ---- Lock e disparo: email + whatsapp (compartilham `notified_ready_at`)
  if (!(row as any).notified_ready_at) {
    const { error: updErr } = await supabaseAdmin
      .from("sales_order_items")
      .update({ notified_ready_at: new Date().toISOString() })
      .eq("id", itemId)
      .is("notified_ready_at", null);
    if (!updErr) {
      if (email) {
        emailRes = await sendRestaurantEmail({
          templateName: "restaurant-order-ready",
          to: email,
          templateData: { customerName, itemDescription: description, tableNumber, companyName },
          idempotencyKey: `order-ready:${itemId}`,
        });
      }
      if (phone) {
        const lines = [
          `🍽️ ${customerName ? customerName + ", o" : "Seu"} pedido ficou pronto!`,
          tableNumber ? `Mesa ${tableNumber}` : null,
          description,
          companyName ? `— ${companyName}` : null,
        ].filter(Boolean);
        whatsappRes = await sendWhatsappText({ to: phone, message: lines.join("\n") });
      }
    }
  }

  // ---- Lock e disparo: SMS (canal independente)
  if (phone && !(row as any).notified_ready_sms_at) {
    const { error: smsLockErr } = await supabaseAdmin
      .from("sales_order_items")
      .update({ notified_ready_sms_at: new Date().toISOString() })
      .eq("id", itemId)
      .is("notified_ready_sms_at", null);
    if (!smsLockErr) {
      const body = [
        `Pedido pronto${tableNumber ? ` (Mesa ${tableNumber})` : ""}: ${description}`,
        companyName ? `- ${companyName}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      smsRes = await sendSms({ to: phone, body });
    }
  }

  return { email: emailRes, whatsapp: whatsappRes, sms: smsRes };
}

export async function notifyTableBillClosed(sessionId: string): Promise<{
  email?: unknown;
  whatsapp?: unknown;
  sms?: unknown;
  skipped?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: sess } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .select(
      `id, customer_email, customer_phone, customer_name, total, sales_order_id,
       bill_notified_at, bill_notified_sms_at,
       table:table_id ( number ),
       company:company_id ( name, trade_name )`,
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (!sess) return { skipped: "session_not_found" };

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
  const email = ((sess as any).customer_email ?? "").trim();
  const phone = (sess as any).customer_phone as string | undefined;

  let emailRes: unknown;
  let whatsappRes: unknown;
  let smsRes: unknown;

  // E-mail + WhatsApp (mesmo lock)
  if (!(sess as any).bill_notified_at) {
    const { error: updErr } = await supabaseAdmin
      .from("restaurant_table_sessions")
      .update({ bill_notified_at: new Date().toISOString() })
      .eq("id", sessionId)
      .is("bill_notified_at", null);
    if (!updErr) {
      if (email) {
        emailRes = await sendRestaurantEmail({
          templateName: "restaurant-bill-closed",
          to: email,
          templateData: { customerName, tableNumber, total, items: billItems, companyName },
          idempotencyKey: `bill-closed:${sessionId}`,
        });
      }
      if (phone) {
        const lines = [
          `✨ ${customerName ? customerName + ", sua" : "Sua"} conta foi fechada!`,
          tableNumber ? `Mesa ${tableNumber}` : null,
          `Total: ${fmtBRL(Math.round(total * 100))}`,
          companyName ? `Obrigado pela visita — ${companyName}` : "Obrigado pela visita!",
        ].filter(Boolean);
        whatsappRes = await sendWhatsappText({ to: phone, message: lines.join("\n") });
      }
    }
  }

  // SMS (canal independente)
  if (phone && !(sess as any).bill_notified_sms_at) {
    const { error: smsLockErr } = await supabaseAdmin
      .from("restaurant_table_sessions")
      .update({ bill_notified_sms_at: new Date().toISOString() })
      .eq("id", sessionId)
      .is("bill_notified_sms_at", null);
    if (!smsLockErr) {
      const body = [
        `Conta fechada${tableNumber ? ` (Mesa ${tableNumber})` : ""}.`,
        `Total: ${fmtBRL(Math.round(total * 100))}.`,
        companyName ? `Obrigado - ${companyName}` : "Obrigado!",
      ].join(" ");
      smsRes = await sendSms({ to: phone, body });
    }
  }

  return { email: emailRes, whatsapp: whatsappRes, sms: smsRes };
}

/**
 * Notifica cliente que tentativa de pagamento PIX falhou/expirou,
 * com link para o /mesa/$token para tentar novamente.
 * (Sem dedupe: cada falha gera uma notificação curta.)
 */
export async function notifyTablePaymentFailed(args: {
  session_id: string;
  reason: "failed" | "expired";
}): Promise<{ whatsapp?: unknown; sms?: unknown; skipped?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: sess } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .select(
      `id, customer_phone, customer_name,
       table:table_id ( number, qr_token ),
       company:company_id ( name, trade_name )`,
    )
    .eq("id", args.session_id)
    .maybeSingle();
  if (!sess) return { skipped: "session_not_found" };
  const phone = (sess as any).customer_phone as string | undefined;
  if (!phone) return { skipped: "no_phone" };

  const tableNumber = (sess as any)?.table?.number;
  const token = (sess as any)?.table?.qr_token;
  const companyName =
    (sess as any).company?.trade_name ?? (sess as any).company?.name ?? "";
  const reasonText = args.reason === "expired" ? "expirou" : "falhou";
  const link = token ? `${getBaseUrl()}/mesa/${token}` : "";
  const msg = `Seu pagamento ${reasonText}${tableNumber ? ` (Mesa ${tableNumber})` : ""}. ${
    link ? `Tente novamente: ${link}` : "Volte ao QR e tente novamente."
  } ${companyName ? `- ${companyName}` : ""}`.trim();

  const whatsappRes = await sendWhatsappText({ to: phone, message: msg });
  const smsRes = await sendSms({ to: phone, body: msg });
  return { whatsapp: whatsappRes, sms: smsRes };
}

function getBaseUrl(): string {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.PUBLIC_SITE_URL ||
    "https://impulsionando.lovable.app"
  );
}
