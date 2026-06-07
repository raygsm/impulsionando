## Análise (o que já existe — NÃO recriar)

- `companies` já tem: `name`, `legal_name`, `document`, `email`, `phone`, `logo_url`, `is_master`, `status`, `niche_id`.
- `company_settings` (chave/valor JSONB) já existe — usado para extensões.
- `message_templates` (95 templates globais com `company_id = NULL`) e `enqueue_message()` + `render_template()` já operam o motor de variáveis `{{...}}`.
- `onboarding_domain_requests` já guarda domínio/subdomínio.
- `/adm` (Core Manager) + Cliente 360 + `core.modulos` + `core.implantacoes` já existem.
- Provisionamento automático (`autoProvisionFromPayment`) já cria empresa + contrato + módulos.

## Princípio

Não criar nova tabela de identidade. **Estender `companies`** com os campos faltantes (additivo, sem quebrar nada) e fazer o `enqueue_message` **injetar automaticamente** as variáveis `{{company_*}}` em TODA mensagem, sem alterar 1 template sequer.

## Etapas

### 1. Migration aditiva em `companies`
Adicionar colunas (todas nullable, sem default destrutivo):
`trade_name`, `company_type`, `segment`, `primary_color`, `secondary_color`,
`whatsapp`, `financial_email`, `support_email`, `commercial_email`,
`domain`, `subdomain`, `website`, `instagram`, `facebook`,
`address_line`, `address_city`, `address_state`, `address_zip`,
`owner_name`.

Os campos `name`, `email`, `phone`, `logo_url` já existem — reaproveitar.

### 2. Função `public.company_identity_payload(uuid)`
Retorna `jsonb` com TODAS as variáveis `company_*` da empresa (name, logo, email, whatsapp, domain, subdomain, primary_color, etc.). Usa fallback para empresa master quando `company_id IS NULL`.

### 3. Patch em `enqueue_message`
Antes de chamar `render_template`, fazer:
```
_merged := company_identity_payload(_company_id) || _payload
```
→ payload do chamador tem prioridade, mas TODA mensagem ganha automaticamente `{{company_name}}`, `{{company_logo}}`, `{{company_whatsapp}}`, etc. **Nenhum template existente precisa ser editado.**

### 4. UI — Edição de Identidade no `/adm`
Estender a página `core.cliente.$id.tsx` (Cliente 360) com aba **"Identidade"**:
- formulário completo com todos os campos novos + logo + cores;
- preview de "como o cliente final verá" (nome, logo, cor primária);
- exibir: domínio, subdomínio, WhatsApp ativo, e-mails ativos, módulos instalados, última comunicação enviada (consulta `message_outbox` ordenada por `created_at`).

Server fn `updateCompanyIdentity` em `src/lib/company-identity.functions.ts`, gated por `is_impulsionando_staff` OU `company.write`.

### 5. Auditoria
Já existe `audit_logs` + trigger `tg_audit` em `companies`. Toda alteração de identidade fica registrada automaticamente.

### 6. Mensagens — sem mudanças
Como o `enqueue_message` agora injeta a identidade, os 95 templates existentes passam a ser contextuais automaticamente. **Nenhum template duplicado, nenhuma reescrita.**

## Detalhes técnicos

- Arquivos novos: `src/lib/company-identity.functions.ts`, um componente `IdentityTab.tsx` consumido por `core.cliente.$id.tsx`.
- Arquivos editados: `core.cliente.$id.tsx` (adiciona aba), 1 migration.
- Nada removido. Nada renomeado. Nenhum módulo tocado.
- Cliente 360 e `/adm` continuam sendo os únicos pontos de gestão.

## Fora de escopo (não fazer agora)

- Refatorar os 95 templates (desnecessário — herança via payload resolve).
- Criar tabela `company_profile` separada (duplicaria `companies`).
- Mexer em provisionamento (já cria company → identidade preenchida via edição depois ou via dados do checkout).
- UI de troca de templates por empresa (já existe `message_templates.company_id` para override).

## Validação final

Após aplicar:
1. `SELECT company_identity_payload((SELECT id FROM companies WHERE name ILIKE '%patricia%'));` deve retornar JSON completo.
2. Enviar `enqueue_message('appointment_confirmed', <company_id>, ...)` e confirmar que `message_outbox.body` contém o WhatsApp/logo/nome **da empresa**, não da Impulsionando.
3. Editar identidade em `/adm/core/cliente/:id` → aba Identidade → salvar → reenviar → body muda automaticamente.