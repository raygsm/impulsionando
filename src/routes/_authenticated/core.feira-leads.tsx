/**
 * /core/feira-leads — Painel Master Impulsionando dos leads de feira/demo.
 *
 * Mostra KPIs (24h, 7d, sessões, conversão), leads por nicho e tabela com os
 * últimos leads capturados via /demo/feira. Atualiza sob demanda.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFeiraOverview, listFeiraLeads } from "@/lib/feira-leads.functions";
import { Sparkles, Users, Clock, TrendingUp, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/feira-leads")({
  component: FeiraLeadsPage,
});

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; }
}

function FeiraLeadsPage() {
  const overviewFn = useServerFn(getFeiraOverview);
  const listFn = useServerFn(listFeiraLeads);

  const overview = useQuery({
    queryKey: ["feira-overview"],
    queryFn: () => overviewFn(),
  });
  const leads = useQuery({
    queryKey: ["feira-leads", 100],
    queryFn: () => listFn({ data: { limit: 100 } }),
  });

  const byNiche = Object.entries(overview.data?.by_niche ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <Badge className="bg-gradient-primary mb-2"><Sparkles className="w-3 h-3 mr-1" /> Demo Feira</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Leads capturados em demonstrações</h1>
          <p className="text-sm text-muted-foreground">Captura em /demo/feira com e-mail automático para o time e o lead.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { overview.refetch(); leads.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Users} label="Total de leads" value={overview.data?.total_leads ?? 0} />
        <Kpi icon={Clock} label="Últimas 24h" value={overview.data?.leads_24h ?? 0} accent />
        <Kpi icon={TrendingUp} label="Últimos 7 dias" value={overview.data?.leads_7d ?? 0} />
        <Kpi icon={Sparkles} label="Sessões / convertidas" value={`${overview.data?.total_sessions ?? 0} / ${overview.data?.sessions_converted ?? 0}`} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Leads por nicho</h2>
        {byNiche.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda sem leads capturados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {byNiche.map(([slug, count]) => (
              <Badge key={slug} variant="secondary" className="text-sm py-1.5 px-3">
                {slug} <span className="ml-2 font-bold">{count}</span>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Últimos leads</h2>
          <Button asChild variant="link" size="sm"><Link to="/demo/feira" target="_blank">Abrir landing →</Link></Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail / WhatsApp</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(leads.data?.leads ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-xs">
                    <div>{l.email}</div>
                    <div className="text-muted-foreground">{l.phone}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{l.niche ?? "—"}</Badge></TableCell>
                  <TableCell className="text-xs">{l.origin}</TableCell>
                  <TableCell><Badge>{l.status}</Badge></TableCell>
                </TableRow>
              ))}
              {(!leads.data?.leads || leads.data.leads.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum lead ainda. Compartilhe <code>/demo/feira</code> ou um QR Code apontando para esta URL.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-4 h-4" /> {label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}
