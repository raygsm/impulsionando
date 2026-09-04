import { readAccessToken } from "@/lib/auth/session";
import { loadDashboardManifest } from "@/lib/modules/load-manifest";
import { AreaWidgets } from "@/components/dashboard/area-widgets";
import { redirect } from "next/navigation";

export default async function OperationsPage() {
  const token = await readAccessToken();
  const loaded = await loadDashboardManifest(token);
  if (!loaded.ok) redirect("/login");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Operações</h1>
        <p className="text-sm text-muted-foreground">Rotina, tarefas, agenda e sinais operacionais opcionais.</p>
      </div>
      <AreaWidgets manifest={loaded.manifest} area="operations" />
    </div>
  );
}
