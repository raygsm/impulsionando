import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEhrClinicalHealth } from "@/lib/ehr-clinical-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ehr-clinical-health")({
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

function Page() {
  const fn = useServerFn(getEhrClinicalHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "ehr-clinical", days],
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
            <Stethoscope className="h-6 w-6 text-primary" />
            EHR & Clinical — Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Prontuários, evoluções, pareceres, documentos clínicos e atendimentos.
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Prontuários</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.records.total)}</div>
            <p className="text-xs text-muted-foreground">{data.records.byStatus.length} status</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Evoluções</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.evolutions.signed)}<span className="text-sm text-muted-foreground">/{fmt(data.evolutions.total)}</span></div>
            <p className="text-xs text-muted-foreground">assinadas · {fmt(data.evolutions.released)} liberadas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tempo médio de assinatura</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data.evolutions.avgSignHours}<span className="text-sm text-muted-foreground"> h</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pareceres</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.opinions.confirmed)}<span className="text-sm text-muted-foreground">/{fmt(data.opinions.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.opinions.requestedFollowup)} retornos · {fmt(data.opinions.requestedNewExam)} novos exames</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Documentos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.documents.total)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.documents.needsReview)} pend. revisão · {fmt(data.documents.reviewed)} ok</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">IA documentos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.documents.aiOk)}<span className="text-sm text-muted-foreground">/{fmt(data.documents.aiOk + data.documents.aiFail)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.documents.aiFail)} falhas</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Atendimentos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.appointments.done)}<span className="text-sm text-muted-foreground">/{fmt(data.appointments.total)}</span></div>
            <p className="text-xs text-muted-foreground">concluídos</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">No-show & canc.</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.appointments.noShow)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.appointments.canceled)} cancelados</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Prontuários por Status</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.records.byStatus.map((r: any) => (
            <tr key={r.status} className="border-t"><td className="py-1">{r.status}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Documentos por Categoria</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.documents.byCategory.map((r: any) => (
            <tr key={r.category} className="border-t"><td className="py-1">{r.category}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Atendimentos por Status</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.appointments.byStatus.map((r: any) => (
            <tr key={r.status} className="border-t"><td className="py-1">{r.status}</td><td className="text-right">{fmt(r.count)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
      </div>
    </div>
  );
}
