import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMessagingPanel } from "@/lib/ops-cockpits.functions";
import { MessageSquare, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ops/mensageria")({
  head: () => ({
    meta: [
      { title: "Mensageria — Operações" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Erro ao carregar mensageria: {error.message}</p>
        <button className="mt-2 text-xs underline" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
  component: MensageriaPage,
});

function MensageriaPage() {
  const fn = useServerFn(fetchMessagingPanel);
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "mensageria"],
    queryFn: () => fn({ data: { days: 30, scope: "company" } }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mensageria" subtitle="WhatsApp · E-mail · In-app — últimas 30 dias" icon={MessageSquare} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total de mensagens</p>
              <p className="mt-1 text-2xl font-semibold">{data?.total ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Falhas recentes</p>
              <p className="mt-1 text-2xl font-semibold text-destructive">{data?.failedRecent.length ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Canais ativos</p>
              <p className="mt-1 text-2xl font-semibold">{data?.byChannel.length ?? 0}</p>
            </Card>
          </div>

          <Tabs defaultValue="canais">
            <TabsList>
              <TabsTrigger value="canais">Por canal</TabsTrigger>
              <TabsTrigger value="status">Por status</TabsTrigger>
              <TabsTrigger value="falhas">Falhas</TabsTrigger>
            </TabsList>
            <TabsContent value="canais">
              <Card className="p-4">
                <ul className="divide-y">
                  {data?.byChannel.map((c) => (
                    <li key={c.channel} className="flex items-center justify-between py-2 text-sm">
                      <span className="capitalize">{c.channel}</span>
                      <Badge variant="outline">{c.count}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>
            <TabsContent value="status">
              <Card className="p-4">
                <ul className="divide-y">
                  {data?.byStatus.map((s) => (
                    <li key={s.status} className="flex items-center justify-between py-2 text-sm">
                      <span className="capitalize">{s.status}</span>
                      <Badge variant={s.status === "failed" ? "destructive" : "outline"}>{s.count}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>
            <TabsContent value="falhas">
              <Card className="p-4">
                {data?.failedRecent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem falhas no período.</p>
                ) : (
                  <ul className="space-y-2">
                    {data?.failedRecent.map((f) => (
                      <li key={f.id} className="rounded border p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="font-medium">{f.event}</span>
                          <Badge variant="outline" className="text-[10px]">{f.channel}</Badge>
                          <span className="ml-auto text-muted-foreground">{new Date(f.at).toLocaleString("pt-BR")}</span>
                        </div>
                        {f.error && <p className="mt-1 text-muted-foreground">{f.error}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
