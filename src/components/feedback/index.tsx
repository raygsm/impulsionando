import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Feedback primitives — placeholders visuais reutilizáveis para telas do shell
 * autenticado. Todos usam tokens do design system (bg-card, text-muted-*),
 * nunca cores hardcoded. Seguros para aplicar em qualquer tenant.
 */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("p-8 text-center border-dashed bg-card/60", className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4 btn-alive focus-ring" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border bg-card/40 p-3"
        >
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 3, className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </Card>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn("rounded-md border overflow-hidden", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="grid gap-3 border-b bg-muted/40 p-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-2/3" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 p-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
