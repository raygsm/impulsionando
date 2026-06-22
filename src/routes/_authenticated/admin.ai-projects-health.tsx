import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAiProjectsHealth } from "@/lib/ai-projects-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-projects-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

function Page() {
  const fn = useServerFn(getAiProjectsHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "ai-projects", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-72 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Projects & Pages — Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerações IA, prompts, páginas geradas, versões e templates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Gerações</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.generations.total)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.generations.approved)} aprov. · {fmt(data.generations.provisioned)} prov.</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Falhas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.generations.failed)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Provisionamento médio</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.generations.avgProvMin}<span className="text-sm text-muted-foreground"> min</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Arquivos IA</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.files.total)}</div>
            <p className="text-xs text-muted-foreground">{mb(data.files.totalBytes)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Prompts ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.prompts.active)}<span className="text-sm text-muted-foreground">/{fmt(data.prompts.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Páginas publicadas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.pages.published)}<span className="text-sm text-muted-foreground">/{fmt(data.pages.total)}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Versões</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.versions.total)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Templates ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.templates.active)}<span className="text-sm text-muted-foreground">/{fmt(data.templates.total)}</span></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Gerações por Modelo</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.generations.byModel.map((r: any) => (
            <tr key={r.model} className="border-t"><td className="py-1">{r.model}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Gerações por Status</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.generations.byStatus.map((r: any) => (
            <tr key={r.status} className="border-t"><td className="py-1">{r.status}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Arquivos por Kind</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.files.byKind.map((r: any) => (
            <tr key={r.kind} className="border-t"><td className="py-1">{r.kind}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right text-muted-foreground">{mb(r.bytes)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Templates por Nicho</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.templates.byNiche.map((r: any) => (
            <tr key={r.niche} className="border-t"><td className="py-1">{r.niche}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Top Prompts · uso</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th>Prompt</th><th>Nicho</th><th>v</th><th className="text-right">Uso</th></tr></thead>
            <tbody>
              {data.prompts.top.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{r.name}</td>
                  <td>{r.niche ?? "—"}</td>
                  <td>{r.version ?? "—"}</td>
                  <td className="text-right">{fmt(r.usage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
    </div>
  );
}
