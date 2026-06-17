import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown, Headphones, DollarSign, Briefcase, Handshake, Layers,
  Building2, UserRound, ArrowRight, ShieldCheck, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/users/corporate")({
  head: () => ({ meta: [{ title: "Visão Corporativa — Usuários | Impulsionando" }] }),
  component: CorporatePage,
});

type LayerKey =
  | "super_admin" | "support" | "finance" | "commercial"
  | "affiliates" | "white_label" | "companies" | "consumers";

type Layer = {
  key: LayerKey;
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
  accent: string;
};

const LAYERS: Layer[] = [
  { key: "super_admin",  icon: Crown,      title: "Super Admin Master",  description: "Único usuário com poder total sobre a plataforma.",        to: "/users",              accent: "from-amber-500/20 to-amber-500/5" },
  { key: "support",      icon: Headphones, title: "Suporte",             description: "Atendimento, tickets e SLAs das empresas clientes.",        to: "/users",              accent: "from-sky-500/20 to-sky-500/5" },
  { key: "finance",      icon: DollarSign, title: "Financeiro",          description: "Cobrança, conciliação, comissões e inadimplência.",        to: "/finance",            accent: "from-emerald-500/20 to-emerald-500/5" },
  { key: "commercial",   icon: Briefcase,  title: "Comercial",           description: "Vendedores, metas, pipeline e oportunidades.",             to: "/crm",                accent: "from-violet-500/20 to-violet-500/5" },
  { key: "affiliates",   icon: Handshake,  title: "Afiliados",           description: "Parceiros vitalícios, carteira e alertas de comissão.",    to: "/affiliates/wallet",  accent: "from-pink-500/20 to-pink-500/5" },
  { key: "white_label",  icon: Layers,     title: "White Labels",        description: "Operações revenda com branding e clientes próprios.",      to: "/companies",          accent: "from-indigo-500/20 to-indigo-500/5" },
  { key: "companies",    icon: Building2,  title: "Empresas Clientes",   description: "Contas pagantes da Impulsionando.",                          to: "/companies",          accent: "from-cyan-500/20 to-cyan-500/5" },
  { key: "consumers",    icon: UserRound,  title: "Consumidores Finais", description: "Clientes das empresas — fidelidade, pedidos, agendas.",    to: "/customers",          accent: "from-orange-500/20 to-orange-500/5" },
];

function CorporatePage() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ["corporate-counts"],
    staleTime: 60_000,
    queryFn: async () => {
      const c = async (table: string, filter?: (q: any) => any) => {
        let q = supabase.from(table as any).select("*", { count: "exact", head: true });
        if (filter) q = filter(q);
        const { count } = await q;
        return count ?? 0;
      };
      const [
        superAdmins, affiliates, lifetimeAffiliates, companies,
        whiteLabels, consumers, walletAlerts,
      ] = await Promise.all([
        c("user_roles", (q) => q.eq("role", "super_admin")),
        c("aff_affiliates"),
        c("aff_affiliates", (q) => q.eq("is_lifetime", true)),
        c("companies"),
        c("companies", (q) => q.not("white_label_id", "is", null)),
        c("consumer_profiles"),
        c("aff_wallet_alerts", (q) => q.eq("status", "open")),
      ]);
      return { superAdmins, affiliates, lifetimeAffiliates, companies, whiteLabels, consumers, walletAlerts };
    },
  });

  const valueFor = (k: LayerKey): { value: string; sub?: string } => {
    if (!counts) return { value: "—" };
    switch (k) {
      case "super_admin": return { value: `${counts.superAdmins}`, sub: "ativo(s)" };
      case "affiliates":  return { value: `${counts.affiliates}`, sub: `${counts.lifetimeAffiliates} vitalícios` };
      case "white_label": return { value: `${counts.whiteLabels}`, sub: "operações" };
      case "companies":   return { value: `${counts.companies}`, sub: "contas" };
      case "consumers":   return { value: `${counts.consumers}`, sub: "perfis" };
      default:            return { value: "·" };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão Corporativa"
        description="Estrutura completa de quem opera, vende, suporta, fatura e consome na Impulsionando."
      />

      {/* Single Super Admin guardrail */}
      <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-semibold mb-1">Regra de governança</div>
          <p className="text-muted-foreground">
            A plataforma admite <strong>exatamente um Super Admin Master</strong>. Demais papéis
            corporativos são distribuídos por perfis (matriz SIM/NÃO em{" "}
            <Link to="/access-profiles/matrix" className="underline">Matriz de Permissões</Link>).
          </p>
        </div>
      </Card>

      {counts && counts.walletAlerts > 0 && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">{counts.walletAlerts} alerta(s) de carteira em aberto</div>
              <div className="text-muted-foreground">Afiliados com pendências de comissão ou clientes inadimplentes.</div>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/affiliates/wallet">Abrir Carteira</Link>
          </Button>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          const v = valueFor(layer.key);
          return (
            <Card key={layer.key} className={`p-5 bg-gradient-to-br ${layer.accent}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-background/80 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="bg-background/60 text-[10px]">Camada</Badge>
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-7 w-12" /> : v.value}
              </div>
              {v.sub && <div className="text-xs text-muted-foreground mb-2">{v.sub}</div>}
              <h3 className="font-semibold text-sm mt-2">{layer.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">{layer.description}</p>
              <Button asChild size="sm" variant="ghost" className="w-full justify-between -mx-2">
                <Link to={layer.to}>Abrir <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Atalhos de gestão</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to="/users">Lista de usuários</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to="/access-profiles">Perfis de acesso</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to="/access-profiles/matrix">Matriz de permissões</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to="/affiliates/wallet">Carteira de afiliados</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to="/finance/webhook-log">Log de webhooks</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to="/insights/oportunidades">Central de oportunidades</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
