import { readAccessToken } from "@/lib/auth/session";
import { loadDashboardManifest } from "@/lib/modules/load-manifest";
import { ModuleStateView } from "@/components/states/module-state-view";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const token = await readAccessToken();
  const loaded = await loadDashboardManifest(token);
  if (!loaded.ok) redirect("/login");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Marca, plano e módulos vêm de Nest. Esta tela não grava regras de negócio.</p>
      </div>
      <ModuleStateView state="ACTIVE" title="Empresa" dataAvailability="LIVE">
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Nome</dt>
            <dd>{loaded.manifest.tenant.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Logo</dt>
            <dd>{loaded.manifest.tenant.logo_url ?? "ausente"}</dd>
          </div>
        </dl>
      </ModuleStateView>
      <ul className="grid gap-2 text-sm">
        {loaded.manifest.modules.map((m) => (
          <li key={m.id} className="rounded-lg border px-3 py-2">
            {m.label}: {m.state}
          </li>
        ))}
      </ul>
    </div>
  );
}
