import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { listTenantPublications } from "@/lib/tenant-publication.functions";
import { listHomologacaoTenants, TENANT_HOMOLOGACAO } from "@/data/tenant-homologacao";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicationStateBadge, derivePublicationState } from "@/components/core/PublicationStateBadge";
import { Building2, Globe, ExternalLink, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenants/")({
  head: () => ({
    meta: [
      { title: "Tenants — Ecossistema Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: TenantsIndex,
});

function TenantsIndex() {
  const listPub = useServerFn(listTenantPublications);
  const { data: pubs, isLoading } = useQuery({
    queryKey: ["tenant-publications-index"],
    queryFn: () => listPub(),
    staleTime: 30_000,
  });

  const homologTenants = listHomologacaoTenants();
  const rows = homologTenants.map((h) => {
    const pub = (pubs ?? []).find(
      (p: any) =>
        p.company?.subdomain === h.slug ||
        (typeof p.company?.domain === "string" && p.company.domain.includes(h.slug)),
    );
    return { manifest: h, pub };
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Tenants do Ecossistema
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos os tenants ativos do core Impulsionando. Acompanhe status de homologação, domínio custom e
          publicação. Este dashboard é 100% visual — para ações use{" "}
          <Link to={"/core/publicacao" as any} className="underline text-primary">
            Core → Publicação
          </Link>
          .
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ manifest, pub }) => {
          const state = derivePublicationState(pub?.state ?? null);
          const domain = pub?.company?.domain ?? manifest.expectedDomain;
          const dnsOk = pub?.state?.dns_ok ?? null;
          const sslOk = pub?.state?.ssl_ok ?? null;
          return (
            <Card key={manifest.slug} className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">{manifest.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{manifest.slug}</div>
                </div>
                <PublicationStateBadge state={state} />
              </div>

              <div className="text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-xs truncate">{domain}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusChip label="DNS" ok={dnsOk} />
                  <StatusChip label="SSL" ok={sslOk} />
                  <StatusChip label="Supabase" ok={pub?.state?.supabase_ok ?? null} />
                  <Badge variant="outline" className="text-[10px]">
                    {manifest.pages.length} páginas
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t">
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir
                  </a>
                </Button>
                <Button size="sm" asChild className="flex-1">
                  <Link
                    to={"/tenants/$slug/homologacao" as any}
                    params={{ slug: manifest.slug } as any}
                  >
                    Homologação <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}

        {!isLoading && rows.length === 0 && (
          <Card className="p-8 col-span-full text-center text-sm text-muted-foreground">
            Nenhum tenant registrado ainda.
          </Card>
        )}
      </section>

      {(pubs ?? []).some(
        (p: any) => !homologTenants.find((h) => h.slug === p.company?.subdomain),
      ) && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Outros tenants registrados
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(pubs ?? [])
              .filter((p: any) => !homologTenants.find((h) => h.slug === p.company?.subdomain))
              .map((p: any) => (
                <Card key={p.company.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.company.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {p.company.domain ?? p.company.subdomain ?? "—"}
                    </div>
                  </div>
                  <PublicationStateBadge state={derivePublicationState(p.state)} />
                </Card>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusChip({ label, ok }: { label: string; ok: boolean | null }) {
  const cls =
    ok === true
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      : ok === false
        ? "bg-rose-500/15 text-rose-700 border-rose-500/30"
        : "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={`text-[10px] ${cls}`}>
      {label}: {ok === true ? "OK" : ok === false ? "falha" : "—"}
    </Badge>
  );
}
