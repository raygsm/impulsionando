import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Building2, ExternalLink, Globe, Crown, Brain, Rocket, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canonicalClientHost, resolveClientCompanyBySlug } from "@/lib/client-registry";

const loadClientHeader = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const resolved = await resolveClientCompanyBySlug(context.supabase as any, data.slug);
    if (!resolved) return { registry: null, company: null, brainStatus: null };

    let brainStatus: string | null = null;
    if (resolved.company?.id) {
      const { data: brain } = await (context.supabase as any)
        .from("core_ai_brains")
        .select("status")
        .eq("company_id", resolved.company.id)
        .maybeSingle();
      brainStatus = brain?.status ?? null;
    }

    return {
      registry: resolved.registry,
      company: resolved.company,
      brainStatus,
    };
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

function ClienteWorkspaceLayout() {
  const { slug } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchHeader = useServerFn(loadClientHeader);
  const { data, isLoading } = useQuery({
    queryKey: ["cliente-header", slug],
    queryFn: () => fetchHeader({ data: { slug } }),
    staleTime: 60_000,
  });

  const tabs = buildTabs(slug);
  const isActive = (t: TabDef) =>
    t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");

  const company = data?.company;
  const registry = data?.registry;
  const brainStatus = data?.brainStatus;
  const domain = registry ? canonicalClientHost(registry.slug) : null;
  const courtesyStatus = (company as any)?.full_courtesy_status as string | undefined;
  const courtesyEndsAt = (company as any)?.full_courtesy_ends_at as string | undefined;
  const courtesyActive = courtesyStatus === "active";
  const courtesyDaysLeft = (() => {
    if (!courtesyActive || !courtesyEndsAt) return null;
    const end = new Date(courtesyEndsAt).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
  })();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="px-4 pb-2 pt-3 sm:px-6 lg:px-8">
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/companies" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
              <ChevronLeft className="h-3 w-3" /> Clientes
            </Link>
            <span aria-hidden>/</span>
            <span className="truncate font-mono">{slug}</span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-card ring-1 ring-border">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={`Logo de ${company.name}`} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="flex truncate text-xl font-semibold sm:text-2xl">
                  {isLoading ? (
                    <Skeleton className="h-7 w-56" />
                  ) : (
                    <span className="truncate">{company?.name ?? registry?.display_name ?? "Cliente não vinculado"}</span>
                  )}
                </h1>
                {company && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{company.legal_name ?? company.name}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {registry && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(registry.active ? "ok" : "bad")}`}>
                      <span className="font-medium">Registry</span><span aria-hidden>·</span>{registry.active ? "ativo" : "inativo"}
                    </span>
                  )}
                  {company?.is_demo && <Badge variant="outline" className="text-[10px]">demo</Badge>}
                  {company && !company.is_active && <Badge variant="destructive" className="text-[10px]">inativo</Badge>}
                  {company && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(company.is_active ? "ok" : "bad")}`}>
                      <span className="font-medium">Cadastro</span><span aria-hidden>·</span>{company.status ?? (company.is_active ? "active" : "inactive")}
                    </span>
                  )}
                  {courtesyActive && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass("warn")}`}>
                      <Crown className="h-3 w-3" aria-hidden /> Cortesia Full{courtesyDaysLeft !== null ? ` · ${courtesyDaysLeft}d` : ""}
                    </span>
                  )}
                  {brainStatus && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass(brainStatus === "active" ? "ok" : "muted")}`}>
                      <Brain className="h-3 w-3" aria-hidden /> Cérebro IA · {brainStatus}
                    </span>
                  )}
                  {domain && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ${toneClass("muted")}`}>
                      <Globe className="h-3 w-3" aria-hidden /><code className="font-mono">{domain}</code>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {registry && (
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                {domain && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /><span className="hidden sm:inline">Abrir site</span>
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/clientes/$slug/painel" params={{ slug }}>
                    <Rocket className="h-3.5 w-3.5" /><span className="hidden sm:inline">Painel</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {registry && !company && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              Este cliente está ativo no registry de comunicação, mas ainda não possui vínculo com um cadastro central de empresa.
            </div>
          )}
        </div>

        <nav aria-label="Áreas do Cliente 360" className="-mb-px overflow-x-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex gap-1 text-sm">
            {tabs.map((t) => {
              const active = isActive(t);
              return (
                <li key={t.key}>
                  <Link
                    to={t.to}
                    aria-current={active ? "page" : undefined}
                    className={`inline-block whitespace-nowrap border-b-2 px-3 py-2 transition-colors ${active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="flex-1"><Outlet /></div>
    </div>
  );
}
