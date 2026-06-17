import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  itemDescription?: string
  tableNumber?: number | string
  companyName?: string
}

const Email = ({ customerName, itemDescription, tableNumber, companyName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu pedido está pronto 🍽️</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Seu pedido está pronto! 🍽️</Heading>
        <Text style={text}>
          {customerName ? `Olá, ${customerName}!` : 'Olá!'} Acabamos de preparar o seu pedido
          {tableNumber ? <> da <strong>Mesa {tableNumber}</strong></> : null}.
        </Text>
        {itemDescription ? (
          <Section style={card}>
            <Text style={text}><strong>{itemDescription}</strong></Text>
            <Text style={meta}>Pode buscar no balcão ou aguardar o garçom.</Text>
          </Section>
        ) : null}
        <Text style={meta}>{companyName ?? 'Equipe do restaurante'} · enviado via Impulsionando</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Seu pedido${d.tableNumber ? ` da mesa ${d.tableNumber}` : ''} está pronto`,
  displayName: 'Pedido pronto (restaurante)',
  previewData: { customerName: 'Maria', itemDescription: '1× Picanha na chapa', tableNumber: 7, companyName: 'Bar do João' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const meta = { fontSize: '11px', color: '#6b7280', marginTop: '12px' }
