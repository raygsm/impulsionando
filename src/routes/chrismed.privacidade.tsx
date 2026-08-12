import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { ChrismedContainer } from '@/components/chrismed/primitives/ChrismedContainer';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/chrismed/privacidade')({
  head: () => ({
    meta: [
      { title: 'Privacidade e LGPD — CHRISMED' },
      { name: 'description', content: 'Como a CHRISMED coleta, armazena e protege dados clínicos e pessoais dos pacientes, em conformidade com a LGPD e o sigilo médico.' },
      { property: 'og:title', content: 'Privacidade · CHRISMED' },
      { property: 'og:description', content: 'Política de privacidade e tratamento de dados CHRISMED.' },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const lang = useLang();
  const t = COPY[lang];

  return (
    <ChrismedShell>
      <section className="w-full border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <ChrismedContainer className="py-16 sm:py-18 md:py-20">
          <div className="mx-auto w-full max-w-4xl">
            <Badge className="mb-5 border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-ink)]">
              {t.eyebrow}
            </Badge>

            <h1 className="chrismed-serif flex max-w-3xl items-start gap-3 text-4xl leading-[1.05] text-[var(--chrismed-ink)] md:text-5xl">
              <ShieldCheck className="mt-2 h-9 w-9 shrink-0 text-[var(--chrismed-ink)]" />
              <span>{t.title}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--chrismed-graphite)]">
              {t.lead}
            </p>
          </div>
        </ChrismedContainer>
      </section>

      <section className="w-full bg-[var(--chrismed-ivory)] py-14 sm:py-16 md:py-20">
        <ChrismedContainer>
          <div className="prose prose-neutral mx-auto w-full max-w-3xl prose-headings:chrismed-serif prose-headings:text-[var(--chrismed-ink)] prose-p:text-[var(--chrismed-graphite)]">
            {(t.sections as ReadonlyArray<{ title: string; paragraphs: readonly string[]; list?: readonly string[] }>).map((s) => (
              <section key={s.title} className="mb-10 last:mb-0">
                <h2 className="text-2xl">{s.title}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="mt-3 leading-relaxed">{p}</p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-2 text-[var(--chrismed-graphite)]">
                    {s.list.map((it) => (
                      <li key={it} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--chrismed-champagne-deep)]" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <aside className="mt-12 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-6 text-sm text-[var(--chrismed-graphite)] shadow-[var(--chrismed-shadow-sm)]">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--chrismed-champagne-deep)]">
                {t.dpoLabel}
              </div>
              <div>{t.dpoBody}</div>
              <div className="mt-3">
                <Link
                  to="/chrismed/contato"
                  className="font-medium text-[var(--chrismed-ink)] underline underline-offset-4 hover:text-[var(--chrismed-forest)]"
                >
                  {t.dpoLink}
                </Link>
              </div>
            </aside>
          </div>
        </ChrismedContainer>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Privacidade · LGPD',
    title: 'Sigilo médico, dados pessoais e conformidade com a LGPD.',
    lead: 'Esta página descreve como a CHRISMED coleta, usa, armazena e protege dados pessoais e clínicos dos pacientes, em cumprimento à Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e ao sigilo profissional médico.',
    dpoLabel: 'Encarregado de Dados (DPO)',
    dpoBody: 'Solicitações de titular de dados (acesso, correção, exclusão, portabilidade) podem ser feitas pelos canais oficiais de contato CHRISMED.',
    dpoLink: 'Acessar canais de contato',
    sections: [
      { title: 'Quem somos', paragraphs: ['A CHRISMED é uma clínica médica particular liderada pela Dra. Cristiane Alencar, com atendimento presencial em Copacabana, teleconsulta, consulta domiciliar e medicina ocupacional para empresas.'] },
      { title: 'Dados que coletamos', paragraphs: ['Coletamos apenas os dados necessários para o cuidado clínico e a operação do serviço:'], list: ['Dados de identificação (nome, CPF, data de nascimento).', 'Dados de contato (e-mail, telefone/WhatsApp, endereço quando aplicável).', 'Dados clínicos (histórico médico, sinais e sintomas, exames, prescrições, evolução).', 'Dados de pagamento (processados pelo Mercado Pago; a CHRISMED não armazena dados de cartão).', 'Dados de navegação estritamente necessários para o funcionamento do site.'] },
      { title: 'Finalidades do tratamento', paragraphs: ['Utilizamos seus dados exclusivamente para: prestação do atendimento médico, agendamento e cobrança, cumprimento de obrigações legais e regulatórias, comunicação de retorno e orientação pós-consulta, e melhoria contínua do atendimento.'] },
      { title: 'Base legal', paragraphs: ['Tratamos dados com base em: consentimento do titular, execução de contrato de prestação de serviços médicos, cumprimento de obrigação legal/regulatória (CFM, Conselho Regional de Medicina, LGPD), tutela da saúde e legítimo interesse quando aplicável.'] },
      { title: 'Compartilhamento', paragraphs: ['Dados clínicos são compartilhados apenas com profissionais autorizados envolvidos no cuidado do paciente, com laboratórios/centros de imagem parceiros mediante requisição médica, e com autoridades quando exigido por lei.'] },
      { title: 'Segurança', paragraphs: ['Prontuário eletrônico com criptografia, controle de acesso por perfil, autenticação forte, trilhas de auditoria e política de retenção compatível com a legislação médica.'] },
      { title: 'Direitos do titular', paragraphs: ['Você pode a qualquer momento solicitar confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados, portabilidade e revogação de consentimento — respeitados os limites legais de retenção do prontuário médico.'] },
      { title: 'Cookies', paragraphs: ['O site utiliza apenas cookies estritamente necessários para funcionamento e cookies analíticos de agregação, sem identificação pessoal.'] },
      { title: 'Atualizações', paragraphs: ['Esta política pode ser atualizada. A versão vigente é sempre a publicada nesta página.'] },
    ],
  },
  en: {
    eyebrow: 'Privacy · LGPD',
    title: 'Medical privacy, personal data and Brazilian LGPD compliance.',
    lead: 'This page describes how CHRISMED collects, uses, stores and protects patients’ personal and clinical data, in compliance with the Brazilian General Data Protection Law (LGPD, Law 13,709/2018) and medical confidentiality duties.',
    dpoLabel: 'Data Protection Officer (DPO)',
    dpoBody: 'Data subject requests (access, correction, deletion, portability) can be filed through official CHRISMED contact channels.',
    dpoLink: 'Open contact channels',
    sections: [
      { title: 'Who we are', paragraphs: ['CHRISMED is a private medical clinic led by Dr. Cristiane Alencar, offering in-person care in Copacabana, telehealth, home visits and occupational medicine for companies.'] },
      { title: 'Data we collect', paragraphs: ['We only collect data necessary for clinical care and service operation:'], list: ['Identification data (name, national ID, date of birth).', 'Contact data (email, phone/WhatsApp, address when applicable).', 'Clinical data (medical history, signs and symptoms, exams, prescriptions, follow-up).', 'Payment data (processed by Mercado Pago; CHRISMED does not store card data).', 'Navigation data strictly required for site operation.'] },
      { title: 'Purposes', paragraphs: ['We use your data solely for: medical care, scheduling and billing, compliance with legal/regulatory duties, follow-up communication, and continuous quality improvement.'] },
      { title: 'Legal basis', paragraphs: ['Consent, contract execution for medical services, compliance with legal/regulatory obligations (CFM, CRM, LGPD), protection of health, and legitimate interest where applicable.'] },
      { title: 'Sharing', paragraphs: ['Clinical data is shared only with authorized professionals involved in the patient’s care, partner labs/imaging centers upon medical request, and authorities when legally required.'] },
      { title: 'Security', paragraphs: ['Encrypted electronic records, role-based access control, strong authentication, audit trails and retention aligned with medical legislation.'] },
      { title: 'Data subject rights', paragraphs: ['You can request confirmation of processing, access, correction, anonymization, blocking or deletion, portability and consent revocation — within legal medical record retention limits.'] },
      { title: 'Cookies', paragraphs: ['The site uses only strictly necessary cookies and aggregated analytics without personal identification.'] },
      { title: 'Updates', paragraphs: ['This policy may be updated. The current version is always the one published on this page.'] },
    ],
  },
  es: {
    eyebrow: 'Privacidad · LGPD',
    title: 'Sigilo médico, datos personales y cumplimiento LGPD.',
    lead: 'Esta página describe cómo CHRISMED recopila, usa, almacena y protege datos personales y clínicos de los pacientes, en cumplimiento con la LGPD (Ley 13.709/2018) y el secreto profesional médico.',
    dpoLabel: 'Encargado de Datos (DPO)',
    dpoBody: 'Solicitudes de titular (acceso, corrección, eliminación, portabilidad) por los canales oficiales de contacto CHRISMED.',
    dpoLink: 'Acceder a canales de contacto',
    sections: [
      { title: 'Quiénes somos', paragraphs: ['CHRISMED es una clínica médica particular liderada por la Dra. Cristiane Alencar, con atención presencial en Copacabana, teleconsulta, visita domiciliaria y medicina ocupacional.'] },
      { title: 'Datos que recopilamos', paragraphs: ['Solo los necesarios para el cuidado clínico y la operación del servicio:'], list: ['Identificación (nombre, documento, fecha de nacimiento).', 'Contacto (email, teléfono/WhatsApp, dirección cuando aplica).', 'Datos clínicos (historia médica, signos y síntomas, exámenes, prescripciones).', 'Datos de pago (procesados por Mercado Pago; CHRISMED no almacena datos de tarjeta).', 'Datos de navegación estrictamente necesarios.'] },
      { title: 'Finalidades', paragraphs: ['Prestación de atención médica, agenda y cobro, cumplimiento de obligaciones legales, comunicación de seguimiento y mejora continua.'] },
      { title: 'Base legal', paragraphs: ['Consentimiento, ejecución de contrato, cumplimiento legal (CFM, CRM, LGPD), tutela de la salud y legítimo interés cuando aplica.'] },
      { title: 'Compartición', paragraphs: ['Datos clínicos solo con profesionales autorizados, laboratorios/centros de imagen asociados por requisición médica y autoridades cuando la ley lo exige.'] },
      { title: 'Seguridad', paragraphs: ['Historia clínica electrónica cifrada, control de acceso por rol, autenticación fuerte, auditoría y retención conforme a la legislación médica.'] },
      { title: 'Derechos del titular', paragraphs: ['Puede solicitar confirmación, acceso, corrección, anonimización, bloqueo o eliminación, portabilidad y revocación — dentro de los límites legales de retención.'] },
      { title: 'Cookies', paragraphs: ['El sitio usa solo cookies estrictamente necesarias y analíticas agregadas sin identificación personal.'] },
      { title: 'Actualizaciones', paragraphs: ['Esta política puede actualizarse. La versión vigente es la publicada en esta página.'] },
    ],
  },
} as const;
