export type StepItem = {
  /** Número visual (ex.: "1", "01", "I"). */
  number: string | number;
  title: string;
  description: string;
};

/**
 * Lista numerada de passos ("Como funciona"). Substitui o padrão
 * "1 · Briefing / 2 · Proposta / 3 · Execução / 4 · Pós" repetido
 * em WMP/Sobre, Garrido, FoodService, etc.
 */
export function StepList({
  steps,
  columns = 4,
}: {
  steps: StepItem[];
  columns?: 3 | 4;
}) {
  const cols = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";
  return (
    <ol className={`grid ${cols} gap-6`}>
      {steps.map((s) => (
        <li key={s.title} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
          <div className="font-serif text-4xl mb-2 text-primary">{s.number}</div>
          <h3 className="font-serif text-lg mb-2">{s.title}</h3>
          <p className="text-sm opacity-75 leading-relaxed">{s.description}</p>
        </li>
      ))}
    </ol>
  );
}
