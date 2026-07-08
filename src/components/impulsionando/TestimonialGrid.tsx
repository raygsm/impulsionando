import { Quote, Star } from "lucide-react";

export type Testimonial = {
  /** Texto do depoimento (sem aspas — o componente adiciona). */
  text: string;
  /** Nome de quem depõe. */
  name: string;
  /** Cargo/relação com o tenant (ex.: "Diretora de Eventos"). */
  role?: string;
  /** Contexto (ex.: "Casamento em Grumari 2024"). */
  context?: string;
  /** Avaliação de 1 a 5 (opcional). */
  rating?: 1 | 2 | 3 | 4 | 5;
  /** URL de avatar (opcional). */
  avatarUrl?: string;
};

/** Grid de depoimentos — substitui as implementações inline em Garrido, Colors, WMP. */
export function TestimonialGrid({
  testimonials,
  columns = 3,
}: {
  testimonials: Testimonial[];
  columns?: 2 | 3;
}) {
  const cols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className={`grid ${cols} gap-6`}>
      {testimonials.map((t) => (
        <TestimonialCard key={`${t.name}-${t.context ?? ""}`} {...t} />
      ))}
    </div>
  );
}

export function TestimonialCard({ text, name, role, context, rating, avatarUrl }: Testimonial) {
  return (
    <figure className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 flex flex-col">
      <Quote className="h-6 w-6 mb-3 text-primary" aria-hidden />
      {rating && (
        <div className="flex mb-3 text-primary" aria-label={`Avaliação ${rating} de 5`}>
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
      )}
      <blockquote className="text-sm md:text-base opacity-90 leading-relaxed flex-1">
        "{text}"
      </blockquote>
      <figcaption className="mt-4 pt-4 border-t border-border flex items-center gap-3">
        {avatarUrl && (
          <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
        )}
        <div className="min-w-0">
          <div className="font-serif text-sm truncate">{name}</div>
          {role && <div className="text-xs opacity-70 truncate">{role}</div>}
          {context && <div className="text-xs opacity-60 truncate mt-0.5">{context}</div>}
        </div>
      </figcaption>
    </figure>
  );
}
