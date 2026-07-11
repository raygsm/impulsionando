import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope, Video, Home, RefreshCw, Filter } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

type Offering = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  modality: 'presencial' | 'telemedicina' | 'domiciliar' | 'retorno';
  price_cents: number;
  duration_minutes: number;
};

const MODALITY_META = {
  presencial: { icon: Stethoscope, label: 'No consultório' },
  telemedicina: { icon: Video, label: 'Por vídeo' },
  domiciliar: { icon: Home, label: 'Onde você estiver' },
  retorno: { icon: RefreshCw, label: 'Retorno acompanhado' },
} as const;

export const Route = createFileRoute('/chrismed/ofertas')({
  head: () => ({
    meta: [
      { title: 'Modalidades de atendimento · CrisMed' },
      { name: 'description', content: 'Conheça as modalidades CrisMed: consulta presencial em Copacabana, teleconsulta, atendimento domiciliar e retornos acompanhados — com a Dra. Cristiane Alencar.' },
      { property: 'og:title', content: 'Modalidades de atendimento · CrisMed' },
      { property: 'og:description', content: 'Atendimento médico no formato que se encaixa na sua rotina, com sigilo, precisão e conforto.' },
    ],
  }),
  component: OfertasPage,
});

function brl(c: number) {
  return c === 0 ? 'Cortesia' : `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
}

function OfertasPage() {
  const [items, setItems] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | Offering['modality']>('todos');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('chrismed_service_offerings')
        .select('id,slug,name,description,modality,price_cents,duration_minutes')
        .eq('company_id', CHRISMED_COMPANY_ID)
        .eq('active', true)
        .order('display_order');
      setItems((data ?? []) as Offering[]);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'todos' ? items : items.filter((i) => i.modality === filter);
  const modalities: Array<'todos' | Offering['modality']> = ['todos', 'presencial', 'telemedicina', 'domiciliar', 'retorno'];

  return (
    <ChrismedShell>
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container py-16 max-w-5xl">
          <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] mb-5 uppercase tracking-[0.18em] text-[10px]">
            Modalidades de atendimento
          </Badge>
          <h1 className="chrismed-serif text-4xl md:text-5xl text-[var(--chrismed-ink)] leading-[1.05] max-w-3xl">
            O atendimento certo, no formato que cabe na sua rotina
          </h1>
          <p className="mt-5 text-lg text-[var(--chrismed-graphite)] max-w-2xl">
            Cada modalidade entrega a mesma qualidade clínica, com prontuário eletrônico, prescrição digital e equipe sempre acessível.
          </p>
        </div>
      </section>

      <section className="container py-12 max-w-5xl">
        <div className="flex items-center gap-2 justify-center flex-wrap mb-8">
          <Filter className="h-4 w-4 text-[var(--chrismed-mist)]" />
          {modalities.map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                filter === m
                  ? 'bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] border-[var(--chrismed-ink)]'
                  : 'bg-[var(--chrismed-ivory)] text-[var(--chrismed-graphite)] border-[var(--chrismed-sand)] hover:border-[var(--chrismed-champagne-deep)]'
              }`}
              aria-pressed={filter === m}
            >
              {m === 'todos' ? 'Todas' : MODALITY_META[m].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[var(--chrismed-ink)]" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((o) => {
              const meta = MODALITY_META[o.modality];
              const Icon = meta.icon;
              return (
                <Card key={o.id} className="border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] hover:border-[var(--chrismed-sand)] hover:shadow-[0_18px_40px_-20px_rgba(6,42,32,0.35)] transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="bg-[var(--chrismed-bone)] text-[var(--chrismed-champagne-deep)] border-[var(--chrismed-champagne)] uppercase tracking-[0.14em] text-[10px]">{meta.label}</Badge>
                    </div>
                    <CardTitle className="mt-3 chrismed-serif text-[var(--chrismed-ink)]">{o.name}</CardTitle>
                    <CardDescription className="text-[var(--chrismed-graphite)]">{o.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl chrismed-serif text-[var(--chrismed-ink)]">{brl(o.price_cents)}</div>
                      <div className="text-xs text-[var(--chrismed-mist)]">~{o.duration_minutes} min</div>
                    </div>
                    <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)] shadow-sm">
                      <Link to="/chrismed/agendar" search={{ modality: o.modality }}>Reservar horário</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="md:col-span-2 text-center py-12 text-[var(--chrismed-mist)]">
                Nenhuma modalidade ativa nesse filtro no momento.
              </div>
            )}
          </div>
        )}
      </section>
    </ChrismedShell>
  );
}
