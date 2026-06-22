import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEhrCompliance } from "@/lib/ehr-compliance.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, RefreshCw, FileSignature, FileSearch, ShieldCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ehr-compliance")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function scoreVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 85) return "default";
  if (score >= 70) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getEhrCompliance);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "ehr-compliance", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!data) return null;
  const k = data.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            EHR & Clinical Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde clínica do prontuário — assinaturas, pareceres, gaps e LGPD em dados sensíveis.
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
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Compliance Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{k.complianceScore.toFixed(0)}<span className="text-base text-muted-foreground">/100</span></div>
            <Badge variant={scoreVariant(k.complianceScore)} className="mt-2">
              {k.complianceScore >= 85 ? "Saudável" : k.complianceScore >= 70 ? "Atenção" : "Crítico"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Prontuários Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.activeRecords)}</div>
            <p className="text-xs text-muted-foreground">de {fmt(k.totalRecords)} totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSignature className="h-4 w-4" />Evoluções sem Assinatura</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.unsignedEvolutions > 0 ? "text-destructive" : ""}`}>{fmt(k.unsignedEvolutions)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.staleUnsigned)} pendentes &gt; 48h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pareceres Pendentes</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.stalePendingOpinions > 0 ? "text-destructive" : ""}`}>{fmt(k.pendingOpinions)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.stalePendingOpinions)} &gt; 48h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileSearch className="h-4 w-4" />Documentos p/ Revisão</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.pendingDocReview)}</div>
            <p className="text-xs text-muted-foreground">de {fmt(k.totalDocuments)} no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taxa de Liberação ao Paciente</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(k.releaseRate)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.totalEvolutions)} evoluções</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Gaps de Histórico</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.recordsMissingHistory > 0 ? "text-amber-600" : ""}`}>{fmt(k.recordsMissingHistory)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.recordsMissingAllergies)} sem alergias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sem Responsável Clínico</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.recordsWithoutResponsible > 0 ? "text-destructive" : ""}`}>{fmt(k.recordsWithoutResponsible)}</div>
            <p className="text-xs text-muted-foreground">obrigatório por CFM</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Tenants Críticos (score &lt; 70)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.criticalTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum tenant em estado crítico no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Tenant</th>
                    <th className="text-right">Prontuários</th>
                    <th className="text-right">Evoluções</th>
                    <th className="text-right">Sem assinatura</th>
                    <th className="text-right">Pareceres pend.</th>
                    <th className="text-right">Docs pend.</th>
                    <th className="text-right">Sem histórico</th>
                    <th className="text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.criticalTenants.map((t) => (
                    <tr key={t.companyId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="text-right">{fmt(t.records)}</td>
                      <td className="text-right">{fmt(t.evolutions)}</td>
                      <td className="text-right text-destructive">{fmt(t.unsigned)}</td>
                      <td className="text-right">{fmt(t.pendingOpinions)}</td>
                      <td className="text-right">{fmt(t.pendingDocs)}</td>
                      <td className="text-right">{fmt(t.missingHistory)}</td>
                      <td className="text-right">
                        <Badge variant={scoreVariant(t.score)}>{t.score.toFixed(0)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking por Tenant (Top 25)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Tenant</th>
                  <th className="text-right">Prontuários</th>
                  <th className="text-right">Evoluções</th>
                  <th className="text-right">Sem assinatura</th>
                  <th className="text-right">Pareceres pend.</th>
                  <th className="text-right">Docs pend.</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((t) => (
                  <tr key={t.companyId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{t.name}</td>
                    <td className="text-right">{fmt(t.records)}</td>
                    <td className="text-right">{fmt(t.evolutions)}</td>
                    <td className="text-right">{fmt(t.unsigned)}</td>
                    <td className="text-right">{fmt(t.pendingOpinions)}</td>
                    <td className="text-right">{fmt(t.pendingDocs)}</td>
                    <td className="text-right">
                      <Badge variant={scoreVariant(t.score)}>{t.score.toFixed(0)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
