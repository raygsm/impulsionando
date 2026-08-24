import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WEBMASTERS_BASE = "https://www.googleapis.com/webmasters/v3";
const INSPECTION_BASE = "https://searchconsole.googleapis.com/v1";

function authHeaders() {
  const accessToken = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "Search Console não configurado. Defina GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN no ambiente server-side.",
    );
  }
  return {
    Authorization: `Bearer ${accessToken}`,
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

async function gscFetch(base: string, path: string, init?: RequestInit) {
  const res = await fetch(`${base}${path}`, {
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

export const listGscSitesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const data = await gscFetch(WEBMASTERS_BASE, "/sites");
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
  startDate: string;
  endDate: string;
  dimensions?: Array<"query" | "page" | "country" | "device" | "date">;
  rowLimit?: number;
}

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
    const res = await gscFetch(
      WEBMASTERS_BASE,
      `/sites/${encoded}/searchAnalytics/query`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return (res.rows ?? []) as GscQueryRow[];
  });

export interface UrlInspectInput { siteUrl: string; inspectionUrl: string }

export const inspectUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: UrlInspectInput) => {
    if (!d?.siteUrl || !d?.inspectionUrl) throw new Error("siteUrl e inspectionUrl obrigatórios");
    return d;
  })
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const res = await gscFetch(INSPECTION_BASE, "/urlInspection/index:inspect", {
      method: "POST",
      body: JSON.stringify({ inspectionUrl: data.inspectionUrl, siteUrl: data.siteUrl }),
    });
    return res.inspectionResult ?? res;
  });
