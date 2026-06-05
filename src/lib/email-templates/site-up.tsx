import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  url?: string
  downSince?: string
  recoveredAt?: string
  downtimeMinutes?: number
}

const Email = ({ url, downSince, recoveredAt, downtimeMinutes }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Resolvido: {url} voltou ao ar</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✅ Site voltou ao ar</Heading>
        <Text style={text}>O serviço voltou a responder normalmente.</Text>
        <Section style={card}>
          <Text style={label}>URL</Text>
          <Text style={value}>{url}</Text>
          <Text style={label}>Fora do ar desde</Text>
          <Text style={value}>{downSince}</Text>
          <Text style={label}>Restabelecido em</Text>
          <Text style={value}>{recoveredAt}</Text>
          <Text style={label}>Duração da indisponibilidade</Text>
          <Text style={value}>{downtimeMinutes} min</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `✅ Restabelecido: ${data.url ?? 'site'}`,
  displayName: 'Site restabelecido',
  previewData: {
    url: 'https://impulsionando.com.br',
    downSince: new Date(Date.now() - 600000).toISOString(),
    recoveredAt: new Date().toISOString(),
    downtimeMinutes: 10,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#15803d', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.5' }
const card = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#14532d', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#111827', margin: '0', wordBreak: 'break-all' as const }
