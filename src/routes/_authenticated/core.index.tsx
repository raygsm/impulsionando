import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageElements";
import { Building2, Boxes, CreditCard, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/")({
  component: CoreIndex,
});

function CoreIndex() {
  const { data } = useQuery({
    queryKey: ["core-overview"],
    queryFn: async () => {
      const [companies, modules, contracts, checklist] = await Promise.all([
        supabase.from("companies").select("id, is_active, is_master").eq("is_master", false),
        supabase.from("company_modules").select("company_id, is_enabled").eq("is_enabled", true),
        supabase.from("billing_contracts").select("monthly_amount, status").eq("status", "active"),
        supabase.from("onboarding_checklist").select("company_id, status").eq("status", "pending"),
      ]);
      const totalClients = companies.data?.length ?? 0;
      const activeClients = companies.data?.filter((c) => c.is_active).length ?? 0;
      const totalModulesEnabled = modules.data?.length ?? 0;
      const mrr = (contracts.data ?? []).reduce((s, c: any) => s + Number(c.monthly_amount ?? 0), 0);
      const pendingChecklistClients = new Set((checklist.data ?? []).map((c: any) => c.company_id)).size;
      return { totalClients, activeClients, totalModulesEnabled, mrr, pendingChecklistClients };
    },
  });

  const cards = [
    { label: "Clientes ativos", value: `${data?.activeClients ?? 0} / ${data?.totalClients ?? 0}`, icon: Building2 },
    { label: "Módulos instalados", value: data?.totalModulesEnabled ?? 0, icon: Boxes },
    { label: "MRR (contratos ativos)", value: `R$ ${(data?.mrr ?? 0).toFixed(2)}`, icon: CreditCard },
    { label: "Onboardings pendentes", value: data?.pendingChecklistClients ?? 0, icon: ClipboardList },
  ];

  return (
    <>
      <PageHeader
        title="Core Manager"
        description="Camada de governança da plataforma. Gerencie clientes, módulos, contratos, domínios e implantações sem alterar o funcionamento dos módulos existentes."
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
        <h3 className="font-semibold mb-2">Como o Core Manager se conecta</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Reusa <strong>companies</strong>, <strong>company_modules</strong>, <strong>billing_contracts</strong>, <strong>message_outbox</strong>, <strong>audit_logs</strong>.</li>
          <li>Não duplica módulos. Cada cliente é uma instância configurada do mesmo sistema.</li>
          <li>Instalação de módulo = ativar flag em <code>company_modules</code> e registrar no checklist do cliente.</li>
          <li>Onboarding pós-pagamento dispara coleta de domínio/subdomínio e e-mails corporativos.</li>
        </ul>
      </Card>
    </>
  );
}
