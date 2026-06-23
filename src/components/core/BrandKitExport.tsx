import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Palette as PaletteIcon } from "lucide-react";

interface Props {
  brandName: string;
  primary: string;
  secondary: string;
  domain: string;
  logoUrl: string | null;
  defaultEmail: string;
}

/**
 * w25 — Brand Kit export.
 *
 * Empacota a identidade do tenant em arquivos prontos pra time/agência:
 *   - logo (download direto via fetch + blob)
 *   - paleta como CSS custom properties + JSON
 *   - assinatura HTML pronta pra colar no cliente de e-mail
 */
export function BrandKitExport({ brandName, primary, secondary, domain, logoUrl, defaultEmail }: Props) {
  const cssVars = useMemo(
    () =>
      `:root {\n  --brand-primary: ${primary};\n  --brand-secondary: ${secondary};\n  --brand-name: "${brandName}";\n  --brand-domain: "${domain}";\n}\n`,
    [primary, secondary, brandName, domain],
  );

  const jsonTokens = useMemo(
    () =>
      JSON.stringify(
        {
          name: brandName,
          domain,
          email: defaultEmail,
          logo: logoUrl,
          colors: { primary, secondary },
        },
        null,
        2,
      ),
    [brandName, domain, defaultEmail, logoUrl, primary, secondary],
  );

  const signatureHtml = useMemo(
    () => buildSignatureHtml({ brandName, primary, domain, logoUrl, defaultEmail }),
    [brandName, primary, domain, logoUrl, defaultEmail],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PaletteIcon className="h-4 w-4" /> Brand Kit (download)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Arquivos prontos pra entregar pro time, agência ou parceiros — paleta, logo e assinatura.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <KitAction
            label="Logo (arquivo original)"
            disabled={!logoUrl}
            onClick={() => logoUrl && downloadUrl(logoUrl, sanitize(brandName) + "-logo")}
          />
          <KitAction
            label="Paleta (.css)"
            onClick={() => downloadText(cssVars, sanitize(brandName) + "-tokens.css", "text/css")}
          />
          <KitAction
            label="Tokens (.json)"
            onClick={() => downloadText(jsonTokens, sanitize(brandName) + "-brand.json", "application/json")}
          />
          <KitAction
            label="Assinatura de e-mail (.html)"
            onClick={() => downloadText(signatureHtml, sanitize(brandName) + "-signature.html", "text/html")}
          />
        </div>

        <CopyBlock title="CSS — cole no seu site" content={cssVars} />
        <CopyBlock title="JSON — tokens" content={jsonTokens} />
        <CopyBlock title="HTML — assinatura de e-mail" content={signatureHtml} />
      </CardContent>
    </Card>
  );
}

function KitAction({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="outline" className="justify-start gap-2" onClick={onClick} disabled={disabled}>
      <Download className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </Button>
  );
}

function CopyBlock({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border bg-muted/30">
      <div className="flex items-center justify-between px-3 py-1.5 border-b">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5"
          onClick={async () => {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="text-[11px] leading-relaxed p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">{content}</pre>
    </div>
  );
}

function sanitize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "brand";
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadUrl(src: string, baseName: string) {
  try {
    const res = await fetch(src, { mode: "cors" });
    const blob = await res.blob();
    const ext = guessExt(blob.type, src);
    const url = URL.createObjectURL(blob);
    triggerDownload(url, baseName + ext);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Fallback: abre em nova aba (download direto pode ser bloqueado por CORS)
    window.open(src, "_blank", "noopener");
  }
}

function guessExt(mime: string, url: string): string {
  if (mime.includes("svg")) return ".svg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  const m = url.match(/\.(svg|png|webp|jpe?g|gif)(?:\?|$)/i);
  return m ? "." + m[1].toLowerCase().replace("jpeg", "jpg") : ".png";
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function buildSignatureHtml(p: {
  brandName: string;
  primary: string;
  domain: string;
  logoUrl: string | null;
  defaultEmail: string;
}): string {
  const logo = p.logoUrl
    ? `<img src="${escapeAttr(p.logoUrl)}" alt="${escapeAttr(p.brandName)}" height="48" style="height:48px;width:auto;display:block;border:0;" />`
    : `<div style="height:48px;width:48px;background:${p.primary};color:#fff;font:bold 14px Arial,sans-serif;display:inline-block;text-align:center;line-height:48px;border-radius:6px;">${escapeText(p.brandName.slice(0, 2).toUpperCase())}</div>`;
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#0f172a;">
  <tr>
    <td style="padding-right:14px;vertical-align:top;">${logo}</td>
    <td style="vertical-align:top;border-left:2px solid ${p.primary};padding-left:14px;">
      <div style="font-weight:bold;color:${p.primary};font-size:14px;">${escapeText(p.brandName)}</div>
      <div style="color:#475569;margin-top:2px;">${escapeText(p.defaultEmail)}</div>
      <div style="color:#475569;">${escapeText(p.domain)}</div>
    </td>
  </tr>
</table>`;
}

function escapeText(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeAttr(s: string) {
  return escapeText(s);
}
