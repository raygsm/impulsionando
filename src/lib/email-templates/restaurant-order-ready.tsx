/**
 * SINAL INTERNO de "item pronto" — destinado ao painel/log de salão e
 * cópia de auditoria para a equipe (gerente / supervisor).
 *
 * IMPORTANTE: este template NUNCA deve ser enviado para o cliente final.
 * A regra de produto da Impulsionando é: comunicação com o cliente é
 * pós-visita, não operação de cozinha. O garçom continua entregando o prato.
 *
 * Mantemos o template registrado para casos legítimos:
 *   - Cópia interna para o gerente quando habilitado em settings.
 *   - Replay/auditoria via /lovable/email/transactional/preview.
 *
 * O caller direto (`notifyItemReady`) foi removido; quem chamar este template
 * deve passar um endereço de equipe (e nunca o customer_email da sessão).
 */
import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  /** Nome do garçom ou da estação responsável. */
  staffName?: string
  /** Descrição do item (ex.: "1× Picanha na chapa"). */
  itemDescription?: string
  /** Número da mesa. */
  tableNumber?: number | string
  /** Nome interno do estabelecimento. */
  companyName?: string
}

const Email = ({ staffName, itemDescription, tableNumber, companyName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>[INTERNO] Item pronto na cozinha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={badge}>
          <Text style={badgeText}>USO INTERNO · NÃO ENCAMINHAR AO CLIENTE</Text>
        </Section>
        <Heading style={h1}>Item pronto na cozinha</Heading>
        <Text style={text}>
          {staffName ? `${staffName}, ` : ''}há um item pronto para retirada
          {tableNumber ? <> da <strong>Mesa {tableNumber}</strong></> : null}.
        </Text>
        {itemDescription ? (
          <Section style={card}>
            <Text style={text}><strong>{itemDescription}</strong></Text>
            <Text style={meta}>Entregue ao cliente diretamente — a Impulsionando não dispara mensagem ao cliente neste evento.</Text>
          </Section>
        ) : null}
        <Text style={meta}>{companyName ?? 'Equipe interna'} · sinal de salão</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `[Interno] Item pronto${d.tableNumber ? ` — mesa ${d.tableNumber}` : ''}`,
  displayName: 'Item pronto (sinal interno de salão)',
  previewData: { staffName: 'Bianca', itemDescription: '1× Picanha na chapa', tableNumber: 7, companyName: 'Bar do João' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const badge = { backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '8px 12px', marginBottom: '16px' }
const badgeText = { fontSize: '10px', color: '#92400e', margin: 0, letterSpacing: '0.05em', fontWeight: 700 as const }
const h1 = { fontSize: '20px', color: '#1e3a8a', margin: '0 0 12px 0' }
const text = { fontSize: '14px', color: '#1f2937', lineHeight: '1.6' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const meta = { fontSize: '11px', color: '#6b7280', marginTop: '12px' }
