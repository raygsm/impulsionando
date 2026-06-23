import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Palette as PaletteIcon, Loader2, Package } from "lucide-react";
import {
  buildBrandKitZip,
  fetchAsBlob,
  pngBlobToIco,
  renderFaviconPng,
  sanitizeSlug,
  triggerDownload,
} from "@/lib/brand-kit-utils";
import { toast } from "sonner";

interface Props {
  brandName: string;
  primary: string;
  secondary: string;
  domain: string;
  logoUrl: string | null;
  defaultEmail: string;
}

export function BrandKitExport({ brandName, primary, secondary, domain, logoUrl, defaultEmail }: Props) {
  const slug = sanitizeSlug(brandName);
  const cssVars = useMemo(
    () =>
      `:root {\n  --brand-primary: ${primary};\n  --brand-secondary: ${secondary};\n  --brand-name: "${brandName}";\n  --brand-domain: "${domain}";\n}\n`,
    [primary, secondary, brandName, domain],
  );
  const jsonTokens = useMemo(
    () =>
      JSON.stringify(
        { name: brandName, domain, email: defaultEmail, logo: logoUrl, colors: { primary, secondary } },
        null,
        2,
      ),
    [brandName, domain, defaultEmail, logoUrl, primary, secondary],
  );
  const signatureHtml = useMemo(
    () => buildSignatureHtml({ brandName, primary, domain, logoUrl, defaultEmail }),
    [brandName, primary, domain, logoUrl, defaultEmail],
  );

  const [busy, setBusy] = useState<string | null>(null);

  async function downloadZip() {
    setBusy("zip");
    try {
      const logo = logoUrl ? await fetchAsBlob(logoUrl) : null;
      const fav32 = await renderFaviconPng({ logoUrl, brandName, primary, size: 32, background: "#ffffff" }).catch(() => null);
      const fav256 = await renderFaviconPng({ logoUrl, brandName, primary, size: 256, background: "#ffffff" }).catch(() => null);
      const apple = await renderFaviconPng({ logoUrl, brandName, primary, size: 180, background: primary }).catch(() => null);
      const ico = fav256 ? await pngBlobToIco(fav256, 256).catch(() => null) : null;
      const zip = await buildBrandKitZip({
        brandName,
        domain,
        defaultEmail,
        primary,
        secondary,
        logoBlob: logo?.blob ?? null,
        logoExt: logo?.ext ?? ".png",
        cssTokens: cssVars,
        jsonTokens,
        signatureHtml,
        faviconPng32: fav32,
        faviconIco: ico,
        appleTouchPng: apple,
      });
      triggerDownload(zip, `${slug}-brand-kit.zip`);
      toast.success("Brand Kit baixado.");
    } catch (e) {
      toast.error("Falha ao gerar o ZIP: " + (e instanceof Error ? e.message : "erro"));
    } finally {
      setBusy(null);
    }
  }

  async function downloadFavicon(kind: "png32" | "ico" | "apple") {
    setBusy(kind);
    try {
      if (kind === "png32") {
        const blob = await renderFaviconPng({ logoUrl, brandName, primary, size: 32, background: "#ffffff" });
        triggerDownload(blob, `${slug}-favicon-32.png`);
      } else if (kind === "apple") {
        const blob = await renderFaviconPng({ logoUrl, brandName, primary, size: 180, background: primary });
        triggerDownload(blob, `${slug}-apple-touch-icon.png`);
      } else {
        const png = await renderFaviconPng({ logoUrl, brandName, primary, size: 256, background: "#ffffff" });
        const ico = await pngBlobToIco(png, 256);
        triggerDownload(ico, `${slug}-favicon.ico`);
      }
    } catch (e) {
      toast.error("Falha ao gerar favicon: " + (e instanceof Error ? e.message : "erro") + ". O logo pode estar bloqueando CORS.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PaletteIcon className="h-4 w-4" /> Brand Kit (download)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Arquivos prontos pra time, agência ou parceiros — paleta, logo, favicons e assinatura.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          size="lg"
          className="w-full sm:w-auto gap-2"
          onClick={downloadZip}
          disabled={busy !== null}
        >
          {busy === "zip" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
          Baixar Brand Kit completo (.zip)
        </Button>

        <div className="grid sm:grid-cols-2 gap-3">
          <KitAction
            label="Logo (original)"
            disabled={!logoUrl}
            onClick={() => logoUrl && downloadLogo(logoUrl, slug)}
          />
          <KitAction label="Paleta (.css)" onClick={() => downloadText(cssVars, `${slug}-tokens.css`, "text/css")} />
          <KitAction label="Tokens (.json)" onClick={() => downloadText(jsonTokens, `${slug}-brand.json`, "application/json")} />
          <KitAction
            label="Assinatura (.html)"
            onClick={() => downloadText(signatureHtml, `${slug}-signature.html`, "text/html")}
          />
          <KitAction
            label={busy === "png32" ? "Gerando…" : "Favicon 32×32 (.png)"}
            disabled={busy !== null}
            onClick={() => downloadFavicon("png32")}
          />
          <KitAction
            label={busy === "ico" ? "Gerando…" : "Favicon (.ico)"}
            disabled={busy !== null}
            onClick={() => downloadFavicon("ico")}
          />
          <KitAction
            label={busy === "apple" ? "Gerando…" : "Apple touch icon 180×180"}
            disabled={busy !== null}
            onClick={() => downloadFavicon("apple")}
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

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  triggerDownload(blob, filename);
}

async function downloadLogo(src: string, slug: string) {
  const got = await fetchAsBlob(src);
  if (got) triggerDownload(got.blob, `${slug}-logo${got.ext}`);
  else window.open(src, "_blank", "noopener");
}

function buildSignatureHtml(p: {
  brandName: string;
  primary: string;
  domain: string;
  logoUrl: string | null;
  defaultEmail: string;
}): string {
  const logo = p.logoUrl
    ? `<img src="${esc(p.logoUrl)}" alt="${esc(p.brandName)}" height="48" style="height:48px;width:auto;display:block;border:0;" />`
    : `<div style="height:48px;width:48px;background:${p.primary};color:#fff;font:bold 14px Arial,sans-serif;display:inline-block;text-align:center;line-height:48px;border-radius:6px;">${esc(p.brandName.slice(0, 2).toUpperCase())}</div>`;
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#0f172a;">
  <tr>
    <td style="padding-right:14px;vertical-align:top;">${logo}</td>
    <td style="vertical-align:top;border-left:2px solid ${p.primary};padding-left:14px;">
      <div style="font-weight:bold;color:${p.primary};font-size:14px;">${esc(p.brandName)}</div>
      <div style="color:#475569;margin-top:2px;">${esc(p.defaultEmail)}</div>
      <div style="color:#475569;">${esc(p.domain)}</div>
    </td>
  </tr>
</table>`;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
