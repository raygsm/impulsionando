# CHRISMED — V4 (Agenda, reserva e pagamento)

**Status:** congelado. Aguardando parecer e contratos do Codex.

Nada neste diretório está montado em rota, nem importado por
`src/routes/chrismed.agendar.tsx`. Serve apenas como referência visual e
schema de props para a recompilação futura da V4.

## Regras de congelamento

Enquanto o Codex não entregar os contratos reais, é PROIBIDO nesta pasta:

- conectar componentes a mocks ou fixtures;
- simular lock de horário, agendamento, aprovação de pagamento;
- criar contagem regressiva falsa (nenhum `setInterval`/`setTimeout` de UX);
- criar confirmação sem persistência real;
- importar `supabase` ou qualquer edge function;
- consumir tabelas, RLS, Mercado Pago, N8N.

Permitido:

- markup e estilos puros;
- documentação de estados;
- dicionários PT/EN/ES (dados);
- tipos/props marcados `TODO(Codex)`.

## Mapa visual

```text
/chrismed/agendar (route — recompilar quando contratos existirem)
└─ AgendarLayout
   ├─ AgendarHero (i18n, já aprovado no hero atual)
   ├─ AgendarStepIndicator     [1 Modalidade · 2 Data · 3 Dados · 4 Pagamento · 5 Confirmação]
   ├─ Step1_ModalityGrid
   ├─ Step2_SlotPicker
   │   ├─ ProfessionalSelect
   │   ├─ CalendarMonth
   │   ├─ TimeSlotList
   │   └─ SlotHoldBanner       (countdown vindo do backend, nunca client-side)
   ├─ Step3_PayerForm          (+ ConsentLGPD + TermsAcceptance)
   ├─ Step4_Payment
   │   ├─ PixPanel             (QR + copia-e-cola, expires_at do backend)
   │   ├─ PaymentStatusBadge   (pending|in_process|approved|rejected|cancelled|expired|refunded|charged_back)
   │   └─ PaymentTroubleshoot  (fallback humano / Oliver)
   └─ Step5_Confirmation
       ├─ ConfirmationSummary
       ├─ CalendarInviteButtons
       └─ NextStepsCard
```

## Estados documentados (visual, sem simulação)

### Vitrine / Step 1
- `loading`, `empty`, `error`, `ready`.

### Step 2 — Slot picker
- `idle` (aguarda escolha de profissional);
- `loading_availability`;
- `no_availability` (janela sem horários);
- `slot_selected` (nenhum hold ainda);
- `hold_pending` (chamada de hold em curso);
- `hold_active` (hold confirmado pelo backend, com `expires_at`);
- `hold_expired` (backend sinalizou expiração);
- `hold_conflict` (409 — outro paciente pegou);
- `error`.

### Step 3 — Dados do pagador
- `draft`, `validating`, `invalid`, `valid`, `submit_blocked_by_consent`.

### Step 4 — Pagamento
- `creating_payment`, `awaiting_pix`, `in_process`, `approved`,
  `rejected`, `cancelled`, `expired`, `refunded`, `charged_back`,
  `error_gateway`, `error_network`.

### Step 5 — Confirmação
- `confirmed`, `confirmed_with_warnings` (ex.: e-mail não entregue),
  `error_post_confirmation`.

## Dependências do Codex (bloqueantes)

Ver auditoria V4 (mensagem anterior). Reproduzido em `contracts.ts` como
`TODO(Codex)` por bloco.

## Regra oficial do SlotHoldBanner (server-authoritative)

O contador visual do hold PODE existir no front-end, desde que:

1. seja calculado a partir do `expires_at` oficial recebido do servidor,
   corrigido por um offset de skew (server_time − client_time) devolvido na
   mesma resposta;
2. seja reconciliado periodicamente contra o backend (GET de status do
   hold), nunca decidindo expiração sozinho;
3. em qualquer divergência com o backend, o servidor vence — o estado do
   componente cai para `hold_expired` ou `hold_conflict` conforme resposta;
4. nunca simule, prolongue ou renove o hold no cliente;
5. na perda de rede, o contador congela e exibe estado de reconciliação,
   não continua contando.

O cliente nunca é fonte de verdade do hold. O contador é apenas leitura
espelhada com correção de deriva.

## Aprovações e próximo passo

- Preparação congelada da V4: **aprovada**.
- Próxima decisão: depende integralmente do relatório do Codex
  (agenda, serviços, profissionais, disponibilidade, lock, Mercado Pago,
  webhooks, reservas, preços, remarcação, cancelamento, reembolso, RLS,
  N8N).
- Enquanto isso: nenhuma linha de `/chrismed/agendar`, Supabase, edge
  functions, Mercado Pago, N8N, RLS ou banco será alterada.
