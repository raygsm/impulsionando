import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  signerName?: string
  companyName?: string
  contractNumber?: string
  signedAt?: string
  signatureHash?: string
  downloadUrl?: string
}

const Email = ({ signerName, companyName, contractNumber, signedAt, signatureHash, downloadUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Contrato assinado com sucesso</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Contrato assinado ✅</Heading>
        <Text style={text}>
          {signerName ? `Olá, ${signerName}!` : 'Olá!'} Confirmamos a assinatura eletrônica do contrato da empresa <strong>{companyName ?? '—'}</strong>.
        </Text>
        <Section style={card}>
          <Text style={label}>Contrato</Text>
          <Text style={value}>{contractNumber ?? '—'}</Text>
          <Text style={label}>Assinado em</Text>
          <Text style={value}>{signedAt ?? '—'}</Text>
          <Text style={label}>Hash de integridade</Text>
          <Text style={{ ...value, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' as const }}>{signatureHash ?? '—'}</Text>
        </Section>
        {downloadUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={downloadUrl} style={button}>Baixar contrato assinado</Button>
          </Section>
        ) : null}
        <Text style={small}>Guarde este e-mail como comprovante de aceite eletrônico.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Contrato assinado · comprovante de aceite',
  displayName: 'Contrato assinado',
  previewData: {
    signerName: 'Cliente',
    companyName: 'Empresa Demo',
    contractNumber: 'IMP-2026-0001',
    signedAt: '17/06/2026 09:32',
    signatureHash: 'a1b2c3d4e5f6...',
    downloadUrl: 'https://impulsionando.com.br/contrato/abc',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#065f46', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const small = { fontSize: '12px', color: '#64748b', marginTop: '16px' }
const card = { backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const label = { fontSize: '11px', color: '#065f46', textTransform: 'uppercase' as const, margin: '8px 0 2px 0', fontWeight: 700 }
const value = { fontSize: '15px', color: '#064e3b', margin: '0', fontWeight: 600 }
const button = { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }
