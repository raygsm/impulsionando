# ANA MADU — FILA DE PRODUCAO IMPULSIONANDO FULL

Status: QUEUED — nao iniciar antes da conclusao da fila tecnica atual e do bloco Colors, conforme priorizacao do usuario em 2026-08-15.

## Identidade e canais confirmados
- Cliente: Ana Madu
- Site atual: https://www.anamadu.com.br/
- WhatsApp: +55 21 96631-5945
- Instagram: https://www.instagram.com/anamadu_acessorios
- Facebook identificado pelo icone do site: https://www.facebook.com/anamaduacessorios
- Segmento: acessorios/joias artesanais com pedras naturais.

## Nova arquitetura comercial
Duas linhas independentes, com catalogo, jornada, precificacao, atendimento e indicadores separados:
1. Tradicional — evolucao da linha atual de pedras naturais e pecas prontas.
2. Ourives — linha premium personalizada com pedras raras, curadoria, projeto sob medida e atendimento consultivo.

## Anita — agente virtual Ana Madu
- Nome oficial: Anita.
- Instancia especializada do Impulsionito; Impulsionito continua sendo o cerebro/orquestrador master.
- Omnichannel: chat/site, WhatsApp, Instagram e Facebook.
- Perfil: vendedora consultiva, atendente, especialista em gemas/pedras, joias e experiencia premium.
- Deve registrar protocolo, lead, historico, contexto e continuidade entre canais.
- Tradicional: descoberta, recomendacao, estoque, venda, pos-venda, cross-sell e recompra.
- Ourives: explicar origem, raridade, historia, dificuldade de obtencao, custo relativo e cuidados; mostrar imagens/referencias permitidas de pedras e de tipos de pecas; ajudar o lead a estruturar briefing visual e preferencias para acelerar o orcamento humano.
- Nunca inventar procedencia, autenticidade, certificado, disponibilidade, preco ou propriedade gemologica nao cadastrada/validada.

## Experiencia Ourives
- Fluxo consultivo com mensagens + imagens + briefing estruturado.
- Conversao de lead para cliente ocorre apos pagamento da entrega inicial de atendimento premium.
- Valor inicial: R$ 500,00, editavel no Dashboard Ana Madu.
- Pagamento antecipado obrigatorio antes da sessao online.
- Agenda exclusiva para clientes Ourives/premium.
- Sessao online dentro do modulo de atendimento Impulsionando, seguindo o mesmo principio de sessao segura/gravavel das teleconsultas, adaptado ao contexto comercial.
- Registrar consentimento, participantes, data/hora, transcricao/conversa quando permitido, arquivos/imagens, decisoes, orcamento posterior e trilha de auditoria.
- Politica de gravacao deve ser explicita e exigir aceite antes do inicio.

## Area exclusiva do cliente
- Login/conta.
- Perfil e preferencias.
- Historico de compras e pedidos.
- Notas fiscais disponiveis para download/consulta; emissao automatizada apos evento fiscal aplicavel e integracao real com emissor fiscal.
- Pagamentos, reembolsos/ajustes quando aplicavel.
- Favoritos e wishlist.
- Pedidos Tradicional.
- Projetos Ourives com status, briefing, imagens, propostas, aprovacoes e cronologia.
- Agenda e sessoes premium Ourives.
- Conversas/protocolos da Anita e atendimento humano conforme politica de retencao/LGPD.
- Comunicacoes e preferencias de consentimento.

## Plano Full — modulos obrigatorios
Aplicar o conjunto Full Impulsionando sem criar modulos paralelos quando o Core ja possuir equivalente:
- CRM e contatos Core.
- Captacao, conversao, relacionamento, retencao, recompra e win-back.
- Segmentacao Tradicional vs Ourives.
- Omnichannel e handoff humano.
- Catalogo/estoque.
- Checkout/pagamentos somente quando gateway estiver homologado.
- NF por integracao fiscal real.
- Cupons/campanhas quando aprovados.
- Carrinho abandonado.
- Pos-venda/NPS/CSAT.
- Agenda e atendimento online premium.
- Arquivos/imagens seguros.
- Dashboard comercial, funil, CAC/LTV, ticket medio, recompra, origem, conversao por canal/agente, SLA e receita por linha.
- Auditoria, logs, permissoes e RLS.
- Templates e jornadas automatizadas via infraestrutura Core/n8n existente.

## Frontend — direcao criativa
Criar frontend extraordinario, premium e correlacionado ao universo de pedras naturais e joalheria autoral.
- Home com bifurcacao editorial clara: Tradicional | Ourives.
- Tradicional: descoberta visual, colecoes, categorias e compra rapida.
- Ourives: narrativa de exclusividade, pedras raras, processo de curadoria, exemplos de aplicacao, briefing assistido pela Anita e CTA para iniciar projeto.
- Estetica sofisticada, organica, mineral, editorial e artesanal, sem perder usabilidade/e-commerce.
- Mobile-first, alta performance, acessibilidade e SEO tecnico.
- Imagens e conteudos nunca devem afirmar caracteristicas gemologicas sem fonte/cadastro valido.

## Backends previstos
- company/tenant Ana Madu no Core.
- agent Anita em communication_agents e configuracao omnichannel.
- catalogo de produtos e variantes com linha Tradicional/Ourives.
- catalogo de pedras/gemas com origem, classificacao, raridade, propriedades documentadas, imagens, disponibilidade e custo de aquisicao.
- projetos Ourives/briefings/itens/imagens/propostas/aprovacoes.
- agenda premium/slots/sessoes/consentimentos/gravacoes.
- configuracao editavel do fee inicial (default R$ 500,00).
- pagamentos e webhooks via gateway homologado.
- pedidos, fiscal/NF, estoque, reservas e trilha de auditoria.
- RLS por company_id e papeis de gestao/cliente.

## Vitrine / Clube Impulsionando
Quando Ana Madu e os demais clientes estiverem homologados, inclui-los na vitrine Impulsionando:
- Exibicao publica basica: nome, segmento e dados de contato autorizados.
- Recursos avancados (estoque em tempo real, consulta por CEP, disponibilidade, ofertas e demais dados vivos) apenas para empresas efetivamente cadastradas/participantes do Clube e conforme permissoes.
- CTA forte para adesao ao Clube nas modalidades gratuita e paga, sem prometer funcionalidade que ainda nao esteja ativa.

## Criterios de pronto
Nao declarar 100% apenas por existir front ou tabela. Exigir: build/lint/testes, banco/persistencia, auth, RLS/permissoes, integracoes, jornadas, templates, pagamentos homologados quando aplicavel, NF real, omnichannel real, deploy, monitoramento e E2E.

## Ordem
Manter em fila. A execucao atual do ecossistema Impulsionando nao deve ser interrompida por este cliente. Colors permanece no fim da fila atual conforme instrucao anterior; Ana Madu inicia somente quando sua posicao for liberada explicitamente pelo checkpoint/priorizacao vigente.