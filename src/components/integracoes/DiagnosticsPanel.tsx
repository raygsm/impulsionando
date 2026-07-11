import { Card } from "@/components/ui/card";
import { IntegrationStatusPill } from "./IntegrationStatusPill";
import type { IntegrationItem } from "@/data/integracoes-catalog";
import { Clock, AlertOctagon, RefreshCw, ShieldCheck } from "lucide-react";

export function DiagnosticsPanel({ item }: { item: IntegrationItem }) {
  const blocks = [
    {
      icon: ShieldCheck,
      label: "Conexão",
      value: <IntegrationStatusPill state={item.state} />,
    },
    {
      icon: Clock,
      label: "Última sincronização",
      value: <span className="text-sm">{item.lastSync ?? "—"}</span>,
    },
    {
      icon: AlertOctagon,
      label: "Último erro",
      value: (
        <span className="text-sm text-muted-foreground">
          {item.state === "erro" ? "Falha ao renovar credenciais" : "Nenhum nas últimas 24h"}
        </span>
      ),
    },
    {
      icon: RefreshCw,
      label: "Última atualização",
      value: <span className="text-sm">{item.lastSync ?? "aguardando primeira conexão"}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <Card key={b.label} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{b.label}</div>
                  <div className="mt-1">{b.value}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissões</div>
        <ul className="mt-2 space-y-1 text-sm">
          <li className="flex justify-between">
            <span>Leitura de dados</span>
            <span className="text-emerald-700">Concedida</span>
          </li>
          <li className="flex justify-between">
            <span>Envio de eventos</span>
            <span className="text-emerald-700">Concedida</span>
          </li>
          <li className="flex justify-between">
            <span>Escrita de campanhas</span>
            <span className="text-muted-foreground">Opcional</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
