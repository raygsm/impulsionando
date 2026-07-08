import { Link } from "@tanstack/react-router";
import { TENANT_MODELS, type ImpulsionitoDimensao } from "@/data/tenant-registry";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/impulsionando";

/**
 * Seção de descoberta reutilizável do Clube. Filtra TENANT_MODELS
 * pela dimensão do Impulsionito e renderiza cards padronizados —
 * evita duplicar o layout entre produtos/serviços/eventos/etc.
 */
export function DiscoverSection({
  eyebrow,
  title,
  description,
  dimensao,
  emptyText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  dimensao: ImpulsionitoDimensao;
  emptyText?: string;
}) {
  const models = TENANT_MODELS.filter((t) => t.impulsionitoDimensoes.includes(dimensao));

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} align="left" />

      {models.length === 0 ? (
        <p className="opacity-75">{emptyText ?? "Nenhuma empresa cadastrada nesta categoria ainda."}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {models.map((t) => (
            <article key={t.slug} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-1">
                  {t.segmentLabel}
                </span>
              </div>
              <h3 className="font-serif text-lg mb-1">{t.name}</h3>
              <p className="text-sm opacity-75 leading-relaxed flex-1">{t.tagline}</p>
              <div className="flex items-center gap-3 text-xs opacity-75 mt-3">
                {t.semantica.regioes?.[0] && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t.semantica.regioes[0]}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary" /> 4,8
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button asChild size="sm" className="flex-1 gap-1">
                  <Link to={t.route}>
                    Conhecer <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <a href="https://wa.me/5521993075000" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
