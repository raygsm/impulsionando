import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEducTalentosHealth } from "@/lib/educ-talentos-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, RefreshCw, Briefcase, Users, Target, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/educ-talentos")({
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

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function metaVariant(p: number): "default" | "secondary" | "destructive" {
  if (p >= 100) return "default";
  if (p >= 70) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getEducTalentosHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "educ-talentos", days],
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
  const e = data.educ;
  const t = data.talentos;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Educacional & Talentos Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Funil de matrículas, performance de polos e mercado de talentos (vagas × candidatos).
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

      <h2 className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="h-5 w-5" />Educacional</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leads</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(e.totalLeads)}</div>
            <p className="text-xs text-muted-foreground">Pipeline {brl(e.pipelineValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Conversão Lead → Matrícula</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct(e.conversionLeadMat)}</div>
            <p className="text-xs text-muted-foreground">{fmt(e.matNew)} novas matrículas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Matrículas Ativas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(e.matActive)}<span className="text-sm text-muted-foreground">/{fmt(e.totalMat)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(e.matCompleted)} concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">MRR Educacional</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(e.mrr)}</div>
            <p className="text-xs text-muted-foreground">Mensalidades ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evasão</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${e.evasionRate >= 10 ? "text-destructive" : ""}`}>{pct(e.evasionRate)}</div>
            <p className="text-xs text-muted-foreground">{fmt(e.matEvaded)} evadidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Inadimplência</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${e.matInadimplentes > 0 ? "text-amber-600" : ""}`}>{fmt(e.matInadimplentes)}</div>
            <p className="text-xs text-muted-foreground">matrículas atrasadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Polos Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(e.polosAtivos)}<span className="text-sm text-muted-foreground">/{fmt(e.polosTotal)}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Estágios do Funil de Leads</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {e.leadStages.map((s) => (
                  <tr key={s.stage} className="border-b last:border-0">
                    <td className="py-2 capitalize">{s.stage}</td>
                    <td className="text-right">{fmt(s.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Origens</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {e.leadOrigens.map((o) => (
                  <tr key={o.origem} className="border-b last:border-0">
                    <td className="py-2">{o.origem}</td>
                    <td className="text-right">{fmt(o.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking de Polos (Top 20)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Polo</th>
                  <th className="text-left">Cidade/UF</th>
                  <th className="text-right">Meta/mês</th>
                  <th className="text-right">Matrículas</th>
                  <th className="text-right">Ativas</th>
                  <th className="text-right">% Meta</th>
                </tr>
              </thead>
              <tbody>
                {e.polosRanking.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{p.nome}</td>
                    <td className="text-xs">{[p.cidade, p.estado].filter(Boolean).join("/") || "—"}</td>
                    <td className="text-right">{fmt(p.meta)}</td>
                    <td className="text-right">{fmt(p.matriculas)}</td>
                    <td className="text-right text-emerald-600">{fmt(p.ativas)}</td>
                    <td className="text-right">
                      {p.meta > 0 ? <Badge variant={metaVariant(p.metaPct)}>{pct(p.metaPct)}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold flex items-center gap-2 pt-4"><Briefcase className="h-5 w-5" />Talentos</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Vagas Ativas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(t.vagasAtivas)}<span className="text-sm text-muted-foreground">/{fmt(t.vagasTotal)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Candidatos Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(t.candidatosAtivos)}</div>
            <p className="text-xs text-muted-foreground">{fmt(t.candidatosVisiveis)} visíveis · {fmt(t.newCandidatos)} novos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />Match Ratio</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t.matchRatio.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">candidatos/vaga ativa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Score Médio</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">de {fmt(t.totalMatches)} matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contratações</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{fmt(t.contratados)}</div>
            <p className="text-xs text-muted-foreground">{pct(t.matchHireRate)} hire rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Desligamentos</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${t.desligados > 0 ? "text-amber-600" : ""}`}>{fmt(t.desligados)}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Estágios dos Matches</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {t.matchStages.map((s) => (
                  <tr key={s.stage} className="border-b last:border-0">
                    <td className="py-2 capitalize">{s.stage}</td>
                    <td className="text-right">{fmt(s.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Nichos (Vagas Ativas)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {t.topNichos.map((n) => (
                  <tr key={n.nicho} className="border-b last:border-0">
                    <td className="py-2 capitalize">{n.nicho}</td>
                    <td className="text-right">{fmt(n.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
