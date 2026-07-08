import type { ReactNode } from "react";

export type StatItem = {
  /** Número/valor destacado (ex.: "+850", "24h", "R$ 2.9M") */
  value: string;
  /** Rótulo curto abaixo do valor */
  label: string;
  /** Ícone opcional (lucide-react) */
  icon?: ReactNode;
};

/**
 * Grid de estatísticas / KPIs públicos. Neutro em cor — herda do escopo
 * `[data-tenant="..."]`. Substitui os `<Stat />` inline duplicados em
 * WMP, Garrido, FoodService etc.
 */
export function StatGrid({
  stats,
  columns = 4,
  accentClassName = "text-primary",
}: {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  accentClassName?: string;
}) {
  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns];
  return (
    <dl className={`grid grid-cols-2 ${cols} gap-6 max-w-4xl mx-auto`}>
      {stats.map((s) => (
        <Stat key={s.label} {...s} accentClassName={accentClassName} />
      ))}
    </dl>
  );
}

export function Stat({
  value,
  label,
  icon,
  accentClassName = "text-primary",
}: StatItem & { accentClassName?: string }) {
  return (
    <div className="text-center">
      {icon && <div className={`mx-auto mb-2 ${accentClassName}`}>{icon}</div>}
      <dt className={`font-serif text-3xl md:text-4xl ${accentClassName}`}>{value}</dt>
      <dd className="text-xs uppercase tracking-wider mt-1 opacity-70">{label}</dd>
    </div>
  );
}
