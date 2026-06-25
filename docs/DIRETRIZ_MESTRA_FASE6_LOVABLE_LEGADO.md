# Diretriz Mestra - Fase 6: Lovable como legado controlado

## Status

Concluida no codigo: Lovable deixou de ser dependencia operacional padrao.

## Decisao

O Core Impulsionando deve operar com credenciais proprias e infraestrutura propria. Lovable fica restrito a um modo legado, desativado por padrao, para suportar migracoes temporarias sem bloquear a operacao.

## Regras vigentes

1. `CORE_AI_API_KEY` e a chave oficial para IA do Core.
2. `CORE_AI_BASE_URL` permite usar provedor OpenAI-compatible proprio.
3. `LOVABLE_API_KEY` nao deve ser usado diretamente por funcoes de negocio.
4. `LOVABLE_LEGACY_ENABLED=true` e obrigatorio para ativar rotas e conectores legados Lovable.
5. Rotas `/lovable/email/*` respondem `410` quando o modo legado esta desligado.
6. Conectores antigos baseados em `connector-gateway.lovable.dev` so podem rodar no modo legado.
7. `@lovable.dev/vite-tanstack-config` permanece apenas como adaptador temporario de build. Ele nao deve ser tratado como autoridade de runtime, banco, pagamento, IA, tenant ou publicacao.

## Impacto operacional

- IA do Core, talentos, briefing executivo, insights, suporte e RioMed usam o gateway configuravel do Core.
- E-mail Lovable, suppression webhook e processamento de fila Lovable ficam congelados como legado.
- SMS/Twilio, Resend via gateway Lovable e Paddle via gateway Lovable nao executam sem opt-in explicito.
- O Core pode ser publicado fora do Lovable sem depender de segredo Lovable para funcionar.

## Configuracao minima fora do Lovable

```env
CORE_AI_API_KEY=
CORE_AI_BASE_URL=https://api.openai.com/v1
LOVABLE_LEGACY_ENABLED=
LOVABLE_API_KEY=
```

Para manter algum legado temporario:

```env
LOVABLE_LEGACY_ENABLED=true
LOVABLE_API_KEY=...
```

## Proximo passo

Fase 7: validar publicacao independente e runbook final de operacao fora do Lovable, incluindo VPS/Hostinger, GitHub Actions, Supabase, N8N e rollback.
