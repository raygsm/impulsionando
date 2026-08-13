# n8n + Omnichannel — contrato operacional

Este documento registra o contrato técnico vigente do Core Impulsionando sem armazenar segredos.

## Runtime n8n

- URL canônica: `https://n8n.impulsionando.com.br`
- O Core não fabrica caminhos de webhook.
- Um workflow só pode ser despachado quando existe em `n8n_workflow_registry`, está ativo para o cliente em `tenant_workflow_state` e possui `webhook_url` canônica sincronizada.
- Dispatches e callbacks usam HMAC SHA-256 por `x-impulsionando-signature`.
- O segredo é mantido somente no ambiente de execução e nunca no repositório.
- Execuções são registradas em `communication_workflow_runs` por `record_n8n_registry_run`.
- Workflows antigos não são associados a `communication_automations` apenas por semelhança de nome.

## Ledger omnichannel

- Impulsionito Core: `agent_key=impulsionito-core`.
- Oliver CHRISMED: `agent_key=chrismed-oliver`.
- Entrada: `communication_ingest_inbound`.
- Saída: `communication_record_outbound`.
- Histórico: `communication_conversation_messages`.
- As RPCs de escrita são exclusivas do backend/service role.
- Identidades de web chat são anônimas e estáveis por sessão.
- Não existe merge automático entre web, WhatsApp, Instagram ou outros canais. A união de identidade exige verificação explícita.
- O isolamento por cliente e por agente deve ser preservado em todas as integrações.

## CHRISMED / Oliver

A persistência omnichannel não substitui nem altera o `SYSTEM_PROMPT` clínico do Oliver. O wrapper de transporte apenas registra entrada/saída e reutiliza o histórico persistente antes de chamar o cérebro CHRISMED existente.

## Regra de publicação

Nenhum painel deve exibir integração como ativa apenas porque existe configuração local. Estado operacional deve vir do backend e do runtime comprovados. Nenhum secret, token, chave de API ou credencial deve ser versionado neste documento ou em qualquer arquivo do repositório.
