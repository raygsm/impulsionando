import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyBrandingCompanies } from "@/lib/my-branding.functions";
import { listEmailAliases } from "@/lib/tenant-email-aliases.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, LayoutDashboard, Users, Settings, Mail, Globe } from "lucide-react";
import { useMemo } from "react";
import { BrandKitExport } from "./BrandKitExport";
import { ContrastReport } from "./ContrastReport";

interface Props { companyId: string }

/**
 * w24 — Pré-visualização ao vivo do branding.
 *
 * Renderiza um mock de app shell (header, sidebar, conteúdo) com as cores,
 * logo e e-mails do time aplicados como CSS inline-scope. NÃO altera o
 * tema global da página — fica isolado ao card.
 */
export function BrandingPreviewTab({ companyId }: Props) {
  const listCompanies = useServerFn(listMyBrandingCompanies);
  const listAliases = useServerFn(listEmailAliases);

  const companiesQ = useQuery({
    queryKey: ["my-branding-companies"],
    queryFn: () => listCompanies(),
  });
  const aliasesQ = useQuery({
    queryKey: ["tenant-email-aliases", companyId],
    queryFn: () => listAliases({ data: { companyId } }),
    enabled: !!companyId,
  });

  const company = companiesQ.data?.companies.find((c) => c.id === companyId);
  const identity = aliasesQ.data?.identity ?? null;
  const aliases = aliasesQ.data?.aliases ?? [];

  const primary = company?.primary_color || "#1e40af";
  const secondary = company?.secondary_color || "#0ea5e9";
  const brandName = company?.trade_name || company?.name || "Tenant";
  const domain = identity?.custom_domain || identity?.full_domain || "—";

  // Detecta cor de texto contrastante (preto/branco) com base na luminância.
  const fgOnPrimary = useMemo(() => contrastingTextColor(primary), [primary]);
  const fgOnSecondary = useMemo(() => contrastingTextColor(secondary), [secondary]);

  const defaultAlias = aliases.find((a) => a.is_default) || aliases[0] || null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pré-visualização ao vivo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Como o app aparece para o time e clientes deste tenant. Logo, paleta, domínio e e-mails são aplicados como nas telas reais.
          </p>
        </CardHeader>
        <CardContent>
          {/* Mock app shell */}
          <div className="rounded-xl border overflow-hidden shadow-sm">
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: primary, color: fgOnPrimary }}
            >
              <div className="flex items-center gap-3">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="logo" className="h-8 w-auto bg-white/10 rounded px-1 py-0.5" />
                ) : (
                  <div className="h-8 w-8 rounded bg-white/20 grid place-items-center text-xs font-bold">
                    {brandName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="font-semibold text-sm">{brandName}</div>
                  <div className="text-xs opacity-80">{domain}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 opacity-90" />
                <div className="h-7 w-7 rounded-full bg-white/20 grid place-items-center text-xs font-medium">
                  AM
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] min-h-[320px]">
              {/* Sidebar */}
              <aside className="border-r bg-muted/30 p-3 space-y-1 text-sm">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: Users, label: "Clientes" },
                  { icon: Mail, label: "Comunicação" },
                  { icon: Globe, label: "Site público" },
                  { icon: Settings, label: "Ajustes" },
                ].map((it) => (
                  <div
                    key={it.label}
                    className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors"
                    style={
                      it.active
                        ? { background: secondary, color: fgOnSecondary }
                        : undefined
                    }
                  >
                    <it.icon className="h-4 w-4" />
                    <span>{it.label}</span>
                  </div>
                ))}
              </aside>

              {/* Content */}
              <div className="p-5 bg-background space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Bem-vindo de volta 👋</h3>
                    <p className="text-sm text-muted-foreground">
                      Este é o painel do {brandName}. Aqui vai a operação do dia.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    style={{ background: primary, color: fgOnPrimary, borderColor: primary }}
                  >
                    Nova ação <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Clientes ativos", value: "1.284" },
                    { label: "Receita do mês", value: "R$ 87,5k" },
                    { label: "Tickets abertos", value: "12" },
                  ].map((m, i) => (
                    <div
                      key={m.label}
                      className="rounded-lg border p-3"
                      style={i === 0 ? { borderColor: primary } : undefined}
                    >
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-xl font-bold mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge style={{ background: primary, color: fgOnPrimary }}>Primária</Badge>
                  <Badge style={{ background: secondary, color: fgOnSecondary }}>Secundária</Badge>
                  <Badge variant="outline" style={{ borderColor: primary, color: primary }}>
                    Outline
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email signature preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assinatura de e-mail</CardTitle>
          <p className="text-sm text-muted-foreground">
            Como os e-mails enviados pelo tenant aparecem na caixa do destinatário.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 max-w-2xl">
            <div className="text-xs text-muted-foreground mb-1">De:</div>
            <div className="font-medium text-sm mb-3">
              {brandName} &lt;
              <span className="text-foreground">
                {defaultAlias?.full_address || `contato@${domain}`}
              </span>
              &gt;
            </div>
            <div className="text-xs text-muted-foreground mb-1">Assunto:</div>
            <div className="font-medium text-sm mb-4">Bem-vindo(a) ao {brandName} 🎉</div>

            <div className="border-t pt-4 text-sm space-y-3">
              <p>Olá Ana,</p>
              <p>É um prazer ter você conosco. Sua conta no <strong>{brandName}</strong> já está ativa e pronta pra uso.</p>

              <div
                className="rounded-md px-4 py-3 text-sm inline-flex items-center gap-2"
                style={{ background: primary, color: fgOnPrimary }}
              >
                Acessar minha conta <ChevronRight className="h-3.5 w-3.5" />
              </div>

              <div className="border-t pt-3 mt-4 flex items-center gap-3">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="logo" className="h-10 w-auto" />
                ) : (
                  <div
                    className="h-10 w-10 rounded grid place-items-center font-bold text-sm"
                    style={{ background: primary, color: fgOnPrimary }}
                  >
                    {brandName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-xs leading-tight">
                  <div className="font-semibold" style={{ color: primary }}>{brandName}</div>
                  <div className="text-muted-foreground">{defaultAlias?.full_address || `contato@${domain}`}</div>
                  <div className="text-muted-foreground">{domain}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContrastReport primary={primary} secondary={secondary} />

      <BrandKitExport
        brandName={brandName}
        primary={primary}
        secondary={secondary}
        domain={domain === "—" ? "" : domain}
        logoUrl={company?.logo_url ?? null}
        defaultEmail={defaultAlias?.full_address || (domain && domain !== "—" ? `contato@${domain}` : "")}
      />
    </div>
  );
}

/** Retorna #000 ou #fff com base na luminância percebida da cor de fundo. */
function contrastingTextColor(hex: string): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 3 && h.length !== 6) return "#fff";
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Luminância relativa simplificada
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}
