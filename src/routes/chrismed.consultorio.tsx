import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, MapPin, Clock, RefreshCw, CreditCard } from 'lucide-react';

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
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">Consulta presencial</Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">Consulta no consultório, em Copacabana</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">
            Atendimento presencial com a Dra. Cristiane Alencar em consultório próprio, no coração de Copacabana. Agende online, com horários reais e pagamento confirmando o seu lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">
              <Link to="/chrismed/agendar" search={{ modality: 'presencial' }}>Ver horários e agendar</Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-900/20">
              <Link to="/chrismed/contato">Falar com a recepção</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><MapPin className="h-4 w-4" /> Localização</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Copacabana, Rio de Janeiro. Endereço completo e referências enviados na confirmação do agendamento.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><Clock className="h-4 w-4" /> Horários e atrasos</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Tolerância de até 15 minutos. Após isso a consulta pode precisar ser reagendada para preservar o horário dos próximos pacientes.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Remarcação e retorno</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Remarcações com até 24h de antecedência. Retornos clínicos seguem regra interna definida no atendimento inicial.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h3 className="font-serif text-lg text-emerald-950 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento</h3>
            <p className="mt-2 text-emerald-900/80 text-sm">Pagamento online no ato do agendamento, via Mercado Pago. O horário fica reservado após a aprovação.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-900/5 p-7">
          <h3 className="font-serif text-xl text-emerald-950 flex items-center gap-2"><Stethoscope className="h-5 w-5" /> O que esperar</h3>
          <ul className="mt-4 space-y-2 text-emerald-900/80 text-sm">
            <li>• Anamnese detalhada e exame clínico cuidadoso.</li>
            <li>• Avaliação de exames trazidos pelo paciente.</li>
            <li>• Conduta, prescrições e relatórios entregues no mesmo dia.</li>
            <li>• Encaminhamentos quando necessário, dentro da rede de confiança da Dra. Cristiane.</li>
          </ul>
        </div>
      </section>
    </ChrismedShell>
  );
}
