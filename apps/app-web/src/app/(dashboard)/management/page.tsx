import { readAccessToken } from "@/lib/auth/session";
import { loadDashboardManifest } from "@/lib/modules/load-manifest";
import { AreaWidgets } from "@/components/dashboard/area-widgets";
import { ModuleStateView } from "@/components/states/module-state-view";
import { redirect } from "next/navigation";

export default async function ManagementPage() {
  const token = await readAccessToken();
  const loaded = await loadDashboardManifest(token);
  if (!loaded.ok) redirect("/login");
  const finance = loaded.manifest.modules.find((m) => m.id === "finance");
  const comms = loaded.manifest.modules.find((m) => m.id === "communications");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gestão</h1>
        <p className="text-sm text-muted-foreground">Empresa, equipe, módulos, integrações e ERP. Sem processador de pagamento no frontend.</p>
      </div>
      <ModuleStateView state={finance?.state ?? "NOT_ENTITLED"} title="Financeiro / ERP" dataAvailability="UNKNOWN" />
      <ModuleStateView state={comms?.state ?? "NOT_ENTITLED"} title="Comunicações (WhatsApp / e-mail)" dataAvailability="UNKNOWN" />
      <AreaWidgets manifest={loaded.manifest} area="management" />
    </div>
  );
}
