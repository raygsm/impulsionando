import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { recordTenantSignupLead } from "./growth-funnel";

const RowSchema = z.object({
  name: z.string().min(1),
  subdomain: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  environment: z.enum(["demo", "teste", "real"]).optional().default("real"),
  release_channel: z.enum(["dev", "beta", "stable"]).optional().default("stable"),
});

const ImportSchema = z.object({
  rows: z.array(RowSchema).min(1).max(500),
  dryRun: z.boolean().optional().default(false),
});

export const importCompaniesCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const results: { name: string; status: "created" | "updated" | "skipped" | "error"; message?: string }[] = [];

    for (const row of data.rows) {
      try {
        const { data: existing } = await supabase
          .from("companies")
          .select("id, name")
          .ilike("name", row.name)
          .maybeSingle();

        if (data.dryRun) {
          results.push({ name: row.name, status: existing ? "updated" : "created", message: "dry-run" });
          continue;
        }

        const payload = {
          name: row.name,
          subdomain: row.subdomain || null,
          domain: row.domain || null,
          email: row.email || null,
          phone: row.phone || null,
          document: row.document || null,
          segment: row.segment || null,
          environment: row.environment ?? "real",
          release_channel: row.release_channel ?? "stable",
          is_active: true,
          status: "active",
        };

        if (existing) {
          const { error } = await supabase.from("companies").update(payload).eq("id", existing.id);
          if (error) throw new Error(error.message);
          results.push({ name: row.name, status: "updated" });
        } else {
          const { error } = await supabase.from("companies").insert(payload as never);
          if (error) throw new Error(error.message);
          results.push({ name: row.name, status: "created" });
        }
      } catch (e: any) {
        results.push({ name: row.name, status: "error", message: e?.message ?? "erro" });
      }
    }

    return {
      total: results.length,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    };
  });
