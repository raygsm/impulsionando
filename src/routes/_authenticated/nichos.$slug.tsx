/**
 * /nichos/$slug — cockpit unificado para QUALQUER nicho do core.
 *
 * • Nichos com produto dedicado: redireciona para a rota específica.
 * • Nichos pendentes (marketing-tecnologia, servicos, comercio,
 *   ecommerce): renderiza cockpit completo com KPIs de funil reais
 *   (marketing_leads + crm_opportunities + customers) + playbook
 *   contextual + quick-links relevantes.
 * • Nichos futuros: fallback genérico funciona imediatamente.
 */
import { createFileRoute, Link, Navigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight, Building2, ChartNoAxesCombined, HeartHandshake, Repeat, Rocket, Sparkles, TrendingUp, Users,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getNicheCockpit } from "@/lib/niche-cockpit.functions";
import { getNichePlaybook, ACCENT_CLASSES } from "@/lib/niche-playbooks";

export const Route = createFileRoute("/_authenticated/nichos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Cockpit ${(params as { slug: string }).slug} — Impulsionando` },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: `Cockpit de funil, KPIs e playbook do nicho ${(params as { slug: string }).slug} no core Impulsionando.`,
      },
    ],
  }),
  component: NichoCockpitPage,
});

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function NichoCockpitPage() {
  // strict:false para tolerar geração do route tree em andamento.
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = params.slug ?? "";
  const fn = useServerFn(getNicheCockpit);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["niche-cockpit", slug],
    queryFn: () => fn({ data: { slug } }),
    staleTime: 60_000,
    enabled: !!slug,
  });

  const playbook = getNichePlaybook(slug, data?.name ?? slug);
  const accent = ACCENT_CLASSES[playbook.accent];

  // Nichos com produto dedicado: redireciona sem UI intermediária.
  if (playbook.redirectTo) {
    return <Navigate to={playbook.redirectTo} replace />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="p-6 border-l-4 border-l-red-500 bg-red-500/5">
          <h1 className="text-lg font-semibold text-red-600">Nicho indisponível</h1>
          <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <PageHeader
        title={playbook.headline}
        description={playbook.subhead}
        action={
          <Badge className={cn("text-[10px]", accent.badge)}>
            Nicho · {slug}
          </Badge>
        }
      />

      {/* KPIs de funil (dados reais do tenant) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Tenants no nicho" value={String(data?.tenants ?? 0)} icon={Building2} />
            <StatCard label="Leads (30d)" value={String(data?.leads30d ?? 0)} icon={Users} />
            <StatCard label="Oportunidades abertas" value={String(data?.opportunitiesOpen ?? 0)} icon={TrendingUp} />
            <StatCard label="Ganhas (30d)" value={String(data?.opportunitiesWon30d ?? 0)} icon={Rocket} />
            <StatCard label="GMV (30d)" value={fmtBRL(data?.gmv30d ?? 0)} icon={ChartNoAxesCombined} />
            <StatCard label="Conversão" value={`${(data?.conversionRate ?? 0).toFixed(1)}%`} icon={TrendingUp} />
          </>
        )}
      </div>


      {/* Estado vazio quando não há tenants */}
      {!isLoading && (data?.tenants ?? 0) === 0 && (
        <Card className={cn("p-5 border-l-4", accent.bar, "bg-muted/30")}>
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className={cn("w-6 h-6", accent.text)} />
            <div className="flex-1 min-w-[240px]">
              <div className="font-semibold">Nenhum tenant onboarded neste nicho ainda</div>
              <div className="text-xs text-muted-foreground">
                Ative o primeiro cliente para que o cockpit passe a exibir dados reais.
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/onboarding">Iniciar onboarding</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Playbook por etapa do funil Impulsionando */}
      <section aria-labelledby="playbook-title">
        <h2 id="playbook-title" className="text-lg font-semibold mb-3">
          Playbook Impulsionando — {playbook.headline}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <FunnelCard title="Captar" icon={<Users className="w-4 h-4" />} items={playbook.funnel.captar} accent={accent} />
          <FunnelCard title="Converter" icon={<TrendingUp className="w-4 h-4" />} items={playbook.funnel.converter} accent={accent} />
          <FunnelCard title="Relacionar" icon={<HeartHandshake className="w-4 h-4" />} items={playbook.funnel.relacionar} accent={accent} />
          <FunnelCard title="Reter" icon={<Repeat className="w-4 h-4" />} items={playbook.funnel.reter} accent={accent} />
          <FunnelCard title="Expandir" icon={<Rocket className="w-4 h-4" />} items={playbook.funnel.expandir} accent={accent} />
        </div>
      </section>

      {/* Quick links operacionais */}
      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="text-lg font-semibold mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {playbook.quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group rounded-lg border p-3 hover:border-primary/50 hover:bg-muted/40 transition flex items-center gap-2 text-sm"
            >
              <span className="flex-1 font-medium">{link.label}</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          ))}
        </div>
      </section>

      <Card className="p-4 text-xs text-muted-foreground">
        Cockpit gerado a partir do funil Impulsionando (captar → converter → relacionar → reter →
        expandir). KPIs são derivados de <code>marketing_leads</code>, <code>crm_opportunities</code>{" "}
        e <code>customers</code>, filtrados pelo nicho <code>{slug}</code>. Personalize o playbook em{" "}
        <Link to="/admin/nichos" className="underline hover:text-foreground">/admin/nichos</Link>.
      </Card>
    </div>
  );
}

function FunnelCard({
  title, icon, items, accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: { bar: string; badge: string; text: string };
}) {
  return (
    <Card className={cn("p-3 border-l-4", accent.bar)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={accent.text}>{icon}</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {items.map((t, i) => (
          <li key={i} className="flex gap-1.5">
            <span className={cn("mt-1.5 w-1 h-1 rounded-full shrink-0", accent.text.replace("text-", "bg-"))} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
