# WhatsApp Impulsionando → Impulsionito — checkpoint

Data: 2026-08-17
Ambiente: homologação
Produção: inalterada

## Confirmado

- O Impulsionito já possui backend LLM server-side e `resolveProvider()` usa `process.env.OPENAI_API_KEY` quando OpenAI é o provider.
- O canal WhatsApp da Impulsionando já existe em `communication_channel_endpoints`, porém está `provider=unbound` e `status=PENDING_CONNECTION`.
- O webchat da Impulsionando está ACTIVE e usa o mesmo agente `impulsionito-core`.
- O ledger omnichannel suporta `whatsapp` nativamente por `communication_ingest_inbound` / `communication_record_outbound`.
- Havia uma tela global `/admin/comunicacoes/whatsapp` apontando diretamente para funções específicas da Ana Madú. Não alterar produção até substituir isso de forma segura.

## Implementado na branch de homologação

- `src/lib/impulsionando/whatsapp-pairing.functions.ts`
  - admin-only;
  - credenciais WhatsApp somente server-side;
  - instância `impulsionito-core`;
  - geração de QR/pairing code via adaptador Evolution API;
  - webhook apontado para `/api/impulsionando/whatsapp/webhook`;
  - endpoint só permanece PENDING até conexão real.

- `src/routes/_authenticated/teste.comunicacoes.whatsapp.tsx`
  - tela isolada de homologação;
  - status, endpoint, provedor e estado;
  - botão Conectar WhatsApp;
  - QR Code temporário;
  - nenhuma chave OpenAI/WhatsApp enviada ao navegador.

## Bloqueio externo atual

O repositório não contém credencial global Evolution para a Impulsionando. O novo backend procura, em ordem:

1. `IMPULSIONANDO_EVOLUTION_BASE_URL` / `IMPULSIONANDO_EVOLUTION_API_KEY`;
2. `EVOLUTION_BASE_URL` / `EVOLUTION_API_KEY` como infraestrutura compartilhada, se já existirem no servidor.

A chave OpenAI NÃO precisa ser recriada; ela pertence ao motor do Impulsionito e é independente da sessão WhatsApp.

## Ainda obrigatório antes de produção

1. confirmar que Evolution API (ou adaptador equivalente) está acessível no servidor;
2. implementar/validar webhook `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`;
3. webhook deve registrar inbound como `channel=whatsapp`, `agent_key=impulsionito-core`;
4. gerar resposta pelo mesmo provider/context engine do Impulsionito;
5. enviar resposta pela instância WhatsApp;
6. registrar outbound no ledger como WhatsApp;
7. validar idempotência por provider message id;
8. heartbeat/reconnect;
9. teste E2E real de telefone externo → Impulsionito → resposta WhatsApp;
10. somente depois substituir a rota produtiva e marcar endpoint ACTIVE.

Status: 🟠 PARCIAL — QR/pairing em homologação preparado; sessão/provedor real e webhook E2E ainda pendentes.
