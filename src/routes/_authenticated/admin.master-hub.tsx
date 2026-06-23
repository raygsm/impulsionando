// Hub canônico da Administração Master.
// Vertentes: "Gestão Impulsionando" (core/produto) e "Gestão Clientes" (tenants).
// Consome `core_admin_menu` + `companies` em tempo real e organiza:
//  - Impulsionando: grupos por finalidade (Visão, Plataforma, Integrações, etc.)
//  - Clientes: Diretório vivo de tenants + Gestão Geral cross-tenant
//             + módulos legados por tenant (riomed_*, etc.) embutidos no card.
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listAdminMenu,
  listAdminHubTenants,
  type AdminMenuGroup,
  type AdminMenuItem,
  type AdminHubTenant,
} from "@/lib/admin-menu.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Building2,
  Crown,
  ArrowRight,
  AlertTriangle,
  Search,
  ExternalLink,
  Users,
  Boxes,
  CircleDot,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/master-hub")({
  head: () => ({ meta: [{ title: "Administração Master · Impulsionando" }] }),
  component: AdminMasterHub,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center gap-2 text-destructive mb-3">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Erro na Administração Master</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">Hub não encontrado.</div>,
});

function AdminMasterHub() {
  const fetchMenu = useServerFn(listAdminMenu);
  const fetchTenants = useServerFn(listAdminHubTenants);

  const menuQ = useQuery({
    queryKey: ["admin-master-hub", "menu"],
    queryFn: () => fetchMenu({ data: {} }),
    staleTime: 30_000,
  });
  const tenantsQ = useQuery({
    queryKey: ["admin-master-hub", "tenants"],
    queryFn: () => fetchTenants({ data: {} }),
    staleTime: 30_000,
  });

  const groups: AdminMenuGroup[] = menuQ.data?.groups ?? [];
  const tenants: AdminHubTenant[] = tenantsQ.data?.tenants ?? [];

  const impGroups = useMemo(
    () => groups.filter((g) => g.vertente === "impulsionando"),
    [groups],
  );
  // Em "Clientes": separar Gestão Geral (group_order < 100) dos grupos legados
  // por tenant (>= 100, ex.: riomed_*).
  const cliGeneral = useMemo(
    () => groups.filter((g) => g.vertente === "clientes" && g.group_order < 100),
    [groups],
  );
  const cliPerTenant = useMemo(
    () => groups.filter((g) => g.vertente === "clientes" && g.group_order >= 100),
    [groups],
  );

  const [tenantFilter, setTenantFilter] = useState("");
  const filteredTenants = useMemo(() => {
    const q = tenantFilter.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.slug ?? "").toLowerCase().includes(q),
    );
  }, [tenants, tenantFilter]);

  const isLoading = menuQ.isLoading || tenantsQ.isLoading;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Administração Master</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Duas vertentes: <strong>Gestão Impulsionando</strong> (produto, plataforma,
            comercial) e <strong>Gestão Clientes</strong> (todos os tenants — CHRISMED,
            RioMed e os demais — com seus módulos integrados).
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/cockpit-tenants">
            <Button variant="outline" size="sm" className="gap-1">
              <Layers className="h-4 w-4" /> Cockpit
            </Button>
          </Link>
          <Link to="/admin/menu-manager">
            <Button variant="outline" size="sm">
              Gerenciar menu
            </Button>
          </Link>
        </div>
      </header>

      <Tabs defaultValue="impulsionando" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-2">
          <TabsTrigger value="impulsionando" className="gap-2">
            <Crown className="h-4 w-4" /> Gestão Impulsionando
            <Badge variant="secondary" className="ml-1">
              {impGroups.reduce((acc, g) => acc + g.items.length, 0)}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Building2 className="h-4 w-4" /> Gestão Clientes
            <Badge variant="secondary" className="ml-1">
              {tenants.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ───────────── IMPULSIONANDO ───────────── */}
        <TabsContent value="impulsionando" className="mt-6 space-y-4">
          {isLoading ? (
            <SkeletonGrid />
          ) : impGroups.length === 0 ? (
            <Empty label="Nenhum item habilitado nesta vertente." />
          ) : (
            <VerticalGrid groups={impGroups} accent="from-amber-500/10 to-amber-500/0" />
          )}
        </TabsContent>

        {/* ───────────── CLIENTES ───────────── */}
        <TabsContent value="clientes" className="mt-6 space-y-8">
          {/* 1) Diretório de tenants */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Tenants ativos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cada cliente é um cockpit completo — abra para acessar módulos,
                  domínio, financeiro, governança.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  placeholder="Filtrar cliente…"
                  className="pl-7 h-8 text-sm"
                />
              </div>
            </div>

            {tenantsQ.isLoading ? (
              <SkeletonGrid />
            ) : filteredTenants.length === 0 ? (
              <Empty label="Nenhum tenant ativo encontrado." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredTenants.map((t) => (
                  <TenantCard
                    key={t.id}
                    tenant={t}
                    legacyGroups={cliPerTenant.filter((g) =>
                      g.group_key.startsWith(`${t.slug.toLowerCase()}_`),
                    )}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 2) Gestão Geral cross-tenant */}
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Gestão geral (cross-tenant)
              </h2>
              <p className="text-xs text-muted-foreground">
                Operações que valem para todos os clientes — diretório, ciclo de
                vida, financeiro consolidado, conteúdo e inteligência de público.
              </p>
            </div>
            {menuQ.isLoading ? (
              <SkeletonGrid />
            ) : cliGeneral.length === 0 ? (
              <Empty label="Nenhum item habilitado." />
            ) : (
              <VerticalGrid groups={cliGeneral} accent="from-sky-500/10 to-sky-500/0" />
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ───────────────────────────────────────────────
// Componentes auxiliares
// ───────────────────────────────────────────────

function VerticalGrid({
  groups,
  accent,
}: {
  groups: AdminMenuGroup[];
  accent: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map((g) => (
        <Card
          key={`${g.vertente}-${g.group_key}`}
          className={`bg-gradient-to-br ${accent} hover:shadow-sm transition-shadow`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{g.group_label}</span>
              <Badge variant="outline" className="ml-2 text-[10px]">
                {g.items.length}
              </Badge>
            </CardTitle>
            <CardDescription className="sr-only">{g.group_label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {g.items.map((it) => (
              <MenuLink key={it.id} item={it} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MenuLink({ item }: { item: AdminMenuItem }) {
  return (
    <Link
      to={item.route as any}
      className="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted/60 transition-colors group"
    >
      <span className="flex flex-col min-w-0">
        <span className="font-medium truncate">{item.item_label}</span>
        {item.description ? (
          <span className="text-xs text-muted-foreground truncate">
            {item.description}
          </span>
        ) : null}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

function TenantCard({
  tenant,
  legacyGroups,
}: {
  tenant: AdminHubTenant;
  legacyGroups: AdminMenuGroup[];
}) {
  const cockpitHref = `/admin/clientes/${tenant.slug}` as const;
  const siteHref = `https://${tenant.slug}.impulsionando.com.br`;
  return (
    <Card className="overflow-hidden border-muted-foreground/10 hover:border-primary/40 hover:shadow-elegant transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-muted/60 border flex items-center justify-center overflow-hidden flex-shrink-0">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logo_url}
                alt={`${tenant.name} logo`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-tight truncate flex items-center gap-2">
              {tenant.name}
              {tenant.is_demo ? (
                <Badge variant="outline" className="text-[10px]">demo</Badge>
              ) : null}
            </CardTitle>
            <CardDescription className="truncate">
              <code className="text-[11px]">{tenant.slug}</code>
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
          <StatusBadge label="com" value={tenant.status_commercial} />
          <StatusBadge label="fin" value={tenant.status_financial} />
          <StatusBadge label="tec" value={tenant.status_technical} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric icon={<Boxes className="h-3.5 w-3.5" />} label="módulos" value={tenant.modules_count} />
          <Metric icon={<Users className="h-3.5 w-3.5" />} label="usuários" value={tenant.users_count} />
          <Metric icon={<CircleDot className="h-3.5 w-3.5" />} label="clientes" value={tenant.customers_count} />
        </div>

        <div className="flex items-center gap-2">
          <Link to={cockpitHref} className="flex-1">
            <Button size="sm" className="w-full gap-1">
              Abrir cockpit <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <a href={siteHref} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="px-2" title="Abrir site">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {legacyGroups.length > 0 ? (
          <Accordion type="single" collapsible className="-mx-1">
            <AccordionItem value="modules" className="border-none">
              <AccordionTrigger className="py-1.5 px-1 text-xs font-medium text-muted-foreground hover:no-underline">
                Módulos detalhados ({legacyGroups.reduce((a, g) => a + g.items.length, 0)})
              </AccordionTrigger>
              <AccordionContent className="px-1 pt-1 space-y-2">
                {legacyGroups.map((g) => (
                  <div key={g.group_key} className="space-y-0.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                      {g.group_label.replace(/^[^·]+·\s*\d+\s*/, "")}
                    </div>
                    {g.items.map((it) => (
                      <MenuLink key={it.id} item={it} />
                    ))}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="border rounded-md px-2 py-1.5 flex flex-col items-start">
      <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
        {icon} {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function StatusBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  const tone =
    value === "active" || value === "ok" || value === "healthy"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : value === "warning" || value === "trial"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
        : value === "blocked" || value === "overdue" || value === "error"
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-muted text-muted-foreground border-muted-foreground/10";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${tone}`}>
      <span className="uppercase tracking-wide">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-md border bg-muted/30 animate-pulse" />
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
      {label}
    </p>
  );
}
