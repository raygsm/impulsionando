import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  nicheName?: string
  demoUrl?: string
  whatsappUrl?: string
}

const Email = ({ name, nicheName, demoUrl, whatsappUrl }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo(a) à demonstração Impulsionando</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Obrigado por visitar nossa demonstração! 🚀</Heading>
        <Text style={text}>
          {name ? `Olá, ${name}!` : 'Olá!'} Sua demonstração da plataforma Impulsionando
          {nicheName ? <> para <strong>{nicheName}</strong></> : null} está pronta.
        </Text>
        <Section style={card}>
          <Text style={text}>
            Você pode continuar explorando os módulos a qualquer momento — agenda, CRM, vendas,
            financeiro, WhatsApp, eventos e BI — tudo navegável e em português.
          </Text>
        </Section>
        {demoUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={demoUrl} style={button}>Continuar demonstração</Button>
          </Section>
        ) : null}
        <Text style={text}>
          Quer falar com um consultor agora? {whatsappUrl ? (
            <>Acesse: <a href={whatsappUrl} style={link}>{whatsappUrl}</a></>
          ) : 'Responda este e-mail.'}
        </Text>
        <Text style={meta}>Equipe Impulsionando · www.impulsionando.com.br</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Sua demo Impulsionando${data.nicheName ? ` — ${data.nicheName}` : ''} está pronta`,
  displayName: 'Boas-vindas demo de feira',
  previewData: {
    name: 'Maria',
    nicheName: 'Bares e Restaurantes',
    demoUrl: 'https://impulsionando.com.br/demo/nicho/bares',
    whatsappUrl: 'https://wa.me/5521993075000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const button = { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }
const link = { color: '#1e3a8a' }
const meta = { fontSize: '11px', color: '#6b7280', marginTop: '24px' }
