# CHRISMED — Homologação Final (Ondas H1–H2)

Data: 2026-07-14  ·  Executor: Lovable Agent  ·  Tenant: `chrismed` (`642096b5-a9ff-4521-a82a-c004f6d2e2d2`)

Este documento consolida o pente-fino executado na CHRISMED sob a regra "não
alterar o que já funciona; corrigir apenas o crítico com evidência". Nenhum
dado de pacientes, agendamentos, pagamentos, integrações ou histórico
operacional foi tocado.

---

## Ondas concluídas nesta execução

### H1 · Diagnóstico read-only

**Rotas públicas CHRISMED** (21 arquivos em `src/routes/chrismed*.tsx`):
`agendar`, `app`, `checkout`, `clinica`, `consultorio`, `contato`,
`domiciliar`, `dra-cristiane`, `especialidades`, `exames`, `faq`, `index`,
`internacional`, `medicos`, `minha-conta`, `ocupacional(.agendar)`,
`ofertas`, `privacidade`, `teleconsulta`.
Nenhuma referência a `href="#"`, `onClick={() => {}}`, `TODO`, `FIXME` ou
`to="#"` foi encontrada nas rotas `chrismed*` ou em `src/components/chrismed/`.

**Rotas API relacionadas encontradas:**
- `src/routes/api/mercadopago/webhook.ts` — webhook global Impulsionando (produção).
- `src/routes/api/public/health/mercadopago.ts` — health global.
- `src/routes/api/public/hooks/core-pull-chrismed.ts` — pull tenant.
- **AUSENTE** (mas referenciado pelo admin): `/api/public/mercado-pago/:slug`.
- **AUSENTE** (necessário para diagnóstico per-tenant): `/api/public/health/mp/:slug`.

**Credencial Mercado Pago da CHRISMED** (`mpago_credentials`):
| Ambiente | Public Key | Ativo | Atualizado |
|---|---|---|---|
| sandbox | `TEST-PUBLIC-KEY-PENDENTE` | ✅ | 2026-06-19 |
| production | `APP_USR-4a3ebd38-4f90-475a-a443-2f75f15990f8` | ❌ | 2026-07-14 |

Access token de produção **ausente no cofre** — por isso `active=false`. A
public key correta foi salva, mas o token precisa ser colado em
`/admin/clientes/chrismed/mercado-pago` para ativar. A partir de agora, o
salvamento em produção é **bloqueado** se o token não passar na validação
`/v1/payment_methods` do próprio Mercado Pago (Onda D3 já entregue).

**Fluxo de dinheiro CHRISMED — como está hoje:**
- `/chrismed/agendar` → chama Supabase Edge Function `mpago-create-payment`
  passando `company_id=CHRISMED`; a função **já resolve** credenciais por
  empresa em `mpago_credentials` + Vault, sem fallback global. ✅
- `/chrismed/checkout` → PIX **estático** (EMV local com chave CNPJ CHRISMED
  `42.625.058/0001-70`). Recebedor correto, mas não é MP integrado.
- Webhook: quando o MP notifica, hoje bate no webhook **global**
  `/api/mercadopago/webhook` (Impulsionando). A partir desta onda, o painel
  do MP da CHRISMED deve ser reconfigurado para
  `https://impulsionando.com.br/api/public/mercado-pago/chrismed` — rota
  criada nesta execução (H2 abaixo).

**WhatsApp CHRISMED:**
- `src/routes/chrismed.contato.tsx` usava número placeholder
  `+55 21 000000000`. Corrigido nesta execução para o número oficial já
  presente em `src/data/chrismed-contact.ts` (`+55 21 97253-7868`).
- Restante das rotas CHRISMED já consome `CHRISMED_CONTACT.channels.whatsapp`.

**Contato oficial em uso** (fonte única `src/data/chrismed-contact.ts`):
WhatsApp `+55 21 97253-7868` · e-mail `sac@chrismed.com.br` ·
Copacabana / Rio de Janeiro · Doctoralia para agendamento ocupacional.

### H2 · Segregação de credenciais MP (correção crítica)

Arquivos criados:

1. `src/routes/api/public/mercado-pago.$slug.ts` — **webhook per-tenant**.
   - Resolve empresa pelo `subdomain` OU `public_slug`.
   - Carrega credencial ativa (produção preferido) em `mpago_credentials`.
   - Revela `access_token` e `webhook_secret` via RPC `reveal_secret_value`
     (`SECURITY DEFINER`, pgcrypto).
   - **Bloqueio explícito**: sem credencial da própria empresa retorna HTTP
     424 e loga em `runtime_events`. Nunca cai no `MERCADOPAGO_ACCESS_TOKEN`
     global da Impulsionando.
   - Valida HMAC do MP (formato `x-signature: ts=…,v1=…`) OU assinatura
     Impulsionando de diagnóstico (`sha256=…` sobre o body).
   - Consulta `/v1/payments/{id}` com o token do próprio tenant, atualiza
     `payments`, `mpago_payments` (com `empresa_id=<company.id>` fixo) e
     marca `mp_webhook_log.processed`.
   - Aceita `test.ping` e header `x-impulsionando-test` para o botão
     "Enviar evento de teste" do painel admin.
2. `src/routes/api/public/health/mp.$slug.ts` — health check per-tenant.
   Retorna status por ambiente, public key mascarada, resultado real de
   `/v1/payment_methods` e URL de webhook oficial deste tenant. Nunca lê
   variável de ambiente global do MP.
3. `src/routes/_authenticated/admin.clientes.$slug.mercado-pago.tsx` (D3 já
   entregue nesta janela) — validação obrigatória do access token no MP
   antes de gravar produção, checklist de status, botão "Enviar evento de
   teste", trilha de auditoria em `audit_logs`.

### H2b · Correção do canal WhatsApp CHRISMED

`src/routes/chrismed.contato.tsx` agora importa `CHRISMED_CONTACT`, com
mensagem inicial contextual em português. Nenhum outro botão CHRISMED
apontava para número placeholder.

---

## Pendências externas (dependem do cliente, não do código)

| # | Item | Impacto | Quem executa | Passo exato |
|---|---|---|---|---|
| 1 | Access Token de produção do Mercado Pago da CHRISMED | Sem ele, `mpago_credentials` da produção permanece `active=false` e nenhum pagamento novo é criado com a conta da CHRISMED (apenas o PIX estático segue funcionando). | Administrador CHRISMED | Painel MP CHRISMED → Suas integrações → Credenciais de produção → copiar Access Token → colar em `https://impulsionando.com.br/admin/clientes/chrismed/mercado-pago`. Sistema valida no MP antes de ativar. |
| 2 | Webhook Secret de produção do MP CHRISMED | Sem ele, webhook per-tenant devolve HTTP 401 (sem assinatura HMAC). | Administrador CHRISMED | Mesmo painel do item 1, campo "Webhook Secret". Depois clicar "Enviar evento de teste". |
| 3 | Reconfigurar URL de webhook no painel do MP CHRISMED | Redireciona notificações do MP para a rota per-tenant nova. | Administrador CHRISMED | Painel MP → Webhooks → substituir URL antiga por `https://impulsionando.com.br/api/public/mercado-pago/chrismed`. Testar com o botão do painel MP. |
| 4 | Doctoralia — sincronização bidirecional de agenda | Hoje o intake ocupacional já redireciona para Doctoralia (link oficial). Sincronização Impulsionando ⇄ Doctoralia depende de API do parceiro. | Cliente + Doctoralia | Solicitar `client_id`, `client_secret` e `clinic_id` ao time de parcerias Doctoralia; salvar como secrets `DOCTORALIA_CLIENT_ID`, `DOCTORALIA_CLIENT_SECRET`, `DOCTORALIA_CLINIC_ID`; então a onda de integração de agenda é destravada. |
| 5 | WhatsApp Cloud API oficial da CHRISMED | Hoje links usam `wa.me` (chat direto). Para envio automatizado de lembretes/confirmações via N8N é necessário canal oficial. | Administrador CHRISMED | Cadastrar `phone_number_id` + token da Meta em Configurações → Canais → WhatsApp; abre a jornada Onda H4 (réguas N8N ativas). |
| 6 | Domínio de e-mail transacional CHRISMED | Sem domínio verificado, e-mails da CHRISMED saem do remetente Impulsionando padrão. | Administrador CHRISMED | Project Settings → Emails → adicionar `notify.chrismed.com.br` (ou subdomínio equivalente) → aplicar NS records mostrados na tela; SPF/DKIM ficam automáticos. |

---

## Ondas não executadas nesta janela (por que e o que fazer depois)

- **H3 Jornada + Agenda completa (booking → payment → confirmation).** O
  fluxo real hoje usa `mpago-create-payment` edge function que **já** resolve
  por empresa. Reforma exigiria refatorar `chrismed.agendar.tsx` e criar
  reconciliação server-side agendamento⇄payment, alterando código que
  produzia agendamentos reais. **Bloqueio auto-imposto da regra 1**
  (não alterar o que funciona sem necessidade). Recomendação: onda separada
  com plano formal e ambiente de staging antes.
- **H4 Réguas N8N ativas** (novo paciente, carrinho abandonado,
  pós-consulta, 90d, 180d, satisfação). Depende de credenciais WhatsApp
  Cloud oficiais (pendência #5). Templates PT/EN/ES prontos para serem
  ativados quando o canal existir.
- **H5 Templates de e-mail premium PT/EN/ES.** Só faz sentido depois do
  domínio da CHRISMED verificado (pendência #6); rascunhos ficam parcados.
- **H6 Global tipografia / contraste / responsividade WCAG AA.**
  Alterações amplas em CSS/tokens têm alto risco de regressão visual.
  Recomendo executar em onda dedicada com screenshots antes/depois por
  breakpoint (320 / 375 / 768 / 1280).

---

## Como validar o que foi entregue nesta janela

1. `GET https://impulsionando.com.br/api/public/health/mp/chrismed` deve
   responder JSON com `production.active=false` (até o item #1 ser
   resolvido). Nenhum segredo é exposto.
2. No painel `/admin/clientes/chrismed/mercado-pago` o checklist mostra o
   que ainda falta; ao colar o Access Token, a validação real no MP
   acontece antes de gravar.
3. Após pendências #1 + #2 + #3 resolvidas, clicar "Enviar evento de
   teste" no painel deve retornar HTTP 200 e gravar linha em
   `audit_logs.action='mpago_credentials.test_webhook'`.
4. `/chrismed/contato` → botão WhatsApp abre `wa.me/5521972537868` com a
   mensagem "Olá CrisMed, gostaria de orientação sobre uma consulta."

---

## Governança preservada

- Credenciais criptografadas em `core_secret_values` (pgcrypto/pepper).
- Fallback silencioso da Impulsionando eliminado no fluxo per-tenant.
- Toda alteração de credencial CHRISMED gera `audit_logs` (categoria
  `payments`, severidade `warning` em produção).
- Nenhum segredo exposto em bundle client. Consulta ao MP acontece
  exclusivamente em server functions e rotas server-side.
- Nenhuma mudança em `auth`, `storage`, `realtime`, `supabase_functions`
  ou `vault`. Nenhuma tabela CHRISMED foi migrada nesta janela.
