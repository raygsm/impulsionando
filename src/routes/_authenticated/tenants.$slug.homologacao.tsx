import { createFileRoute, redirect, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import {
  listTenantPublications,
  validateTenantPublication,
} from "@/lib/tenant-publication.functions";
import { TENANT_HOMOLOGACAO } from "@/data/tenant-homologacao";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PublicationStateBadge,
  derivePublicationState,
} from "@/components/core/PublicationStateBadge";
import { PublicationValidationCard } from "@/components/core/PublicationValidationCard";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  RefreshCw,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenants/$slug/homologacao")({
  head: ({ params }) => ({
    meta: [
      { title: `Homologação — ${params.slug} · Impulsionando` },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ params }) => {
    if (!TENANT_HOMOLOGACAO[params.slug]) throw notFound();
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: TenantHomologacaoPage,
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Tenant não encontrado no manifesto de homologação.
    </div>
  ),
});

function TenantHomologacaoPage() {
  const { slug } = Route.useParams();
  const manifest = TENANT_HOMOLOGACAO[slug];

  const listPub = useServerFn(listTenantPublications);
  const validateFn = useServerFn(validateTenantPublication);

  const { data: pubs, refetch, isFetching } = useQuery({
    queryKey: ["tenant-publications-detail", slug],
    queryFn: () => listPub(),
    staleTime: 30_000,
  });

  const pub = useMemo(
    () =>
      (pubs ?? []).find(
        (p: any) =>
          p.company?.subdomain === slug ||
          (typeof p.company?.domain === "string" && p.company.domain.includes(slug)),
      ),
    [pubs, slug],
  );

  const companyId = pub?.company?.id;
  const state = derivePublicationState(pub?.state ?? null);
  const detail = pub?.state?.validation_detail ?? {};
  const domain = pub?.company?.domain ?? manifest.expectedDomain;

  const validateMut = useQuery({
    queryKey: ["tenant-validate", companyId, "trigger"],
    queryFn: () => validateFn({ data: { companyId: companyId! } }),
    enabled: false,
  });

  async function runValidation() {
    if (!companyId) return;
    await validateMut.refetch();
    await refetch();
  }

  const pagesTotal = manifest.pages.length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header className="space-y-3">
        <Link
          to={"/tenants" as any}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Tenants
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Homologação — {manifest.name}
            </h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Globe className="h-3.5 w-3.5" />
              <span className="font-mono">{domain}</span>
              <Badge variant="outline" className="text-[10px]">
                {manifest.slug}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PublicationStateBadge state={state} />
            <Button
              size="sm"
              variant="outline"
              onClick={runValidation}
              disabled={!companyId || isFetching || validateMut.isFetching}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1 ${validateMut.isFetching ? "animate-spin" : ""}`}
              />
              Revalidar DNS/SSL
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir domínio
              </a>
            </Button>
          </div>
        </div>
      </header>

      {!companyId && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5 text-sm">
          Nenhum registro em <code>companies</code> encontrado para{" "}
          <strong>{manifest.slug}</strong> ou <strong>{manifest.expectedDomain}</strong>. Cadastre o
          tenant no core antes de rodar a validação.
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Verificação de domínio custom (A / CAA / TXT)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PublicationValidationCard title="Domínio configurado" result={detail.domain} />
          <PublicationValidationCard title="DNS (A / CNAME / CAA / TXT _lovable)" result={detail.dns} />
          <PublicationValidationCard title="SSL / HTTPS" result={detail.ssl} />
          <PublicationValidationCard title="Supabase (resolve_tenant_by_host)" result={detail.supabase} />
          <PublicationValidationCard title="GitHub (workflows)" result={detail.github} />
          <PublicationValidationCard title="Envs obrigatórias" result={detail.env} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Checklist de páginas públicas
          </h2>
          <span className="text-xs text-muted-foreground">{pagesTotal} rotas</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {manifest.pages.map((p) => (
            <Card
              key={p.to}
              className="p-3 flex items-center justify-between gap-2 hover:border-primary/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.label}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{p.to}</div>
                {p.purpose && (
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5">{p.purpose}</div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" asChild>
                  <a href={p.to} target="_blank" rel="noreferrer">
                    Core <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://${domain}${p.to}`} target="_blank" rel="noreferrer">
                    Custom <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="text-xs text-muted-foreground border-t pt-4">
        Aprovação e publicação ficam em{" "}
        <Link to={"/core/publicacao" as any} className="underline text-primary">
          Core → Publicação
        </Link>
        . Esta tela é somente de homologação visual + verificação DNS/SSL do domínio custom.
      </section>
    </div>
  );
}
