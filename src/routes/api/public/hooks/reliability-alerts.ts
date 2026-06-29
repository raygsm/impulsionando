import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Reliability Alerts cron hook.
 *
 * Recomputes per-tenant reliability score over the last 7 days (N8N 45%,
 * webhooks 45%, open incidents 10%). For each active tenant:
 *  - score < 70 and no open alert → open alert + enqueue in-app/email outbox to staff.
 *  - score >= 80 and open alert exists → resolve alert + enqueue recovery in-app outbox.
 *
 * Called every 30min by pg_cron (job `reliability_alerts_tick`).
 */

const REOPEN_THRESHOLD = 70;
const RESOLVE_THRESHOLD = 80;

type RowScore = {
  company_id: string;
  company_name: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  n8n_failed: number;
  webhook_failed: number;
  open_incidents: number;
};

function gradeFor(score: number): RowScore["grade"] {
  if (score >= 95) return "A";
  if (score >= 85) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

async function computeScores(): Promise<RowScore[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [coRes, n8nRes, whRes, incRes] = await Promise.all([
    supabaseAdmin
      .from("companies")
      .select("id,name,public_slug,is_active,status")
      .eq("is_active", true)
      .neq("status", "archived"),
    supabaseAdmin
      .from("n8n_workflow_runs")
      .select("tenant_id,status")
      .gte("created_at", sevenDaysAgo)
      .limit(10000),
    supabaseAdmin
      .from("webhook_runs")
      .select("company_id,status")
      .gte("created_at", sevenDaysAgo)
      .limit(10000),
    supabaseAdmin
      .from("core_incidents")
      .select("scope,severity,status")
      .neq("status", "resolved")
      .limit(2000),
  ]);

  const companies = (coRes.data ?? []) as any[];
  const n8nRuns = (n8nRes.data ?? []) as any[];
  const whRuns = (whRes.data ?? []) as any[];
  const incidents = (incRes.data ?? []) as any[];

  const n8nByCo = new Map<string, { total: number; failed: number }>();
  for (const r of n8nRuns) {
    if (!r.tenant_id) continue;
    const e = n8nByCo.get(r.tenant_id) ?? { total: 0, failed: 0 };
    e.total++;
    if (r.status === "error" || r.status === "failed") e.failed++;
    n8nByCo.set(r.tenant_id, e);
  }
  const whByCo = new Map<string, { total: number; failed: number }>();
  for (const r of whRuns) {
    if (!r.company_id) continue;
    const e = whByCo.get(r.company_id) ?? { total: 0, failed: 0 };
    e.total++;
    if (r.status === "error" || r.status === "failed" || r.status === "dead_letter") e.failed++;
    whByCo.set(r.company_id, e);
  }
  const incByScope = new Map<string, { total: number; critical: number }>();
  for (const i of incidents) {
    const key = (i.scope ?? "").toString();
    const e = incByScope.get(key) ?? { total: 0, critical: 0 };
    e.total++;
    if (i.severity === "critical" || i.severity === "high") e.critical++;
    incByScope.set(key, e);
  }

  return companies.map((c) => {
    const n8n = n8nByCo.get(c.id) ?? { total: 0, failed: 0 };
    const wh = whByCo.get(c.id) ?? { total: 0, failed: 0 };
    const inc = incByScope.get(c.public_slug ?? "") ?? { total: 0, critical: 0 };
    const n8nRate = n8n.total ? (n8n.total - n8n.failed) / n8n.total : 1;
    const whRate = wh.total ? (wh.total - wh.failed) / wh.total : 1;
    const incPenalty = Math.min(1, inc.total * 0.05 + inc.critical * 0.15);
    const composite = n8nRate * 0.45 + whRate * 0.45 + (1 - incPenalty) * 0.1;
    const score = Math.round(composite * 100);
    return {
      company_id: c.id,
      company_name: c.name,
      score,
      grade: gradeFor(score),
      n8n_failed: n8n.failed,
      webhook_failed: wh.failed,
      open_incidents: inc.total,
    };
  });
}

async function getStaffRecipients(): Promise<{ user_id: string; email: string | null }[]> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, profiles:user_id(email)")
    .in("role", ["impulsionando_master", "impulsionando_staff"]);
  const list = (data ?? []) as any[];
  const seen = new Set<string>();
  const out: { user_id: string; email: string | null }[] = [];
  for (const r of list) {
    if (seen.has(r.user_id)) continue;
    seen.add(r.user_id);
    out.push({ user_id: r.user_id, email: r.profiles?.email ?? null });
  }
  return out;
}

async function enqueueAlertOutbox(args: {
  company_id: string;
  company_name: string;
  score: number;
  grade: string;
  kind: "open" | "resolved";
}): Promise<{ in_app_id: string | null; email_id: string | null }> {
  const staff = await getStaffRecipients();
  if (!staff.length) return { in_app_id: null, email_id: null };

  const title =
    args.kind === "open"
      ? `Alerta: ${args.company_name} com score de confiabilidade ${args.score} (${args.grade})`
      : `Resolvido: ${args.company_name} voltou a ${args.score} (${args.grade})`;
  const body =
    args.kind === "open"
      ? `O score composto do tenant ${args.company_name} caiu abaixo de 70 (atual: ${args.score}). Verifique falhas de N8N, webhooks e incidentes.`
      : `O score composto do tenant ${args.company_name} recuperou (atual: ${args.score}).`;

  const inAppRows = staff.map((s) => ({
    company_id: args.company_id,
    event_code: args.kind === "open" ? "reliability.alert.open" : "reliability.alert.resolved",
    channel: "in_app",
    recipient_user_id: s.user_id,
    subject: title,
    body,
    payload: { kind: args.kind, score: args.score, grade: args.grade, company_id: args.company_id },
    reference_type: "reliability_alert",
    reference_id: args.company_id,
    status: "queued",
  }));

  const inAppIns = await supabaseAdmin.from("message_outbox").insert(inAppRows).select("id").limit(1);
  const in_app_id = (inAppIns.data?.[0] as any)?.id ?? null;

  let email_id: string | null = null;
  if (args.kind === "open") {
    const emailRows = staff
      .filter((s) => s.email)
      .map((s) => ({
        company_id: args.company_id,
        event_code: "reliability.alert.open",
        channel: "email",
        recipient_user_id: s.user_id,
        recipient_email: s.email!,
        subject: title,
        body,
        payload: { kind: args.kind, score: args.score, grade: args.grade, company_id: args.company_id },
        reference_type: "reliability_alert",
        reference_id: args.company_id,
        status: "queued",
      }));
    if (emailRows.length) {
      const emailIns = await supabaseAdmin.from("message_outbox").insert(emailRows).select("id").limit(1);
      email_id = (emailIns.data?.[0] as any)?.id ?? null;
    }
  }

  return { in_app_id, email_id };
}

async function run() {
  const scores = await computeScores();
  const { data: openAlerts } = await supabaseAdmin
    .from("core_reliability_alerts")
    .select("id, company_id")
    .eq("status", "open");
  const openByCo = new Map<string, string>();
  for (const a of (openAlerts ?? []) as any[]) openByCo.set(a.company_id, a.id);

  let opened = 0;
  let resolved = 0;

  for (const s of scores) {
    const existingId = openByCo.get(s.company_id);
    if (s.score < REOPEN_THRESHOLD && !existingId) {
      const outbox = await enqueueAlertOutbox({
        company_id: s.company_id,
        company_name: s.company_name,
        score: s.score,
        grade: s.grade,
        kind: "open",
      });
      await supabaseAdmin.from("core_reliability_alerts").insert({
        company_id: s.company_id,
        triggered_score: s.score,
        triggered_grade: s.grade,
        n8n_failed: s.n8n_failed,
        webhook_failed: s.webhook_failed,
        open_incidents: s.open_incidents,
        status: "open",
        outbox_in_app_id: outbox.in_app_id,
        outbox_email_id: outbox.email_id,
        payload: { source: "cron" },
      });
      opened++;
    } else if (s.score >= RESOLVE_THRESHOLD && existingId) {
      await supabaseAdmin
        .from("core_reliability_alerts")
        .update({
          status: "resolved",
          resolved_score: s.score,
          resolved_grade: s.grade,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", existingId);
      await enqueueAlertOutbox({
        company_id: s.company_id,
        company_name: s.company_name,
        score: s.score,
        grade: s.grade,
        kind: "resolved",
      });
      resolved++;
    }
  }

  return { tenants_checked: scores.length, opened, resolved };
}

export const Route = createFileRoute("/api/public/hooks/reliability-alerts")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await run();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(
            JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      GET: async () => {
        try {
          const result = await run();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(
            JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
