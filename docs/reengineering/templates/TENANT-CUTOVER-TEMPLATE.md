# Cutover do tenant — NOME

## Identificação

- Slug:
- Domínios:
- Owner:
- Criticidade:
- Janela:
- Release SHA:

## Escopo funcional

- Jornadas migradas:
- Integrações:
- Dados envolvidos:
- Dependências ainda legadas:

## Pré-condições

- [ ] auth e memberships validados
- [ ] RLS allow/deny validada
- [ ] migrations aplicadas em staging
- [ ] smoke e E2E verdes
- [ ] observabilidade ativa
- [ ] backup/restauração confirmados
- [ ] rollback ensaiado

## Execução

- mudança de tráfego:
- responsável:
- instante:
- checks imediatos:

## Rollback

- gatilhos:
- destino anterior identificado:
- procedimento:
- limite da janela:

## Evidência pós-cutover

- HTTP/health:
- auth:
- operações críticas:
- jobs/webhooks:
- erros e latência:
- reconciliação de dados:

## Encerramento

- [ ] janela de rollback encerrada
- [ ] dependências legadas registradas ou removidas
- [ ] documentação atualizada

