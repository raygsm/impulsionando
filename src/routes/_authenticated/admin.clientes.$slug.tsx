import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Building2, ExternalLink } from "lucide-react";
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
        "id,name,legal_name,subdomain,domain,status,status_commercial,is_active,is_demo",
      )
      .eq("subdomain", data.slug)
      .maybeSingle();
    return { company };
  });

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug")({
  head: () => ({
    meta: [
      { title: "Workspace do Cliente — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TenantWorkspaceLayout,
});

type TabDef = { key: string; label: string; to: string; exact?: boolean };

function buildTabs(slug: string): TabDef[] {
  return [
    { key: "resumo", label: "Resumo", to: `/admin/clientes/${slug}`, exact: true },
    { key: "painel", label: "Painel", to: `/admin/clientes/${slug}/painel` },
    { key: "modulos", label: "Módulos", to: `/admin/clientes/${slug}/modulos` },
    { key: "financeiro", label: "Financeiro", to: `/admin/clientes/${slug}/financeiro` },
    { key: "crm", label: "CRM & Leads", to: `/admin/clientes/${slug}/crm` },
    { key: "automacoes", label: "Automações", to: `/admin/clientes/${slug}/automacoes` },
    { key: "dominio", label: "Domínio", to: `/admin/clientes/${slug}/dominio` },
    { key: "logs", label: "Logs & Auditoria", to: `/admin/clientes/${slug}/logs` },
    { key: "configuracoes", label: "Configurações", to: `/admin/clientes/${slug}/configuracoes` },
  ];
}

function TenantWorkspaceLayout() {
  const { slug } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchHeader = useServerFn(loadTenantHeader);
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-header", slug],
    queryFn: () => fetchHeader({ data: { slug } }),
    staleTime: 60_000,
  });

  const tabs = buildTabs(slug);
  const isActive = (t: TabDef) =>
    t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");

  const company = data?.company;
  const domain = company?.domain ?? (company ? `${company.subdomain}.impulsionando.com.br` : null);

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/companies" className="hover:underline">
                Clientes
              </Link>
              <span>/</span>
              <span className="font-mono">{slug}</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold flex items-center gap-2 truncate">
              <Building2 className="h-5 w-5 shrink-0" />
              {isLoading ? <Skeleton className="h-6 w-48" /> : company?.name ?? "Cliente não encontrado"}
              {company?.is_demo ? (
                <Badge variant="outline" className="text-[10px]">demo</Badge>
              ) : null}
              {company && !company.is_active ? (
                <Badge variant="destructive" className="text-[10px]">inativo</Badge>
              ) : null}
            </h1>
            {company ? (
              <p className="text-xs text-muted-foreground mt-1">
                <code className="px-1 bg-muted rounded">{domain}</code> · status:{" "}
                <code>{company.status ?? "—"}</code>
              </p>
            ) : null}
          </div>
          {domain ? (
            <Button asChild variant="outline" size="sm">
              <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                Abrir site <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ) : null}
        </div>
        <nav className="px-4 sm:px-6 lg:px-8 -mb-px overflow-x-auto">
          <ul className="flex gap-1 text-sm">
            {tabs.map((t) => {
              const active = isActive(t);
              return (
                <li key={t.key}>
                  <Link
                    to={t.to}
                    className={`inline-block px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${
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
