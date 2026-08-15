import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { ChrismedFlagsBar } from '@/components/chrismed/ChrismedFlagsBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Globe2, CreditCard, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/chrismed/teleconsulta')({
  head: () => ({
    meta: [
      { title: 'Teleconsulta — Dra. Christiane Alencar · CHRISMED' },
      { name: 'description', content: 'Teleconsulta médica com a Dra. Christiane Alencar em português, inglês e espanhol. Consulte horários e condições diretamente na agenda CHRISMED.' },
      { property: 'og:title', content: 'Teleconsulta · CHRISMED' },
      { property: 'og:description', content: 'Atendimento médico por vídeo em português, inglês e espanhol.' },
    ],
  }),
  component: TeleconsultaPage,
});

function TeleconsultaPage() {
  return (
    <ChrismedShell><div className="chrismed-page-mustard">
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <ChrismedFlagsBar tone="light" align="right" className="mb-6" />
          <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] hover:bg-[var(--chrismed-sand)] mb-5 uppercase tracking-[0.18em] text-[10px]">
            Teleconsulta médica
          </Badge>
          <h1 className="chrismed-serif text-4xl md:text-6xl text-[var(--chrismed-ink)] leading-[1.05] max-w-3xl">
            Consulta por vídeo com a Dra. Christiane Alencar
          </h1>
          <p className="mt-6 text-lg text-[var(--chrismed-graphite)] max-w-2xl">
            Atendimento médico online, com acolhimento clínico e orientação detalhada. Em português, inglês ou espanhol, para você onde estiver.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-5 max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)]">Avaliação clínica integrada</div>
            <p className="mt-1 text-[var(--chrismed-ink)]">
              Na teleconsulta você <strong>não precisa escolher uma das três especialidades da Dra. Christiane</strong>. A avaliação integra sua formação e experiência em <strong>Gastroenterologia</strong>, <strong>Hepatologia</strong> e <strong>Clínica Médica</strong>, conforme a necessidade clínica de cada caso.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)]">
              <Link to="/chrismed/agendar" search={{ modality: 'telemedicina' }}>Ver horários e agendar</Link>
            </Button>
            <Button asChild variant="outline" className="border-[var(--chrismed-forest)] bg-white text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)]">
              <Link to="/chrismed/contato">Falar com a equipe</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="chrismed-serif text-2xl text-[var(--chrismed-ink)] flex items-center gap-2"><Video className="h-5 w-5" aria-hidden="true" /> Como funciona</h2>
          <ol className="mt-5 space-y-3 text-[var(--chrismed-graphite)] list-decimal pl-5">
            <li>Escolha “Teleconsulta” na agenda.</li>
            <li>Consulte os horários realmente disponíveis.</li>
            <li>Selecione data e horário e confira os dados do agendamento.</li>
            <li>Conclua a etapa de pagamento quando ela for exigida para a modalidade.</li>
            <li>Aguarde a confirmação oficial da CHRISMED no canal informado durante a jornada.</li>
            <li>Siga as instruções de acesso recebidas para entrar no atendimento no horário marcado.</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Globe2 className="h-4 w-4" aria-hidden="true" /> Idiomas</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Atendimento em português, inglês e espanhol para pacientes brasileiros e estrangeiros.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><CreditCard className="h-4 w-4" aria-hidden="true" /> Pagamento</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Quando houver pagamento antecipado, o valor e a forma disponível são apresentados antes da confirmação. O horário só é considerado confirmado após a conclusão das etapas exigidas na jornada.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" /> Confirmação</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">As orientações oficiais do agendamento são enviadas pelos canais habilitados pela CHRISMED e também devem permanecer disponíveis na jornada autenticada quando aplicável.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Privacidade</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Dados de saúde exigem proteção reforçada. A CHRISMED utiliza controles de acesso, rastreabilidade e tratamento compatível com a LGPD e com a finalidade assistencial.</p>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl pb-20">
        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-7">
          <h3 className="chrismed-serif text-xl text-[var(--chrismed-ink)] flex items-center gap-2"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Situações que podem ser avaliadas</h3>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-[var(--chrismed-graphite)] text-sm">
            <li>• Avaliação clínica geral</li>
            <li>• Acompanhamento de condições crônicas</li>
            <li>• Orientação sobre exames já realizados</li>
            <li>• Pacientes em viagem ou fora do Rio de Janeiro</li>
            <li>• Avaliação de necessidade de documentos médicos</li>
            <li>• Discussão de segunda opinião, quando pertinente</li>
          </ul>
          <p className="mt-5 text-xs leading-5 text-[var(--chrismed-mist)]">A adequação da teleconsulta depende da situação clínica. Se houver necessidade de exame físico presencial ou atendimento de urgência, a profissional poderá orientar outra modalidade de cuidado.</p>
        </div>
      </section>
    </div></ChrismedShell>
  );
}
