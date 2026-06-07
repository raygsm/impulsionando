import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { coreExecutiveDashboard } from "@/lib/provisioning.functions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageElements";
import { Building2, Boxes, CreditCard, ClipboardList, AlertTriangle, Globe, Rocket, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/")({
  component: CoreIndex,
});

function CoreIndex() {
  const fetchDash = useServerFn(coreExecutiveDashboard);
  const { data } = useQuery({ queryKey: ["core-exec-dash"], queryFn: () => fetchDash() });

  const cards = [
    { label: "Clientes ativos", value: `${data?.active ?? 0} / ${data?.total ?? 0}`, icon: Building2 },
    { label: "MRR (contratos ativos)", value: `R$ ${(data?.mrr ?? 0).toFixed(2)}`, icon: CreditCard },
    { label: "Bloqueados (suspensos)", value: data?.blocked ?? 0, icon: ShieldOff },
    { label: "Em onboarding", value: data?.onboarding ?? 0, icon: ClipboardList },
    { label: "Aguardando domínio", value: data?.awaitingDomain ?? 0, icon: Globe },
    { label: "Aguardando implantação", value: data?.awaitingDeploy ?? 0, icon: Boxes },
    { label: "Provisionamentos pendentes", value: data?.provisioningPending ?? 0, icon: AlertTriangle },
    { label: "Implantações concluídas", value: data?.provisioningDone ?? 0, icon: Rocket },
  ];

  return (
    <>
      <PageHeader
        title="Core Manager"
        description="Governança da plataforma. Toda contratação se transforma automaticamente em empresa provisionada, módulos instalados, checklist atualizado e cliente notificado."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-1 text-xl font-bold">{c.value}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 mt-4">
        <h3 className="font-semibold mb-2">Atalhos rápidos</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/core/clientes" className="text-primary underline">Clientes</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/core/modulos" className="text-primary underline">Biblioteca de Módulos</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/core/implantacoes" className="text-primary underline">Implantações automáticas</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/admin/billing-contracts" className="text-primary underline">Contratos</Link>
        </div>
      </Card>
    </>
  );
}
