import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  propertyTitle?: string
  referenceCode?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  message?: string
  kind?: string
  source?: string
  actionUrl?: string
  receivedAt?: string
}

const KIND: Record<string, string> = {
  interesse: 'Interesse no imóvel',
  visita: 'Pedido de visita',
  avaliacao: 'Pedido de avaliação',
  contato: 'Solicitação de contato',
  proposta: 'Proposta',
}

const Email = ({ propertyTitle, referenceCode, customerName, customerEmail, customerPhone, message, kind, source, actionUrl, receivedAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Novo interessado: ${customerName ?? 'cliente'}${referenceCode ? ` — ${referenceCode}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🏠 Novo interessado na vitrine</Heading>
        <Text style={text}>
          {KIND[kind ?? 'interesse'] ?? 'Interesse no imóvel'}{referenceCode ? ` ${referenceCode}` : ''}{propertyTitle ? ` — ${propertyTitle}` : ''}.
        </Text>
        <Section style={card}>
          <Text style={label}>Nome</Text><Text style={value}>{customerName || '—'}</Text>
          <Text style={label}>E-mail</Text><Text style={value}>{customerEmail || '—'}</Text>
          <Text style={label}>Telefone / WhatsApp</Text><Text style={value}>{customerPhone || '—'}</Text>
          <Text style={label}>Tipo</Text><Text style={value}>{KIND[kind ?? 'interesse'] ?? kind ?? '—'}</Text>
          <Text style={label}>Origem</Text><Text style={value}>{source || 'vitrine'}</Text>
        </Section>
        {message ? (
          <Section style={msg}>
            <Text style={label}>Mensagem do cliente</Text>
            <Text style={value}>{message}</Text>
          </Section>
        ) : null}
        <Hr style={hr} />
        <Text style={meta}>
          Recebido em: {receivedAt || new Date().toISOString()}
          {actionUrl ? <><br />Abrir no admin: {actionUrl}</> : null}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `🏠 Novo interessado${data.referenceCode ? ` — ${data.referenceCode}` : ''}${data.customerName ? ` (${data.customerName})` : ''}`,
  displayName: 'Vitrine — novo interessado (imobiliária)',
  previewData: {
    propertyTitle: 'Apartamento 3 dormitórios — Centro',
    referenceCode: 'GAR-001',
    customerName: 'Maria Silva',
    customerEmail: 'maria@example.com',
    customerPhone: '(48) 99999-9999',
    message: 'Gostaria de agendar visita no fim de semana.',
    kind: 'visita',
    source: 'vitrine',
    actionUrl: 'https://www.impulsionando.com.br/imobiliaria/interessados',
    receivedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.5' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const msg = { backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', margin: '8px 0 16px 0' }
const label = { fontSize: '11px', color: '#475569', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#111827', margin: '0', wordBreak: 'break-word' as const }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const meta = { fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }
