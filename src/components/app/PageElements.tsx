import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label, value, hint, icon: Icon, accent,
}: {
  label: string; value: ReactNode; hint?: string;
  icon?: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  return (
    <Card className={cn("p-5 shadow-card", accent && "bg-gradient-primary text-primary-foreground")}>
      <div className="flex items-start justify-between">
        <div>
          <div className={cn("text-xs font-medium uppercase tracking-wider", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {label}
          </div>
          <div className="text-3xl font-semibold mt-2">{value}</div>
          {hint && <div className={cn("text-xs mt-1", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", accent ? "bg-white/15" : "bg-muted")}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </Card>
  );
}
