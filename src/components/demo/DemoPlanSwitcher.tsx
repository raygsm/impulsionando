import { PLAN_LABEL, PLAN_ORDER, type DemoPlanId } from "@/data/demo-templates/types";
import { cn } from "@/lib/utils";

type Props = {
  active: DemoPlanId;
  recommended?: DemoPlanId;
  onChange: (plan: DemoPlanId) => void;
};

export function DemoPlanSwitcher({ active, recommended, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-background p-1 shadow-sm">
      {PLAN_ORDER.map((p) => {
        const isActive = p === active;
        const isRec = p === recommended;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PLAN_LABEL[p]}
            {isRec && !isActive && (
              <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                sugerido
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
