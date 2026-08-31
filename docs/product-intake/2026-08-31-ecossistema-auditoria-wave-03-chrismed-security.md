# Auditoria Master — Wave 03 — Segurança CHRISMED

Data: 2026-08-31
Status: IN_PROGRESS

## Achado P1 — criação pública de hold contorna a borda do Core

A jornada pública ativa chama diretamente o Supabase RPC `create_chrismed_booking_hold` pelo cliente web.

A função é `SECURITY DEFINER` e possui `EXECUTE` concedido a `anon` e `authenticated`. Ela valida oferta, profissional aprovado, CPF, aceite, janela de agenda, blocks, conflito de appointments e expiração do hold. O hold padrão é limitado a 300 segundos e possui proteção por exclusion/unique violation contra concorrência.

Essas validações são positivas, mas existe uma superfície de abuso: um ator externo com a chave pública Supabase pode chamar o RPC diretamente, sem passar por Cloudflare/Core, e criar repetidos holds anônimos válidos usando dados sintaticamente válidos. Como holds temporários retiram slots da disponibilidade, isto pode ser usado para degradar a agenda pública.

## Correção arquitetural recomendada

Não resolver apenas com frontend.

Fluxo alvo:
`browser -> Cloudflare/WAF/rate limit -> Core API CHRISMED booking -> validação anti-abuso -> Supabase RPC interno/service role -> hold`.

Requisitos:
- retirar `EXECUTE` de `anon` do RPC interno depois que a rota Core estiver homologada;
- endpoint público no Core com rate limit por IP/fingerprint/janela e limites por identidade normalizada;
- Turnstile/CAPTCHA adaptativo somente quando risco justificar, evitando atrito desnecessário;
- idempotency/request ID obrigatório;
- limite de holds ativos por identidade e por origem;
- telemetria de tentativas, recusas e bursts;
- não armazenar CPF completo além do estritamente necessário;
- preservar expiração automática de hold;
- não permitir que anti-abuso revele se um CPF/e-mail já é paciente;
- testes de concorrência e negação de serviço lógica;
- fallback seguro: falha de proteção não deve gerar cobrança nem reserva permanente.

## Achados positivos
- `chrismed_appointments` tem RLS de leitura para paciente e profissional/staff; não há política pública de leitura direta.
- `chrismed_service_offerings` expõe publicamente apenas ofertas ativas, coerente com catálogo público.
- `agenda_professionals`, `agenda_schedules` e `agenda_blocks` não estão expostos para leitura anônima pelas policies observadas.
- `list_chrismed_available_slots` filtra profissional aprovado/ativo e não retorna PII.
- `get_chrismed_booking_status` usa hold token e, quando há `patient_user_id`, exige correspondência com `auth.uid()`.
- criação do pagamento CHRISMED valida hold, expiração, identidade do e-mail, ownership quando autenticado e deriva valor da oferta/appointment.

## Hardening adicional
- revisar `SECURITY DEFINER` com `search_path` mínimo e seguro (`pg_catalog`, schemas explicitamente necessários);
- revisar grants de todos os RPCs CHRISMED públicos;
- adicionar testes negativos de cross-tenant, enumeração, replay, brute force e flood de holds;
- validar políticas de storage de documentos/exames separadamente;
- validar logs para não registrar CPF, tokens, QR Pix ou dados clínicos sensíveis em texto aberto.

## Critério de homologação
A agenda não será marcada `VERIFIED` em segurança enquanto a criação de hold puder ser abusada diretamente fora da borda de rate limiting do Core.