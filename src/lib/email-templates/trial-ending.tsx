import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  planName?: string
  daysLeft?: number
  trialEndsAt?: string
  checkoutUrl?: string
}

const Email = ({ name, planName, daysLeft, trialEndsAt, checkoutUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Faltam {daysLeft ?? 2} dias para o fim do seu teste</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Seu teste termina em {daysLeft ?? 2} dias ⏰</Heading>
        <Text style={text}>
          {name ? `Olá, ${name}!` : 'Olá!'} Seu acesso ao plano <strong>{planName ?? 'Impulsionando'}</strong> encerra em <strong>{trialEndsAt ?? 'breve'}</strong>.
        </Text>
        <Text style={text}>
          Para manter tudo funcionando sem interrupções, ative sua assinatura agora. O processo leva menos de 2 minutos.
        </Text>
        {checkoutUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={checkoutUrl} style={button}>Ativar assinatura</Button>
          </Section>
        ) : null}
        <Text style={small}>Se decidir não continuar, nenhuma cobrança será feita.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `Faltam ${data.daysLeft ?? 2} dias para o fim do seu teste · Impulsionando`,
  displayName: 'Trial encerrando',
  previewData: {
    name: 'Cliente',
    planName: 'Completo',
    daysLeft: 2,
    trialEndsAt: '18/06/2026',
    checkoutUrl: 'https://impulsionando.com.br/checkout',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const button = { backgroundColor: '#f59e0b', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
const small = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0 0' }
