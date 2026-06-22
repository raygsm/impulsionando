import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const loadRioMedDossier = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: company } = await supabase
      .from("companies")
      .select("id,name,legal_name,subdomain,domain,address_city,address_state,status_commercial,status_financial,status_technical,primary_color,secondary_color")
      .eq("subdomain", "riomed")
      .maybeSingle();
    if (!company) return { company: null, modules: [], identity: null, pipelines: [] };

    const [{ data: identity }, { data: modules }, { data: pipelines }] = await Promise.all([
      supabase.from("core_tenant_identity").select("*").eq("company_id", company.id).maybeSingle(),
      supabase
        .from("company_modules")
        .select("is_enabled,enabled_at,modules(slug,name)")
        .eq("company_id", company.id)
        .order("enabled_at", { ascending: false }),
      supabase
        .from("crm_pipelines")
        .select("id,name,description,is_default,sort_order")
        .eq("company_id", company.id)
        .order("sort_order"),
    ]);
    return { company, identity, modules: modules ?? [], pipelines: pipelines ?? [] };
  });

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed")({
  head: () => ({ meta: [{ title: "RioMed — Tenant Master · Impulsionando" }] }),
  component: RioMedDossier,
});

function RioMedDossier() {
  const fetchDossier = useServerFn(loadRioMedDossier);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tenant", "riomed"],
    queryFn: () => fetchDossier(),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando dossiê RioMed…</div>;
  if (!data?.company) return <div className="p-8">Tenant RioMed não provisionado.</div>;

  const { company, identity, modules, pipelines } = data;
  const meta = (identity?.metadata as Record<string, unknown>) ?? {};

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.legal_name} · {company.address_city}/{company.address_state}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Subdomínio: <code className="px-1 bg-muted rounded">{identity?.full_domain ?? `${company.subdomain}.impulsionando.com.br`}</code>
          </p>
        </div>
        <div className="text-right text-xs space-y-1">
          <Badge label="Comercial" value={company.status_commercial} />
          <Badge label="Financeiro" value={company.status_financial} />
          <Badge label="Técnico" value={company.status_technical} />
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="País" value={String(meta.country ?? "—")} />
        <Stat label="Idioma" value={String(meta.language ?? "—")} />
        <Stat label="Moeda" value={String(meta.currency ?? "—")} />
        <Stat label="Plano" value={String(meta.plan ?? "—")} />
        <Stat label="Taxa Impulsionando" value={`${meta.taxa_intermediacao_pct ?? "—"}%`} />
        <Stat label="DNS" value={identity?.dns_status ?? "—"} />
        <Stat label="SSL" value={identity?.ssl_status ?? "—"} />
        <Stat label="Funis CRM" value={String(pipelines.length)} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Módulos ativos ({modules.filter((m: any) => m.is_enabled).length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {modules.map((m: any) => (
            <div key={m.modules?.slug} className="border rounded px-3 py-2 flex justify-between items-center">
              <span>{m.modules?.name ?? m.modules?.slug}</span>
              <span className={`text-xs ${m.is_enabled ? "text-green-600" : "text-muted-foreground"}`}>
                {m.is_enabled ? "ativo" : "inativo"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Funis CRM</h2>
        <ul className="space-y-1 text-sm">
          {pipelines.map((p: any) => (
            <li key={p.id} className="border rounded px-3 py-2">
              <span className="font-medium">{p.name}</span>
              {p.is_default && <span className="ml-2 text-xs text-primary">padrão</span>}
              <p className="text-xs text-muted-foreground">{p.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border rounded p-4 bg-muted/30 text-sm">
        <h3 className="font-semibold mb-2">Próximas fases planejadas</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Importação de dados (CSV `;` / XLSX, ES/PT, dedupe, dry-run)</li>
          <li>Estoque multi-almoxarifado + categorias médicas</li>
          <li>Motor de distribuição de leads (7 estratégias)</li>
          <li>Loja virtual + outlet + carrinho abandonado + recuperação de pagamento</li>
          <li>Locação (assets, contratos, checklist) + Assistência Técnica (OS, laudo)</li>
          <li>Templates ES-BO + jornadas B2C/B2B/Técnica/Locação + agente IA</li>
          <li>Dashboards, permissões, marketplace, domínio próprio</li>
        </ol>
        <p className="text-xs mt-3">Doc completo: <code>docs/CORE_RIOMED_TENANT.md</code></p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
