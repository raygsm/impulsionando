import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  invoiceNumber?: string
  amount?: string
  paidAt?: string
  receiptUrl?: string
}

const Email = ({ name, invoiceNumber, amount, paidAt, receiptUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recebemos seu pagamento — fatura {invoiceNumber ?? ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Pagamento recebido ✅</Heading>
        <Text style={text}>{name ? `Olá, ${name}!` : 'Olá!'} Confirmamos o recebimento da sua fatura.</Text>
        <Section style={card}>
          <Text style={label}>Fatura</Text>
          <Text style={value}>{invoiceNumber ?? '—'}</Text>
          <Text style={label}>Valor</Text>
          <Text style={value}>{amount ?? '—'}</Text>
          <Text style={label}>Pago em</Text>
          <Text style={value}>{paidAt ?? '—'}</Text>
        </Section>
        {receiptUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={receiptUrl} style={button}>Ver recibo</Button>
          </Section>
        ) : null}
        <Text style={small}>Guarde este e-mail como comprovante.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Pagamento recebido — Fatura ${data.invoiceNumber ?? ''} · Impulsionando`,
  displayName: 'Fatura paga',
  previewData: {
    name: 'Cliente',
    invoiceNumber: 'INV-0001',
    amount: 'R$ 297,00',
    paidAt: '16/06/2026',
    receiptUrl: 'https://impulsionando.com.br/app/billing',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#065f46', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#166534', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#064e3b', margin: '0', fontWeight: 600 }
const button = { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
const small = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0 0' }
