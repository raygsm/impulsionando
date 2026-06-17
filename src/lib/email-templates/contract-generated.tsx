import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  signerName?: string
  companyName?: string
  contractNumber?: string
  planName?: string
  monthly?: string
  signUrl?: string
}

const Email = ({ signerName, companyName, contractNumber, planName, monthly, signUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu contrato Impulsionando está pronto para assinatura</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Contrato disponível para assinatura</Heading>
        <Text style={text}>
          {signerName ? `Olá, ${signerName}!` : 'Olá!'} O contrato da empresa <strong>{companyName ?? '—'}</strong> foi gerado e está disponível para assinatura eletrônica.
        </Text>
        <Section style={card}>
          <Text style={label}>Contrato</Text>
          <Text style={value}>{contractNumber ?? '—'}</Text>
          <Text style={label}>Plano</Text>
          <Text style={value}>{planName ?? '—'}</Text>
          <Text style={label}>Mensalidade</Text>
          <Text style={value}>{monthly ?? '—'}</Text>
        </Section>
        {signUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={signUrl} style={button}>Revisar e assinar contrato</Button>
          </Section>
        ) : null}
        <Text style={small}>O link é seguro e exclusivo. Caso não tenha solicitado, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Seu contrato Impulsionando está pronto para assinatura',
  displayName: 'Contrato gerado',
  previewData: {
    signerName: 'Cliente',
    companyName: 'Empresa Demo',
    contractNumber: 'IMP-2026-0001',
    planName: 'Integrado',
    monthly: 'R$ 1.621,00',
    signUrl: 'https://impulsionando.com.br/contrato/abc',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0c4a6e', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const small = { fontSize: '12px', color: '#64748b', marginTop: '16px' }
const card = { backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#0c4a6e', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '15px', color: '#082f49', margin: '0', fontWeight: 600 }
const button = { backgroundColor: '#0284c7', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
