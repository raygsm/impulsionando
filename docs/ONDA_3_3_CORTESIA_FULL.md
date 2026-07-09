# Onda 3.3 — Cortesia Full 30 dias

Destravamento controlado e mínimo do backend para suportar a cortesia Full
de novos clientes conectados ao Core Impulsionando.

## Escopo

- Todo cliente pode receber Plano Full em cortesia (padrão 30 dias).
- Cortesia é auditável, extensível, revogável e conversível em cobrança.
- Parametrização global do prazo default via `core_settings`.
- Somente equipe Impulsionando (`is_impulsionando_staff`) pode operar.
- Nenhuma cobrança é gerada nesta fase — conversão apenas marca o status.

## Migration aplicada

Arquivo: gerado via `supabase--migration` (Onda 3.3).

Alterações:

1. `companies` recebeu 5 colunas aditivas (defaults seguros):
   - `full_courtesy_status text NOT NULL DEFAULT 'none'`
     · valores: `none|active|converted|expired|revoked`
   - `full_courtesy_started_at timestamptz`
   - `full_courtesy_ends_at timestamptz`
   - `full_courtesy_days integer`
   - `full_courtesy_plan_id uuid REFERENCES billing_plans(id)`
2. `core_settings` recebeu o par
   `('full_courtesy_days_default', 30, 'Cortesia Full — dias padrão', 'billing')`.
3. Nova tabela `core_courtesy_events` para trilha de auditoria:
   - eventos: `grant|extend|convert|revoke|expire|sync`
   - FK para `companies` e opcional para `billing_plans`
   - RLS: SELECT/ALL apenas via `is_impulsionando_staff(auth.uid())`
   - GRANTs para `authenticated` (filtrado pela RLS) e `service_role`
   - Index `(company_id, created_at DESC)`

Todas as alterações são aditivas: nenhuma coluna existente foi tocada,
nenhuma política existente foi removida, nenhum plano foi alterado.

## Arquivos alterados

- `src/lib/courtesy.functions.ts` *(novo)*
  Server functions: `getFullCourtesy`, `grantFullCourtesy`,
  `extendFullCourtesy`, `revokeFullCourtesy`, `convertFullCourtesy`,
  `setDefaultCourtesyDays`. Todas exigem staff e usam
  `requireSupabaseAuth`.
- `src/routes/_authenticated/admin.clientes.$slug.plano.tsx`
  Aba Plano e cortesia agora conectada ao backend: exibe status atual,
  dias restantes, plano de referência, histórico e ações (conceder,
  estender, converter, revogar). Formulário do padrão global.
- `src/routes/_authenticated/admin.clientes.$slug.tsx`
  Header do Cliente 360 recebeu badge "Cortesia Full · Nd" quando
  status = `active`. Query estendida para trazer `full_courtesy_status`
  e `full_courtesy_ends_at`.
- `docs/ONDA_3_3_CORTESIA_FULL.md` *(este documento)*

## Fluxos suportados

| Ação | Efeito principal | Auditoria |
| --- | --- | --- |
| Conceder | `status=active`, `started_at=now`, `ends_at=now+dias`, `days` e `plan_id` gravados | `grant` |
| Estender +N | `ends_at` empurrado a partir do maior entre `ends_at` e `now`; `days += N` | `extend` |
| Converter | `status=converted`, mantém datas | `convert` |
| Revogar | `status=revoked`, mantém datas | `revoke` |
| Alterar padrão global | atualiza `core_settings.full_courtesy_days_default` | — |

Reversibilidade: qualquer estado pode ser reconciliado por um novo `grant`
(reinicia a contagem). Colunas podem ser zeradas por `UPDATE ... SET
full_courtesy_status='none'` sem impacto em outras áreas.

## Segurança

- Todas as server functions checam `is_impulsionando_staff` no
  `context.userId` antes de qualquer leitura/escrita sensível.
- RLS de `core_courtesy_events` limita SELECT/ALL a staff.
- Colunas `full_courtesy_*` em `companies` seguem as políticas existentes
  daquela tabela (leitura por staff e pelo próprio cliente).
- Não há endpoint público; nenhum caminho anônimo foi aberto.

## Riscos

- Cobrança real ainda **não é gerada** ao final da cortesia — este é o
  próximo passo (Fase 3.5, Mercado Pago). Enquanto isso, `expired`
  precisa ser marcado manualmente ou por rotina futura.
- Somente `code = 'full'` é utilizado como plano de referência. Se um
  cliente já estiver amarrado a outro plano, essa amarração NÃO é
  alterada — a cortesia é apenas metadado nesta fase.
- A UI mostra apenas dias inteiros restantes. Precisão de horas não é
  crítica para este caso de uso.
- `core_settings.value` continua `jsonb`; escrevemos número puro
  (`json_typeof = number`), compatível com a leitura em `readDefaultDays`.

## Testes recomendados (manuais nesta fase)

1. Como staff: abrir `/admin/clientes/<slug>/plano`, conceder cortesia
   padrão, ver badge no header e no card. Verificar histórico.
2. Estender +30 → confirmar novo `ends_at` no card e evento no histórico.
3. Alterar padrão global para 45 → recarregar → default reflete 45.
4. Converter → badge de header some, status vira "Convertida em
   cobrança", ainda listado no histórico.
5. Revogar cortesia recém-concedida → status vira "Revogada".
6. Como usuário não-staff (opcional): abrir a mesma URL deve retornar
   erro "Apenas equipe Impulsionando." nas mutations e no fetch inicial.

## Pendências para Fase 3.4 (Cérebro IA por Cliente)

- Schema `client_ai_brain`: agente, tom, horários, idiomas, canais,
  base de conhecimento, prompts, guardrails, versão.
- RLS por `company_id` + grants para staff e para o dono do cliente.
- Painel real de testes com histórico de conversa e revisão humana.

## Pendências para Fase 3.5 (Cobrança / Mercado Pago)

- Rotina que muda `active → expired` no vencimento (cron ou trigger).
- Ao converter: emitir cobrança/assinatura no Mercado Pago com plano
  contratado real (não necessariamente o Full padrão).
- Webhook público em `/api/public/mercado-pago/*` com verificação HMAC.

## PROJECT_STATE / MASTER_SPEC / PLANS

- **PROJECT_STATE**: Onda 3.3 concluída (frontend + backend mínimo).
  Cliente 360 agora tem uma aba operacional real (Plano e cortesia).
- **MASTER_SPEC**: cortesia Full é atributo padrão de todo cliente
  conectado ao Core, com padrão global parametrizável.
- **PLANS**: próximo passo Fase 3.4 (Cérebro IA), depois Fase 3.5
  (cobrança real via Mercado Pago).
