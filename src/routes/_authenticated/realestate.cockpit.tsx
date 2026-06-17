import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Search, Sparkles, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/realestate/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit Imobiliária — Impulsionando" }] }),
  component: REOpsCockpit,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function REOpsCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["realestate-cockpit"],
    staleTime: 60_000,
    queryFn: async () => {
      const last30 = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [pubProps, draftProps, intents, interests, openMsgs, matches30, recentInterests, topProps] = await Promise.all([
        supabase.from("realestate_properties").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("realestate_properties").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("realestate_search_intents").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("realestate_interests").select("id", { count: "exact", head: true }).gte("created_at", last30),
        supabase.from("realestate_internal_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("realestate_property_matches").select("id", { count: "exact", head: true }).gte("created_at", last30),
        supabase.from("realestate_interests")
          .select("id, contact_name, kind, status, source, property_id, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("realestate_properties")
          .select("id, address_line, city, neighborhood, bedrooms, bathrooms, area_useful, operation, is_published")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      return {
        published: pubProps.count ?? 0,
        drafts: draftProps.count ?? 0,
        activeIntents: intents.count ?? 0,
        interests30d: interests.count ?? 0,
        openMessages: openMsgs.count ?? 0,
        matches30d: matches30.count ?? 0,
        recentInterests: recentInterests.data ?? [],
        topProps: topProps.data ?? [],
      };
    },
  });

  const kpis = [
    { label: "Imóveis publicados", value: data?.published ?? "—", sub: `${data?.drafts ?? 0} rascunho(s)`, icon: Home, color: "text-emerald-600" },
    { label: "Buscas ativas",      value: data?.activeIntents ?? "—", icon: Search, color: "text-sky-600" },
    { label: "Matches (30d)",      value: data?.matches30d ?? "—", icon: Sparkles, color: "text-violet-600" },
    { label: "Interesses (30d)",   value: data?.interests30d ?? "—", icon: Sparkles, color: "text-primary" },
    { label: "Mensagens abertas",  value: data?.openMessages ?? "—", icon: MessageSquare, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cockpit Imobiliária" description="Estoque de imóveis, intenções de busca, matches e atendimento corretor↔cliente." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
            {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Interests */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" /> Interesses recentes
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/realestate">Imobiliária <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.recentInterests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Sem interesses registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentInterests.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium text-sm">{i.contact_name}</TableCell>
                    <TableCell className="text-xs">{i.kind}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.source}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{i.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Top published */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="h-4 w-4 text-emerald-600" /> Imóveis publicados recentes
          </h2>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.topProps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem imóveis publicados.</p>
          ) : (
            <div className="space-y-2">
              {data?.topProps.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md border">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {p.address_line || p.neighborhood || "Imóvel"} · {p.city || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.bedrooms} dorm · {p.bathrooms} banh · {p.area_useful ?? "—"} m²
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase ml-2 shrink-0">{p.operation}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Home className="h-4 w-4" /> Atalhos</h3>
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/realestate/properties">Imóveis</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/realestate/intents">Buscas / Intenções</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/realestate/interests">Interesses</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/realestate/messages">Mensagens internas</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/realestate/matches">Matches</Link></Button>
        </div>
      </Card>
    </div>
  );
}
