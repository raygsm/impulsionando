import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RIOMED_COMPANY_ID, verifyRiomedWebhook } from "@/lib/riomed-public-auth";

/**
 * Faturas vencidas do RioMed para a régua de cobrança N8N `riomed-05-cobranca-ar`.
 * Retorna bucket (lembrete / firme / escalonar gerência) por dias vencidos.
 */
const BodySchema = z
  .object({
    company_id: z.string().uuid().default(RIOMED_COMPANY_ID),
    min_days_overdue: z.number().int().min(0).max(720).default(1),
    max_days_overdue: z.number().int().min(1).max(720).default(120),
    limit: z.number().int().min(1).max(500).default(100),
  })
  .default({});

function bucket(days: number): "reminder" | "firm" | "escalate" {
  if (days <= 3) return "reminder";
  if (days <= 15) return "firm";
  return "escalate";
}

export const Route = createFileRoute("/api/public/riomed/ar/overdue")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!verifyRiomedWebhook(request, raw)) return new Response("Unauthorized", { status: 401 });

        let parsed;
        try {
          parsed = BodySchema.parse(raw ? JSON.parse(raw) : {});
        } catch (e) {
          return Response.json({ ok: false, error: "invalid_body", detail: (e as Error).message }, { status: 422 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date();
        const minDate = new Date(today.getTime() - parsed.max_days_overdue * 86400_000).toISOString().slice(0, 10);
        const maxDate = new Date(today.getTime() - parsed.min_days_overdue * 86400_000).toISOString().slice(0, 10);

        const { data, error } = await supabaseAdmin
          .from("riomed_ar_invoices")
          .select("id, number, customer_id, hospital_id, amount, paid_amount, currency, due_date, status, mp_init_point, fiscal_number")
          .eq("company_id", parsed.company_id)
          .in("status", ["open", "pending", "partial", "overdue"])
          .gte("due_date", minDate)
          .lte("due_date", maxDate)
          .order("due_date", { ascending: true })
          .limit(parsed.limit);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        const invoices = (data ?? []).map((inv) => {
          const due = new Date(inv.due_date as string);
          const daysOverdue = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400_000));
          return { ...inv, days_overdue: daysOverdue, bucket: bucket(daysOverdue) };
        });
        return Response.json({ ok: true, count: invoices.length, invoices });
      },
      GET: async () => Response.json({ ok: true, usage: "POST { min_days_overdue, max_days_overdue, limit } com x-impulsionando-signature" }),
    },
  },
});
