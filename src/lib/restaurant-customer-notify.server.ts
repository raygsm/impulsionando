/**
 * Notificações relacionadas a mesa do restaurante.
 *
 * REGRA DE PRODUTO (não mudar sem revisar `demo.beer-house.tsx` cap. 03 e 07):
 *   A Impulsionando NÃO substitui o garçom durante a operação.
 *   - "Pedido pronto" NÃO dispara comunicação ao cliente (e-mail/WhatsApp/SMS).
 *     Quem leva o prato à mesa é o garçom. O sistema apenas registra um
 *     SINAL INTERNO para o salão (auditoria + painel), sem canal externo.
 *   - Comunicação com o cliente acontece em DOIS momentos válidos:
 *       (a) Recibo automático no fechamento da conta (notifyTableBillClosed).
 *       (b) Régua pós-visita (notifyPostVisitThanks) 24h–72h depois,
 *           com timing/copy por nicho — convite para voltar, voucher,
 *           entrada no Clube Impulsionando.
 *
 * Qualquer novo canal "ao cliente durante a refeição" deve ser rejeitado.
 */
import { sendRestaurantEmail } from "@/lib/restaurant-notify.server";
import { sendWhatsappText } from "@/lib/whatsapp-notify.server";
import { sendSms } from "@/lib/sms-notify.server";

const fmtBRL = (cents: number) =>
  (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

/**
 * SINAL INTERNO de "item pronto / entregue".
 *
 * NÃO envia e-mail / WhatsApp / SMS ao cliente.
 * Apenas marca `notified_ready_at` (lock idempotente) e devolve um payload
 * com a info do item — usado por painéis internos do salão e por logs de
 * auditoria. Mantemos a função exportada com o mesmo nome para preservar
 * compatibilidade com chamadores existentes (ver restaurant-kitchen.functions.ts).
 */
export async function notifyItemReady(itemId: string): Promise<{
  internal: true;
  itemId: string;
  description?: string;
  tableNumber?: number;
  customerName?: string;
  companyName?: string;
  skipped?: string;
  /** Sempre `undefined` por desenho — nada é enviado ao cliente neste evento. */
  email?: undefined;
  whatsapp?: undefined;
  sms?: undefined;
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
  if (!row) return { internal: true, itemId, skipped: "item_not_found" };

  const { data: sess } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .select("customer_name, table:table_id ( number )")
    .eq("sales_order_id", (row as any).order_id)
    .maybeSingle();

  // Lock idempotente — mesmo sem disparar canais, evita reprocessar.
  if (!(row as any).notified_ready_at) {
    await supabaseAdmin
      .from("sales_order_items")
      .update({ notified_ready_at: new Date().toISOString() })
      .eq("id", itemId)
      .is("notified_ready_at", null);
  }

  return {
    internal: true,
    itemId,
    description: `${Number((row as any).quantity)}× ${(row as any).description}`,
    tableNumber: (sess as any)?.table?.number as number | undefined,
    customerName: (sess as any)?.customer_name as string | undefined,
    companyName:
      (row as any).company?.trade_name ?? (row as any).company?.name ?? undefined,
  };
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
