import type { DashboardManifest, DashboardAreaId } from "@impulsionando/contracts";
import { ModuleStateView } from "@/components/states/module-state-view";

export function AreaWidgets({
  manifest,
  area,
}: {
  manifest: DashboardManifest;
  area: DashboardAreaId;
}) {
  const widgets = manifest.widgets.filter((w) => w.area === area);
  if (widgets.length === 0) {
    return <ModuleStateView state="EMPTY" title="Área" />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {widgets.map((w) => (
        <ModuleStateView key={w.id} state={w.state} title={w.title} dataAvailability={w.dataAvailability} />
      ))}
    </div>
  );
}
