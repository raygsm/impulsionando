import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  url?: string
  error?: string
  status?: string
  detectedAt?: string
}

const Email = ({ url, error, status, detectedAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Alerta: ${url ?? 'site'} está fora do ar`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚨 Site fora do ar</Heading>
        <Text style={text}>
          A verificação automática detectou que o endereço abaixo está inacessível.
        </Text>
        <Section style={card}>
          <Text style={label}>URL</Text>
          <Text style={value}>{url}</Text>
          <Text style={label}>Status</Text>
          <Text style={value}>{status || 'sem resposta'}</Text>
          {error ? (
            <>
              <Text style={label}>Erro</Text>
              <Text style={value}>{error}</Text>
            </>
          ) : null}
          <Text style={label}>Detectado em</Text>
          <Text style={value}>{detectedAt}</Text>
        </Section>
        <Text style={small}>
          Você receberá um novo e-mail assim que o serviço voltar a responder.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => `🚨 Fora do ar: ${data.url ?? 'site'}`,
  displayName: 'Site fora do ar',
  previewData: {
    url: 'https://impulsionando.com.br',
    status: '503',
    error: 'fetch failed',
    detectedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#b91c1c', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.5' }
const card = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#7f1d1d', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '14px', color: '#111827', margin: '0', wordBreak: 'break-all' as const }
const small = { fontSize: '12px', color: '#6b7280', margin: '16px 0 0 0' }
