#!/usr/bin/env bun
/**
 * scripts/verify-planos-meta.ts
 *
 * Validador PT-BR das meta tags e Open Graph de /planos.
 * Confirma que preços, quotas e elegibilidade renderizam exatamente como
 * definido no source — pego diretamente do HTML SSR.
 *
 * Uso:
 *   bun run scripts/verify-planos-meta.ts                       # preview default
 *   bun run scripts/verify-planos-meta.ts https://impulsionando.com.br
 *
 * Após mudanças nas metas, lembrar de forçar refresh nos debuggers:
 *   - Facebook: https://developers.facebook.com/tools/debug/
 *   - LinkedIn: https://www.linkedin.com/post-inspector/
 *   - Twitter/X: https://cards-dev.twitter.com/validator
 */

const DEFAULT_BASE = "https://impulsionando.com.br";
const base = process.argv[2] ?? DEFAULT_BASE;
const url = `${base.replace(/\/$/, "")}/planos`;

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function add(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

function pickMeta(html: string, attr: "name" | "property", value: string): string | null {
  const re = new RegExp(
    `<meta[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${value}["']`,
    "i",
  );
  return html.match(re2)?.[1] ?? null;
}

function pickTitle(html: string): string | null {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null;
}

function pickCanonical(html: string): string | null {
  return (
    html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? null
  );
}

async function main() {
  console.log(`🔎 GET ${url}`);
  const res = await fetch(url, {
    headers: { "user-agent": "ImpulsionandoMetaVerifier/1.0 (+social-preview)" },
  });
  add(`HTTP ${res.status}`, res.ok, `${res.status} ${res.statusText}`);
  const html = await res.text();

  const title = pickTitle(html);
  const desc = pickMeta(html, "name", "description");
  const ogTitle = pickMeta(html, "property", "og:title");
  const ogDesc = pickMeta(html, "property", "og:description");
  const ogUrl = pickMeta(html, "property", "og:url");
  const ogType = pickMeta(html, "property", "og:type");
  const ogLocale = pickMeta(html, "property", "og:locale");
  const twCard = pickMeta(html, "name", "twitter:card");
  const canonical = pickCanonical(html);

  // 1. Tags presentes
  add("title presente", !!title, title ?? "—");
  add("description presente", !!desc, desc ?? "—");
  add("og:title presente", !!ogTitle, ogTitle ?? "—");
  add("og:description presente", !!ogDesc, ogDesc ?? "—");
  add("og:url presente", !!ogUrl, ogUrl ?? "—");
  add("canonical presente", !!canonical, canonical ?? "—");
  add("twitter:card presente", !!twCard, twCard ?? "—");

  // 2. PT-BR
  const allText = `${title ?? ""} ${desc ?? ""} ${ogTitle ?? ""} ${ogDesc ?? ""}`.toLowerCase();
  add(
    "linguagem PT-BR detectada",
    /(plano|mensal|anual|trial|empres|módulo|implant|setup)/.test(allText),
    "esperado vocabulário PT-BR de planos",
  );
  if (ogLocale) add("og:locale = pt_BR", ogLocale === "pt_BR", ogLocale);

  // 3. Preços e quotas exatos (de PLANS/PLAN_SETUP_BRL)
  const expectedPrices = ["759", "1.518", "1518", "3.036", "3036"];
  const foundPrices = expectedPrices.filter((p) => html.includes(p));
  add(
    "preços R$ 759 / 1.518 / 3.036 no HTML",
    foundPrices.length >= 3,
    `encontrados: ${foundPrices.join(", ") || "nenhum"}`,
  );

  const expectedSetups = ["297", "759", "1.518", "1518"];
  const foundSetups = expectedSetups.filter((p) => html.includes(p));
  add(
    "setup R$ 297 / 759 / 1.518 no HTML",
    foundSetups.length >= 3,
    `encontrados: ${foundSetups.join(", ") || "nenhum"}`,
  );

  // 4. Trial 7 dias + 90 dias
  add("menciona Trial 7 dias", /7\s*dias/i.test(html), "string '7 dias'");
  add("menciona contrato mínimo 90 dias", /90\s*dias/.test(html), "string '90 dias'");
  add(
    "FAQ Trial elegibilidade (CNPJ)",
    /CNPJ/i.test(html) && /elegív/i.test(html),
    "esperado bloco de elegibilidade do trial",
  );

  // 5. Quotas (1/2/3 módulos)
  add(
    "quotas de módulos por plano",
    /1\s*módulo/i.test(html) && /2\s*módulos/i.test(html) && /3\s*módulos/i.test(html),
    "1/2/3 módulos por plano",
  );

  // 6. Canonical + og:url self-reference
  if (canonical) {
    add(
      "canonical aponta para /planos",
      canonical.includes("/planos") && !canonical.endsWith("/"),
      canonical,
    );
  }
  if (ogUrl) {
    add("og:url aponta para /planos", ogUrl.includes("/planos"), ogUrl);
  }

  // 7. Tamanhos recomendados
  if (title) add(`title ≤ 60 chars (atual ${title.length})`, title.length <= 60, title);
  if (desc) add(`description ≤ 160 chars (atual ${desc.length})`, desc.length <= 160, desc);

  // ============ Report ============
  let pass = 0, fail = 0;
  console.log("");
  for (const c of checks) {
    const icon = c.ok ? "✅" : "❌";
    console.log(`${icon} ${c.name}${c.detail ? `  →  ${c.detail}` : ""}`);
    c.ok ? pass++ : fail++;
  }
  console.log("");
  console.log(`Resultado: ${pass} OK · ${fail} falha(s)`);
  if (fail > 0) {
    console.log("");
    console.log("Após corrigir, force refresh do cache nos debuggers sociais:");
    console.log("  • Facebook   https://developers.facebook.com/tools/debug/?q=" + encodeURIComponent(url));
    console.log("  • LinkedIn   https://www.linkedin.com/post-inspector/inspect/" + encodeURIComponent(url));
    console.log("  • Twitter/X  https://cards-dev.twitter.com/validator");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("erro:", e);
  process.exit(2);
});
