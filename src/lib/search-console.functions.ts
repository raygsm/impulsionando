import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

function authHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  if (!lovableKey || !gscKey) {
    throw new Error(
      "Search Console não configurado. Conecte o Google Search Console em Connectors.",
    );
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": gscKey,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function ensureAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

async function gwFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Search Console [${res.status}]: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : {};
}

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

/** Lista propriedades verificadas na conta Google conectada. */
export const listGscSitesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const data = await gwFetch("/webmasters/v3/sites");
    return (data.siteEntry ?? []) as GscSite[];
  });

export interface GscQueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryInput {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions?: Array<"query" | "page" | "country" | "device" | "date">;
  rowLimit?: number;
}

/** Executa searchAnalytics.query para uma propriedade verificada. */
export const querySearchAnalyticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: GscQueryInput) => {
    if (!d?.siteUrl) throw new Error("siteUrl obrigatório");
    if (!d?.startDate || !d?.endDate) throw new Error("Datas obrigatórias");
    return d;
  })
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const encoded = encodeURIComponent(data.siteUrl);
    const body = {
      startDate: data.startDate,
      endDate: data.endDate,
      dimensions: data.dimensions ?? ["query"],
      rowLimit: data.rowLimit ?? 25,
    };
    const res = await gwFetch(
      `/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return (res.rows ?? []) as GscQueryRow[];
  });
