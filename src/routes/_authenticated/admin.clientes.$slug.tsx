import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Building2,
  ExternalLink,
  Globe,
  Crown,
  Brain,
  Rocket,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const loadTenantHeader = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: company } = await context.supabase
      .from("companies")
      .select(
        "id,name,legal_name,subdomain,domain,status,status_commercial,status_financial,status_technical,is_active,is_demo,niche_id,full_courtesy_status,full_courtesy_ends_at,logo_url",
      )
      .eq("subdomain", data.slug)
      .maybeSingle();

    let niche: { slug: string | null; name: string | null } | null = null;
    if (company?.niche_id) {
      const { data: n } = await context.supabase
        .from("niches")
        .select("slug,name")
        .eq("id", company.niche_id)
        .maybeSingle();
      niche = n ? { slug: n.slug ?? null, name: n.name ?? null } : null;
    }

    let brainStatus: string | null = null;
    if (company?.id) {
      const { data: brain } = await context.supabase
        .from("core_ai_brains")
        .select("status")
        .eq("company_id", company.id)
        .maybeSingle();
      brainStatus = (brain as { status?: string | null } | null)?.status ?? null;
    }

    return { company, niche, brainStatus };
  });

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug")({
  head: () => ({
    meta: [
      { title: "Cliente · Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ClienteWorkspaceLayout,
});

type TabDef = { key: string; label: string; to: string; exact?: boolean };

// Cliente 360 — 13 abas oficiais (Fase P2). Copy usa sempre "cliente/empresa".
function buildTabs(slug: string): TabDef[] {
  return [
    { key: "painel", label: "Painel", to: `/admin/clientes/${slug}/painel` },
    { key: "auditoria", label: "Auditoria Full", to: `/admin/clientes/${slug}/auditoria` },
    { key: "dados", label: "Dados", to: `/admin/clientes/${slug}/dados` },
    { key: "plano", label: "Plano e cortesia", to: `/admin/clientes/${slug}/plano` },
    { key: "modulos", label: "Módulos", to: `/admin/clientes/${slug}/modulos` },
    { key: "cerebro-ia", label: "Cérebro IA", to: `/admin/clientes/${slug}/cerebro-ia` },
    { key: "crm", label: "CRM", to: `/admin/clientes/${slug}/crm` },
    { key: "automacoes", label: "Automações", to: `/admin/clientes/${slug}/automacoes` },
    { key: "financeiro", label: "Financeiro", to: `/admin/clientes/${slug}/financeiro` },
    { key: "mercado-pago", label: "Mercado Pago", to: `/admin/clientes/${slug}/mercado-pago` },
    { key: "dominio", label: "Domínio", to: `/admin/clientes/${slug}/dominio` },
    { key: "publicacao", label: "Publicação", to: `/admin/clientes/${slug}/publicacao` },
    { key: "logs", label: "Logs", to: `/admin/clientes/${slug}/logs` },
    { key: "configuracoes", label: "Configurações", to: `/admin/clientes/${slug}/configuracoes` },
  ];
}

type StatusTone = "ok" | "warn" | "bad" | "muted";
function toneClass(tone: StatusTone) {
  switch (tone) {
    case "ok":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20";
    case "warn":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20";
    case "bad":
      return "bg-destructive/10 text-destructive ring-destructive/20";
    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}
function commercialTone(v: string | null | undefined): StatusTone {
  const s = (v ?? "").toLowerCase();
  if (["active", "ativo", "customer", "cliente"].includes(s)) return "ok";
  if (["trial", "cortesia", "onboarding"].includes(s)) return "warn";
  if (["churned", "cancelado", "inativo", "lost"].includes(s)) return "bad";
  return "muted";
}
function financialTone(v: string | null | undefined): StatusTone {
  const s = (v ?? "").toLowerCase();
  if (["ok", "adimplente", "paid"].includes(s)) return "ok";
  if (["pendente", "aguardando", "overdue_soon"].includes(s)) return "warn";
  if (["inadimplente", "overdue", "blocked", "vencido"].includes(s)) return "bad";
  return "muted";
}
function technicalTone(v: string | null | undefined): StatusTone {
  const s = (v ?? "").toLowerCase();
  if (["ok", "healthy", "operational"].includes(s)) return "ok";
  if (["degraded", "warning", "atencao"].includes(s)) return "warn";
  if (["down", "failing", "critico", "critical"].includes(s)) return "bad";
  return "muted";
}

function ClienteWorkspaceLayout() {
  const { slug } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchHeader = useServerFn(loadTenantHeader);
  const { data, isLoading } = useQuery({
    queryKey: ["cliente-header", slug],
    queryFn: () => fetchHeader({ data: { slug } }),
    staleTime: 60_000,
  });

  const tabs = buildTabs(slug);
  const isActive = (t: TabDef) =>
    t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");

  const company = data?.company;
  const niche = data?.niche;
  const brainStatus = data?.brainStatus;
  const domain = company?.domain ?? (company ? `${company.subdomain}.impulsionando.com.br` : null);
  const hasCustomDomain = !!(company?.domain && !company.domain.endsWith(".impulsionando.com.br"));

  const courtesyActive = company?.full_courtesy_status === "active";
  const courtesyDaysLeft = (() => {
    if (!courtesyActive || !company?.full_courtesy_ends_at) return null;
    const end = new Date(company.full_courtesy_ends_at).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
  })();

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Link
              to="/companies"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Clientes
            </Link>
            <span aria-hidden>/</span>
            <span className="font-mono truncate">{slug}</span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0 flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card ring-1 ring-border overflow-hidden">
                {company?.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`Logo de ${company.name}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold truncate flex items-center gap-2">
                  {isLoading ? (
                    <Skeleton className="h-7 w-56" />
                  ) : (
                    <>
                      <span className="truncate">{company?.name ?? "Cliente não encontrado"}</span>
                      {company?.is_demo && (
                        <Badge variant="outline" className="text-[10px] shrink-0">demo</Badge>
                      )}
                      {company && !company.is_active && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">inativo</Badge>
                      )}
                    </>
                  )}
                </h1>
                {company && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {company.legal_name ?? "—"}
                    {niche?.name ? <> · <span>{niche.name}</span></> : null}
                  </p>
                )}

                {/* Chips de status resumidos */}
                {company && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusChip
                      label="Comercial"
                      value={company.status_commercial}
                      tone={commercialTone(company.status_commercial)}
                    />
                    <StatusChip
                      label="Financeiro"
                      value={company.status_financial}
                      tone={financialTone(company.status_financial)}
                    />
                    <StatusChip
                      label="Técnico"
                      value={company.status_technical}
                      tone={technicalTone(company.status_technical)}
                    />
                    {courtesyActive && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(
                          "warn",
                        )}`}
                      >
                        <Crown className="h-3 w-3" aria-hidden />
                        Cortesia Full
                        {courtesyDaysLeft !== null ? ` · ${courtesyDaysLeft}d` : ""}
                      </span>
                    )}
                    {brainStatus && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(
                          brainStatus === "active" ? "ok" : "muted",
                        )}`}
                      >
                        <Brain className="h-3 w-3" aria-hidden />
                        Cérebro IA · {brainStatus}
                      </span>
                    )}
                    {domain && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(
                          hasCustomDomain ? "ok" : "muted",
                        )}`}
                      >
                        <Globe className="h-3 w-3" aria-hidden />
                        <code className="font-mono">{domain}</code>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ações rápidas — sempre com destino funcional */}
            {company && (
              <div className="flex flex-wrap gap-2 justify-end shrink-0">
                {domain && (
                  <Button asChild variant="outline" size="sm" aria-label="Abrir site do cliente em nova aba">
                    <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Abrir site</span>
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/clientes/$slug/painel" params={{ slug }}>
                    <Rocket className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Painel</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Áreas do Cliente 360" className="px-4 sm:px-6 lg:px-8 -mb-px overflow-x-auto scroll-contrast">
          <ul className="flex gap-1 text-sm">
            {tabs.map((t) => {
              const active = isActive(t);
              return (
                <li key={t.key}>
                  <Link
                    to={t.to}
                    aria-current={active ? "page" : undefined}
                    className={`inline-block px-3 py-2 border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      active
                        ? "border-primary text-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | null | undefined;
  tone: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(
        tone,
      )}`}
      title={`${label}: ${value ?? "—"}`}
    >
      <span className="font-medium">{label}</span>
      <span aria-hidden>·</span>
      <span className="truncate max-w-[8rem]">{value ?? "—"}</span>
    </span>
  );
}
