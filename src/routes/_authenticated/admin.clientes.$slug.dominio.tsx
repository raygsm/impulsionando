import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  ExternalLink,
  GitCommit,
} from "lucide-react";
import { BUILD_INFO } from "@/generated/build-info";
import { markTenantPublished, listTenantDeployHistory } from "@/lib/tenant-publish.functions";
import { toast } from "sonner";

/**
 * Painel consolidado de domínio/DNS/SSL/build por tenant — Onda E.
 * Substitui a navegação espalhada entre /core/dominios e /admin/deploy-status
 * com uma visão única por cliente: DNS records esperados, status atual do tenant
 * (status_technical, dns_status, ssl_status em core_tenant_identity) e verificação
 * ao vivo do commit publicado no domínio configurado.
 */

const loadTenantDomain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: company } = await supabase
      .from("companies")
      .select(
        "id,name,subdomain,domain,status,status_technical,is_active,address_city,address_state",
      )
      .eq("subdomain", data.slug)
      .maybeSingle();
    if (!company) return { company: null, identity: null };
    const { data: identity } = await supabase
      .from("core_tenant_identity")
      .select(
        "full_domain,custom_domain,dns_status,ssl_status,ssl_issued_at,provisioned_at,published_at,published_commit",
      )
      .eq("company_id", company.id)
      .maybeSingle();
    return { company, identity };
  });

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/dominio")({
  head: () => ({ meta: [{ title: "Domínio do cliente · Impulsionando" }] }),
  component: TenantDomainPage,
});

function TenantDomainPage() {
  const { slug } = Route.useParams();
  const fetchTenant = useServerFn(loadTenantDomain);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tenant-domain", slug],
    queryFn: () => fetchTenant({ data: { slug } }),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Carregando dossiê de domínio…
      </div>
    );
  }
  if (!data?.company) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Tenant não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Slug informado (<code>{slug}</code>) não corresponde a um cliente ativo.
        </p>
      </div>
    );
  }

  const { company, identity } = data;
  const expectedDomain =
    company.domain ??
    identity?.full_domain ??
    `${company.subdomain}.impulsionando.com.br`;
  const url = `https://${expectedDomain}`;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" /> {company.name} · Domínio
          </h1>
          <p className="text-sm text-muted-foreground">
            {company.address_city}/{company.address_state} · status técnico:{" "}
            <code>{company.status_technical ?? "—"}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
          </Button>
          <MarkPublishedButton slug={slug} onDone={() => refetch()} />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm text-primary underline"
          >
            Abrir <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DNS esperado (Lovable Hosting)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="A">
            <code>{expectedDomain}</code> → <code>185.158.133.1</code>
          </Row>
          <Row label="TXT">
            <code>_lovable.{expectedDomain}</code> → <code>lovable_verify=&lt;token&gt;</code>
          </Row>
          <p className="text-xs text-muted-foreground pt-2">
            Configure no DNS do registrador. Após propagar, a Lovable provisiona SSL
            automaticamente (até 72h).
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
        <Stat label="DNS" value={identity?.dns_status ?? "—"} />
        <Stat label="SSL" value={identity?.ssl_status ?? "—"} />
        <Stat
          label="Provisionado em"
          value={
            identity?.provisioned_at
              ? new Date(identity.provisioned_at as string).toLocaleString("pt-BR")
              : "—"
          }
        />
        <Stat
          label="Último deploy"
          value={
            identity?.published_at
              ? new Date(identity.published_at as string).toLocaleString("pt-BR")
              : "—"
          }
        />
        <Stat
          label="Commit publicado"
          value={
            identity?.published_commit
              ? identity.published_commit.slice(0, 7)
              : "—"
          }
        />
      </div>

      <LiveBuildCheck url={url} expectedCommit={BUILD_INFO.commit} />
      <DeployHistory slug={slug} />
    </div>
  );
}

function DeployHistory({ slug }: { slug: string }) {
  const fetchHistory = useServerFn(listTenantDeployHistory);
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-deploy-history", slug],
    queryFn: () => fetchHistory({ data: { slug, limit: 10 } }),
    staleTime: 30_000,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de deploys</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !data?.rows.length ? (
          <p className="text-muted-foreground">
            Nenhuma promoção registrada ainda. Use “Marcar deploy agora” após o publish.
          </p>
        ) : (
          <ul className="divide-y">
            {data.rows.map((r: any) => {
              const commit = r.after?.published_commit?.slice(0, 7) ?? "—";
              const prev = r.before?.published_commit?.slice(0, 7);
              return (
                <li key={r.id} className="py-2 flex items-baseline gap-3">
                  <span className="text-xs text-muted-foreground w-40 shrink-0">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </span>
                  <code className="text-xs">{commit}</code>
                  {prev ? (
                    <span className="text-xs text-muted-foreground">
                      (de <code>{prev}</code>)
                    </span>
                  ) : null}
                  {r.user_email ? (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {r.user_email}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LiveBuildCheck({
  url,
  expectedCommit,
}: {
  url: string;
  expectedCommit: string;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    commit?: string;
    builtAt?: string;
    latencyMs?: number;
  }>({ loading: false });

  async function check() {
    setState({ loading: true });
    const t0 = performance.now();
    try {
      const res = await fetch(`${url}/api/public/version`, { cache: "no-store" });
      const body = await res.json();
      setState({
        loading: false,
        commit: body.commitShort ?? body.commit,
        builtAt: body.builtAt,
        latencyMs: Math.round(performance.now() - t0),
      });
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? String(e) });
    }
  }

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const inSync =
    !!state.commit && state.commit.startsWith(expectedCommit.slice(0, 7));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitCommit className="h-4 w-4" /> Verificação ao vivo do build publicado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {state.loading ? (
          <p className="text-muted-foreground">Consultando {url}…</p>
        ) : state.error ? (
          <p className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Falhou: {state.error}
          </p>
        ) : (
          <>
            <Row label="Commit publicado">
              <code>{state.commit ?? "—"}</code>
              {inSync ? (
                <span className="ml-2 inline-flex items-center text-green-600 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> em dia
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center text-amber-600 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" /> divergente (esperado{" "}
                  {expectedCommit.slice(0, 7)})
                </span>
              )}
            </Row>
            <Row label="Construído em">
              {state.builtAt
                ? new Date(state.builtAt).toLocaleString("pt-BR")
                : "—"}
            </Row>
            <Row label="Latência">{state.latencyMs} ms</Row>
          </>
        )}
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={check}>
            <RefreshCw className="h-3 w-3 mr-1" /> Verificar implantação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground w-32">
        {label}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function MarkPublishedButton({
  slug,
  onDone,
}: {
  slug: string;
  onDone: () => void;
}) {
  const mark = useServerFn(markTenantPublished);
  const [busy, setBusy] = useState(false);
  async function handle() {
    setBusy(true);
    try {
      const res = await mark({
        data: { slug, commit: BUILD_INFO.commit, builtAt: BUILD_INFO.builtAt },
      });
      toast.success(`Tenant marcado como publicado · ${res.commit.slice(0, 7)}`);
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao marcar deploy");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="default" size="sm" disabled={busy} onClick={handle}>
      <GitCommit className="h-3 w-3 mr-1" />
      {busy ? "Marcando…" : "Marcar deploy agora"}
    </Button>
  );
}
