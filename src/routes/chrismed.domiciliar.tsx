import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { CalendarDays, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/chrismed/domiciliar')({
  head: () => ({
    meta: [
      { title: 'Consulta domiciliar — Dra. Christiane Alencar · CHRISMED' },
      { name: 'description', content: 'Consulta domiciliar integrada à agenda única da CHRISMED, compartilhada com ASO, teleconsulta, consulta presencial e perícia.' },
      { property: 'og:title', content: 'Consulta domiciliar · CHRISMED' },
      { property: 'og:description', content: 'Acesse diretamente a agenda única CHRISMED com a modalidade domiciliar já selecionada.' },
    ],
  }),
  component: DomiciliarPage,
});

function DomiciliarPage() {
  useEffect(() => {
    window.location.replace('/agendar?modality=domiciliar');
  }, []);

  return (
    <ChrismedShell>
      <main className="flex min-h-[65vh] items-center justify-center bg-[var(--chrismed-ivory)] px-4 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-[var(--chrismed-sand)] bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[var(--chrismed-forest)]" aria-hidden="true" />
          <h1 className="chrismed-serif mt-5 text-3xl text-[var(--chrismed-ink)]">Abrindo a agenda única CHRISMED</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--chrismed-graphite)]">
            Consulta domiciliar, ASO, teleconsulta, consulta presencial e perícia usam a mesma agenda do profissional. Quando um período é reservado, ele fica indisponível para todas as demais modalidades durante toda a duração do atendimento.
          </p>
          <Button asChild className="mt-6 bg-[var(--chrismed-ink)] text-white hover:bg-[var(--chrismed-forest)]">
            <Link to="/chrismed/agendar" search={{ modality: 'domiciliar' }}>
              <CalendarDays className="mr-2 h-4 w-4" /> Abrir agenda agora
            </Link>
          </Button>
        </div>
      </main>
    </ChrismedShell>
  );
}
