import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  planName?: string
  trialEndsAt?: string
  appUrl?: string
}

const Email = ({ name, planName, trialEndsAt, appUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu teste gratuito do Impulsionando começou</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo(a) ao Impulsionando 🚀</Heading>
        <Text style={text}>
          {name ? `Olá, ${name}!` : 'Olá!'} Seu período de teste gratuito do plano <strong>{planName ?? 'Impulsionando'}</strong> está ativo.
        </Text>
        <Section style={card}>
          <Text style={label}>Acesso liberado até</Text>
          <Text style={value}>{trialEndsAt ?? 'em 3 dias'}</Text>
        </Section>
        <Text style={text}>Sem cobrança, sem cartão. Aproveite para configurar tudo e ver o sistema em ação.</Text>
        {appUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={appUrl} style={button}>Acessar a plataforma</Button>
          </Section>
        ) : null}
        <Text style={small}>Se precisar de ajuda, basta responder este e-mail.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Seu teste gratuito começou · Impulsionando',
  displayName: 'Trial iniciado',
  previewData: {
    name: 'Cliente',
    planName: 'Completo',
    trialEndsAt: '19/06/2026',
    appUrl: 'https://impulsionando.com.br/app',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#075985', textTransform: 'uppercase' as const, margin: '0 0 4px 0', fontWeight: 700 }
const value = { fontSize: '16px', color: '#0c4a6e', margin: '0', fontWeight: 600 }
const button = { backgroundColor: '#0ea5e9', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
const small = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0 0' }
