# CrisMed — Handoff Lovable → Codex

Documento de transferência da camada visual/frontend (entregue pelo Lovable) para a camada de dados/integrações (a cargo do Codex).

Última atualização: Wave 5 · CrisMed sob core Impulsionando.

---

## 1. Escopo entregue pelo Lovable (Waves 1–5)

### Wave 1 · Fluxo de agendamento invertido
Rota: `/chrismed/agendar`
- 9 passos: Especialidade → Médico → Modalidade → Unidade → Calendário → Horário → Identificação → Confirmação → PIX → Sucesso.
- Indicador de progresso, botão Voltar, validação client-side.
- Máscaras CPF/CEP/telefone.
- Calendário mobile-first com estados `available | unavailable | held | past`.
- Integração PIX via Mercado Pago (fluxo de produção já existente).
- Mocks visuais em `src/data/chrismed-mock.ts` com aviso `CHRISMED_MOCK_NOTICE`.

### Wave 2 · Oliver (concierge)
Componente: `src/components/chrismed/ChrismedOliverPanel.tsx`
- Avatar circular monograma "O", nome **Oliver**, título **Concierge CrisMed**.
- Grade de ações rápidas 2×3: Agendar, Nossos médicos, Especialidades, Meus agendamentos, Pagamento, Falar com atendimento.
- Respostas contextuais por rota via `OLIVER_CONTEXTS`.
- Canal humano desabilitado (`WHATSAPP_ENABLED = false`) — ativação pendente Codex.
- Nenhuma resposta simulada de IA.

### Wave 3 · Nossos Médicos + cadastro parceiro
Rota: `/chrismed/medicos`
- Diretório filtrável (busca + especialidade + modalidade).
- Cadastro em 4 etapas com stepper: Pessoal → Profissional → Atendimento → Agenda.
- Multiespecialidades no formulário + escolha da principal.
- Inclui Medicina do Trabalho e Saúde Ocupacional.
- Envio em `marketing_leads` (`answers.tipo = 'medico_parceiro'`).

### Wave 4 · Checkout + Área do paciente
Rotas: `/chrismed/checkout`, `/chrismed/minha-conta`
- Checkout com identidade CrisMed, seletor PIX/Cartão, resumo lateral sticky.
- Cartão marcado como pendente Codex (UI somente).
- Área do paciente com abas Agendamentos / Pagamentos / Meus dados.

### Wave 5 · Polimento
- Auditoria de responsividade (dvh no Oliver, grids fluidos, tabela de pagamentos com scroll no mobile).
- Contraste consistente com tokens `--chrismed-*` e paleta emerald/amber.
- Estados vazios (`EmptyState`), CTAs em todas as telas terminais.
- Este documento de handoff.

---

## 2. Pendências Codex (o que Lovable NÃO faz)

Cada item abaixo aparece marcado na UI como "Pendente Codex" ou "em breve".

### 2.1 Agendamento — `/chrismed/agendar`
- Persistir agendamento em tabela real (hoje mock).
- Lock/hold de horário atomicamente no banco.
- Fonte real de disponibilidade dos médicos.
- CEP → endereço via ViaCEP (consumidor no client, gravação no server).
- Webhook do Mercado Pago → confirma agendamento e dispara e-mail/WhatsApp.
- Reagendamento e cancelamento pelo paciente.

### 2.2 Oliver
- Canal humano (WhatsApp) — trocar `WHATSAPP_ENABLED` para `true` quando número oficial estiver configurado e ligar o click-through ao número/URL certo.
- Contadores reais em "Meus agendamentos" quando o paciente estiver autenticado.

### 2.3 Médicos — `/chrismed/medicos`
- Tabela `chrismed_doctors` (ou equivalente) com múltiplas especialidades por médico (relação N:N). Hoje o schema aceita 1 especialidade principal por profissional.
- Substituir `CHRISMED_DOCTORS` (mock) por query real.
- Fluxo interno de análise do cadastro parceiro (`novo → em análise → aprovado/recusado → ativo`).

### 2.4 Checkout — `/chrismed/checkout`
- Habilitar captura de cartão (provedor a definir com o Codex).
- Preencher resumo real com dados da sessão/agendamento vindo do backend.
- Emissão de recibo/NF automática.

### 2.5 Minha área — `/chrismed/minha-conta`
- Autenticação do paciente (magic link / OTP / senha — decidir com o core Impulsionando).
- Query real de agendamentos e pagamentos por `patient_id = auth.uid()` (RLS).
- Persistência do formulário "Meus dados" com validação de CPF e endereço.
- Download real de recibo/NF por agendamento.

---

## 3. Publicação

Frontend só entra em produção após:
1. Abrir a modal Publish no editor Lovable.
2. Clicar **Update**.
3. Aguardar ~1 minuto.

Domínio oficial: `www.crismed.com.br` (o apontamento é gerenciado no painel de domínios do Lovable; ver Project settings → Domains).
Preview atual: `https://id-preview--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app`.

---

## 4. Convenções mantidas

- Todo o CrisMed vive sob o core Impulsionando (auth, RLS, billing, branding). Nada de arquitetura isolada.
- Tokens de cor via `--chrismed-*` e paleta emerald/amber; sem cores hardcoded fora dos tokens.
- Nenhuma resposta simulada de IA nas superfícies do paciente.
- Todo mock declara explicitamente "Pendente Codex" na UI.
