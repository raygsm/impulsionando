import type { ReactNode } from "react";

export function CommandPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function ComingSoon({ hint }: { hint?: string }) {
  return (
    <div className="border rounded-xl bg-card p-12 text-center">
      <p className="text-sm font-medium">Em construção</p>
      <p className="text-xs text-muted-foreground mt-1">
        {hint ?? "Este workspace faz parte das próximas ondas do Mission Control."}
      </p>
    </div>
  );
}
