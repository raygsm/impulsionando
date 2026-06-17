import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRound, Heart, ShoppingBag, CalendarDays, Ticket, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/consumer/unified")({
  head: () => ({ meta: [{ title: "Área do Consumidor — Unificada | Impulsionando" }] }),
  component: ConsumerUnified,
});

function ConsumerUnified() {
  const { data, isLoading } = useQuery({
    queryKey: ["consumer-unified"],
    staleTime: 60_000,
    queryFn: async () => {
      const [profiles, favorites, memberships, recentOrders, eventsTickets] = await Promise.all([
        supabase.from("consumer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("consumer_favorites").select("id", { count: "exact", head: true }),
        supabase.from("consumer_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("sales_orders").select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
        supabase.from("evt_tickets").select("id", { count: "exact", head: true }),
      ]);
      return {
        profiles: profiles.count ?? 0,
        favorites: favorites.count ?? 0,
        memberships: memberships.count ?? 0,
        orders30d: recentOrders.count ?? 0,
        tickets: eventsTickets.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Perfis de consumidor", value: data?.profiles, icon: UserRound, to: "/customers", color: "from-cyan-500/20 to-cyan-500/5" },
    { label: "Favoritos salvos",      value: data?.favorites, icon: Heart, to: "/customers", color: "from-pink-500/20 to-pink-500/5" },
    { label: "Memberships ativos",    value: data?.memberships, icon: Badge as any, to: "/customers", color: "from-emerald-500/20 to-emerald-500/5" },
    { label: "Pedidos (30 dias)",     value: data?.orders30d, icon: ShoppingBag, to: "/orders", color: "from-orange-500/20 to-orange-500/5" },
    { label: "Tickets de eventos",    value: data?.tickets, icon: Ticket, to: "/events", color: "from-violet-500/20 to-violet-500/5" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Área do Consumidor (Unificada)"
        description="Tudo o que o consumidor final faz nas empresas que usam Impulsionando — em uma única visão."
      />

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Card key={label} className={`p-5 bg-gradient-to-br ${color}`}>
            <div className="h-10 w-10 rounded-lg bg-background/80 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-12" /> : value ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1 mb-3">{label}</div>
            <Button asChild size="sm" variant="ghost" className="w-full justify-between -mx-2">
              <Link to={to}>Abrir <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> O que o consumidor encontra
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          A área unificada agrega — em um único acesso — fidelidade, agendas, pedidos, cupons,
          eventos e benefícios das empresas onde o consumidor já comprou ou se cadastrou.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/customers">Clientes</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/orders">Pedidos</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/agenda">Agendas</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/events">Eventos</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/demo/cliente-final">Demo consumidor</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/privacy">Privacidade & LGPD</Link></Button>
        </div>
      </Card>
    </div>
  );
}
