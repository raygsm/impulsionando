// Primitivas visuais compartilhadas pela Fase B — Marocas.
// Nenhum efeito colateral: puro visual + estados.
import type { ReactNode } from "react";
import { Loader2, Inbox, AlertTriangle, CheckCircle2 } from "lucide-react";
import { STATUS_LABEL, STATUS_TONE, type OperationStatus, OP_EVENT_LABEL, OP_EVENT_TONE, type OpEventType } from "./marocasMockData";

export function KpiCard({ label, value, hint, tone = "default", icon }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "success" | "danger";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "border-border",
    warn: "border-amber-400/60",
    success: "border-emerald-400/60",
    danger: "border-red-400/60",
  }[tone];
  return (
    <div className={`rounded-xl border ${toneClass} bg-card p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: OperationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EventPill({ type }: { type: OpEventType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
      <span className={`h-2 w-2 rounded-full ${OP_EVENT_TONE[type]}`} />
      {OP_EVENT_LABEL[type]}
    </span>
  );
}

export function EmptyState({ title, description, icon, action }: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-background text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ title = "Não foi possível carregar", description, onRetry }: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-300/60 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
      <AlertTriangle className="mx-auto h-6 w-6 text-red-600" />
      <h3 className="mt-2 font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-background">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 flex gap-3">
      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export function Section({ title, description, children, actions }: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function DataTable<T>({ rows, columns, empty }: {
  rows: T[];
  columns: { header: string; render: (row: T) => ReactNode; className?: string }[];
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return <>{empty ?? <EmptyState title="Sem registros" description="Nada por aqui ainda." />}</>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={`px-3 py-2 text-left font-medium ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {columns.map((c, j) => (
                <td key={j} className={`px-3 py-2 align-middle ${c.className ?? ""}`}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
