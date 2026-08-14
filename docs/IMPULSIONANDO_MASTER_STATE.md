# IMPULSIONANDO MASTER STATE

Atualizado em: 2026-08-14

## Protocolo obrigatorio de continuidade entre chats
Este arquivo existe para impedir perda de contexto quando um chat atingir o limite de tamanho.

Sempre que um novo chat do projeto Impulsionando for iniciado, o ChatGPT deve obrigatoriamente:
1. Ler este arquivo antes de qualquer alteracao.
2. Consultar o estado atual do repositorio `raygsm/impulsionando` e identificar o commit mais recente.
3. Consultar o Supabase principal `Impulsionando` (`arygtqrdpcdkwnuwsgmm`) e validar o estado real do banco.
4. Verificar workflows, deploys, integracoes e dominios antes de assumir qualquer pendencia.
5. Recuperar a memoria disponivel do projeto e cruzar com o estado real do GitHub/Supabase.
6. Nunca reiniciar o projeto do zero.
7. Nunca repetir alteracoes ja concluidas sem auditoria previa.
8. Nunca reintroduzir configuracoes antigas ou erros corrigidos.
9. Continuar exatamente do ultimo checkpoint tecnico confirmado.
10. Atualizar este arquivo sempre que houver mudanca estrutural, decisao definitiva, nova integracao, novo cliente ou novo risco relevante.

## Arquitetura definitiva
- Repositorio oficial unico do ecossistema: `raygsm/impulsionando`.
- O repositorio `raygsm/impulsionito` e legado criado por equivoco. Deve ser apenas fonte temporaria para reaproveitamento de codigo util; excluir somente apos auditoria e migracao segura.
- Impulsionito e o agente virtual master/cerebro vivo do ecossistema, nao um repositorio separado.
- Os demais agentes virtuais sao instancias especializadas do Impulsionito por cliente, com isolamento de dados, regras, conhecimento, canais e permissoes.
- Em linguagem comercial/UI usar `cliente`, `empresa` ou `cliente conectado ao Core`; `tenant` apenas em contexto tecnico.
- Nao usar Codex neste projeto.

## Infraestrutura confirmada
- GitHub conectado ao repositorio `raygsm/impulsionando`.
- Supabase principal: projeto `Impulsionando`, ref `arygtqrdpcdkwnuwsgmm`, status ACTIVE_HEALTHY, regiao us-east-2.
- GitHub Actions cobre migrations, build, deploy, E2E, DNS/VPS, n8n, seguranca e monitoramento.
- Publicacao principal ocorre em VPS/Hostinger; trafego publico atual e atendido por Traefik.
- Core responde localmente em porta 3000 e Traefik possui regra wildcard para `*.impulsionando.com.br`.
- Diagnostico de 2026-08-14 confirmou HTTP 200 no Core para Host headers: impulsionando, CHRISMED, WMP, Marocas, RioMed e Colors.
- Portanto, nao tratar Marocas/RioMed/Colors como ausencia de rota quando checagem direta da origem sem roteamento adequado retornar 404.

## Clientes prioritarios e regras fixas
### Impulsionando
- Dominio base oficial: `https://impulsionando.com.br`.
- Core centraliza CRM, billing, comunicacao, suporte, modulos, empresas, agentes, n8n e dashboards.

### CHRISMED
- Sempre escrever CHRISMED em maiusculas.
- Dominio: `https://chrismed.impulsionando.com.br`.
- Rota correta de autenticacao: `/auth`; `/alth` e legado incorreto.
- Remetente oficial: `sac@chrismed.com.br`.
- Agenda, profissionais, pacientes, especialidades, eventos, pega-agenda, teleconsulta, pagamentos, carteira, gravacoes, comunicacao e dashboards devem ser homologados ponta a ponta.
- Cadastro profissional deve carregar especialidades por profissao e permitir multiplas especialidades.

### WMP — Wagner Miller Producoes
- Dominio oficial: `https://wmp.impulsionando.com.br`.
- Agente especializado oficial: **Milito**.
- Fluxo comercial: lead -> briefing -> proposta preliminar -> aceite -> contrato -> execucao -> financeiro -> pos-evento.
- Proposta preliminar contem servico, data e preco; contrato formal somente depois do aceite.
- Equipamentos e mao de obra sao separados; todo equipamento utilizado e contabilizado como locacao.
- Por DJ: R$ 50 alimentacao + R$ 50 estacionamento; deduzir o que for fornecido diretamente pelo contratante.

### Marocas
- Grafia tecnica encontrada no repositorio: `Marocas`.
- Existem modulos para site, app, login, anfitriao, hospede, prestador, imoveis, planos, limpeza/manutencao, notificacoes e food service.

### RioMed
- Existem modulos para portal, vendedor, cotizacao, suporte, carrinho, checkout, aluguel, pacientes, IA, n8n e pos-venda.
- Preservar foco em equipamentos medicos, venda, locacao e manutencao.

### CP — Chat Privado
- Nome oficial: `CP — Chat Privado`.
- Convite exige aceite do convidado e confirmacao final do convidante.
- Nome civil nao deve ser exibido a outros usuarios; usar celular + nome fantasia/apelido.
- Retencao e exclusao sao configuraveis; exclusao definitiva exige confirmacao e e irreversivel.

## Impulsionito e agentes — estado real
- Impulsionito: ativo, role `platform_orchestrator`, rota `/api/agents/omnichannel`.
- Oliver/CHRISMED: ativo, rota `/api/agents/omnichannel`.
- Milito/WMP: cadastro corrigido em 2026-08-14 para nome `Milito` e rota `/api/agents/omnichannel`.
- A chave tecnica WMP ainda e `wmp-millito` e algumas rotas/nomes de arquivo internos usam `millito` por compatibilidade. Nao expor essa grafia ao usuario. Migracao tecnica futura deve ser coordenada para nao quebrar sessoes/ingestao.
- Front WMP teve textos visiveis corrigidos para `Milito` no componente do chat.

## n8n — estado real verificado em producao
- Inventario exportado diretamente do runtime em 2026-08-14: **31 workflows, 28 ativos**.
- Core Impulsionando possui workflows ativos para captacao, conversao, relacionamento, onboarding e Impulsionito proativo.
- CHRISMED possui `chrismedOutboxWorker01` ativo, webhook canônico `/webhook/chrismed-outbox-worker`, execution model `shared_outbox_worker`.
- O registro `communication_automations` de `outbox-processor` foi sincronizado para ACTIVE e recebeu o ID/webhook reais em 2026-08-14.
- Os demais workflows CHRISMED continuam READY/DRAFT sem webhook/ID. Nao ativa-los em massa; verificar primeiro se o evento deve ser atendido pelo worker/outbox compartilhado ou necessita orquestracao separada.
- WMP `wmp_lead_intake` esta ACTIVE no workflow `wmpLeadIntake01`.
- WMP `wmp_partner_intake` compartilha intencionalmente o mesmo workflow e webhook.
- WMP `wmp_proposal_lifecycle`, `wmp_dj_booking_lifecycle` e `wmp_post_event_relationship` permanecem READY.
- Backend WMP ja despacha `wmp.lead.received` e `wmp.partner.received`.
- Em 2026-08-14, envio real de proposta passou a despachar `wmp.proposal.sent`; enquanto o lifecycle estiver READY, o dispatcher retorna inactive e nao chama webhook inexistente.
- Existem 3 workflows inativos no runtime: duas versoes historicas duplicadas (lead-qualificado e pagamento-aprovado) e `My workflow`. Nao excluir sem validar ausencia de referencias.
- Documento `docs/n8n/PENDENCIAS.md` foi reconciliado com o estado real em 2026-08-14 e nao deve ser substituido por versoes antigas.

## Seguranca — executado e pendencias
- `.gitignore` atualizado para bloquear novos `.env` e variantes, preservando apenas arquivos `.example` seguros.
- `.env`, `.env.development` e `.env.production` antigos ainda estao rastreados. O `.env` principal contem apenas configuracao publica do Supabase; os arquivos de environment de pagamento nao devem ser removidos ate o deploy passar a injetar o token por secret, para nao quebrar checkout.
- Supabase Security Advisor mostra tabelas com RLS sem policy. Isso e deny-by-default para anon/authenticated; nao criar policy permissiva apenas para zerar advisor.
- Funcoes SECURITY DEFINER devem ser classificadas caso a caso. Muitas possuem validacao interna ou precisam ser publicas para agenda/eventos; nao revogar em massa.
- Tentativa automatizada de habilitar HaveIBeenPwned/leaked-password protection pela Management API retornou HTTP 402: recurso exige Supabase Pro ou superior. Registrar como dependencia comercial externa.
- Extensao `btree_gist` permanece no schema public; avaliar migracao somente com analise de dependencias.

## Performance — executado e pendencias
- Migration `add_wmp_fk_indexes_20260814` aplicada com sucesso, adicionando indices de cobertura das FKs operacionais WMP apontadas pelo Advisor.
- Indice duplicado `idx_wmp_conversation_messages_export` removido, preservando `idx_communication_conversation_messages_thread`.
- Advisor deixou de apontar FKs WMP sem indice e indice duplicado.
- Permanecem warnings de RLS initplan e policies permissivas duplicadas. Otimizar preservando exatamente as regras de acesso.
- Nao remover indices apenas porque aparecem como `unused` enquanto a plataforma entra em producao.

## GitHub e legado
- Repositorio ainda contem `.lovable` e dependencias Lovable; auditar antes de remover.
- Deploy atual injeta secrets do Supabase via GitHub Secrets, mas nao injeta o token client-side de pagamento; por isso os environments rastreados ainda nao podem ser simplesmente apagados.
- Nunca expor valores de secrets em documentacao, commits ou chat.
- Workflows diagnosticos criados em 2026-08-14 sao somente leitura: `diagnose-tenant-origins.yml` e `diagnose-n8n-registry.yml`.

## Commits relevantes desta execucao
- `a28557b921e59cc84d39e64f5792251a301e7db7` — endurecimento do `.gitignore`.
- `5c4a307d69fd974564fbc59d99299064fa0345d7` — diagnostico read-only de origem/Traefik/VPS.
- `9573a72e92209e9b13670adb42bbb45955d2d73f` — diagnostico read-only do n8n.
- `886deabbf1f9f84118f55868e095e34526ae33f5` — WMP passa a despachar evento de proposta enviada.
- `0ed821be455d22ebd3e88884ddea359851f7c1a7` — nome visivel Milito corrigido no chat WMP.
- `58fcf91ef90d4fc314b39449220b76c492c054d7` — documentacao n8n reconciliada.

## Proximos blocos — continuar daqui
1. Validar CI/deploy dos commits de codigo WMP acima e smoke test do front publicado.
2. Auditar todos os pontos transacionais WMP para proposta aceita/assinada/ganha, DJ lifecycle e pos-evento antes de ativar workflows n8n.
3. Auditar CHRISMED evento por evento para separar `outbox compartilhado` de `workflow n8n dedicado`; ativar somente automacoes reais.
4. Resolver injecao segura do token client-side de pagamento no build via secret/config e somente depois remover `.env.production/.env.development` rastreados.
5. Otimizar RLS initplan/policies permissivas sem alterar isolamento por empresa.
6. Inventariar e migrar conteudo util do repo legado `raygsm/impulsionito`; excluir apenas depois de comprovada consolidacao.
7. Continuar homologacao funcional de dashboards/rotas de Marocas, RioMed, CHRISMED, WMP e Core.

## Definicao de pronto
Nenhum recurso e considerado pronto apenas porque arquivo/tabela existe. Exigir, quando aplicavel: build + lint + testes + persistencia real + auth/autorizacao + RLS + rotas + botoes + comunicacao + deploy + monitoramento.

## Regra operacional
- Nao usar Codex.
- Nao refazer trabalho concluido.
- Nao declarar 100% sem evidencia.
- Quando houver ferramenta conectada para corrigir, corrigir e testar.
- Quando faltar acesso externo, registrar a dependencia com precisao e continuar tudo que puder ser executado de forma independente.
