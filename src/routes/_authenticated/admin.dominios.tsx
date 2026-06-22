// Cockpit de Domínios por Tenant — Onda I do Core Impulsionando.
// Lista todos os tenants ativos com status de DNS, SSL e deploy, e atalho
// para o painel detalhado `/admin/clientes/{slug}/dominio`.
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery } from "@tanstack/react-query";
import { Globe, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUILD_INFO } from "@/generated/build-info";

const loadDomainsCockpit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: companies } = await supabase
      .from("companies")
      .select("id,name,subdomain,domain,is_active,status_technical")
      .eq("is_active", true)
      .order("name");
    if (!companies?.length) return { rows: [] };
    const ids = companies.map((c) => c.id);
    const { data: identities } = await supabase
      .from("core_tenant_identity")
      .select(
        "company_id,full_domain,custom_domain,dns_status,ssl_status,provisioned_at,ssl_issued_at,published_at,published_commit",
      )
      .in("company_id", ids);
    const idx = new Map((identities ?? []).map((i) => [i.company_id, i]));
    return {
      rows: companies.map((c) => {
        const ident = idx.get(c.id) ?? null;
        const domain =
          ident?.custom_domain ??
          c.domain ??
          ident?.full_domain ??
          `${c.subdomain}.impulsionando.com.br`;
        return {
          id: c.id,
          name: c.name,
          slug: c.subdomain,
          domain,
          statusTechnical: c.status_technical,
          dnsStatus: ident?.dns_status ?? null,
          sslStatus: ident?.ssl_status ?? null,
          publishedAt: ident?.published_at ?? null,
          publishedCommit: ident?.published_commit ?? null,
          provisionedAt: ident?.provisioned_at ?? null,
        };
      }),
    };
  });

export const Route = createFileRoute("/_authenticated/admin/dominios")({
  head: () => ({ meta: [{ title: "Domínios & Deploy · Impulsionando" }] }),
  component: DomainsCockpitPage,
});

function DomainsCockpitPage() {
  const fetchCockpit = useServerFn(loadDomainsCockpit);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "dominios-cockpit"],
    queryFn: () => fetchCockpit(),
    staleTime: 60_000,
  });

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <header className="flex items-center justify-between border-b pb-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" /> Domínios & Deploy por Cliente
          </h1>
          <p className="text-sm text-muted-foreground">
            Status DNS, SSL e build publicado de todos os tenants ativos.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando tenants…</div>
      ) : !data?.rows.length ? (
        <div className="text-sm text-muted-foreground">Nenhum tenant ativo.</div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left p-2">Tenant</th>
                <th className="text-left p-2">Domínio</th>
                <th className="text-left p-2">DNS</th>
                <th className="text-left p-2">SSL</th>
                <th className="text-left p-2">Build</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const currentCommit = BUILD_INFO.commit;
                const inSync =
                  r.publishedCommit &&
                  currentCommit &&
                  r.publishedCommit.startsWith(currentCommit.slice(0, 7));
                return (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="p-2">
                    <div className="font-medium">{r.name}</div>
                    <code className="text-xs text-muted-foreground">{r.slug}</code>
                  </td>
                  <td className="p-2">
                    <code className="text-xs">{r.domain}</code>
                  </td>
                  <td className="p-2">
                    <StatusPill value={r.dnsStatus} />
                  </td>
                  <td className="p-2">
                    <StatusPill value={r.sslStatus} />
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {r.publishedAt
                      ? new Date(r.publishedAt).toLocaleDateString()
                      : "—"}
                    {r.publishedCommit ? (
                      <code className="ml-1">
                        {r.publishedCommit.slice(0, 7)}
                      </code>
                    ) : null}
                  </td>
                  <td className="p-2">
                    {!r.publishedCommit ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        sem registro
                      </span>
                    ) : inSync ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-700">
                        em dia
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                        divergente
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <a
                      href={`/admin/clientes/${r.slug}/dominio`}
                      className="text-xs underline text-primary"
                    >
                      detalhar
                    </a>
                    <a
                      href={`https://${r.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline inline-flex items-center gap-1"
                    >
                      abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  const ok = ["active", "verified", "issued", "provisioned", "ok"].includes(
    value.toLowerCase(),
  );
  const warn = ["pending", "verifying", "setting_up"].includes(value.toLowerCase());
  const cls = ok
    ? "bg-green-500/10 text-green-700"
    : warn
      ? "bg-amber-500/10 text-amber-700"
      : "bg-destructive/10 text-destructive";
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{value}</span>
  );
}
