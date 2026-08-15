# IMPULSIONANDO MASTER STATE

Atualizado em: 2026-08-15

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

## Regra definitiva de consolidacao de dados — selection first
- Regra transversal do ecossistema: dados mestres, classificaveis ou relacionais devem ser escolhidos em listas pesquisaveis/canonicas; texto livre e excecao.
- Objetivo de UX/dados: 99% ou mais dos campos classificaveis por selecao, autocomplete estruturado, relacao ou preenchimento automatico.
- Texto livre deve ficar restrito ao que e intrinsecamente individual: nome, numero/complemento, observacao, descricao, bio, mensagem e excecoes justificadas.
- CEP e sempre a primeira pergunta dentro do bloco de endereco brasileiro. O Core deve preencher logradouro, bairro, municipio, UF e codigo IBGE quando a fonte retornar os dados.
- Frontends nao devem consultar ViaCEP ou IBGE diretamente. Provedores externos ficam mediados pelo Core.
- UF usa referencia canonica; municipio usa codigo IBGE. Bairro nao possui uma lista oficial nacional unica equivalente aos municipios: o Core usa CEP como fonte primaria e mantem `core_localities` para aprender/normalizar bairros validados, evitando falsa precisao.
- CPF/CNPJ brasileiros devem ser validados no Core e no backend/banco, nunca apenas por mascara/front.
- CNPJ suporta o formato atual alfanumerico da Receita Federal: 12 posicoes alfanumericas + 2 DVs numericos, alem do legado numerico.
- `reference_option_sets` + `reference_options` sao a fonte central de listas; nao criar tabelas paralelas sem necessidade de dominio relacional proprio.

## Selection-first — estado implementado em 2026-08-15
- `src/lib/validators.ts` centraliza CPF, CNPJ, CEP e mascaras. WMP fiscal delega ao Core.
- Rotas Core criadas/ativas em codigo:
  - `/api/public/cep/$cep` — consulta server-side e normaliza endereco; alimenta `core_localities`.
  - `/api/public/municipios/$uf` — consulta server-side da lista oficial de municipios/IBGE.
  - `/api/public/referencias/$key` — expõe apenas conjuntos de referencia publicos permitidos.
- Migration live `20260815102844 core_selection_first_master_data_20260815`:
  - funcoes `core_is_valid_cpf`, `core_is_valid_cnpj`, normalizacao CNPJ;
  - `core_localities`;
  - 27 UFs canonicas;
  - tipos de documento PF/PJ;
  - 48 categorias canonicas de equipamento WMP.
- Migration live `20260815104305 core_fiscal_document_integrity_20260815`:
  - `core_is_valid_br_document`;
  - integridade de CNPJ em `companies` quando `document_type=CNPJ`;
  - integridade CPF/CNPJ em `wmp_briefings` conforme `contratante_tipo_documento`;
  - integridade de CNPJ em `chrismed_occupational_intakes` quando aplicavel;
  - documentos estrangeiros continuam suportados por tipo explicito.
- Auditoria antes do endurecimento: o unico `companies.document` preenchido era CNPJ valido; WMP briefing e CHRISMED ocupacional nao tinham documentos gravados.

## WMP — selection-first implementado
- Migration live `20260815103201 wmp_equipment_reference_integrity_20260815`:
  - `manufacturer_id` e `model_id` relacionais em `wmp_equipment_catalog`;
  - fila `wmp_equipment_reference_requests` para excecao controlada quando fabricante/modelo ainda nao existe;
  - base inicial ampla de fabricantes profissionais AV. Nao afirmar que todos os fabricantes/modelos do mundo estao carregados; a arquitetura permite expansao continua sem poluir dados mestres.
- Migration live `20260815103354 wmp_briefing_canonical_municipality_20260815`: `evento_municipio_ibge`.
- Migration live `20260815103443 wmp_reference_taxonomy_expansion_20260815`: `wmp_event_types` e `wmp_partner_categories`.
- Migration live `20260815103603 wmp_partner_canonical_municipality_20260815`: `municipio_ibge` no parceiro.
- Todas as cinco migrations de selection-first/fiscal acima estao rastreadas no GitHub com suas versoes reais do banco.
- `src/lib/wmp/equipment.functions.ts` valida categoria, fabricante e modelo contra catalogos e grava IDs relacionais; ausencia de referencia vai para fila de curadoria.
- `src/components/wmp/WmpOrcamentoForm.tsx`: endereco CEP-first, municipio por IBGE, UF/cidade consolidados.
- `src/routes/wmp.parceiro.cadastro.tsx`: categoria, UF e municipio por listas Core; cidade nao e mais texto livre.
- `src/lib/wmp.functions.ts`: backend valida evento/UF/municipio/CEP e normaliza alias legado `outro` para `outro_curado` antes de persistir.
- Pendencia: retirar a lista hardcoded de tipos de evento do front WMP e consumir `wmp_event_types` dinamicamente. O backend ja garante dado canonico.

## Outros fronts migrados para CEP Core
- `src/routes/quero-comecar.tsx`: ViaCEP direto removido; guarda codigo IBGE quando disponivel.
- `src/routes/chrismed.domiciliar.tsx`: CEP-first; UF/municipio automaticos; numero/complemento continuam livres; bairro/logradouro so editaveis quando a fonte nao retorna.
- `src/components/colors/PreCheckoutModal.tsx`: CEP Core; cidade/UF bloqueadas para digitacao; logradouro/bairro somente excecao; bloco de endereco com CEP primeiro.
- `src/lib/colors-checkout.functions.ts`: CPF opcional, quando presente, agora e validado pelo Core antes de hash/persistencia.
- `src/routes/_authenticated/talentos.cadastro.tsx` ainda requer migracao: ViaCEP direto e varios campos classificaveis ainda sao texto livre (cargo, curso, instituicao, habilidades, idiomas). Nao reescrever a tela sem preservar funcionalidades; criar/usar catalogos canonicos antes da troca.

## Infraestrutura confirmada
- GitHub conectado ao repositorio `raygsm/impulsionando`.
- Supabase principal: projeto `Impulsionando`, ref `arygtqrdpcdkwnuwsgmm`, regiao us-east-2.
- Plano Supabase PRO confirmado; HIBP/leaked-password protection habilitado posteriormente e warning removido.
- GitHub Actions cobre migrations, build, deploy, E2E, DNS/VPS, n8n, seguranca e monitoramento.
- Publicacao principal ocorre em VPS/Hostinger; trafego publico atual e atendido por Traefik.
- Core responde localmente em porta 3000 e Traefik possui regra wildcard para `*.impulsionando.com.br`.
- Diagnostico anterior confirmou HTTP 200 no Core para Host headers: Impulsionando, CHRISMED, WMP, Marocas, RioMed e Colors.
- Nao tratar Marocas/RioMed/Colors como ausencia de rota quando checagem direta da origem sem roteamento adequado retornar 404.

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
- Dra. Christiane Alencar e medica e gestora. Politica de comunicacao de gestao: primaria `sac@chrismed.com.br`, copia gerencial `chrissalencar@yahoo.com.br`; conteudo clinico sensivel usa modo `metadata_only` na copia gerencial.
- Worker `chrismed-communication-worker` v3 foi implantado com esta politica; falta homologacao controlada de recebimento end-to-end sem PII.

### WMP — Wagner Miller Producoes
- Dominio oficial: `https://wmp.impulsionando.com.br`.
- Agente especializado oficial: **Milito**.
- Fluxo comercial: lead -> briefing -> proposta preliminar -> aceite -> contrato -> execucao -> financeiro -> pos-evento.
- Proposta preliminar contem servico, data e preco; contrato formal somente depois do aceite.
- Equipamentos e mao de obra sao separados; todo equipamento utilizado e contabilizado como locacao.
- Por DJ: R$ 50 alimentacao + R$ 50 estacionamento; deduzir o que for fornecido diretamente pelo contratante.

### Marocas
- Existem modulos para site, app, login, anfitriao, hospede, prestador, imoveis, planos, limpeza/manutencao, notificacoes e food service.
- Reconciliacao de identidade/agent ainda pendente; nao inventar marca/agente.

### RioMed
- Existem modulos para portal, vendedor, cotizacao, suporte, carrinho, checkout, aluguel, pacientes, IA, n8n e pos-venda.
- Preservar foco em equipamentos medicos, venda, locacao e manutencao.
- Backend legado ainda precisa trocar dependencias de `companies.subdomain` pela identidade Core.

### CP — Chat Privado
- Nome oficial: `CP — Chat Privado`.
- Convite exige aceite do convidado e confirmacao final do convidante.
- Nome civil nao deve ser exibido a outros usuarios; usar celular + nome fantasia/apelido.
- Retencao e exclusao sao configuraveis; exclusao definitiva exige confirmacao e e irreversivel.

## Impulsionito e agentes — estado real
- Impulsionito: ativo, role `platform_orchestrator`.
- Oliver/CHRISMED: ativo.
- Milito/WMP: ativo; grafia visivel oficial `Milito`.
- A chave tecnica WMP ainda pode usar `wmp-millito`/arquivos `millito` por compatibilidade. Nao expor essa grafia ao usuario.
- Universal conversation protocol/export existe no banco (`20260815023718`), mas rotas server ainda precisam ser migradas integralmente para remover acoplamento WMP-only.

## n8n — estado consolidado anterior
- Inventario exportado do runtime em 2026-08-14: 31 workflows, 28 ativos.
- Core possui workflows ativos para captacao, conversao, relacionamento, onboarding e Impulsionito proativo.
- CHRISMED possui worker/outbox compartilhado ativo; nao ativar workflows duplicados em massa.
- WMP `wmp_lead_intake` ativo; partner intake compartilha intencionalmente o mesmo workflow.
- WMP proposal/DJ/post-event lifecycle permanecem READY ate homologacao de eventos transacionais reais.

## Pagamentos — bloqueio conhecido
- `mpago-create-payment` e `mpago-webhook` estao implantados, mas `mpago_credentials` e `vault.secrets` estavam vazios na ultima auditoria.
- RPC de configuracao de credenciais foi restaurada, mas isso nao restaura os segredos brutos antigos.
- Nao declarar Mercado Pago/checkout CHRISMED ou Core homologado ate credenciais serem restauradas por canal seguro e PIX/webhook serem testados ponta a ponta.
- Nunca pedir segredos para serem colados no chat.

## Seguranca — estado
- `.gitignore` bloqueia novos `.env`; arquivos antigos rastreados ainda precisam de migracao segura de secrets antes de remover.
- RLS sem policy em tabelas internas pode ser deny-by-default; nao criar policy permissiva so para zerar advisor.
- SECURITY DEFINER deve ser auditada funcao a funcao.
- `btree_gist` no schema public permanece pendente de analise de dependencia.
- HIBP/leaked-password protection esta habilitado no Supabase Pro.

## Riscos/pendencias estruturais ainda abertos
- `support-pro.functions.ts` usa contrato antigo de `support_tickets`; reconciliar com colunas atuais (`ticket_code`, `category`, `source_channel`, etc.).
- Billing plans: front Essencial/Ideal/Full e live `billing_plans` ESSENCIAL/PRO/ENTERPRISE/WHITE_LABEL ainda divergem; nao declarar billing/recorrencia funcional.
- `omnichannel.server.ts` ainda precisa usar a tabela/funcoes universais de conversation ticket/export em todos os agentes.
- RioMed ainda possui dependencia legada de `companies.subdomain`.
- Marocas/RioMed precisam de reconciliacao front-back e selection-first especifica.
- Public site deve remover qualquer afirmacao de `dados hospedados no Brasil` enquanto o Supabase estiver em us-east-2.
- Talentos precisa de catalogo de ocupacoes/idiomas/formacao e CEP Core.
- Catalogo WMP de modelos precisa enriquecimento continuo/curado; nao aceitar texto livre na tabela principal.

## GitHub / CI — atencao
- O conector GitHub apresentou leitura inconsistente/cacheada do HEAD do `main`: `fetch_file` mostra conteudo novo no branch, enquanto endpoint `/commits/main` ainda retornou `7ac5e32...` durante esta execucao.
- Nao mover `main` manualmente/force enquanto essa inconsistencia nao for resolvida.
- Tests Gate/DNS vistos para commit antigo nao homologam os commits novos deste checkpoint.
- Antes de declarar deploy/homologacao, revalidar Actions/HEAD e smoke test do front publicado.

## Definicao de pronto
Nenhum recurso e considerado pronto apenas porque arquivo/tabela existe. Exigir, quando aplicavel: build + lint + testes + persistencia real + auth/autorizacao + RLS + rotas + botoes + comunicacao + deploy + monitoramento.

## Proximo checkpoint — continuar daqui
1. Confirmar GitHub HEAD/Actions para o conteudo atual sem force update de branch.
2. WMP: trocar lista visual hardcoded de tipo de evento pelo endpoint Core `wmp_event_types`.
3. Talentos: criar catalogos canonicos e migrar CEP/cargo/idiomas/formacao sem perder upload/IA/curriculo.
4. Nova varredura de ViaCEP/IBGE direto e de CPF/CNPJ/documentos em front/server/banco.
5. Reconciliar support contract e universal conversation protocol.
6. Continuar selection-first para CHRISMED, Impulsionando, Marocas e RioMed.
7. Homologar cada bloco no front publicado; manter porcentagem de implementacao separada da homologacao.

## Regra operacional
- Nao usar Codex.
- Nao refazer trabalho concluido.
- Nao declarar 100% sem evidencia.
- Quando houver ferramenta conectada para corrigir, corrigir e testar.
- Quando faltar acesso externo, registrar a dependencia com precisao e continuar tudo que puder ser executado de forma independente.
