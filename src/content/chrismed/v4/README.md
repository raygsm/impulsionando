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
