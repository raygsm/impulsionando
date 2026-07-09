# WMP — Roadmap de Plataforma de Eventos (pendências para o Codex)

Onda 2.4 auditou e refinou o front atual da WMP (institucional + briefing +
parceiros). Para elevar a WMP à condição de **plataforma completa de produção,
gestão e comercialização de eventos** dentro do ecossistema Impulsionando,
esta é a arquitetura recomendada — a ser implementada pelo Codex, integrada
ao core (auth, RBAC `user_roles`+`has_role`, RLS por `company_id`, billing,
branding).

## Áreas ausentes (a construir)

### 1. Agenda pública de eventos — `/wmp/agenda`
- Listagem SSR com filtros (categoria, cidade, mês, gratuito/pago).
- Cards com data, local, lote atual, ingressos restantes.
- Route dinâmica `/wmp/eventos/$slug` com hero, programação, palestrantes/atrações,
  mapa (lat/lng), FAQ do evento, regulamento e política de reembolso.
- JSON-LD `Event` por evento (com `offers` e `location`).

### 2. Venda de ingressos e lotes — `/wmp/eventos/$slug/ingressos`
- Tabela `events`, `ticket_batches`, `orders`, `tickets` (com QR único).
- Motor de lotes: preço, quantidade, data de virada, meia-entrada, cupom.
- Checkout integrado ao `CheckoutShell` do core (Pix, cartão, boleto).
- E-mail transacional com QR + PDF do ingresso.
- Reserva temporária (10 min) com liberação automática.

### 3. Área do participante — `/wmp/minha-conta`
- Autenticado via `_authenticated` do core.
- Meus ingressos (QR Code), inscrições ativas, histórico de compras,
  certificados (para congressos/cursos), notificações, dados pessoais,
  preferência de comunicação.

### 4. Área do produtor / organizador — `/wmp/produtor`
- Gate por `has_role('producer')`.
- CRUD de eventos, lotes, cortesias, cupons.
- Vendas em tempo real (GMV, ticket médio, conversão de checkout).
- Participantes exportáveis (CSV), lista de espera, comunicação em massa.
- Financeiro: repasses, taxa de intermediação digital do core (0,50% padrão,
  override por nicho), extrato, antecipação.
- Relatórios (dashboards por evento e consolidados).

### 5. Check-in — `/wmp/checkin/$eventoId`
- App PWA com câmera → scan de QR → validação + liberação.
- Modo offline com sincronização posterior.
- Roles: `checkin_operator`, `supervisor`.

### 6. Expositor / patrocinador — `/wmp/eventos/$slug/expor`
- Formulário de proposta com pacotes (stand, cotas ouro/prata/bronze).
- Sem cobrança direta na v1: encaminha para funil comercial (`crm_opportunities`).

### 7. Admin master do módulo
- Entrada nova em `core_admin_menu` (grupo "Eventos") com telas de moderação,
  compliance de eventos (verificar CNPJ do produtor, política antifraude) e
  monitoramento de receita.

## Ajustes ao core Impulsionando

- Novos `audiences`: `event_attendee`, `event_producer`, `event_checkin`.
- Nicho `events` no `TENANT_MODELS` com réguas próprias (pré-evento,
  pós-evento, NPS, upsell para próximo evento).
- Menu do produtor entra pelo `core_admin_menu` (padrão parametrizável).
- Funil Impulsionando: cada evento vira campanha (`marketing_campaigns`),
  cada comprador vira lead (`marketing_leads`) e cada produtor vira conta.

## Fora do escopo desta onda

- Nenhuma tabela nova, migração, RLS, edge function ou integração de pagamento
  foi criada. Esta onda entregou apenas front institucional refinado, com o
  estado vazio de agenda documentando publicamente a evolução.
- Substituir o `aggregateRating` fictício (removido) por métricas reais só
  quando houver base de reviews verificáveis (Google/Meta) integradas.

## Prioridade sugerida

1. Agenda + evento público (SEO wins imediatos).
2. Ingressos + checkout (receita).
3. Área do participante (retenção).
4. Área do produtor (self-service, escala).
5. Check-in PWA (operação no dia).
6. Expositor/patrocinador (upsell B2B).
