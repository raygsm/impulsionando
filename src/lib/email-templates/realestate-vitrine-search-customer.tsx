import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  operation?: string
  cities?: string[]
  neighborhoods?: string[]
  priceMin?: number | null
  priceMax?: number | null
  bedrooms?: number
  companyName?: string
  receivedAt?: string
}

const fmt = (v?: number | null) => (v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))
const arr = (v?: string[]) => (v && v.length ? v.join(', ') : '—')

const Email = ({ customerName, operation, cities, neighborhoods, priceMin, priceMax, bedrooms, companyName, receivedAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recebemos sua busca por imóvel</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Recebemos sua busca</Heading>
        <Text style={text}>
          Olá{customerName ? `, ${customerName}` : ''}! Sua busca foi cadastrada com sucesso{companyName ? ` na ${companyName}` : ''}. Avisaremos quando aparecerem imóveis compatíveis.
        </Text>
        <Section style={card}>
          <Text style={label}>Finalidade</Text><Text style={value}>{operation || '—'}</Text>
          <Text style={label}>Cidades</Text><Text style={value}>{arr(cities)}</Text>
          <Text style={label}>Bairros</Text><Text style={value}>{arr(neighborhoods)}</Text>
          <Text style={label}>Faixa de preço</Text><Text style={value}>{fmt(priceMin)} a {fmt(priceMax)}</Text>
          <Text style={label}>Dormitórios mínimos</Text><Text style={value}>{bedrooms ?? 0}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={meta}>Cadastrada em: {receivedAt || new Date().toISOString()}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: () => 'Recebemos sua busca por imóvel',
  displayName: 'Vitrine — confirmação de busca salva',
  previewData: {
    customerName: 'Maria Silva', operation: 'venda',
    cities: ['Florianópolis'], neighborhoods: ['Centro', 'Trindade'],
    priceMin: 300000, priceMax: 600000, bedrooms: 2,
    companyName: 'Imobiliária Garrido',
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
