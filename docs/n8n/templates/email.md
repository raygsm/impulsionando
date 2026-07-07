# Templates E-mail (Impulsionando)

HTML transacional simples, mobile-first, dark-mode safe. Preheader
obrigatório. Rodapé com endereço legal + opt-out. Variáveis idem
`whatsapp.md`.

## Captação

**em.lead-captado**
- Assunto: `Recebemos seu contato na {{tenant_name}}`
- Preheader: `Vamos te responder em breve — enquanto isso, dá uma olhada.`
- CTA: `Ver próximos passos → {{cta_url}}`

## Conversão

**em.cadastro-abandonado**
- Assunto: `Vamos terminar seu cadastro na {{tenant_name}}?`
- CTA: `Continuar cadastro → {{cta_url}}`

**em.pagamento-aprovado**
- Assunto: `Pagamento confirmado — R$ {{payment_amount}}`
- Corpo: recibo + próximos passos + `{{support_url}}`

## Relacionamento

**em.onboarding-d0**
- Assunto: `Bem-vindo(a) à {{tenant_name}} 🎉`
- Blocos: (1) primeiro passo (2) tutorial (3) suporte

**em.onboarding-d7**
- Assunto: `1 semana com a {{tenant_name}} — dicas para acelerar`

## Retenção

**em.trial-d15**
- Assunto: `Você aproveitou 15 dias de Premium — veja o que já mudou`

**em.trial-d29**
- Assunto: `Último dia do seu Teste Premium na {{tenant_name}}`

**em.renovacao-proxima**
- Assunto: `Sua renovação da {{tenant_name}} acontece em 7 dias`

## Financeiro

**em.nota-fiscal-emitida**
- Assunto: `Nota fiscal emitida — {{tenant_name}}`
- Anexo: PDF NF (quando disponível)

## Vitrine & Clube

**em.clube-empresa-proxima**
- Assunto: `Tem uma empresa parceira pertinho de você`
- Personalização por CEP.

## Regras universais

- Rodapé: `Impulsionando · <endereço legal> · <link opt-out>`.
- `From`: `no-reply@<tenant-domain>` quando configurado, senão
  `no-reply@impulsionando.com.br`.
- Reply-to: e-mail de suporte do tenant.
- Tag UTM padrão: `utm_source=impulsionando&utm_medium=email&utm_campaign={{workflow_slug}}`.
