import { readAccessToken } from "@/lib/auth/session";
import { loadDashboardManifest } from "@/lib/modules/load-manifest";
import { AreaWidgets } from "@/components/dashboard/area-widgets";
import { ModuleStateView } from "@/components/states/module-state-view";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const token = await readAccessToken();
  const loaded = await loadDashboardManifest(token);
  if (!loaded.ok) redirect("/login");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Início</h1>
        <p className="text-sm text-muted-foreground">Briefing e fila de atenção. KPIs sem API aparecem como UNKNOWN.</p>
      </div>
      <ModuleStateView state="ACTIVE" title="Fila de atenção" dataAvailability="UNKNOWN" />
      <AreaWidgets manifest={loaded.manifest} area="home" />
    </div>
  );
}
