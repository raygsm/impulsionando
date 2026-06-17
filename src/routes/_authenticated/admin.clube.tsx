/**
 * /admin/clube — Painel administrativo do Clube Impulsionando.
 * KPIs (membros, premium, MRR, visitas 30d), top parceiros e últimos cadastros.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminClubeOverview } from "@/lib/clube.functions";
import { Users, Crown, MapPin, Share2, Bell, DollarSign, Trophy, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clube")({
  component: AdminClubePage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminClubePage() {
  const fetchOverview = useServerFn(getAdminClubeOverview);
  const q = useQuery({ queryKey: ["admin-clube-overview"], queryFn: () => fetchOverview() });

  if (q.isLoading) return <div className="p-6">Carregando…</div>;
  if (q.error) return <div className="p-6 text-destructive">{(q.error as any).message}</div>;
  const d = q.data!;

  const kpis = [
    { icon: Users,      label: "Membros totais",       value: d.kpis.totalMembers.toLocaleString("pt-BR") },
    { icon: Crown,      label: "Premium ativos",       value: d.kpis.premiumActive.toLocaleString("pt-BR") },
    { icon: DollarSign, label: "MRR estimado",         value: BRL(d.kpis.mrrCents) },
    { icon: MapPin,     label: "Visitas (30d)",        value: d.kpis.visits30d.toLocaleString("pt-BR") },
    { icon: Bell,       label: "Alertas ativos",       value: d.kpis.activeAlerts.toLocaleString("pt-BR") },
    { icon: Share2,     label: "Indicações totais",    value: d.kpis.referrals.toLocaleString("pt-BR") },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Badge className="bg-gradient-primary mb-2"><Crown className="w-3 h-3 mr-1" /> Admin · Clube Impulsionando</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Cockpit do Clube</h1>
          <p className="text-sm text-muted-foreground">Membros, conversão, MRR e engajamento da base B2C.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/consumer/unified">Membros →</Link></Button>
          <Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4" /> Top parceiros (por visitas)</h2>
          {d.topPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem visitas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {d.topPartners.map((p: any, i: number) => (
                <li key={p.name + i} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                  <span className="truncate"><span className="text-muted-foreground mr-2">#{i + 1}</span>{p.name}</span>
                  <Badge variant="secondary">{p.total} visitas</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Últimos cadastros</h2>
          {d.recentSignups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cadastro recente.</p>
          ) : (
            <ul className="space-y-2">
              {d.recentSignups.map((u: any) => (
                <li key={u.user_id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.full_name || "Sem nome"}</div>
                    <div className="text-xs text-muted-foreground">{[u.city, u.state].filter(Boolean).join(" · ") || "—"}</div>
                  </div>
                  <Badge variant="outline">{u.current_level}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
