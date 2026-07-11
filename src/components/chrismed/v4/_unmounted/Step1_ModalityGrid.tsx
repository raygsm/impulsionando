/**
 * V4 — Step 1: grid de modalidades (isolado, não montado).
 * Sem fetch. Consome `offerings` por prop (loader real virá do Codex).
 */
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { V4_DICTIONARY } from '@/content/chrismed/v4/dictionary';
import type { V4ModalityGridProps } from '@/content/chrismed/v4/contracts';

export function Step1_ModalityGrid({ offerings, onSelect, state, lang }: V4ModalityGridProps) {
  const d = V4_DICTIONARY[lang].step1;

  if (state === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-emerald-900" />
      </div>
    );
  }
  if (state === 'error') return <p className="text-center text-emerald-900/70 py-12">{d.error}</p>;
  if (state === 'empty' || offerings.length === 0)
    return <p className="text-center text-emerald-900/70 py-12">{d.empty}</p>;

  return (
    <section>
      <h2 className="font-serif text-2xl text-emerald-950">{d.title}</h2>
      <p className="text-sm text-emerald-900/70 mt-1 mb-6">{d.subtitle}</p>
      <div className="grid md:grid-cols-2 gap-5">
        {offerings.map((o) => (
          <Card
            key={o.id}
            className="border-emerald-900/10 hover:border-emerald-900/30 bg-white cursor-pointer transition-all"
            onClick={() => onSelect(o.id)}
          >
            <CardHeader>
              <CardTitle className="font-serif text-emerald-950 text-xl">{o.name}</CardTitle>
              <CardDescription className="text-emerald-900/70">{o.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-serif text-emerald-950">
                  {o.price_cents === 0 ? '—' : `R$ ${(o.price_cents / 100).toFixed(2).replace('.', ',')}`}
                </div>
                <div className="text-xs text-emerald-900/60">~{o.duration_minutes} min</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
