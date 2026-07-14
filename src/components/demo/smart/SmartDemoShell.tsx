import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartPlanSwitcher } from "./SmartPlanSwitcher";
import { SmartSidebar } from "./SmartSidebar";
import { SmartDashboard } from "./SmartDashboard";
import { SmartLeadCapture } from "./SmartLeadCapture";
import { useDemoPlan } from "@/hooks/useDemoPlan";
import { PLAN_LABEL, type DemoTemplate } from "@/data/demo-templates/types";

type Props = { template: DemoTemplate };

export function SmartDemoShell({ template }: Props) {
  const { plan, setPlan } = useDemoPlan(template.recommendedPlan);
  const [activeMenu, setActiveMenu] = useState<string>(template.menu[0]?.id ?? "overview");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {template.branding.businessName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{template.branding.businessName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {template.macroLabel} · {template.subLabel}
              </p>
            </div>
            <Badge variant="secondary" className="ml-1">Ambiente de demonstração</Badge>
          </div>
          <SmartPlanSwitcher active={plan} recommended={template.recommendedPlan} onChange={setPlan} />
          <Button size="sm">{template.conversion.primaryCTA}</Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SmartSidebar
            items={template.menu}
            active={activeMenu}
            plan={plan}
            onSelect={setActiveMenu}
            onUnlock={setPlan}
          />
          <div className="mt-4 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
            Alterne entre <strong>Essencial</strong>, <strong>Ideal</strong> e <strong>Full</strong> no
            topo para ver como os recursos evoluem no seu negócio.
          </div>
        </aside>

        <main>
          <SmartDashboard template={template} plan={plan} onUnlock={setPlan} />
        </main>
      </div>
    </div>
  );
}
