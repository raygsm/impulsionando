import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  monthLabel?: string
  totalCount?: number
  grossBRL?: string
  taxBRL?: string
  netBRL?: string
  csvUrl?: string
  dashboardUrl?: string
  expiresAt?: string
}

const Email = ({
  monthLabel,
  totalCount,
  grossBRL,
  taxBRL,
  netBRL,
  csvUrl,
  dashboardUrl,
  expiresAt,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      Relatório fiscal de {monthLabel ?? '—'} disponível para download
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Relatório fiscal mensal</Heading>
        <Text style={text}>
          Segue o consolidado de faturas pagas em <strong>{monthLabel ?? '—'}</strong>.
          Os arquivos foram gerados automaticamente pela Impulsionando.
        </Text>

        <Section style={card}>
          <Text style={label}>Faturas no período</Text>
          <Text style={value}>{totalCount ?? 0}</Text>
          <Text style={label}>Receita bruta</Text>
          <Text style={value}>{grossBRL ?? 'R$ 0,00'}</Text>
          <Text style={label}>Estimativa de impostos (ISS + PIS + COFINS)</Text>
          <Text style={value}>{taxBRL ?? 'R$ 0,00'}</Text>
          <Text style={label}>Receita líquida estimada</Text>
          <Text style={value}>{netBRL ?? 'R$ 0,00'}</Text>
        </Section>

        {csvUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={csvUrl} style={button}>
              Baixar CSV
            </Button>
            <Text style={small}>
              Link válido até {expiresAt ?? '—'}.
            </Text>
          </Section>
        ) : null}

        {dashboardUrl ? (
          <Text style={text}>
            Para gerar o PDF (Imprimir / Salvar PDF) e revisar fatura a fatura, acesse o{' '}
            <a href={dashboardUrl} style={link}>
              painel fiscal
            </a>
            .
          </Text>
        ) : null}

        <Text style={small}>
          Valores de imposto são estimativa contábil — confirme as alíquotas e o
          regime tributário antes de emitir guias.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Relatório fiscal — ${data?.monthLabel ?? 'mensal'}`,
  displayName: 'Fiscal • Relatório mensal (contador)',
  previewData: {
    monthLabel: 'maio/2026',
    totalCount: 42,
    grossBRL: 'R$ 18.430,00',
    taxBRL: 'R$ 1.589,79',
    netBRL: 'R$ 16.840,21',
    csvUrl: 'https://example.com/fiscal-2026-05.csv',
    dashboardUrl: 'https://app.impulsionando.com.br/admin/fiscal',
    expiresAt: '27/06/2026',
  },
  allowedChannels: ['internal', 'staff'],
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '22px', color: '#1f2937', margin: '0 0 12px' }
const small = { fontSize: '12px', color: '#64748b', margin: '8px 0 0' }
const card = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '16px 0',
  background: '#f8fafc',
}
const label = { fontSize: '11px', textTransform: 'uppercase' as const, color: '#64748b', margin: '8px 0 2px', letterSpacing: '0.04em' }
const value = { fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }
const button = {
  background: '#0ea5e9',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const link = { color: '#0ea5e9', textDecoration: 'underline' }
