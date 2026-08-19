# ON TAP — Full Pub Commerce Platform

Status inicial: arquitetura aprovada para implementação incremental, sem impacto em produção.
Data: 2026-08-18

## Princípio
On Tap nasce como cliente conectado ao Core universal da Impulsionando. Não duplicar autenticação, CRM, omnichannel, tickets, analytics, billing, reference data ou infraestrutura compartilhada.

## Experiência pública
- Home imersiva mobile-first com identidade de pub premium da Tijuca.
- Cardápio vivo: torneiras, estilos, cervejarias, ABV/IBU quando real, preço, disponibilidade e harmonizações.
- Gastronomia, combos e destaques.
- Agenda: shows, DJs, transmissões esportivas, tap takeovers, lançamentos, degustações e eventos privados.
- Reservas e lista de espera.
- Clube On Tap integrado à conta do cliente.
- Área do cliente: perfil, pontos, nível, benefícios, cupons, reservas, pedidos, histórico, preferências, aniversários, indicações e consentimentos.
- QR de mesa/comanda para pedido assistido quando habilitado.

## PDV e operação
- Mesas e comandas.
- Pulseiras numeradas 0001–9999 quando a operação optar por pulseiras: número físico selecionado no PDV; após quitação volta a ficar disponível.
- Pedidos por garçom, balcão e QR.
- Divisão de conta, transferência de itens, descontos autorizados, cortesia com motivo e trilha de auditoria.
- KDS/cozinha e fila do bar.
- Sangria, suprimento, abertura/fechamento e conferência de caixa.
- Perfis e permissões por função.

## Estoque conectado ao PDV
- Insumos, produtos, barris, embalagens e fichas técnicas.
- Baixa automática por venda.
- Barril por lote, cervejaria, estilo, volume nominal, volume estimado restante, custo, validade e torneira.
- Perdas: espuma, limpeza de linha, degustação, quebra, cortesia e divergência, sempre com motivo.
- Inventário e contagem cíclica.
- Estoque mínimo, previsão de ruptura e sugestão de compra.
- CMV real e teórico.
- Nunca inventar estoque, preço ou disponibilidade.

## Clube e fidelidade
- Cadastro único Core.
- Pontos, cashback promocional quando juridicamente/comercialmente habilitado, níveis, missões e badges.
- Benefícios configuráveis por dia, horário, produto, categoria, evento e nível.
- Aniversário, indicação, frequência, ticket médio e reativação.
- Desconto do clube aplicado no PDV mediante identificação do cliente e regra vigente.
- Antifraude e limites por campanha.

## CRM e jornadas n8n
Eventos canônicos: lead_created, customer_registered, reservation_created, reservation_confirmed, checkin, order_opened, order_paid, club_joined, benefit_redeemed, birthday_window, inactive_customer, event_registered, event_attended, review_requested, review_received, cart_or_order_abandoned quando aplicável.

Jornadas prioritárias:
1. Primeiro cadastro -> boas-vindas -> convite ao clube -> primeira visita.
2. Reserva -> confirmação -> lembrete -> check-in -> pós-visita -> avaliação.
3. Cliente novo -> segunda visita -> terceira visita -> fidelização.
4. Cliente inativo -> reativação contextual.
5. Aniversário -> benefício -> reserva -> acompanhamento.
6. Evento -> inscrição -> lembrete -> check-in -> pós-evento.
7. Cerveja favorita/estilo favorito -> nova torneira compatível -> comunicação consentida.
8. Torneira/barril em baixa -> alerta operacional e compra.
9. NPS baixo -> ticket de recuperação; NPS alto -> avaliação pública.
10. Indicação -> rastreio -> recompensa após regra de conversão.

## Inteligência / dez agentes funcionais
Os dez agentes são papéis especializados coordenados pelo Impulsionito, não dez bancos ou sistemas paralelos:
1. Orquestração/Impulsionito.
2. Vendas e conversão.
3. Concierge cervejeiro e harmonização.
4. Reservas e eventos.
5. CRM, fidelidade e reativação.
6. Social/content e reputação.
7. Estoque, compras e CMV.
8. PDV/operação e qualidade de serviço.
9. Financeiro/BI e rentabilidade.
10. Segurança, auditoria e observabilidade.
Cada agente opera somente com ferramentas, dados e permissões autorizadas; ações financeiras, descontos extraordinários, exclusões e mudanças críticas exigem política de autorização.

## Back-end
- Supabase/Postgres principal e isolamento por company_id/cliente conectado ao Core.
- RLS obrigatória e resolução canônica de empresa.
- APIs server-side; segredos nunca no browser.
- Outbox/event bus para automações e integrações.
- Idempotência em pagamentos, pedidos, estoque e webhooks.
- Audit log imutável para operações sensíveis.
- LGPD: consentimento, finalidade, minimização, exportação e exclusão conforme obrigação legal.

## Analytics
- Receita, ticket médio, covers, giro de mesa, ocupação, vendas/hora.
- Produto/estilo/cervejaria, margem, CMV, perdas e ruptura.
- Cliente: frequência, recência, LTV, coortes, churn/inatividade e clube.
- Eventos: inscrições, presença, receita incremental e retorno.
- Marketing: UTM/origem, CAC quando disponível, conversão e receita atribuída.

## Integrações
- n8n via eventos/outbox compartilhados do Core.
- E-mail funcional conforme infraestrutura homologada do Core.
- WhatsApp/SMS/VoIP somente quando o respectivo canal estiver homologado e configurado.
- Mercado Pago somente após credenciais seguras + PIX/cartão/webhook E2E homologados; não declarar funcional antes disso.
- Sem Vercel. Publicação segue VPS/Hostinger + Traefik + GitHub Actions do ecossistema.

## Front-end visual
Direção: pub premium contemporâneo, atmosfera noturna, textura de metal/madeira/vidro e cerveja, tipografia altamente legível, fotos reais sempre que disponíveis, microinterações discretas e foco mobile. Evitar template genérico de restaurante. CTAs principais: Ver torneiras agora, Reservar mesa, Entrar no Clube, Agenda, Pedir/abrir comanda quando disponível.

## Segurança e disponibilidade
- Zero mudança destrutiva em produção sem autorização explícita.
- Branch/PR antes de merge.
- RLS, RBAC, rate limit, validação server-side, CSP/headers, logs, backups e restore testado.
- Monitoramento de saúde e alertas integrados ao padrão do Core.

## Critério de pronto
Nenhum item é verde por existir em código. Para homologação: build + lint + testes + persistência real + auth + RLS/autorização + rotas + UI + integrações + deploy + observabilidade + E2E real aplicável.

## Fases
P0: identidade do cliente, roteamento, schema operacional, PDV/comandas, estoque, cardápio vivo, conta/cliente, clube básico, CRM/eventos e segurança.
P1: reservas, eventos, KDS, jornadas n8n, BI, reputação, indicações e automações avançadas.
P2: previsão de demanda, recomendação cervejeira, otimização de compras/margem e experiências gamificadas.
