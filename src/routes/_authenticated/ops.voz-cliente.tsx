import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchVoiceOfCustomer } from "@/lib/ops-cockpits.functions";

export const Route = createFileRoute("/_authenticated/ops/voz-cliente")({
  head: () => ({
    meta: [
      { title: "Voz do Cliente — Operações" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Erro: {error.message}</p>
        <button className="mt-2 text-xs underline" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Não encontrado.</div>,
  component: VozClientePage,
});

function VozClientePage() {
  const fn = useServerFn(fetchVoiceOfCustomer);
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "voc"],
    queryFn: () => fn({ data: { days: 30 } }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Voz do Cliente" description="Demandas, enquetes e feedback consolidados (30d)" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Demandas totais</p>
              <p className="mt-1 text-2xl font-semibold">{data?.summary.totalDemands ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Demandas abertas</p>
              <p className="mt-1 text-2xl font-semibold">{data?.summary.openDemands ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Enquetes ativas</p>
              <p className="mt-1 text-2xl font-semibold">{data?.summary.activePolls ?? 0}</p>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Demandas recentes</h2>
            {data?.demands.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma demanda no período.</p>
            ) : (
              <ul className="divide-y">
                {data?.demands.slice(0, 20).map((d: any) => (
                  <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="flex-1 truncate">{d.title}</span>
                    <Badge variant="outline">{d.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Enquetes</h2>
            {data?.polls.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem enquetes no período.</p>
            ) : (
              <ul className="divide-y">
                {data?.polls.slice(0, 10).map((p: any) => (
                  <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="flex-1 truncate">{p.question}</span>
                    <Badge variant="outline">{p.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
