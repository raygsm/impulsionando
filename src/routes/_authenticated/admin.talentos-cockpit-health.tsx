import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTalentosCockpitHealth } from "@/lib/talentos-cockpit-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, RefreshCw, Briefcase, FileText, Building2, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/talentos-cockpit-health")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

function Tab({ title, rows }: { title: string; rows: { k: string; count: number }[] }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
        <table className="w-full text-sm"><tbody>
          {rows.map((s, i) => (<tr key={i} className="border-b last:border-0"><td className="py-2">{s.k}</td><td className="text-right">{fmt(s.count)}</td></tr>))}
        </tbody></table>
      )}
    </CardContent></Card>
  );
}

function Page() {
  const fn = useServerFn(getTalentosCockpitHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ["admin","talentos-cockpit",days], queryFn: () => fn({data:{days}}) });
  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><div className="grid grid-cols-4 gap-3">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Talentos — Cockpit</h1>
          <p className="text-sm text-muted-foreground">Candidatos, vagas, matches, currículos e empresas participantes do banco de talentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v)=>setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4"/>Candidatos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.candidatos.ativos)}/{fmt(data.candidatos.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.candidatos.visiveis)} visíveis · {fmt(data.candidatos.novosPeriodo)} novos ({data.days}d)</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Perfis Ricos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.candidatos.comFoto)}</div><p className="text-xs text-muted-foreground">com foto · {fmt(data.candidatos.comVideo)} com vídeo</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4"/>Vagas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.vagas.ativas)}/{fmt(data.vagas.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.vagas.novasPeriodo)} novas ({data.days}d)</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4"/>Matches</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.matches.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.matches.noPeriodo)} no período · score médio {data.matches.scoreMedio.toFixed(1)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Contratações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{fmt(data.matches.contratados)}</div><p className="text-xs text-muted-foreground">{data.matches.taxaContratacao.toFixed(1)}% de taxa · {fmt(data.matches.desligados)} desligamentos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Matches/Vaga</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.matches.matchesPorVaga.toFixed(2)}</div><p className="text-xs text-muted-foreground">média de matches por vaga publicada</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Currículos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.curriculos.processados)}/{fmt(data.curriculos.total)}</div><p className="text-xs text-muted-foreground">{data.curriculos.processRate.toFixed(1)}% processados · cobertura {data.curriculos.coberturaCandidatos.toFixed(1)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4"/>Empresas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmt(data.empresas.participantes)}/{fmt(data.empresas.total)}</div><p className="text-xs text-muted-foreground">{fmt(data.empresas.comRecebimentoAuto)} c/ auto · raio médio {data.empresas.raioMedioKm.toFixed(0)} km</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Candidatos — Nicho" rows={data.candidatos.byNicho}/>
        <Tab title="Candidatos — Estado" rows={data.candidatos.byEstado}/>
        <Tab title="Candidatos — Cidade" rows={data.candidatos.byCidade}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Tab title="Modelo de Trabalho" rows={data.candidatos.byModelo}/>
        <Tab title="Escolaridade" rows={data.candidatos.byEscolaridade}/>
        <Tab title="Disponibilidade" rows={data.candidatos.byDisponibilidade}/>
        <Tab title="Faixa Etária" rows={data.candidatos.byFaixaEtaria}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Vagas — Nicho" rows={data.vagas.byNicho}/>
        <Tab title="Vagas — Cidade" rows={data.vagas.byCidade}/>
        <Tab title="Vagas — Cargo" rows={data.vagas.byCargo}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tab title="Vagas — Modelo" rows={data.vagas.byModelo}/>
        <Tab title="Vagas — Experiência" rows={data.vagas.byExperiencia}/>
        <Tab title="Matches — Stage" rows={data.matches.byStage}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tab title="Currículos — Formato" rows={data.curriculos.byFormato}/>
        <Tab title="Empresas Participantes — Nicho" rows={data.empresas.byNicho}/>
      </div>
    </div>
  );
}
