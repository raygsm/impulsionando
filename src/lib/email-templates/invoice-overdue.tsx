import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  invoiceNumber?: string
  amount?: string
  dueDate?: string
  payUrl?: string
}

const Email = ({ name, invoiceNumber, amount, dueDate, payUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Fatura {invoiceNumber ?? ''} vencida — regularize para evitar suspensão</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sua fatura está em atraso ⚠️</Heading>
        <Text style={text}>
          {name ? `Olá, ${name}.` : 'Olá.'} Identificamos que a fatura abaixo não foi paga até o vencimento.
        </Text>
        <Section style={card}>
          <Text style={label}>Fatura</Text>
          <Text style={value}>{invoiceNumber ?? '—'}</Text>
          <Text style={label}>Valor</Text>
          <Text style={value}>{amount ?? '—'}</Text>
          <Text style={label}>Vencimento</Text>
          <Text style={value}>{dueDate ?? '—'}</Text>
        </Section>
        <Text style={text}>
          Para evitar a suspensão do acesso, conclua o pagamento o quanto antes.
        </Text>
        {payUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={payUrl} style={button}>Pagar agora</Button>
          </Section>
        ) : null}
        <Text style={small}>Já efetuou o pagamento? Desconsidere este aviso.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `⚠️ Fatura ${data.invoiceNumber ?? ''} vencida · Impulsionando`,
  displayName: 'Fatura vencida',
  previewData: {
    name: 'Cliente',
    invoiceNumber: 'INV-0001',
    amount: 'R$ 297,00',
    dueDate: '10/06/2026',
    payUrl: 'https://impulsionando.com.br/app/billing',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#b91c1c', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#7f1d1d', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#111827', margin: '0', fontWeight: 600 }
const button = { backgroundColor: '#dc2626', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
const small = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0 0' }
