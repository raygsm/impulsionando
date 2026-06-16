import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  planName?: string
  amount?: string
  appUrl?: string
}

const Email = ({ name, planName, amount, appUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo(a) ao Impulsionando — pagamento confirmado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Pagamento confirmado 🎉</Heading>
        <Text style={text}>
          {name ? `Olá, ${name}!` : 'Olá!'} Sua assinatura do plano <strong>{planName ?? 'Impulsionando'}</strong> está ativa.
        </Text>
        <Section style={card}>
          <Text style={label}>Valor</Text>
          <Text style={value}>{amount ?? '—'}</Text>
          <Text style={label}>Plano</Text>
          <Text style={value}>{planName ?? '—'}</Text>
        </Section>
        <Text style={text}>Agora é só usar. Toda a equipe Impulsionando agradece a confiança.</Text>
        {appUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={appUrl} style={button}>Entrar na plataforma</Button>
          </Section>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Pagamento confirmado · Bem-vindo(a) ao Impulsionando',
  displayName: 'Boas-vindas pós-pagamento',
  previewData: {
    name: 'Cliente',
    planName: 'Completo',
    amount: 'R$ 297,00',
    appUrl: 'https://impulsionando.com.br/app',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#065f46', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#065f46', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '15px', color: '#064e3b', margin: '0', fontWeight: 600 }
const button = { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
