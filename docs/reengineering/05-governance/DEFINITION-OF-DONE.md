# Definition of Done

Uma funcionalidade migrada só está concluída quando:

## Produto

- comportamento esperado validado;
- estados vazios, erros e permissões cobertos;
- documentação do fluxo atualizada.

## Código

- limites de módulo respeitados;
- contratos validados em runtime;
- sem secret ou configuração implícita;
- testes unitários e de integração adequados ao risco.

## Segurança

- allow e deny multi-tenant testados;
- logs não expõem dados sensíveis;
- ação sensível gera auditoria;
- webhook/job é idempotente quando aplicável.

## Operação

- health/readiness adequados;
- logs estruturados com correlation ID;
- métricas e alerta útil;
- rollback documentado e ensaiado;
- runbook de falha relevante.

## Entrega

- imagem identificada por SHA;
- staging validado;
- smoke externo concluído;
- evidência anexada ao PR/release.

“Funciona na minha máquina” ou “o deploy ficou verde” não satisfaz esta definição.

Agent close-out for every implementation task: [`IMPLEMENTATION-RULES.md`](IMPLEMENTATION-RULES.md) · root [`AGENTS.md`](../../../AGENTS.md).


