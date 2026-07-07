# Templates WhatsApp (Impulsionando)

Templates ficam sujeitos à homologação Meta. Todos usam tom cordial,
opt-out visível, no máximo 1024 caracteres. Variáveis universais:

`{{tenant_name}}`, `{{customer_name}}`, `{{lead_name}}`, `{{plan_name}}`,
`{{module_name}}`, `{{event_name}}`, `{{payment_amount}}`,
`{{trial_days_left}}`, `{{cta_url}}`, `{{support_url}}`.

## Captação

**wa.lead-captado** (utility)
```
Olá {{lead_name}}, aqui é da {{tenant_name}}! Recebemos seu contato e vamos
te responder rapidinho. Se preferir agilizar, acesse: {{cta_url}}
Para sair, responda SAIR.
```

**wa.lead-sem-resposta**
```
Oi {{lead_name}}, tudo bem? Ainda posso te ajudar com o que você procurava
na {{tenant_name}}? Se quiser, responda por aqui ou acesse {{cta_url}}.
```

## Conversão

**wa.pix-gerado**
```
{{customer_name}}, seu PIX de R$ {{payment_amount}} da {{tenant_name}} está
pronto. Copie o código em {{cta_url}}. Expira em 30 min.
```

**wa.pix-expirado**
```
Poxa {{customer_name}}, seu PIX expirou. Sem problema — gere um novo em
{{cta_url}}. Se precisar, {{support_url}}.
```

**wa.pagamento-aprovado**
```
{{customer_name}}, pagamento de R$ {{payment_amount}} confirmado na
{{tenant_name}}! ✅ Detalhes: {{cta_url}}
```

## Retenção

**wa.trial-d29**
```
{{customer_name}}, seu Teste Premium na {{tenant_name}} termina amanhã.
Continue com tudo por apenas o valor do {{plan_name}}: {{cta_url}}
```

**wa.inadimplencia**
```
{{customer_name}}, notamos uma pendência de R$ {{payment_amount}} na
{{tenant_name}}. Regularize em {{cta_url}} para manter tudo ativo.
```

## Nicho — Clínica

**wa.clinica-consulta-confirmada**
```
{{customer_name}}, sua consulta na {{tenant_name}} está confirmada para
{{event_name}}. Se precisar remarcar: {{cta_url}}
```

## Nicho — Bar/Restaurante

**wa.bar-pedido-saiu-entrega**
```
{{customer_name}}, seu pedido da {{tenant_name}} saiu para entrega 🛵
Acompanhe: {{cta_url}}
```

## Nicho — Imobiliária

**wa.imob-visita-confirmada**
```
{{customer_name}}, sua visita ao imóvel está confirmada para {{event_name}}.
Endereço e detalhes: {{cta_url}}
```

## Clube PF

**wa.clube-voucher-usado**
```
{{customer_name}}, voucher usado com sucesso na {{tenant_name}} 🎉
Ver benefícios ativos: {{cta_url}}
```

> Todos os templates são **rascunho**. Submissão à Meta acontece só depois
> do checklist de ativação do tenant.
