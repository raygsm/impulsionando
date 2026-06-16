import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button } from '@react-email/components'
import type { TemplateEntry } from './registry'

type Event = 'submitted' | 'approved' | 'rejected' | 'changes_requested'

interface Props {
  event?: Event
  propertyTitle?: string
  referenceCode?: string | null
  reviewerName?: string
  submitterName?: string
  notes?: string | null
  actionUrl?: string
  companyName?: string
}

const COPY: Record<Event, { heading: string; body: string; cta: string; color: string }> = {
  submitted: {
    heading: '📝 Imóvel enviado para aprovação',
    body: 'Um novo imóvel foi enviado para revisão na carteira.',
    cta: 'Abrir fila de aprovação',
    color: '#0ea5e9',
  },
  approved: {
    heading: '✅ Imóvel aprovado',
    body: 'Seu imóvel foi aprovado e já está publicado.',
    cta: 'Ver imóvel',
    color: '#16a34a',
  },
  rejected: {
    heading: '⛔ Imóvel rejeitado',
    body: 'Seu imóvel foi rejeitado pelo revisor. Veja o motivo abaixo.',
    cta: 'Abrir carteira',
    color: '#dc2626',
  },
  changes_requested: {
    heading: '✏️ Ajustes solicitados no imóvel',
    body: 'O revisor pediu ajustes antes de publicar este imóvel.',
    cta: 'Abrir carteira',
    color: '#d97706',
  },
}

const Email = ({
  event = 'submitted',
  propertyTitle,
  referenceCode,
  reviewerName,
  submitterName,
  notes,
  actionUrl,
  companyName,
}: Props) => {
  const c = COPY[event] ?? COPY.submitted
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{`${c.heading}${propertyTitle ? ` — ${propertyTitle}` : ''}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{ ...h1, color: c.color }}>{c.heading}</Heading>
          <Text style={text}>{c.body}</Text>

          <Section style={card}>
            <Text style={label}>Imóvel</Text>
            <Text style={value}>
              {propertyTitle ?? '—'}
              {referenceCode ? ` · Ref ${referenceCode}` : ''}
            </Text>

            {companyName ? (
              <>
                <Text style={label}>Imobiliária</Text>
                <Text style={value}>{companyName}</Text>
              </>
            ) : null}

            {submitterName ? (
              <>
                <Text style={label}>Enviado por</Text>
                <Text style={value}>{submitterName}</Text>
              </>
            ) : null}

            {reviewerName && event !== 'submitted' ? (
              <>
                <Text style={label}>Revisor</Text>
                <Text style={value}>{reviewerName}</Text>
              </>
            ) : null}

            {notes ? (
              <>
                <Text style={label}>Observações</Text>
                <Text style={value}>{notes}</Text>
              </>
            ) : null}
          </Section>

          {actionUrl ? (
            <Section style={{ textAlign: 'center', marginTop: 24 }}>
              <Button href={actionUrl} style={{ ...button, backgroundColor: c.color }}>
                {c.cta}
              </Button>
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>Você está recebendo este e-mail porque participa do fluxo de aprovação de imóveis.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const c = COPY[(data?.event as Event) ?? 'submitted'] ?? COPY.submitted
    return data?.propertyTitle ? `${c.heading} — ${data.propertyTitle}` : c.heading
  },
  displayName: 'Aprovação de imóvel',
  previewData: {
    event: 'submitted',
    propertyTitle: 'Apartamento 3 quartos · Flamengo',
    referenceCode: 'GAR-FLM-203',
    submitterName: 'João Corretor',
    companyName: 'Imobiliária Garrido',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: 560 }
const h1 = { fontSize: 22, margin: '0 0 8px' }
const text = { fontSize: 14, color: '#374151', margin: '0 0 16px', lineHeight: 1.5 }
const card = { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 18px', margin: '8px 0' }
const label = { fontSize: 11, color: '#6b7280', margin: '8px 0 2px', textTransform: 'uppercase' as const, letterSpacing: 0.4 }
const value = { fontSize: 14, color: '#111827', margin: '0 0 4px' }
const button = { color: '#ffffff', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' as const, display: 'inline-block' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const footer = { fontSize: 12, color: '#9ca3af' }
