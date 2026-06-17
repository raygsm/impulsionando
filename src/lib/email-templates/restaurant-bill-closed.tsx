import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Item { description: string; quantity: number; total: number }
interface Props {
  customerName?: string
  tableNumber?: number | string
  total?: number
  items?: Item[]
  companyName?: string
}

const fmt = (n: number) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const Email = ({ customerName, tableNumber, total, items, companyName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Sua conta foi fechada — obrigado pela preferência!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Obrigado pela visita! ✨</Heading>
        <Text style={text}>
          {customerName ? `Olá, ${customerName}!` : 'Olá!'} A conta
          {tableNumber ? <> da <strong>Mesa {tableNumber}</strong></> : null} foi fechada.
        </Text>
        {items?.length ? (
          <Section style={card}>
            {items.map((i, idx) => (
              <Text key={idx} style={{ ...text, margin: '4px 0' }}>
                {Number(i.quantity)}× {i.description} — <strong>{fmt(i.total)}</strong>
              </Text>
            ))}
            <hr style={hr} />
            <Text style={{ ...text, fontWeight: 700 }}>Total: {fmt(total ?? 0)}</Text>
          </Section>
        ) : (
          <Section style={card}>
            <Text style={{ ...text, fontWeight: 700 }}>Total: {fmt(total ?? 0)}</Text>
          </Section>
        )}
        <Text style={text}>Esperamos te ver novamente em breve! 💙</Text>
        <Text style={meta}>{companyName ?? 'Equipe do restaurante'} · enviado via Impulsionando</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Sua conta${d.tableNumber ? ` da mesa ${d.tableNumber}` : ''} — ${fmt(d.total ?? 0)}`,
  displayName: 'Conta fechada (restaurante)',
  previewData: {
    customerName: 'Maria',
    tableNumber: 7,
    total: 78.5,
    items: [
      { description: 'Picanha na chapa', quantity: 1, total: 65 },
      { description: 'Refrigerante 600ml', quantity: 1, total: 13.5 },
    ],
    companyName: 'Bar do João',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const hr = { border: 0, borderTop: '1px solid #e2e8f0', margin: '8px 0' }
const meta = { fontSize: '11px', color: '#6b7280', marginTop: '12px' }
