// Cabeçalho padrão do Dashboard de Cliente — Impulsionando.
// Regra: TODO dashboard de cliente exibe APENAS a identidade Impulsionando
// (logo + cores + slogan "Seu Dashboard"). NUNCA a marca do tenant.
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { Badge } from "@/components/ui/badge";

export interface ClientDashboardHeroProps {
  tenantName: string;
  subdomain: string;
  planLabel?: string;
  moduleCount?: number;
  generatedAt?: string;
  rightSlot?: React.ReactNode;
}

export function ClientDashboardHero({
  tenantName,
  subdomain,
  planLabel = "Plano Full",
  moduleCount,
  generatedAt,
  rightSlot,
}: ClientDashboardHeroProps) {
  return (
    <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="container mx-auto px-6 py-7">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <LogoImpulsionando variant="light" size="sm" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-primary/80">
                Seu Dashboard
              </span>
            </div>
            <div className="h-14 w-px bg-border mt-1" aria-hidden />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
                <span>Painel Impulsionando</span>
                <span>·</span>
                <span>Cliente</span>
                <span>·</span>
                <code className="text-[10px]">{subdomain}</code>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 leading-tight">
                {tenantName}
              </h1>
              {moduleCount != null && (
                <p className="text-sm text-muted-foreground mt-1">
                  Visão proporcional ao plano contratado · {moduleCount} módulos ativos
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-elegant">
              {planLabel}
            </Badge>
            {generatedAt && (() => {
              const d = new Date(generatedAt);
              const isToday = new Date().toDateString() === d.toDateString();
              const label = isToday
                ? `Atualizado ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : `Atualizado ${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
              return (
                <span className="text-xs text-muted-foreground" title={d.toLocaleString("pt-BR")}>
                  {label}
                </span>
              );
            })()}
            {rightSlot}
          </div>
        </div>
      </div>
    </div>
  );
}
