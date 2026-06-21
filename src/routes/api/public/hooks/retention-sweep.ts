import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Retention sweep diário — varre tenants ativos, identifica os em risco
 * crítico (>=2 sinais negativos) e enfileira um outreach do CS Impulsionando
 * no message_outbox (email + whatsapp). Idempotente por dia via
 * reference_id = `retention-<companyId>-<YYYY-MM-DD>`.
 *
 * Sinais críticos:
 *   - fatura vencida em billing_invoices
 *   - sem mensagem enviada nos últimos 30 dias
 *   - sem módulo ativo
 *   - última baixa > 60 dias
 *
 * Nenhum SaaS BR concorrente dispara playbook de retenção automático
 * cross-canal baseado em score multi-sinal.
 */
export const Route = createFileRoute("/api/public/hooks/retention-sweep")({
  server: {
    handlers: {
      POST: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

        const [companies, contracts, overdue, msgs, modules] = await Promise.all([
          supabaseAdmin.from("companies").select("id, name, contact_email, contact_phone").eq("is_active", true).limit(1000),
          supabaseAdmin.from("billing_contracts").select("id, company_id, last_paid_at"),
          supabaseAdmin.from("billing_invoices").select("contract_id").in("status", ["overdue", "open"]),
          supabaseAdmin.from("message_outbox").select("company_id").eq("status", "sent").gte("created_at", since30).limit(20000),
          supabaseAdmin.from("company_modules").select("company_id").eq("is_enabled", true),
        ]);

        const contractByCompany = new Map<string, { last_paid_at: string | null; ids: Set<string> }>();
        for (const c of (contracts.data as any[]) ?? []) {
          const e = contractByCompany.get(c.company_id) ?? { last_paid_at: null, ids: new Set<string>() };
          if (c.last_paid_at && (!e.last_paid_at || c.last_paid_at > e.last_paid_at)) e.last_paid_at = c.last_paid_at;
          e.ids.add(c.id);
          contractByCompany.set(c.company_id, e);
        }
        const overdueIds = new Set<string>((overdue.data as any[] ?? []).map((o) => o.contract_id));
        const msgByCompany = new Map<string, number>();
        for (const m of (msgs.data as any[]) ?? []) msgByCompany.set(m.company_id, (msgByCompany.get(m.company_id) ?? 0) + 1);
        const modByCompany = new Map<string, number>();
        for (const m of (modules.data as any[]) ?? []) modByCompany.set(m.company_id, (modByCompany.get(m.company_id) ?? 0) + 1);

        const now = Date.now();
        const queued: Array<{ company_id: string; ref: string }> = [];
        const rows: any[] = [];

        for (const co of (companies.data as any[]) ?? []) {
          const ct = contractByCompany.get(co.id);
          const hasOverdue = !!ct && Array.from(ct.ids).some((id) => overdueIds.has(id));
          const lowMsgs = (msgByCompany.get(co.id) ?? 0) === 0;
          const noModules = (modByCompany.get(co.id) ?? 0) === 0;
          const lastPaidDays = ct?.last_paid_at ? (now - Date.parse(ct.last_paid_at)) / 86400000 : 999;
          const stalePay = lastPaidDays > 60;

          const signals = [hasOverdue, lowMsgs, noModules, stalePay].filter(Boolean).length;
          if (signals < 2) continue;

          const ref = `retention-${co.id}-${today}`;
          const reasons: string[] = [];
          if (hasOverdue) reasons.push("fatura em aberto");
          if (lowMsgs) reasons.push("baixo engajamento");
          if (noModules) reasons.push("nenhum módulo ativo");
          if (stalePay) reasons.push("inativo há mais de 60 dias");

          const subject = "Estamos aqui para ajudar — vamos destravar resultados?";
          const message = `Olá ${co.name}, percebemos sinais de que podemos melhorar sua experiência (${reasons.join(", ")}). Um especialista Impulsionando entrará em contato em 24h. Se preferir, responda essa mensagem.`;

          if (co.contact_email) {
            rows.push({
              company_id: co.id, channel: "email",
              recipient_email: co.contact_email,
              event_code: "retention.outreach",
              payload: { subject, message, reasons, company_name: co.name },
              status: "pending", scheduled_at: new Date().toISOString(),
              reference_type: "retention_sweep", reference_id: ref,
            });
          }
          if (co.contact_phone) {
            rows.push({
              company_id: co.id, channel: "whatsapp",
              recipient_phone: co.contact_phone,
              event_code: "retention.outreach",
              payload: { subject, message, reasons, company_name: co.name },
              status: "pending", scheduled_at: new Date().toISOString(),
              reference_type: "retention_sweep", reference_id: ref,
            });
          }
          queued.push({ company_id: co.id, ref });
        }

        // Idempotência: ignora linhas com mesmo (reference_type, reference_id, channel) já existentes hoje
        const refs = queued.map((q) => q.ref);
        let existing = new Set<string>();
        if (refs.length) {
          const { data: ex } = await supabaseAdmin
            .from("message_outbox")
            .select("reference_id, channel")
            .eq("reference_type", "retention_sweep")
            .in("reference_id", refs);
          existing = new Set((ex as any[] ?? []).map((r) => `${r.reference_id}:${r.channel}`));
        }
        const fresh = rows.filter((r) => !existing.has(`${r.reference_id}:${r.channel}`));

        if (fresh.length) {
          const { error } = await supabaseAdmin.from("message_outbox").insert(fresh);
          if (error) {
            return new Response(JSON.stringify({ ok: false, error: error.message }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }
        }

        return new Response(
          JSON.stringify({ ok: true, tenants_flagged: queued.length, messages_queued: fresh.length, skipped: rows.length - fresh.length }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
