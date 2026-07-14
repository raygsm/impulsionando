import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "warning" | "danger";
  href?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-destructive"
          : "text-muted-foreground";
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className={cn("w-4 h-4", toneClass)} />}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className={cn("text-xs mt-1", toneClass)}>{hint}</div>}
    </>
  );
  const cls = "rounded-xl border bg-card p-5 block transition-colors";
  if (href) {
    return (
      <Link to={href as any} className={cn(cls, "hover:border-foreground/20 hover:bg-accent/30")}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

