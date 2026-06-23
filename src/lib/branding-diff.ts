/**
 * Helpers compartilhados de branding (snapshot, diff, sig HTML, changelog .md).
 */

export interface BrandingSnapshot {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export interface BrandingFieldDiff {
  field: "name" | "logo_url" | "primary_color" | "secondary_color";
  label: string;
  from: string | null;
  to: string | null;
  kind: "text" | "color" | "image";
}

export function diffBranding(to: BrandingSnapshot | null, from: BrandingSnapshot | null): BrandingFieldDiff[] {
  if (!to || !from) return [];
  const fields: { field: BrandingFieldDiff["field"]; label: string; kind: BrandingFieldDiff["kind"] }[] = [
    { field: "name", label: "Nome comercial", kind: "text" },
    { field: "logo_url", label: "Logo", kind: "image" },
    { field: "primary_color", label: "Cor primária", kind: "color" },
    { field: "secondary_color", label: "Cor secundária", kind: "color" },
  ];
  return fields
    .filter((f) => (to as Record<string, unknown>)[f.field] !== (from as Record<string, unknown>)[f.field])
    .map((f) => ({
      ...f,
      from: (from as Record<string, string | null>)[f.field] ?? null,
      to: (to as Record<string, string | null>)[f.field] ?? null,
    }));
}

/** Renderiza assinatura de e-mail HTML a partir de um snapshot. */
export function renderSignatureHtml(s: {
  brandName: string;
  primary: string;
  domain: string;
  logoUrl: string | null;
  defaultEmail: string;
}): string {
  const logo = s.logoUrl
    ? `<img src="${esc(s.logoUrl)}" alt="${esc(s.brandName)}" height="48" style="height:48px;width:auto;display:block;border:0;" />`
    : `<div style="height:48px;width:48px;background:${s.primary};color:#fff;font:bold 14px Arial,sans-serif;display:inline-block;text-align:center;line-height:48px;border-radius:6px;">${esc(s.brandName.slice(0, 2).toUpperCase())}</div>`;
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#0f172a;">
  <tr>
    <td style="padding-right:14px;vertical-align:top;">${logo}</td>
    <td style="vertical-align:top;border-left:2px solid ${s.primary};padding-left:14px;">
      <div style="font-weight:bold;color:${s.primary};font-size:14px;">${esc(s.brandName)}</div>
      <div style="color:#475569;margin-top:2px;">${esc(s.defaultEmail)}</div>
      <div style="color:#475569;">${esc(s.domain)}</div>
    </td>
  </tr>
</table>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/**
 * Gera resumo de changelog em Markdown a partir de um conjunto de diffs.
 * `from` é o rótulo da versão de referência (ex.: "v3 (publicada)").
 * `to` é o rótulo do estado atual (ex.: "live" / "rascunho candidato").
 */
export function buildChangelogMarkdown(opts: {
  brandName: string;
  fromLabel: string;
  toLabel: string;
  diffs: BrandingFieldDiff[];
}): string {
  const lines: string[] = [];
  lines.push(`# Changelog de branding — ${opts.brandName}`);
  lines.push("");
  lines.push(`> Comparação **${opts.fromLabel}** → **${opts.toLabel}** · gerado em ${new Date().toLocaleString("pt-BR")}`);
  lines.push("");
  if (opts.diffs.length === 0) {
    lines.push("Nenhuma mudança detectada — os snapshots são idênticos.");
    return lines.join("\n");
  }
  lines.push(`## ${opts.diffs.length} mudança${opts.diffs.length > 1 ? "s" : ""}`);
  lines.push("");
  for (const d of opts.diffs) {
    if (d.kind === "image") {
      lines.push(`- **${d.label}**: ${d.from ? `[antiga](${d.from})` : "_(vazio)_"} → ${d.to ? `[nova](${d.to})` : "_(vazio)_"}`);
    } else if (d.kind === "color") {
      lines.push(`- **${d.label}**: \`${d.from ?? "—"}\` → \`${d.to ?? "—"}\``);
    } else {
      lines.push(`- **${d.label}**: "${d.from ?? ""}" → "${d.to ?? ""}"`);
    }
  }
  lines.push("");
  lines.push(`_Core Impulsionando · branding management_`);
  return lines.join("\n");
}

/**
 * Gera changelog em texto curto (uma linha por mudança), útil pra pré-preencher
 * o campo de notas da publicação.
 */
export function buildChangelogSummary(diffs: BrandingFieldDiff[]): string {
  if (diffs.length === 0) return "Sem mudanças desde a versão anterior.";
  return diffs
    .map((d) => {
      const from = d.from ?? "vazio";
      const to = d.to ?? "vazio";
      if (d.kind === "color") return `${d.label}: ${from} → ${to}`;
      if (d.kind === "image") return `${d.label} atualizado`;
      return `${d.label}: "${from}" → "${to}"`;
    })
    .join("\n");
}
