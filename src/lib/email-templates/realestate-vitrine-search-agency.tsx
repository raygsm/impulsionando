import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  operation?: string
  cities?: string[]
  neighborhoods?: string[]
  priceMin?: number | null
  priceMax?: number | null
  bedrooms?: number
  notes?: string
  matchesCount?: number
  source?: string
  actionUrl?: string
  receivedAt?: string
}

const fmt = (v?: number | null) => (v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))
const arr = (v?: string[]) => (v && v.length ? v.join(', ') : '—')

const Email = ({ customerName, customerEmail, customerPhone, operation, cities, neighborhoods, priceMin, priceMax, bedrooms, notes, matchesCount, source, actionUrl, receivedAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Nova busca cadastrada${customerName ? ` — ${customerName}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔎 Nova busca na vitrine</Heading>
        <Text style={text}>Um cliente cadastrou uma nova busca pela vitrine.</Text>
        <Section style={card}>
          <Text style={label}>Nome</Text><Text style={value}>{customerName || '—'}</Text>
          <Text style={label}>E-mail</Text><Text style={value}>{customerEmail || '—'}</Text>
          <Text style={label}>Telefone / WhatsApp</Text><Text style={value}>{customerPhone || '—'}</Text>
          <Text style={label}>Finalidade</Text><Text style={value}>{operation || '—'}</Text>
          <Text style={label}>Cidades</Text><Text style={value}>{arr(cities)}</Text>
          <Text style={label}>Bairros</Text><Text style={value}>{arr(neighborhoods)}</Text>
          <Text style={label}>Faixa</Text><Text style={value}>{fmt(priceMin)} a {fmt(priceMax)}</Text>
          <Text style={label}>Dormitórios mínimos</Text><Text style={value}>{bedrooms ?? 0}</Text>
          <Text style={label}>Imóveis compatíveis (estoque)</Text><Text style={value}>{matchesCount ?? 0}</Text>
          <Text style={label}>Origem</Text><Text style={value}>{source || 'vitrine'}</Text>
        </Section>
        {notes ? (
          <Section style={msg}><Text style={label}>Observações</Text><Text style={value}>{notes}</Text></Section>
        ) : null}
        <Hr style={hr} />
        <Text style={meta}>Recebido em: {receivedAt || new Date().toISOString()}{actionUrl ? <><br />Abrir no admin: {actionUrl}</> : null}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `🔎 Nova busca cadastrada${data.customerName ? ` — ${data.customerName}` : ''}`,
  displayName: 'Vitrine — nova busca (imobiliária)',
  previewData: {
    customerName: 'Maria Silva', customerEmail: 'maria@example.com', customerPhone: '(48) 99999-9999',
    operation: 'venda', cities: ['Florianópolis'], neighborhoods: ['Centro'],
    priceMin: 300000, priceMax: 600000, bedrooms: 2, matchesCount: 3,
    source: 'vitrine', actionUrl: 'https://www.impulsionando.com.br/imobiliaria/intencoes',
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
