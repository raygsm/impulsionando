import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, MapPin, Clock, RefreshCw, CreditCard } from 'lucide-react';
import consultorioExame from '@/assets/chrismed/consultorio-exame.jpg.asset.json';
import consultorioRecepcao from '@/assets/chrismed/consultorio-recepcao.jpg.asset.json';
import consultorioEspera from '@/assets/chrismed/consultorio-espera.jpg.asset.json';

export const Route = createFileRoute('/chrismed/consultorio')({
  head: () => ({
    meta: [
      { title: 'Consulta no consultório — Copacabana · CrisMed' },
      { name: 'description', content: 'Consulta presencial com a Dra. Cristiane Alencar em Copacabana, Rio de Janeiro. Agendamento online com pagamento via Mercado Pago.' },
      { property: 'og:title', content: 'Consulta no consultório · CrisMed' },
      { property: 'og:description', content: 'Atendimento presencial em consultório próprio em Copacabana, com agendamento e pagamento online.' },
    ],
  }),
  component: ConsultorioPage,
});

function ConsultorioPage() {
  return (
    <ChrismedShell><div className="chrismed-page-mustard">
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container py-16 max-w-6xl grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] mb-5 uppercase tracking-[0.18em] text-[10px]">Consulta presencial</Badge>
            <h1 className="chrismed-serif text-4xl md:text-6xl text-[var(--chrismed-ink)] leading-[1.05]">Consulta no consultório, em Copacabana</h1>
            <p className="mt-6 text-lg text-[var(--chrismed-graphite)] max-w-xl">
              Um espaço leve, discreto e reservado — atendimento exclusivo, sem filas, com a Dra. Cristiane Alencar. Agende online, com horários reais e pagamento confirmando o seu lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]">
                <Link to="/chrismed/agendar" search={{ modality: 'presencial' }}>Ver horários e agendar</Link>
              </Button>
              <Button asChild variant="outline" className="border-[var(--chrismed-sand)]">
                <Link to="/chrismed/contato">Falar com a recepção</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={consultorioExame.url}
              alt="Sala de exame do consultório CrisMed em Copacabana"
              className="w-full aspect-[4/5] object-cover border border-[var(--chrismed-sand)] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]"
              loading="eager"
            />
            <div className="absolute -bottom-6 -left-6 hidden md:block w-40 h-52 border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-2">
              <img src={consultorioRecepcao.url} alt="Recepção do consultório" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-4">
          <figure className="col-span-2 md:row-span-2">
            <img src={consultorioRecepcao.url} alt="Ambiente de trabalho da recepção — claro e sereno" className="w-full h-full aspect-[4/3] md:aspect-auto object-cover border border-[var(--chrismed-sand)]" loading="lazy" />
          </figure>
          <figure>
            <img src={consultorioEspera.url} alt="Sala de espera aconchegante do consultório" className="w-full aspect-[4/5] object-cover border border-[var(--chrismed-sand)]" loading="lazy" />
          </figure>
          <figure>
            <img src={consultorioExame.url} alt="Detalhe da sala clínica" className="w-full aspect-[4/5] object-cover border border-[var(--chrismed-sand)]" loading="lazy" />
          </figure>
        </div>
        <p className="mt-5 text-sm text-[var(--chrismed-graphite)] italic max-w-2xl">
          Um consultório propositalmente pequeno — porque não há filas. Cada horário é reservado a um único paciente, com privacidade e tempo integral da Dra. Cristiane.
        </p>
      </section>


      <section className="container py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><MapPin className="h-4 w-4" /> Localização</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Copacabana, Rio de Janeiro. Endereço completo e referências enviados na confirmação do agendamento.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Clock className="h-4 w-4" /> Horários e atrasos</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Tolerância de até 15 minutos. Após isso a consulta pode precisar ser reagendada para preservar o horário dos próximos pacientes.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Remarcação e retorno</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Remarcações com até 24h de antecedência. Retornos clínicos seguem regra interna definida no atendimento inicial.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Pagamento online no ato do agendamento, via Mercado Pago. O horário fica reservado após a aprovação.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-7">
          <h3 className="chrismed-serif text-xl text-[var(--chrismed-ink)] flex items-center gap-2"><Stethoscope className="h-5 w-5" /> O que esperar</h3>
          <ul className="mt-4 space-y-2 text-[var(--chrismed-graphite)] text-sm">
            <li>• Anamnese detalhada e exame clínico cuidadoso.</li>
            <li>• Avaliação de exames trazidos pelo paciente.</li>
            <li>• Conduta, prescrições e relatórios entregues no mesmo dia.</li>
            <li>• Encaminhamentos quando necessário, dentro da rede de confiança da Dra. Cristiane.</li>
          </ul>
        </div>
      </section>
    </div></ChrismedShell>
  );
}
