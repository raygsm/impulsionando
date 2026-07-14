import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

export type SearchHit = {
  group: "clientes" | "usuarios" | "tickets" | "automacoes" | "aprovacoes";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export const globalCommandSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data, context }): Promise<SearchHit[]> => {
    await ensureAdmin(context);
    const q = (data.q ?? "").trim();
    if (q.length < 2) return [];
    const like = `%${q}%`;

    const [companies, users, tickets, workflows, approvals] = await Promise.all([
      context.supabase
        .from("companies" as any)
        .select("id,name,trade_name,document")
        .or(`name.ilike.${like},trade_name.ilike.${like},document.ilike.${like}`)
        .limit(6),
      context.supabase
        .from("user_profiles" as any)
        .select("id,display_name,email,company_id")
        .or(`display_name.ilike.${like},email.ilike.${like}`)
        .limit(6),
      context.supabase
        .from("support_tickets" as any)
        .select("id,subject,status")
        .ilike("subject", like)
        .limit(6),
      context.supabase
        .from("n8n_workflows" as any)
        .select("id,name,status")
        .ilike("name", like)
        .limit(6),
      context.supabase
        .from("automation_approvals" as any)
        .select("id,rule_key,status")
        .ilike("rule_key", like)
        .limit(6),
    ]);

    const hits: SearchHit[] = [];
    (companies.data ?? []).forEach((c: any) =>
      hits.push({
        group: "clientes",
        id: c.id,
        title: c.trade_name || c.name,
        subtitle: c.document || undefined,
        href: `/command/clientes/${c.id}`,
      }),
    );
    (users.data ?? []).forEach((u: any) =>
      hits.push({
        group: "usuarios",
        id: u.id,
        title: u.display_name || u.email || u.id,
        subtitle: u.email ?? undefined,
        href: u.company_id ? `/command/clientes/${u.company_id}?tab=usuarios` : `/command/clientes`,
      }),
    );
    (tickets.data ?? []).forEach((t: any) =>
      hits.push({
        group: "tickets",
        id: t.id,
        title: t.subject ?? "(sem assunto)",
        subtitle: t.status,
        href: `/command/atendimento?ticket=${t.id}`,
      }),
    );
    (workflows.data ?? []).forEach((w: any) =>
      hits.push({
        group: "automacoes",
        id: w.id,
        title: w.name,
        subtitle: w.status,
        href: `/command/automacoes?workflow=${w.id}`,
      }),
    );
    (approvals.data ?? []).forEach((a: any) =>
      hits.push({
        group: "aprovacoes",
        id: a.id,
        title: a.rule_key,
        subtitle: a.status,
        href: `/command/aprovacoes?id=${a.id}`,
      }),
    );
    return hits;
  });
