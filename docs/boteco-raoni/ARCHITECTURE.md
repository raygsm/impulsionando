# Boteco do Raoni — arquitetura do ecossistema

## Princípio
Boteco do Raoni é uma instância do Core Impulsionando, não um sistema isolado. O módulo `hospitality_*` é reutilizável por bares/restaurantes e cada registro é isolado por `company_id`.

## Núcleo operacional
Fluxo principal: **PDV → comanda → item → movimento de estoque → barril → torneira → tapboard → CRM/BI**.

Para chope, o estoque canônico é mililitro. Barris de 30/40/50 L entram como 30000/40000/50000 mL. Cada venda desconta exatamente o volume cadastrado no tamanho servido. A função transacional `hospitality_post_draft_sale` bloqueia o barril durante a operação para evitar overselling concorrente, grava movimento e suporta idempotência.

Perdas nunca são escondidas como venda. Espuma, limpeza de linha, degustação e ajustes devem gerar movimentos próprios.

## Experiência pública
1. Home viva, mobile-first.
2. **Nas torneiras agora**: rótulo, cervejaria, estilo, ABV, IBU, origem, tamanhos/preços e disponibilidade.
3. Carta de cervejas embaladas e gastronomia.
4. Eventos e programação.
5. Reserva/check-in.
6. Clube Raoni: perfil, favoritos, pontos, histórico, benefícios, alertas e indicação.
7. História/personagem Raoni e identidade de boteco cervejeiro premium com humor.
8. Localização, horários e canais oficiais.

A vitrine pública deve receber atualizações realtime. Para o cliente, preferir `available`, `ending`, `unavailable`; o volume exato em mL/L é informação operacional do backoffice.

## Backoffice
- Dashboard: faturamento, ticket, clientes, comandas, giro, CMV, margem e alertas.
- PDV: balcão, mesa, takeaway, evento; fechamento e múltiplos pagamentos.
- Torneiras: barril ativo, saldo, previsão de término, troca e limpeza.
- Estoque: chope, garrafa, lata, alimentos, insumos e embalagens.
- Compras/fornecedores.
- CRM e segmentação.
- Clube/fidelidade.
- Eventos/reservas/check-in QR.
- Jornadas n8n.
- Marketing, UTM, campanhas e SEO.
- BI.
- Usuários, RBAC e auditoria.

## 10 funções-agente
Todos operam sobre o mesmo Core e contexto do funil; não existem bancos paralelos.

1. **Concierge/Atendimento** — dúvidas, rótulos, harmonização, reservas e eventos.
2. **Vendas** — conversão, upsell, combos, clube e reservas.
3. **Relacionamento/CRM** — segmentação, retorno, VIP, inatividade, NPS e indicação.
4. **Estoque/Compras** — giro, ruptura, validade, reposição, barris e fornecedores.
5. **Operação/PDV** — comandas, filas, mesas, produtividade e divergências.
6. **Eventos/Reservas** — agenda, lotação, lista de espera, confirmação e check-in.
7. **Marketing/Conteúdo** — calendário, lançamentos, humor da marca e campanhas.
8. **Aquisição/SEO/UTM** — origem, campanhas, busca local e performance.
9. **Financeiro/BI** — CMV, margem, ticket, mix, previsão e anomalias.
10. **Segurança/Monitoramento** — RBAC, RLS, auditoria, disponibilidade e alertas.

O Impulsionito permanece como orquestrador central do Core.

## Jornadas mínimas
- Primeiro contato → cadastro → primeira visita → pós-visita → retorno.
- Visitante anônimo → QR/wi-fi/site → consentimento → CRM.
- Primeira compra → convite ao Clube.
- Preferência por estilo/cervejaria → lançamento compatível.
- Rótulo favorito indisponível → alerta quando retornar.
- Rótulo/barril próximo do fim → urgência contextual sem falsa escassez.
- Cliente recorrente → VIP/benefício.
- Cliente inativo → winback.
- Aniversário.
- Evento publicado → interesse → reserva → confirmação → check-in → pós-evento/NPS.
- Reserva abandonada/no-show.
- Happy hour por perfil/horário.
- Indicação → código → atribuição → benefício.
- NPS baixo → ticket humano; NPS alto → convite a avaliação/indicação.

## Eventos para CRM
O módulo deve publicar eventos normalizados para automação/BI: `tab.opened`, `pos.item.posted`, `draft.poured`, `keg.low`, `keg.empty`, `tap.changed`, `reservation.created`, `reservation.checked_in`, `club.joined`, `customer.returned`, `nps.received`.

## P0 antes de produção
- Migration aplicada e RLS testada.
- Cliente Raoni existente em `communication_tenants` com `company_id` válido.
- Teste concorrente de duas vendas contra o mesmo barril.
- Teste de idempotência.
- Teste 30/40/50 L e doses configuráveis.
- Teste de saldo insuficiente.
- Teste de troca de barril.
- Realtime tapboard.
- PDV ponta a ponta e fechamento.
- CRM/jornadas registrando eventos.
- Auditoria/RBAC.
- Smoke/E2E e rollback documentado.

Nenhum item deve ser declarado funcional em produção sem evidência.