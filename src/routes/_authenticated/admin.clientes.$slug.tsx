import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  Boxes,
  Users,
  CreditCard,
  Workflow,
  ExternalLink,
  ShieldCheck,
  Languages,
} from "lucide-react";
import {
  getLocaleProfile,
  formatMoney,
  formatDateTime,
  TENANT_LOCALE_PROFILES,
  type CountryCode,
} from "@/lib/tenant-locale";


/**
 * Card unificado por tenant — Onda D do Core Impulsionando.
 * `/admin/clientes/$slug` é a porta de entrada de QUALQUER cliente, não
 * apenas RioMed. Mostra status (comercial, financeiro, técnico), módulos
 * ativos, contagem de usuários/clientes e atalhos para operação.
 *
 * Quando existe rota legada específica (ex.: `/admin/clientes/riomed`),
 * o card oferece um botão "Dossiê detalhado" para ela.
 */

const loadTenantOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: company } = await supabase
      .from("companies")
      .select(
        "id,name,legal_name,subdomain,domain,address_city,address_state,status,status_commercial,status_financial,status_technical,is_active,company_kind,is_demo,niche_id,country_code,locale,currency_code,phone_country_code,timezone",
      )
      .eq("subdomain", data.slug)
      .maybeSingle();
    if (!company) return { company: null };
    const [{ data: modules }, { count: customersCount }, { count: usersCount }] =
      await Promise.all([
        supabase
          .from("company_modules")
          .select("is_enabled, modules!inner(slug,name)")
          .eq("company_id", company.id)
          .eq("is_enabled", true),
        supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
      ]);
    return {
      company,
      modules: modules ?? [],
      customersCount: customersCount ?? 0,
      usersCount: usersCount ?? 0,
    };
  });

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug")({
  head: () => ({ meta: [{ title: "Cliente · Impulsionando" }] }),
  component: TenantOverviewPage,
});

// Slugs que têm dossiê dedicado preservado (rota legada).
const LEGACY_DOSSIER_SLUGS = new Set<string>([]); // /admin/clientes/riomed já é capturado pela rota estática.

function TenantOverviewPage() {
  const { slug } = Route.useParams();
  const fetchTenant = useServerFn(loadTenantOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-overview", slug],
    queryFn: () => fetchTenant({ data: { slug } }),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Carregando card do cliente…
      </div>
    );
  }
  if (!data?.company) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-lg font-semibold">Cliente não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Nenhum tenant ativo com slug <code>{slug}</code>.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="/companies">← Voltar à lista de tenants</a>
        </Button>
      </div>
    );
  }

  const { company, modules, customersCount, usersCount } = data;
  const domain =
    company.domain ?? `${company.subdomain}.impulsionando.com.br`;
  const hasLegacyDossier = LEGACY_DOSSIER_SLUGS.has(slug);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" /> {company.name}
            {company.is_demo ? (
              <span className="text-[10px] uppercase bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded">
                demo
              </span>
            ) : null}
            {!company.is_active ? (
              <span className="text-[10px] uppercase bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                inativo
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            {company.legal_name ?? "—"}
            {company.address_city
              ? ` · ${company.address_city}/${company.address_state ?? ""}`
              : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <code className="px-1 bg-muted rounded">{domain}</code> · status:{" "}
            <code>{company.status ?? "—"}</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasLegacyDossier ? (
            <Button asChild variant="default" size="sm">
              <a href={`/admin/clientes/${slug}`}>Dossiê detalhado →</a>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <a href={`https://${domain}`} target="_blank" rel="noreferrer">
              Abrir site <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Status comercial" value={company.status_commercial} />
        <Stat label="Status financeiro" value={company.status_financial} />
        <Stat label="Status técnico" value={company.status_technical} />
        <Stat label="Tipo de conta" value={company.company_kind} />
        <Stat label="Usuários" value={String(usersCount)} />
        <Stat label="Clientes finais" value={String(customersCount)} />
        <Stat label="Módulos ativos" value={String(modules.length)} />
        <Stat
          label="Domínio próprio"
          value={company.domain && !company.domain.endsWith(".impulsionando.com.br") ? "sim" : "não"}
        />
      </section>

      <LocaleStrip company={company} />

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <ActionCard
          icon={<Globe className="h-5 w-5" />}
          title="Domínio & Deploy"
          description="DNS, SSL, build publicado, verificação ao vivo."
          to={`/admin/clientes/${slug}/dominio`}
        />
        <ActionCard
          icon={<Boxes className="h-5 w-5" />}
          title="Módulos do tenant"
          description="Catálogo, instalação e configuração por nicho."
          to="/modules"
        />
        <ActionCard
          icon={<Users className="h-5 w-5" />}
          title="Usuários & Permissões"
          description="Acessos, perfis, RBAC do cliente."
          to="/users"
        />
        <ActionCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Financeiro do cliente"
          description="Plano, fatura, recorrência, inadimplência."
          to="/core/financeiro-consolidado"
        />
        <ActionCard
          icon={<Workflow className="h-5 w-5" />}
          title="Automações n8n"
          description="Réguas de funil, integrações ativas."
          to="/core/integracoes/n8n"
        />
        <ActionCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Governança & Auditoria"
          description="LGPD, audit trail, compliance do tenant."
          to="/admin/governance-lgpd-health"
        />
      </section>

      {modules.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Módulos ativos ({modules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {modules.map((m: any) => (
                <div
                  key={m.modules?.slug}
                  className="border rounded px-3 py-2"
                >
                  <div className="font-medium">
                    {m.modules?.name ?? m.modules?.slug}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <code>{m.modules?.slug}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <a
      href={to}
      className="border rounded-md p-4 hover:bg-muted/40 transition-colors block"
    >
      <div className="flex items-center gap-2 font-medium">
        {icon} {title}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </a>
  );
}

function LocaleStrip({
  company,
}: {
  company: {
    country_code?: string | null;
    locale?: string | null;
    currency_code?: string | null;
    phone_country_code?: string | null;
    timezone?: string | null;
  };
}) {
  const profile = getLocaleProfile(company);
  const now = new Date();
  return (
    <section className="border rounded-md p-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs bg-muted/30">
      <span className="inline-flex items-center gap-1 font-medium">
        <Languages className="h-3.5 w-3.5" /> {profile.countryName} · {profile.locale}
      </span>
      <span>
        Moeda: <code>{profile.currencyCode}</code> · ex {formatMoney(1234.5, profile)}
      </span>
      <span>
        DDI: <code>{profile.phoneCountryCode}</code>
      </span>
      <span>
        Fuso: <code>{profile.timezone}</code> · {formatDateTime(now, profile)}
      </span>
    </section>
  );
}
