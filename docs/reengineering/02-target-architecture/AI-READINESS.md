# Preparação para IA

IA será uma capacidade da plataforma, não um atalho ao redor da autorização.

## Componentes

- gateway de modelos independente de provedor;
- streaming síncrono para conversa;
- filas e worker para tarefas demoradas;
- registro de ferramentas com schemas de entrada e saída;
- policy engine por tenant, usuário, papel e risco;
- armazenamento de prompts e versões;
- RAG com documentos e embeddings isolados por tenant;
- evals, telemetria de custo e feedback de resultado.

## Classes de ação

| Classe | Comportamento |
|---|---|
| READ | consultar dados autorizados |
| RECOMMEND | sugerir sem executar |
| AUTO_SAFE | executar ação reversível, limitada e idempotente |
| APPROVAL_REQUIRED | preparar e aguardar aprovação autorizada |
| HUMAN_REQUIRED | encaminhar contexto para uma pessoa |
| FORBIDDEN | negar sempre |

## Regras de segurança

- O modelo nunca recebe `service_role`, tokens de integração ou SQL arbitrário.
- Contexto de tenant é montado pelo servidor.
- Toda ferramenta revalida autorização ao executar.
- Prompt não é controle de segurança.
- Outputs externos são tratados como não confiáveis.
- Custos, tokens e rate limits são medidos por tenant e capability.

## Gate para iniciar a Fase 6

Não iniciar implementação de IA operacional antes de existirem auth canônica, isolamento testado, audit trail, fila durável, idempotência e observabilidade.

