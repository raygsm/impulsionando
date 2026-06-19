import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listReleases, promoteVersion, rolloutVersionToChannel } from "@/lib/releases.functions";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/releases")({
  head: () => ({ meta: [{ title: "Releases — Pipeline DEV→HOMOLOG→PROD" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: ReleasesPage,
});

const CHANNEL_LABEL: Record<string, string> = { dev: "DEV", beta: "HOMOLOG", stable: "PROD" };
const CHANNEL_COLOR: Record<string, string> = {
  dev: "bg-zinc-500",
  beta: "bg-amber-500",
  stable: "bg-emerald-600",
};
const NEXT_CHANNEL: Record<string, "beta" | "stable" | null> = { dev: "beta", beta: "stable", stable: null };

function ReleasesPage() {
  const qc = useQueryClient();
  const fetchReleases = useServerFn(listReleases);
  const promote = useServerFn(promoteVersion);
  const rollout = useServerFn(rolloutVersionToChannel);

  const { data, isLoading } = useQuery({
    queryKey: ["core-releases"],
    queryFn: () => fetchReleases(),
  });

  const promoteMut = useMutation({
    mutationFn: (vars: { versionId: string; toChannel: "dev" | "beta" | "stable" }) =>
      promote({ data: vars }),
    onSuccess: (_r, vars) => {
      toast.success(`Promovido para ${CHANNEL_LABEL[vars.toChannel]}`);
      qc.invalidateQueries({ queryKey: ["core-releases"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao promover"),
  });

  const rolloutMut = useMutation({
    mutationFn: (vars: { moduleId: string; channel: "dev" | "beta" | "stable"; version: string }) =>
      rollout({ data: vars }),
    onSuccess: (r: any) => {
      toast.success(`Aplicado em ${r.updated} tenant(s)`);
      qc.invalidateQueries({ queryKey: ["core-releases"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no rollout"),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando pipeline…</div>;

  const counts = (data?.companies ?? []).reduce(
    (acc: Record<string, number>, c: any) => {
      acc[c.release_channel] = (acc[c.release_channel] ?? 0) + 1;
      return acc;
    },
    { dev: 0, beta: 0, stable: 0 },
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          Pipeline de Releases
        </h1>
        <p className="text-sm text-muted-foreground">
          DEV → HOMOLOG (beta) → PROD (stable). Tenants recebem versões conforme o canal que assinam.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {(["dev", "beta", "stable"] as const).map((ch) => (
          <Card key={ch} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{CHANNEL_LABEL[ch]}</span>
              <span className={`h-2 w-2 rounded-full ${CHANNEL_COLOR[ch]}`} />
            </div>
            <div className="mt-1 text-2xl font-semibold">{counts[ch] ?? 0}</div>
            <div className="text-xs text-muted-foreground">tenants no canal</div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {(data?.modules ?? []).map((m: any) => (
          <Card key={m.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.slug} · atual: <code>{m.current_version ?? "—"}</code> · {m.installs.total} install(s)
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              {(m.versions as any[]).length === 0 && (
                <div className="text-xs text-muted-foreground italic">Nenhuma versão registrada.</div>
              )}
              {(m.versions as any[]).slice(0, 8).map((v: any) => {
                const next = NEXT_CHANNEL[v.channel as string];
                return (
                  <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{v.version}</Badge>
                      <Badge className={`${CHANNEL_COLOR[v.channel]} text-white`}>{CHANNEL_LABEL[v.channel]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {v.released_at ? new Date(v.released_at).toLocaleDateString("pt-BR") : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {next && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={promoteMut.isPending}
                          onClick={() => promoteMut.mutate({ versionId: v.id, toChannel: next })}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Promover → {CHANNEL_LABEL[next]}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        disabled={rolloutMut.isPending}
                        onClick={() => rolloutMut.mutate({ moduleId: m.id, channel: v.channel, version: v.version })}
                        title={`Aplica ${v.version} em todos os tenants do canal ${CHANNEL_LABEL[v.channel]}`}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Rollout global ({CHANNEL_LABEL[v.channel]})
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
