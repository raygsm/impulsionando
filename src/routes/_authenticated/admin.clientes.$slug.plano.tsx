import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Gift, Calendar, Settings2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/plano")({
  head: () => ({ meta: [{ title: "Plano e cortesia — Impulsionando" }] }),
  component: TenantPlanoTab,
});

// Onda 3.2 — Cliente 360. Aba visual "Plano e cortesia".
// A cortesia Full de 30 dias e sua parametrização são funcionalidades da
// Fase 3.3 (backend destravado). Aqui apresentamos apenas o layout previsto
// para que o dono do produto valide a estrutura visual antes.
function TenantPlanoTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Crown className="h-5 w-5" /> Plano e cortesia
        </h2>
        <p className="text-sm text-muted-foreground">
          Plano contratado, cortesia inicial e regras de parametrização para <code>{slug}</code>.
        </p>
      </header>

      <Card className="p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 text-primary p-2">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">Plano Full — Cortesia inicial</div>
              <div className="text-xs text-muted-foreground">
                Todo cliente conectado ao Core inicia no plano Full, em cortesia por 30 dias.
              </div>
            </div>
          </div>
          <Badge variant="default">Cortesia · 30 dias</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <Metric icon={<Gift className="h-4 w-4" />} label="Duração da cortesia" value="30 dias" />
          <Metric icon={<Calendar className="h-4 w-4" />} label="Início" value="—" />
          <Metric icon={<Calendar className="h-4 w-4" />} label="Fim previsto" value="—" />
        </div>

        <div className="border-t pt-3 text-xs text-muted-foreground">
          Barra de status visual · fase 3.3 conectará ao backend (billing_plans / core_settings).
        </div>
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4" /> Parametrização futura da cortesia
        </div>
        <ul className="grid gap-2 md:grid-cols-2 list-disc pl-5 text-muted-foreground">
          <li>Duração padrão da cortesia (global, por nicho e por cliente)</li>
          <li>Regras de conversão automática ao final do período</li>
          <li>Bloqueios progressivos por status de pagamento</li>
          <li>Cortesia estendida em situações comerciais especiais</li>
          <li>Alertas para squad comercial e sucesso do cliente</li>
          <li>Auditoria de cada extensão e conversão</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug/financeiro" params={{ slug }}>Ir para Financeiro</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug/mercado-pago" params={{ slug }}>Ir para Mercado Pago</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
