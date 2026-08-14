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
- O repositorio `raygsm/impulsionito` e legado criado por equivoco e deve ser apenas fonte temporaria de reaproveitamento de codigo util. So pode ser excluido depois de auditoria e migracao segura do que ainda for valido.
- Impulsionito e o agente virtual master/cerebro vivo do ecossistema, nao um repositorio separado.
- Os demais agentes virtuais sao instancias especializadas do Impulsionito por cliente, com isolamento de dados, regras, conhecimento, canais e permissoes.
- Em linguagem comercial/UI usar `cliente`, `empresa` ou `cliente conectado ao Core`; `tenant` apenas em contexto tecnico.

## Infraestrutura confirmada
- GitHub conectado ao repositorio `raygsm/impulsionando`.
- Supabase principal: projeto `Impulsionando`, ref `arygtqrdpcdkwnuwsgmm`, status ACTIVE_HEALTHY, regiao us-east-2.
- Existem GitHub Actions para migrations, build, deploy, E2E, DNS/VPS, n8n e monitoramento.
- Commit de referencia auditado em 2026-08-14: `92f91686f905ff2462e2f0612b35fb1950967974`.
- Publish Gate deste commit: sucesso.
- Post-deploy monitor CHRISMED neste commit: sucesso.

## Clientes prioritarios e regras fixas
### Impulsionando
- Dominio base oficial: https://impulsionando.com.br
- Core centraliza CRM, billing, comunicacao, suporte, modulos, empresas, agentes, n8n e dashboards.

### CHRISMED
- Sempre escrever CHRISMED em maiusculas.
- Dominio: https://chrismed.impulsionando.com.br
- Rota correta de autenticacao: `/auth`; `/alth` e legado incorreto.
- Remetente oficial: `sac@chrismed.com.br`.
- Agenda, profissionais, pacientes, especialidades, eventos, pega-agenda, teleconsulta, pagamentos, carteira, gravacoes, comunicacao e dashboards devem ser homologados ponta a ponta.
- Cadastro profissional deve carregar especialidades por profissao e permitir multiplas especialidades.

### WMP — Wagner Miller Producoes
- Dominio oficial: https://wmp.impulsionando.com.br
- Agente especializado: Milito.
- Fluxo comercial: lead -> briefing -> proposta preliminar -> aceite -> contrato -> execucao -> financeiro -> pos-evento.
- Proposta preliminar contem servico, data e preco. Contrato formal somente depois do aceite.
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

## Impulsionito e agentes
- Impulsionito e o agente master do Core.
- Instancias conhecidas incluem Milito, Oliver, Iris e outras atuais/futuras.
- Conversas relevantes devem alimentar CRM.
- Handoff humano deve preservar contexto e historico.

## Estado do n8n confirmado
- Diversos workflows Impulsionando estao ACTIVE e possuem `n8n_workflow_id` para captacao, conversao, relacionamento e Impulsionito proativo.
- CHRISMED `chrismed.outbox.processor` esta ACTIVE com `n8n_workflow_id=chrismedOutboxWorker01`.
- Diversos workflows CHRISMED continuam `READY` sem `n8n_workflow_id`; nao considerar concluidos.
- WMP `wmp_lead_intake` e `wmp_partner_intake` estao ACTIVE; outros ciclos WMP continuam READY.

## Seguranca — pendencias reais confirmadas
- Supabase Security Advisor aponta tabelas com RLS habilitado e sem policy; validar caso a caso antes de criar qualquer policy, pois RLS sem policy bloqueia anon/authenticated por padrao.
- Advisor aponta funcoes SECURITY DEFINER expostas. Algumas possuem verificacao interna de auth/role e outras sao intencionalmente publicas; classificar antes de revogar para nao quebrar agenda, eventos ou fluxos legitimos.
- Leaked Password Protection do Supabase Auth esta desabilitada.
- Extensao `btree_gist` esta no schema public e precisa avaliacao cuidadosa antes de mover.

## Performance — pendencias reais confirmadas
- Existem FKs WMP sem indices de cobertura.
- Existem policies RLS com auth.* reevaluado por linha.
- Existem policies permissivas duplicadas.
- Existe indice duplicado em `communication_conversation_messages`.
- Nao remover indices apenas por estarem `unused` durante entrada em producao.

## GitHub e legado
- O repositorio ainda contem dependencias e estruturas Lovable; auditar antes de remover.
- O `.gitignore` deve bloquear `.env` e variantes, preservando apenas exemplos seguros.
- Nunca expor valores de secrets em documentacao, commits ou chat.

## Definicao de pronto
Nenhum recurso e considerado pronto apenas porque o arquivo ou tabela existe. Exigir, quando aplicavel: build + lint + testes + persistencia real + auth/autorizacao + RLS + rotas + botoes + comunicacao + deploy + monitoramento.

## Ordem permanente de execucao
1. Seguranca e fonte unica de codigo.
2. Core Impulsionando e Impulsionito.
3. CHRISMED.
4. WMP.
5. Marocas.
6. RioMed.
7. CP e demais clientes encontrados.
8. Mensageria, templates, n8n e CRM transversal.
9. Infraestrutura, DNS, SSL, hosting/VPS/Cloudflare.
10. E2E, smoke, homologacao e relatorio final.

## Regra operacional
- Nao usar Codex.
- Nao refazer trabalho concluido.
- Nao declarar 100% sem evidencia.
- Quando houver ferramenta conectada para corrigir, corrigir e testar.
- Quando faltar acesso externo, registrar a dependencia com precisao e continuar tudo que puder ser executado de forma independente.
