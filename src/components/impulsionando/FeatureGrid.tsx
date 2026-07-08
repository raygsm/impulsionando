import type { LucideIcon } from "lucide-react";

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/**
 * Grid de features/serviços. Padrão que se repete em WMP, Garrido,
 * FoodService, Chrismed. Neutro em cor.
 */
export function FeatureGrid({
  features,
  columns = 3,
}: {
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
}) {
  const cols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  }[columns];
  return (
    <div className={`grid ${cols} gap-6`}>
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 transition hover:-translate-y-1 hover:border-primary/40"
          >
            <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h3 className="font-serif text-lg md:text-xl mb-2">{f.title}</h3>
            <p className="opacity-75 text-sm leading-relaxed">{f.description}</p>
          </div>
        );
      })}
    </div>
  );
}
