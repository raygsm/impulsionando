import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { listTenantPublications } from "@/lib/tenant-publication.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicationStateBadge, derivePublicationState } from "@/components/core/PublicationStateBadge";
import { Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/publicacao")({
  head: () => ({
    meta: [{ title: "Publicação — Core Impulsionando" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: PublicacaoIndex,
});

function PublicacaoIndex() {
  const list = useServerFn(listTenantPublications);
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-publications"],
    queryFn: () => list(),
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          Publicação
        </h1>
        <p className="text-sm text-muted-foreground">
          Estado de publicação por tenant do ecossistema Impulsionando. Cada tenant tem 3 estados:
          Homologação → Pronto para Publicação → Publicado.
        </p>
      </header>

      {isLoading ? (
        <Card className="p-8 text-sm text-muted-foreground">Carregando tenants…</Card>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-8 text-sm text-muted-foreground">Nenhum tenant ativo encontrado.</Card>
      ) : (
        <div className="grid gap-3">
          {(data ?? []).map((row: any) => {
            const state = derivePublicationState(row.state);
            return (
              <Link
                key={row.company.id}
                to="/_authenticated/core/publicacao/$tenantId" as any
                params={{ tenantId: row.company.id }}
                className="block"
              >
                <Card className="p-4 hover:border-primary/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{row.company.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.company.domain ?? "sem domínio custom"} · {row.company.environment}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {row.state?.snapshot_id && (
                        <Badge variant="outline" className="text-[10px]">
                          snapshot: {String(row.state.snapshot_id).slice(0, 20)}
                        </Badge>
                      )}
                      <PublicationStateBadge state={state} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
