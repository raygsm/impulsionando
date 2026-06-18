import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchVersionsPipeline } from "@/lib/ops-cockpits.functions";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ops/versoes")({
  head: () => ({
    meta: [
      { title: "Versões & Atualizações — Operações" },
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
  component: VersoesPage,
});

function VersoesPage() {
  const fn = useServerFn(fetchVersionsPipeline);
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "versoes"],
    queryFn: () => fn({ data: {} }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Versões & Atualizações"
        description="Catálogo de módulos, última versão publicada e instalações pendentes."
      />

      <Card className="p-3 text-xs text-muted-foreground">
        Pipeline: Sandbox → Rollout 5% → 25% → 100% → Backup automático.{" "}
        <Link to="/saiba-mais/versoes" className="underline">Ver detalhes</Link>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando catálogo…</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Módulos no catálogo</p>
              <p className="mt-1 text-2xl font-semibold">{data?.summary.totalModules ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Instalações desatualizadas</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{data?.summary.totalPending ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Escopo</p>
              <p className="mt-1 text-sm font-semibold capitalize">{data?.scope}</p>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Módulo</th>
                  <th className="px-3 py-2 text-left">Última versão</th>
                  <th className="px-3 py-2 text-left">Publicada em</th>
                  <th className="px-3 py-2 text-right">Instalações</th>
                  <th className="px-3 py-2 text-right">Atualizadas</th>
                  <th className="px-3 py-2 text-right">Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {data?.modules.map((m) => (
                  <tr key={m.moduleId} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.code}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{m.latestVersion}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {m.releasedAt ? new Date(m.releasedAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{m.installs}</td>
                    <td className="px-3 py-2 text-right">{m.onLatest}</td>
                    <td className="px-3 py-2 text-right">
                      {m.pending > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <RefreshCw className="h-3 w-3" />{m.pending}
                        </Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
