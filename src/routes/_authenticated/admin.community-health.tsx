import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCommunityHealth } from "@/lib/community-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/community-health")({
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
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

function Page() {
  const fn = useServerFn(getCommunityHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "community", days],
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
            <Users className="h-6 w-6 text-primary" />
            Community — Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Comunidades, membros, mensalidades, doações e presenças.
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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Comunidades ativas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.communities.active)}<span className="text-sm text-muted-foreground">/{fmt(data.communities.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.communities.acceptsDonations)} aceitam doações</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Membros ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.members.active)}<span className="text-sm text-muted-foreground">/{fmt(data.members.total)}</span></div>
            <p className="text-xs text-muted-foreground">+{fmt(data.members.new)} no período</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Mensalidades pagas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.memberships.paid)}<span className="text-sm text-muted-foreground">/{fmt(data.memberships.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.memberships.pending)} pend. · {fmt(data.memberships.overdue)} atraso</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita mensalidades</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.memberships.revenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Doações</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{brl(data.donations.amount)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.donations.total)} registros</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Presenças</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.attendance.present)}<span className="text-sm text-muted-foreground">/{fmt(data.attendance.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.attendance.absent)} ausências</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Participantes únicos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.attendance.uniqueAttendees)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tipos de comunidade</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(data.communities.byKind.length)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Mensalidades por Método</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.memberships.byMethod.map((r: any) => (
            <tr key={r.method} className="border-t"><td className="py-1">{r.method}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right text-muted-foreground">{brl(r.amount)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Doações por Método</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{data.donations.byMethod.map((r: any) => (
            <tr key={r.method} className="border-t"><td className="py-1">{r.method}</td><td className="text-right">{fmt(r.count)}</td><td className="text-right text-muted-foreground">{brl(r.amount)}</td></tr>
          ))}</tbody></table>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Top Comunidades · Receita</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th>Comunidade</th><th className="text-right">Mensalidades</th><th className="text-right">Doações</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {data.topCommunities.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{r.name}</td>
                  <td className="text-right">{brl(r.msh)}</td>
                  <td className="text-right">{brl(r.don)}</td>
                  <td className="text-right font-medium">{brl(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
    </div>
  );
}
