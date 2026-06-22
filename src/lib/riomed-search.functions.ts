import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMBEDDING_MODEL = "google/gemini-embedding-001";
const EMBEDDING_DIMS = 1536;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/embeddings";

type GatewayInput =
  | string
  | { content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> };

async function embed(input: GatewayInput): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [input],
      dimensions: EMBEDDING_DIMS,
      encoding_format: "float",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
  const vec = json.data?.[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIMS) throw new Error("Embedding vazio/dimensão errada");
  return vec;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function toVectorLiteral(vec: number[]): string {
  return "[" + vec.map((n) => n.toFixed(6)).join(",") + "]";
}

async function resolveCompanyId(supabase: ReturnType<typeof Object>, userId: string): Promise<string> {
  const { data: profile } = await (supabase as any)
    .from("user_profiles").select("company_id").eq("user_id", userId).maybeSingle();
  if (profile?.company_id) return profile.company_id as string;
  const { data: tenant } = await (supabase as any)
    .from("core_tenant_identity").select("company_id").eq("subdomain", "riomed").maybeSingle();
  if (!tenant?.company_id) throw new Error("Empresa não identificada.");
  return tenant.company_id as string;
}

// ------------------------------------------------------------------
// 1) Processa fila de embeddings (texto) — admin/manual trigger
// ------------------------------------------------------------------
export const runRiomedEmbeddingJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: jobs, error } = await supabaseAdmin
      .from("riomed_embedding_jobs")
      .select("id, product_id, kind, attempts")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(data.limit);
    if (error) throw error;
    if (!jobs?.length) return { processed: 0, errors: 0 };

    let processed = 0;
    let errors = 0;

    for (const job of jobs) {
      try {
        await supabaseAdmin.from("riomed_embedding_jobs")
          .update({ status: "running", attempts: (job.attempts ?? 0) + 1 })
          .eq("id", job.id);

        const { data: product } = await supabaseAdmin
          .from("riomed_products")
          .select("id, name, description, sku, category")
          .eq("id", job.product_id).single();
        if (!product) throw new Error("Produto não encontrado");

        const text = [product.name, product.sku, product.category, product.description]
          .filter(Boolean).join(" | ").slice(0, 4000);
        if (!text.trim()) {
          await supabaseAdmin.from("riomed_embedding_jobs")
            .update({ status: "done" }).eq("id", job.id);
          processed++;
          continue;
        }

        const vec = await embed(text);
        const hash = await sha256Hex(text);

        await supabaseAdmin.from("riomed_product_embeddings").upsert({
          company_id: companyId,
          product_id: product.id,
          kind: "text",
          source: text,
          source_hash: hash,
          model: EMBEDDING_MODEL,
          dims: EMBEDDING_DIMS,
          embedding: toVectorLiteral(vec) as unknown as number[],
          metadata: { sku: product.sku, name: product.name },
        }, { onConflict: "product_id,variant_id,kind,source_hash", ignoreDuplicates: false });

        await supabaseAdmin.from("riomed_embedding_jobs")
          .update({ status: "done", last_error: null }).eq("id", job.id);
        processed++;
      } catch (e) {
        errors++;
        await supabaseAdmin.from("riomed_embedding_jobs")
          .update({ status: "error", last_error: String((e as Error).message ?? e) })
          .eq("id", job.id);
      }
    }

    return { processed, errors };
  });

// ------------------------------------------------------------------
// 2) Busca semântica (texto e/ou imagem)
// ------------------------------------------------------------------
export const searchRiomedProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      query: z.string().min(1).max(500).optional(),
      imageUrl: z.string().url().optional(),
      channel: z.enum(["web", "whatsapp", "api", "b2b"]).default("web"),
      limit: z.number().int().min(1).max(50).default(12),
      minSimilarity: z.number().min(0).max(1).default(0.45),
    }).refine(d => d.query || d.imageUrl, { message: "Informe texto ou imagem" }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);
    const t0 = Date.now();

    let input: GatewayInput;
    let kindHint: "text" | "image" | "multimodal" = "text";
    if (data.query && data.imageUrl) {
      kindHint = "multimodal";
      input = { content: [
        { type: "text", text: data.query },
        { type: "image_url", image_url: { url: data.imageUrl } },
      ]};
    } else if (data.imageUrl) {
      kindHint = "image";
      input = { content: [{ type: "image_url", image_url: { url: data.imageUrl } }] };
    } else {
      input = data.query!;
    }

    const vec = await embed(input);

    const { data: matches, error } = await (supabase as any).rpc("riomed_match_products", {
      p_company_id: companyId,
      p_query_embedding: toVectorLiteral(vec),
      p_kind: null,
      p_match_count: data.limit,
      p_min_similarity: data.minSimilarity,
    });
    if (error) throw error;

    const ids = (matches ?? []).map((m: any) => m.product_id);
    let products: any[] = [];
    if (ids.length) {
      const { data: rows } = await supabase
        .from("riomed_products")
        .select("id, name, sku, description, category, image_url")
        .in("id", ids);
      products = rows ?? [];
    }
    const byId = new Map(products.map((p: any) => [p.id, p]));
    const results = (matches ?? []).map((m: any) => ({
      ...m,
      product: byId.get(m.product_id) ?? null,
    }));

    const latency = Date.now() - t0;
    await supabase.from("riomed_search_queries").insert({
      company_id: companyId,
      user_id: userId,
      channel: data.channel,
      query_text: data.query ?? null,
      query_image_url: data.imageUrl ?? null,
      query_kind: kindHint,
      results_count: results.length,
      top_product_id: results[0]?.product_id ?? null,
      top_score: results[0]?.similarity ?? null,
      latency_ms: latency,
      metadata: { model: EMBEDDING_MODEL },
    });

    return { results, latency_ms: latency, kind: kindHint };
  });

// ------------------------------------------------------------------
// 3) Métricas (fila + buscas recentes)
// ------------------------------------------------------------------
export const getRiomedSearchOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const companyId = await resolveCompanyId(supabase, userId);

    const [{ count: indexed }, { count: pending }, { count: errors }, { data: recent }] = await Promise.all([
      supabase.from("riomed_product_embeddings").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("riomed_embedding_jobs").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "pending"),
      supabase.from("riomed_embedding_jobs").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "error"),
      supabase.from("riomed_search_queries").select("id, query_text, query_kind, results_count, top_score, latency_ms, created_at")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(15),
    ]);

    return {
      indexed: indexed ?? 0,
      pending: pending ?? 0,
      errors: errors ?? 0,
      recent: recent ?? [],
    };
  });
