import { createFileRoute, Link } from '@tanstack/react-router';
import { FileCheck2, ShieldCheck } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';

export const Route = createFileRoute('/chrismed/termos')({
  head: () => ({
    meta: [
      { title: 'Termos de Uso e Atendimento — CHRISMED' },
      { name: 'description', content: 'Condições de uso, atendimento, contratação, pagamento e cancelamento dos serviços CHRISMED.' },
    ],
  }),
  component: ChrismedTermsPage,
});

const SECTIONS = [
  ['1. Objeto', 'Estes termos regulam o uso dos canais digitais e a contratação de consultas, teleconsultas, atendimento domiciliar, medicina ocupacional, GMS e eventos oferecidos pela CHRISMED.'],
  ['2. Relação assistencial', 'O agendamento não substitui avaliação médica. Diagnósticos, condutas, prescrições e encaminhamentos dependem da avaliação profissional e das normas do CFM. Em urgências, procure imediatamente o serviço de emergência adequado.'],
  ['3. Cadastro e veracidade', 'O usuário deve fornecer informações completas e verdadeiras, manter seus contatos atualizados e proteger suas credenciais. Dados incorretos podem impedir o atendimento ou a emissão de documentos.'],
  ['4. Agenda e confirmação', 'A reserva somente é confirmada após a validação do horário e, quando aplicável, a aprovação do pagamento. Horários temporariamente selecionados podem expirar antes da confirmação.'],
  ['5. Pagamento', 'Valores e condições são exibidos antes da confirmação. Pagamentos eletrônicos são processados pelo provedor indicado no checkout. A CHRISMED não armazena os dados completos do cartão.'],
  ['6. Cancelamento e reagendamento', 'Salvo condição específica informada antes da compra, cancelamentos com mais de 24 horas de antecedência permitem reembolso integral. Solicitações posteriores, ausências e serviços já iniciados serão analisados conforme a natureza do atendimento e a legislação aplicável.'],
  ['7. Telemedicina e GMS', 'O paciente declara possuir conexão e ambiente adequados, aceita as limitações próprias do atendimento remoto e reconhece que poderá ser encaminhado para avaliação presencial. O GMS oferece suporte de coordenação e não substitui serviços públicos de emergência.'],
  ['8. Eventos e empresas', 'Contratações empresariais, ocupacionais ou de eventos podem exigir proposta, escopo e instrumento contratual específicos. Havendo divergência, o contrato específico prevalece sobre estes termos gerais.'],
  ['9. Privacidade e prontuário', 'Dados pessoais e dados de saúde são tratados para tutela da saúde, execução do serviço e obrigações legais, conforme a Política de Privacidade, a LGPD e as regras de guarda do prontuário médico.'],
  ['10. Comunicações', 'Confirmações, orientações e avisos operacionais podem ser enviados por e-mail, telefone ou WhatsApp. Comunicações promocionais dependem de base legal ou consentimento próprio e podem ser canceladas.'],
  ['11. Responsabilidades', 'A CHRISMED emprega medidas técnicas e administrativas proporcionais ao risco. Não responde por indisponibilidades externas, informações falsas fornecidas pelo usuário ou uso indevido de credenciais.'],
  ['12. Vigência e contato', 'Versão 2026-08-08, vigente a partir de sua publicação. Dúvidas ou solicitações podem ser encaminhadas a sac@chrismed.com.br pelos canais oficiais.'],
] as const;

function ChrismedTermsPage() {
  return (
    <ChrismedShell>
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-forest-deep)] text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 md:px-6 md:py-24">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--chrismed-amber-soft)]">
            <FileCheck2 className="h-5 w-5" /> Versão 2026-08-08
          </div>
          <h1 className="chrismed-serif mt-5 text-4xl text-[var(--chrismed-amber)] md:text-6xl">Termos de Uso e Atendimento</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">Regras transparentes para utilizar os canais digitais e contratar serviços CHRISMED.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="mb-10 flex gap-3 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-forest-mist)] p-5 text-sm leading-relaxed text-[var(--chrismed-forest-deep)]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>O aceite eletrônico registra concordância com esta versão. Contratos específicos de empresas, eventos ou serviços personalizados permanecem complementares.</p>
        </div>
        <div className="space-y-9">
          {SECTIONS.map(([title, body]) => (
            <article key={title}>
              <h2 className="chrismed-serif text-2xl text-[var(--chrismed-forest-deep)]">{title}</h2>
              <p className="mt-3 leading-7 text-[var(--chrismed-graphite)]">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4 border-t border-[var(--chrismed-sand)] pt-8 text-sm">
          <Link to="/chrismed/privacidade" className="font-semibold text-[var(--chrismed-forest-deep)] underline">Política de Privacidade e LGPD</Link>
          <Link to="/chrismed/contato" className="font-semibold text-[var(--chrismed-forest-deep)] underline">Falar com a CHRISMED</Link>
        </div>
      </section>
    </ChrismedShell>
  );
}
