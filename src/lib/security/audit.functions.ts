import { createServerFn, getRequest } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ActionSchema = z.object({
  action: z.string().min(1).max(120),
  entity: z.string().min(1).max(120),
  entityId: z.string().max(200).optional(),
  before: z.any().optional(),
  after: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  companyId: z.string().uuid().optional(),
  severity: z.enum(["info", "notice", "warning", "critical"]).default("info"),
  category: z
    .enum(["admin", "auth", "security", "billing", "data", "system"])
    .default("admin"),
});

function ipFromRequest(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

/**
 * Registra uma ação administrativa na trilha de auditoria com IP e user-agent.
 * Requer usuário autenticado. Qualquer usuário logado pode registrar suas próprias
 * ações via a função pública; ações realmente sensíveis devem checar role antes
 * de chamar esta função.
 */
export const logAdminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof ActionSchema>) => ActionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const req = getRequest();
    const ip = ipFromRequest(req);
    const ua = req.headers.get("user-agent") ?? null;

    const { data: id, error } = await context.supabase.rpc("log_admin_action", {
      _action: data.action,
      _entity: data.entity,
      _entity_id: data.entityId ?? null,
      _before: data.before ?? null,
      _after: data.after ?? null,
      _metadata: data.metadata ?? {},
      _company_id: data.companyId ?? null,
      _ip: ip,
      _user_agent: ua,
      _severity: data.severity,
      _category: data.category,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

/**
 * Lista trilha de auditoria com filtros.
 * RLS já restringe: admin master vê tudo; admin de tenant vê o próprio.
 */
const ListSchema = z.object({
  category: z
    .enum(["admin", "auth", "security", "billing", "data", "system"])
    .optional(),
  severity: z.enum(["info", "notice", "warning", "critical"]).optional(),
  actorEmail: z.string().max(200).optional(),
  fromISO: z.string().optional(),
  toISO: z.string().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListSchema>) => ListSchema.parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("audit_logs")
      .select(
        "id, created_at, user_email, action, entity, entity_id, severity, category, ip_address, metadata, company_id",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.category) q = q.eq("category", data.category);
    if (data.severity) q = q.eq("severity", data.severity);
    if (data.actorEmail) q = q.ilike("user_email", `%${data.actorEmail}%`);
    if (data.fromISO) q = q.gte("created_at", data.fromISO);
    if (data.toISO) q = q.lte("created_at", data.toISO);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });
