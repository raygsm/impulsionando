import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  propertyTitle?: string
  referenceCode?: string
  companyName?: string
  propertyUrl?: string
  receivedAt?: string
}

const Email = ({ customerName, propertyTitle, referenceCode, companyName, propertyUrl, receivedAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Recebemos seu interesse no imóvel${referenceCode ? ` ${referenceCode}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Recebemos seu interesse</Heading>
        <Text style={text}>
          Olá{customerName ? `, ${customerName}` : ''}! Recebemos seu interesse no imóvel
          {referenceCode ? ` ${referenceCode}` : ''}{propertyTitle ? ` — ${propertyTitle}` : ''}.
        </Text>
        <Text style={text}>
          Um consultor{companyName ? ` da ${companyName}` : ''} entrará em contato em breve para apresentar mais detalhes e agendar uma visita.
        </Text>
        <Section style={card}>
          <Text style={label}>Imóvel</Text>
          <Text style={value}>{propertyTitle || '—'}</Text>
          {referenceCode ? (<><Text style={label}>Código</Text><Text style={value}>{referenceCode}</Text></>) : null}
          {propertyUrl ? (<><Text style={label}>Link</Text><Text style={value}>{propertyUrl}</Text></>) : null}
        </Section>
        <Hr style={hr} />
        <Text style={meta}>Solicitação recebida em: {receivedAt || new Date().toISOString()}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Recebemos seu interesse${data.referenceCode ? ` no imóvel ${data.referenceCode}` : ''}`,
  displayName: 'Vitrine — confirmação de interesse',
  previewData: {
    customerName: 'Maria Silva',
    propertyTitle: 'Apartamento 3 dormitórios — Centro',
    referenceCode: 'GAR-001',
    companyName: 'Imobiliária Garrido',
    propertyUrl: 'https://www.impulsionando.com.br/imoveis/garrido/abc',
    receivedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.5' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#475569', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#111827', margin: '0', wordBreak: 'break-word' as const }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const meta = { fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }
