// Cliente-side validator para JSON-LD: extrai de HTML e valida schemas comuns.

export type JsonLdIssue = { level: "error" | "warning"; message: string };
export type JsonLdResult = {
  index: number;
  type: string;
  raw: any;
  issues: JsonLdIssue[];
};

export function extractJsonLdBlocks(html: string): string[] {
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html))) out.push(m[1].trim());
  return out;
}

function typeOf(node: any): string {
  const t = node?.["@type"];
  return Array.isArray(t) ? t.join("+") : (t ?? "Unknown");
}

function validateNode(node: any): JsonLdIssue[] {
  const issues: JsonLdIssue[] = [];
  if (!node || typeof node !== "object") {
    issues.push({ level: "error", message: "Nó não é um objeto JSON válido" });
    return issues;
  }
  if (!node["@context"]) issues.push({ level: "warning", message: "Faltando @context (schema.org)" });
  const type = typeOf(node);

  switch (type) {
    case "BreadcrumbList": {
      const items = node.itemListElement;
      if (!Array.isArray(items) || items.length === 0) {
        issues.push({ level: "error", message: "BreadcrumbList precisa de itemListElement (array)" });
      } else {
        items.forEach((it: any, i: number) => {
          if (it["@type"] !== "ListItem") issues.push({ level: "error", message: `item ${i}: @type deve ser ListItem` });
          if (typeof it.position !== "number") issues.push({ level: "error", message: `item ${i}: position numérico ausente` });
          if (!it.name && !it.item?.name) issues.push({ level: "warning", message: `item ${i}: sem name` });
          if (!it.item) issues.push({ level: "warning", message: `item ${i}: sem item (URL)` });
        });
      }
      break;
    }
    case "Service": {
      if (!node.name) issues.push({ level: "error", message: "Service.name obrigatório" });
      if (!node.provider) issues.push({ level: "warning", message: "Service.provider recomendado" });
      if (!node.areaServed) issues.push({ level: "warning", message: "Service.areaServed recomendado" });
      break;
    }
    case "FAQPage": {
      const q = node.mainEntity;
      if (!Array.isArray(q) || q.length === 0) {
        issues.push({ level: "error", message: "FAQPage.mainEntity precisa ser array de Question" });
      } else {
        q.forEach((it: any, i: number) => {
          if (it["@type"] !== "Question") issues.push({ level: "error", message: `Q${i}: @type deve ser Question` });
          if (!it.name) issues.push({ level: "error", message: `Q${i}: name (pergunta) ausente` });
          const a = it.acceptedAnswer;
          if (!a || a["@type"] !== "Answer" || !a.text) {
            issues.push({ level: "error", message: `Q${i}: acceptedAnswer/Answer.text ausente` });
          }
        });
      }
      break;
    }
    case "Article":
    case "NewsArticle":
    case "BlogPosting": {
      if (!node.headline) issues.push({ level: "error", message: "Article.headline obrigatório" });
      if (!node.author) issues.push({ level: "warning", message: "Article.author recomendado" });
      if (!node.datePublished) issues.push({ level: "warning", message: "Article.datePublished recomendado" });
      break;
    }
    case "Product": {
      if (!node.name) issues.push({ level: "error", message: "Product.name obrigatório" });
      if (!node.offers) issues.push({ level: "warning", message: "Product.offers recomendado" });
      break;
    }
    case "Organization":
    case "WebSite":
      if (!node.name) issues.push({ level: "warning", message: `${type}.name recomendado` });
      if (!node.url) issues.push({ level: "warning", message: `${type}.url recomendado` });
      break;
    default:
      issues.push({ level: "warning", message: `Tipo "${type}" sem validação específica` });
  }
  return issues;
}

export function validateJsonLd(html: string): JsonLdResult[] {
  const blocks = extractJsonLdBlocks(html);
  const results: JsonLdResult[] = [];
  blocks.forEach((raw, i) => {
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      (Array.isArray(nodes) ? nodes : [nodes]).forEach((node: any) => {
        results.push({ index: i, type: typeOf(node), raw: node, issues: validateNode(node) });
      });
    } catch (e: any) {
      results.push({
        index: i,
        type: "InvalidJSON",
        raw: raw.slice(0, 200),
        issues: [{ level: "error", message: `JSON inválido: ${e.message}` }],
      });
    }
  });
  return results;
}
