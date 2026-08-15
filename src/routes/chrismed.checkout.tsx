import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldCheck, CalendarCheck, ArrowRight } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/chrismed/checkout')({
  head: () => ({
    meta: [
      { title: 'Pagamento e agendamento — CHRISMED' },
      {
        name: 'description',
        content: 'O pagamento CHRISMED é iniciado somente dentro do fluxo oficial de agendamento, após a escolha de um horário realmente disponível.',
      },
      { property: 'og:title', content: 'Pagamento e agendamento · CHRISMED' },
      {
        property: 'og:description',
        content: 'Use a agenda oficial CHRISMED para consultar disponibilidade e seguir com a confirmação do atendimento.',
      },
    ],
  }),
  component: CheckoutRedirectPage,
});

/**
 * Rota histórica mantida apenas para compatibilidade com links antigos.
 * Não inicia cobrança, não calcula preço no cliente e não oferece PIX ou
 * links externos paralelos. Toda transação deve nascer de um hold válido
 * criado pela jornada oficial /agendar.
 */
function CheckoutRedirectPage() {
  return (
    <ChrismedShell variant="minimal">
      <main className="min-h-[65vh] bg-[var(--chrismed-ivory)] px-4 py-16 text-[var(--chrismed-ink)] sm:py-24">
        <section className="mx-auto max-w-2xl rounded-3xl border border-[var(--chrismed-sand)] bg-white p-7 text-center shadow-[var(--chrismed-shadow-md)] sm:p-10">
          <Badge className="mb-5 border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-ink)]">
            Jornada protegida
          </Badge>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--chrismed-forest-mist)] text-[var(--chrismed-forest-deep)]">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="chrismed-serif mt-6 text-3xl font-semibold text-[var(--chrismed-forest-deep)] sm:text-4xl">
            Pagamentos começam pela agenda oficial
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--chrismed-graphite)]">
            Para proteger seu horário e garantir que o valor corresponda ao atendimento escolhido, consulte primeiro a disponibilidade real. Quando houver pagamento antecipado, a etapa será apresentada somente depois da reserva temporária do horário.
          </p>
          <div className="mt-7 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-4 text-left text-sm leading-6 text-[var(--chrismed-graphite)]">
            <strong className="text-[var(--chrismed-forest-deep)]">Importante:</strong> esta página não solicita PIX, não exibe chave de pagamento e não direciona para links de cobrança avulsos.
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-[var(--chrismed-forest-deep)] text-white hover:bg-[var(--chrismed-forest)]">
              <Link to="/chrismed/agendar">
                <CalendarCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Ver horários e agendar
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[var(--chrismed-forest)] bg-white text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)]">
              <Link to="/chrismed/contato">
                Falar com a equipe
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </ChrismedShell>
  );
}
