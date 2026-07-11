import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { ChrismedFlagsBar } from '@/components/chrismed/ChrismedFlagsBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Globe2, CreditCard, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/chrismed/teleconsulta')({
  head: () => ({
    meta: [
      { title: 'Teleconsulta — Dra. Cristiane Alencar · CrisMed' },
      { name: 'description', content: 'Teleconsulta médica com a Dra. Cristiane Alencar em português, inglês e espanhol. Agendamento online com pagamento via Mercado Pago e link de consulta enviado por e-mail e WhatsApp.' },
      { property: 'og:title', content: 'Teleconsulta · CrisMed' },
      { property: 'og:description', content: 'Atendimento médico por vídeo em PT · EN · ES com pagamento online e link enviado automaticamente.' },
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
            Consulta por vídeo com a Dra. Cristiane Alencar
          </h1>
          <p className="mt-6 text-lg text-[var(--chrismed-graphite)] max-w-2xl">
            Atendimento médico online, com acolhimento clínico e orientação detalhada. Em português, inglês ou espanhol, para você onde estiver.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-5 max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)]">Diagnóstico 360°</div>
            <p className="mt-1 text-[var(--chrismed-ink)]">
              Na teleconsulta você <strong>não precisa escolher especialidade</strong>. A Dra. Christiane funde na mesma consulta o conhecimento de <strong>Gastroenterologia</strong>, <strong>Hepatologia</strong> e <strong>Clínica Médica</strong> — um único olhar clínico, integrado.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]">
              <Link to="/chrismed/agendar" search={{ modality: 'telemedicina' }}>Ver horários e agendar</Link>
            </Button>
            <Button asChild variant="outline" className="border-[var(--chrismed-sand)]">
              <Link to="/chrismed/contato">Falar com a equipe</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="chrismed-serif text-2xl text-[var(--chrismed-ink)] flex items-center gap-2"><Video className="h-5 w-5" /> Como funciona</h2>
          <ol className="mt-5 space-y-3 text-[var(--chrismed-graphite)] list-decimal pl-5">
            <li>Você escolhe o serviço “Teleconsulta”.</li>
            <li>Vê os horários disponíveis na agenda da Dra. Cristiane.</li>
            <li>Seleciona data e horário e preenche seu cadastro.</li>
            <li>Faz o pagamento online (Mercado Pago).</li>
            <li>Recebe a confirmação por e-mail e WhatsApp.</li>
            <li>Acessa o link de vídeo no horário marcado.</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Globe2 className="h-4 w-4" /> Idiomas</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Atendimento em português, inglês e espanhol — pacientes brasileiros e estrangeiros.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamento</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Pagamento obrigatório no ato do agendamento via Mercado Pago. O horário só fica reservado após confirmação do pagamento.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><Mail className="h-4 w-4" /> Confirmação automática</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Você recebe o link da consulta por e-mail e WhatsApp assim que o pagamento for aprovado.</p>
          </div>
          <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
            <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Sigilo e LGPD</h3>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-sm">Seus dados são tratados conforme a LGPD. Prontuário eletrônico criptografado e acessível apenas pela equipe médica.</p>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl pb-20">
        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-7">
          <h3 className="chrismed-serif text-xl text-[var(--chrismed-ink)] flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Indicado para</h3>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-[var(--chrismed-graphite)] text-sm">
            <li>• Avaliação clínica geral</li>
            <li>• Acompanhamento de pacientes crônicos</li>
            <li>• Orientação e interpretação de exames</li>
            <li>• Pacientes internacionais e em viagem</li>
            <li>• Renovação de receitas e relatórios</li>
            <li>• Segunda opinião médica</li>
          </ul>
        </div>
      </section>
    </div></ChrismedShell>
  );
}
