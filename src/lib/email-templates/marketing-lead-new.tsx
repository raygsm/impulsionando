import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  leadName?: string
  leadEmail?: string
  leadPhone?: string
  leadCompany?: string
  leadSource?: string
  leadMessage?: string
  recommendedPlan?: string
  recommendedModules?: string[] | string
  pageUrl?: string
  createdAt?: string
}

const fmtModules = (m?: string[] | string) =>
  Array.isArray(m) ? m.join(', ') : (m || '—')

const Email = ({
  leadName,
  leadEmail,
  leadPhone,
  leadCompany,
  leadSource,
  leadMessage,
  recommendedPlan,
  recommendedModules,
  pageUrl,
  createdAt,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Novo lead do site${leadName ? `: ${leadName}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📩 Novo lead do site</Heading>
        <Text style={text}>
          Um visitante acabou de enviar um formulário em impulsionando.com.br.
        </Text>

        <Section style={card}>
          <Text style={label}>Nome</Text>
          <Text style={value}>{leadName || '—'}</Text>

          <Text style={label}>E-mail</Text>
          <Text style={value}>{leadEmail || '—'}</Text>

          <Text style={label}>WhatsApp / Telefone</Text>
          <Text style={value}>{leadPhone || '—'}</Text>

          {leadCompany ? (
            <>
              <Text style={label}>Empresa</Text>
              <Text style={value}>{leadCompany}</Text>
            </>
          ) : null}

          <Text style={label}>Origem</Text>
          <Text style={value}>{leadSource || '—'}</Text>

          {recommendedPlan ? (
            <>
              <Text style={label}>Plano recomendado</Text>
              <Text style={value}>{recommendedPlan}</Text>
            </>
          ) : null}

          {recommendedModules && (Array.isArray(recommendedModules) ? recommendedModules.length : recommendedModules) ? (
            <>
              <Text style={label}>Módulos recomendados</Text>
              <Text style={value}>{fmtModules(recommendedModules)}</Text>
            </>
          ) : null}
        </Section>

        {leadMessage ? (
          <Section style={msgCard}>
            <Text style={label}>Mensagem</Text>
            <Text style={value}>{leadMessage}</Text>
          </Section>
        ) : null}

        <Hr style={hr} />

        <Text style={meta}>
          Página: {pageUrl || '—'}
          <br />
          Recebido em: {createdAt || new Date().toISOString()}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `📩 Novo lead${data.leadName ? `: ${data.leadName}` : ''}${data.leadSource ? ` (${data.leadSource})` : ''}`,
  displayName: 'Novo lead do site',
  to: 'sac@impulsionando.com.br',
  previewData: {
    leadName: 'João das Couves',
    leadEmail: 'joao@example.com',
    leadPhone: '(21) 99999-9999',
    leadCompany: 'Acme',
    leadSource: 'orcamento',
    leadMessage: 'Plano Integrado · Módulos: CRM, Financeiro',
    recommendedPlan: 'Integrado',
    recommendedModules: ['CRM', 'Financeiro'],
    pageUrl: 'https://impulsionando.com.br/orcamento',
    createdAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.5' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const msgCard = { backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', margin: '8px 0 16px 0' }
const label = { fontSize: '11px', color: '#475569', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#111827', margin: '0', wordBreak: 'break-word' as const }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const meta = { fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }
