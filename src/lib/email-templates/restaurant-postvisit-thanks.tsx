/**
 * E-mail pós-visita do restaurante — disparado 24h–72h após o fechamento
 * da conta (notifyTableBillClosed). Copy segmentado por nicho.
 *
 * Este é o ÚNICO ponto onde a Impulsionando convida o cliente a voltar:
 * relacionamento, não operação. Inclui voucher pessoal opcional e CTA
 * para entrar no Clube Impulsionando.
 */
import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  customerName?: string
  companyName?: string
  /** Slug do nicho ("bares-restaurantes" | "cervejaria" | ...). */
  niche?: string
  /** Código do voucher pessoal, se houver. */
  voucherCode?: string
  voucherLabel?: string
  /** Link para entrar no Clube Impulsionando (já com tracking). */
  clubeUrl?: string
  /** Link para reservar/voltar (cardápio, agenda, etc.). */
  ctaUrl?: string
  ctaLabel?: string
}

const NICHE_COPY: Record<string, { headline: string; lead: string; cta: string }> = {
  'bares-restaurantes': {
    headline: 'Bom te ver por aqui — volta logo?',
    lead: 'A casa fica mais cheia quando você está. Reservamos um agrado para a sua próxima visita.',
    cta: 'Reservar mesa',
  },
  'cervejaria': {
    headline: 'A próxima rodada é por nossa conta 🍺',
    lead: 'Obrigado pela visita. Guardamos um voucher pra você experimentar o próximo rótulo que entrar na torneira.',
    cta: 'Ver cardápio',
  },
  'cafe-confeitaria': {
    headline: 'Sua próxima xícara já tem desconto ☕',
    lead: 'Que bom te receber. Volte na semana e a gente caprichando no que você curtiu.',
    cta: 'Ver novidades',
  },
  'default': {
    headline: 'Obrigado pela visita 🙏',
    lead: 'Adoramos te receber. Preparamos um agrado para a próxima vez.',
    cta: 'Voltar à loja',
  },
}

const Email = ({
  customerName,
  companyName,
  niche,
  voucherCode,
  voucherLabel,
  clubeUrl,
  ctaUrl,
  ctaLabel,
}: Props) => {
  const copy = NICHE_COPY[niche ?? 'default'] ?? NICHE_COPY.default
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{copy.headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{copy.headline}</Heading>
          <Text style={text}>
            {customerName ? `Oi, ${customerName}! ` : 'Oi! '}{copy.lead}
          </Text>
          {voucherCode ? (
            <Section style={voucherBox}>
              <Text style={voucherTitle}>{voucherLabel ?? 'Seu voucher pessoal'}</Text>
              <Text style={voucherCodeStyle}>{voucherCode}</Text>
              <Text style={meta}>Apresente na próxima visita ou no caixa do app.</Text>
            </Section>
          ) : null}
          {ctaUrl ? (
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={ctaUrl} style={btn}>
                {ctaLabel ?? copy.cta}
              </Button>
            </Section>
          ) : null}
          {clubeUrl ? (
            <Text style={text}>
              Quer recompensas todo mês? Entre no <a href={clubeUrl} style={link}>Clube Impulsionando</a> e
              acumule pontos, vouchers e convites para eventos.
            </Text>
          ) : null}
          <Text style={meta}>{companyName ?? 'Equipe Impulsionando'} · enviado via Impulsionando</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const c = NICHE_COPY[d.niche ?? 'default'] ?? NICHE_COPY.default
    return c.headline
  },
  displayName: 'Pós-visita (restaurante / bar / cervejaria)',
  previewData: {
    customerName: 'Maria',
    companyName: 'Beer House',
    niche: 'cervejaria',
    voucherCode: 'BEERHOUSE-IPA15',
    voucherLabel: '15% off na próxima IPA',
    clubeUrl: 'https://impulsionando.com.br/clube',
    ctaUrl: 'https://impulsionando.com.br/r/beer-house',
    ctaLabel: 'Reservar mesa',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const meta = { fontSize: '11px', color: '#6b7280', marginTop: '12px' }
const link = { color: '#1e3a8a', textDecoration: 'underline' }
const voucherBox = { backgroundColor: '#eff6ff', border: '1px dashed #1e3a8a', borderRadius: '10px', padding: '16px', textAlign: 'center' as const, margin: '20px 0' }
const voucherTitle = { fontSize: '12px', color: '#1e3a8a', margin: 0, letterSpacing: '0.05em', fontWeight: 700 as const, textTransform: 'uppercase' as const }
const voucherCodeStyle = { fontSize: '22px', color: '#0f172a', margin: '8px 0', fontWeight: 700 as const, letterSpacing: '0.1em' as const }
const btn = { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 as const, fontSize: '14px' }
