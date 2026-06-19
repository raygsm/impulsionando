import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope, Video, Home, RefreshCw, Filter } from 'lucide-react';

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
  presencial: { icon: Stethoscope, label: 'No consultório', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  telemedicina: { icon: Video, label: 'Por vídeo', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  domiciliar: { icon: Home, label: 'Onde você estiver', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  retorno: { icon: RefreshCw, label: 'Retorno acompanhado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
} as const;

export const Route = createFileRoute('/chrismed/ofertas')({
  head: () => ({
    meta: [
      { title: 'CHRISMED — Modalidades de Atendimento Premium' },
      { name: 'description', content: 'Conheça as modalidades CHRISMED: atendimento no consultório, por vídeo, médico onde você estiver e retornos acompanhados. Concierge médico com confirmação imediata.' },
      { property: 'og:title', content: 'CHRISMED — Modalidades de Atendimento' },
      { property: 'og:description', content: 'Atendimento médico no formato que se encaixa na sua rotina. Confirmação imediata, sigilo absoluto e equipe disponível.' },
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <Link to="/chrismed" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">C</div>
            <div>
              <div className="font-semibold tracking-tight">CHRISMED</div>
              <div className="text-xs text-muted-foreground -mt-0.5">Catálogo de serviços</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/chrismed"><Button variant="ghost" size="sm">Agendar</Button></Link>
            <Link to="/chrismed/ofertas"><Button variant="secondary" size="sm">Ofertas</Button></Link>
          </nav>
        </div>
      </header>

      <main className="container py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
            Nossas <span className="text-teal-600">modalidades</span> de atendimento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o formato que melhor se encaixa na sua rotina. Todos com prontuário eletrônico e prescrição digital.
          </p>
        </div>

        <div className="flex items-center gap-2 justify-center flex-wrap mb-8">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {modalities.map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === m
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
              }`}
            >
              {m === 'todos' ? 'Todas' : MODALITY_META[m].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-teal-600" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((o) => {
              const meta = MODALITY_META[o.modality];
              const Icon = meta.icon;
              return (
                <Card key={o.id} className="border-teal-100 hover:shadow-md transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${meta.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                    </div>
                    <CardTitle className="mt-3">{o.name}</CardTitle>
                    <CardDescription>{o.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{brl(o.price_cents)}</div>
                      <div className="text-xs text-muted-foreground">~{o.duration_minutes} min</div>
                    </div>
                    <Link to="/chrismed"><Button className="bg-teal-600 hover:bg-teal-700">Agendar</Button></Link>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="md:col-span-2 text-center py-12 text-muted-foreground">
                Nenhum serviço nesta modalidade ainda.
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          CHRISMED · Clínica Médica
          <div className="mt-1">Powered by <span className="font-semibold text-teal-700">Impulsionando</span></div>
        </div>
      </footer>
    </div>
  );
}
