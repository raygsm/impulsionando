import { Lock } from "lucide-react";
import type { DemoMenuItem, DemoPlanId } from "@/data/demo-templates/types";
import { PLAN_LABEL } from "@/data/demo-templates/types";
import { isLockedByPlan } from "@/data/demo-templates/registry";
import { cn } from "@/lib/utils";

type Props = {
  items: DemoMenuItem[];
  active: string;
  plan: DemoPlanId;
  onSelect: (id: string) => void;
  onUnlock: (minPlan: DemoPlanId) => void;
};

export function DemoSidebar({ items, active, plan, onSelect, onUnlock }: Props) {
  return (
    <nav className="flex flex-col gap-1 rounded-xl border bg-card p-2 text-sm">
      {items.map((item) => {
        const locked = isLockedByPlan(item.minPlan, plan);
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => (locked && item.minPlan ? onUnlock(item.minPlan) : onSelect(item.id))}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors",
              isActive && !locked ? "bg-primary/10 text-primary" : "hover:bg-muted",
              locked && "text-muted-foreground",
            )}
          >
            <span>{item.label}</span>
            {locked && item.minPlan && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium">
                <Lock className="h-3 w-3" />
                {PLAN_LABEL[item.minPlan]}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
