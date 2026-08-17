# Impulsionando Tecnologia — Go-Live Checkpoint

Data: 2026-08-17
Branch: `homologacao/impulsionando-go-live-20260817`
Produção: preservada; nenhuma promoção automática.

## Evidências confirmadas

- Impulsionito existe como runtime CORE (`impulsionito-core`) e está ativo.
- CHRISMED, Colors, Marocas e Rio Med já apontam para o root do Impulsionito.
- WMP possui runtime CLIENT_INSTANCE ativo, mas o vínculo root estava ausente; correção preparada em homologação.
- Ana Madú possui agente visível, mas não possui runtime; runtime Annita preparado em homologação.
- Mercado Pago da Impulsionando possui credenciais production ativas no banco.
- Billing possui contratos, invoices, checkout sessions, dunning, suspensão e reativação automática via `billing_mark_paid`.
- `billing_run_cycle` já suporta email e WhatsApp; política atual em produção usa apenas email. Política multicanal preparada em homologação.
- WhatsApp da Impulsionando permanece `PENDING_CONNECTION`/`unbound`; não declarar operacional até provedor e sessão real estarem vinculados.
- Webchat da Impulsionando está ACTIVE.
- n8n possui diversas jornadas Impulsionando ACTIVE com workflow IDs reais.

## P0 identificados

1. RPCs `SECURITY DEFINER` de alteração de plano herdaram EXECUTE de PUBLIC/anon.
2. `core_inventory_search` permite contornar a regra de estoque restrito ao Clube Pago se mantido para authenticated.
3. `billing_checkout_sessions` tem RLS habilitado, porém zero policies.
4. `mpago-create-payment` universal está `verify_jwt=false`; para fluxos não-CHRISMED exige usuário autenticado no corpo, porém confia em `company_id` e `amount_cents` fornecidos pelo cliente.
5. Não alterar a função universal diretamente sem E2E dos clientes existentes. Endpoint dedicado e seguro da Impulsionando preparado em homologação.

## Pacotes já preparados na homologação

- `20260817180500_core_security_hardening_stage.sql`
- `20260817183500_billing_checkout_rls.sql`
- `20260817185000_billing_dunning_multichannel_stage.sql`
- `20260817190500_agent_federation_integrity_stage.sql`
- `supabase/functions/impulsionando-billing-create-payment/index.ts`

## Regras de promoção

Nenhum item acima deve ser promovido apenas por existir. Antes da produção:

1. validar migrations em ambiente isolado;
2. testar autenticação e RLS;
3. testar checkout PIX/cartão sem cobrança real ou com credencial/teste apropriada;
4. testar webhook e idempotência;
5. testar criação/ativação de contrato;
6. testar suspensão e reativação sem indisponibilizar o site público;
7. validar todos os agentes especializados após normalização do root;
8. validar WhatsApp real somente após provider/sessão ativa;
9. smoke/E2E completo;
10. autorização explícita de promoção.

## Estado atual

Status global: 🟠 PARCIAL.
Não usar “GO-LIVE APROVADO” enquanto houver P0, integração externa pendente ou E2E não executado.
