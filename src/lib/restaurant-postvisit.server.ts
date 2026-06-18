/**
 * Régua de comunicação PÓS-VISITA — restaurante / bar / cervejaria.
 *
 * Regra de produto: a Impulsionando só comunica o cliente em dois momentos:
 *   1) Recibo automático ao fechar a conta (notifyTableBillClosed).
 *   2) Este disparo aqui — 24h–72h após a visita, segmentado por nicho,
 *      com convite para voltar / voucher / entrada no Clube.
 *
 * NÃO confundir com "pedido pronto": aquilo é sinal interno de salão.
 *
 * Idempotente via `restaurant_table_sessions.postvisit_notified_at`.
 *
 * Pode ser chamado pelo cron `/api/public/hooks/restaurant-postvisit`
 * que varre sessões fechadas há N horas, ou manualmente passando session_id.
 */
import { sendRestaurantEmail } from "@/lib/restaurant-notify.server";
import {
  postVisitDelayHours,
  voucherLabelForNiche,
} from "@/lib/postvisit-timing-registry";

// Re-export para retrocompatibilidade com callers/testes existentes.
export { postVisitDelayHours } from "@/lib/postvisit-timing-registry";

function makeVoucherCode(companySlug: string, niche?: string): string {
  const tag = (niche ?? "POS").split("-")[0].toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${companySlug.toUpperCase()}-${tag}-${rand}`;
}

export async function notifyPostVisitThanks(args: {
  session_id: string;
  /** Nicho para escolher copy/voucher; se omitido, usa `companies.niche_slug`. */
  niche?: string;
  /** Força reenvio (ignora dedupe). Usar apenas em replay manual. */
  force?: boolean;
}): Promise<{
  email?: unknown;
  skipped?: string;
  scheduledFor?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: sess } = await supabaseAdmin
    .from("restaurant_table_sessions")
    .select(
      `id, customer_email, customer_name, bill_notified_at, postvisit_notified_at,
       company:company_id ( id, name, trade_name, niche_slug, slug )`,
    )
    .eq("id", args.session_id)
    .maybeSingle();

  if (!sess) return { skipped: "session_not_found" };

  const email = ((sess as any).customer_email ?? "").trim();
  if (!email) return { skipped: "no_customer_email" };

  if (!(sess as any).bill_notified_at) {
    return { skipped: "bill_not_closed_yet" };
  }

  if (!args.force && (sess as any).postvisit_notified_at) {
    return { skipped: "already_notified" };
  }

  // Janela mínima após o fechamento — protege contra disparo na mesma noite.
  const closedAt = new Date((sess as any).bill_notified_at).getTime();
  const niche = args.niche ?? (sess as any).company?.niche_slug ?? undefined;
  const minHours = postVisitDelayHours(niche);
  const earliest = closedAt + minHours * 3600 * 1000;
  if (!args.force && Date.now() < earliest) {
    return { skipped: "too_early", scheduledFor: new Date(earliest).toISOString() };
  }

  const companyName =
    (sess as any).company?.trade_name ?? (sess as any).company?.name ?? "";
  const companySlug = (sess as any).company?.slug ?? "casa";
  const voucherCode = makeVoucherCode(companySlug, niche);

  const emailRes = await sendRestaurantEmail({
    templateName: "restaurant-postvisit-thanks",
    to: email,
    templateData: {
      customerName: (sess as any).customer_name,
      companyName,
      niche,
      voucherCode,
      voucherLabel: niche ? VOUCHER_LABEL[niche] : undefined,
      clubeUrl: "https://impulsionando.com.br/clube",
      ctaUrl: `https://impulsionando.com.br/r/${companySlug}`,
    },
    idempotencyKey: `postvisit:${args.session_id}`,
  });

  // Marca dedupe — coluna opcional; ignora erro se ainda não existir no schema.
  try {
    await supabaseAdmin
      .from("restaurant_table_sessions")
      .update({ postvisit_notified_at: new Date().toISOString() } as any)
      .eq("id", args.session_id);
  } catch {
    /* tabela ainda não tem a coluna — pós-visita já foi enviada via idempotencyKey */
  }

  return { email: emailRes };
}
