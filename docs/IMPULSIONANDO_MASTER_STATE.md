# IMPULSIONANDO MASTER STATE

Atualizado em: 2026-08-15

## Protocolo obrigatorio de continuidade
Este arquivo e a fonte persistente de continuidade entre chats do projeto Impulsionando.
Ao receber `Continue`, `Siga`, `Retome` ou `Continuidade Impulsionando`:
1. Ler este arquivo.
2. Validar o HEAD real de `raygsm/impulsionando`.
3. Validar Supabase principal `arygtqrdpcdkwnuwsgmm` e migrations live.
4. Validar Actions/deploys/integracoes antes de assumir que algo esta homologado.
5. Nunca reiniciar o projeto, refazer trabalho pronto ou reintroduzir legado sem auditoria.
6. Atualizar este arquivo apos mudanca estrutural relevante.
7. Nao usar Codex.

## Arquitetura definitiva
- Repositorio oficial unico: `raygsm/impulsionando`.
- `raygsm/impulsionito` e repositorio legado criado por equivoco; apenas fonte temporaria de codigo util ate migracao/auditoria segura.
- Impulsionito e o agente virtual master/orquestrador do ecossistema, nao um repositorio.
- Agentes especializados atuais: Oliver/CHRISMED e Milito/WMP. Grafia visivel oficial: **Milito**.
- Linguagem comercial/UI: cliente, empresa ou cliente conectado ao Core; `tenant` apenas tecnico.
- Dominio base: `impulsionando.com.br`.

## Regra transversal — selection first
- Dados mestres/classificaveis/relacionais devem ser selecionados de catalogos canonicos pesquisaveis. Texto livre e excecao.
- Objetivo: >=99% dos campos classificaveis por select/autocomplete/relacao/preenchimento automatico.
- CEP e a primeira pergunta de endereco brasileiro; Core preenche logradouro, bairro, municipio, UF e codigo IBGE quando disponivel.
- Front nao consulta ViaCEP/IBGE diretamente; provedores externos ficam mediados pelo Core.
- UF canonica; municipio por IBGE. Bairro/logradouro sao aprendidos/normalizados por CEP; nao inventar uma lista nacional oficial de bairros.
- CPF/CNPJ brasileiros sao validados no Core e backend/banco. CNPJ suporta base alfanumerica de 12 posicoes + 2 DVs numericos e legado numerico.
- Validacao matematica de CPF/CNPJ nao equivale a consulta de situacao cadastral ativa na Receita.
- `reference_option_sets` + `reference_options` sao fonte central para listas simples.

## Core selection-first implementado
- `src/lib/validators.ts`: CPF, CNPJ, CEP e mascaras centralizados; `lookupCEP()` usa Core.
- `/api/public/cep/$cep`: consulta server-side e alimenta `core_localities`.
- `/api/public/municipios/$uf`: municipios oficiais/IBGE via servidor.
- `/api/public/reference-options/$key`: expoe apenas conjuntos publicos permitidos.
- Migration live `20260815102844 core_selection_first_master_data_20260815`.
- Migration live `20260815104305 core_fiscal_document_integrity_20260815`.
- 27 UFs, tipos de documentos, categorias de equipamentos WMP e validadores fiscais rastreados no GitHub.

## WMP — selection-first e integridade
- `20260815103201 wmp_equipment_reference_integrity_20260815`: fabricante/modelo relacionais, fila de excecao curada e base inicial de 62 fabricantes profissionais. Nao afirmar cobertura estatica de todos os modelos/fabricantes do mundo.
- `20260815103354 wmp_briefing_canonical_municipality_20260815`: municipio IBGE no briefing.
- `20260815103443 wmp_reference_taxonomy_expansion_20260815`: tipos de evento e categorias de parceiros canonicos.
- `20260815103603 wmp_partner_canonical_municipality_20260815`: municipio IBGE no parceiro.
- `20260815111354 wmp_partner_category_reference_integrity_20260815`: remove CHECK estatico legado de `wmp_parceiros.categoria`; trigger valida contra taxonomia ativa do Core. Os 5 registros existentes eram `dj`.
- `src/lib/wmp/equipment.functions.ts`: valida categoria/fabricante/modelo e usa fila de curadoria para excecoes.
- `WmpOrcamentoForm`: CEP-first + municipio IBGE. PENDENTE: retirar tipos de evento e UF hardcoded do front e carregar via reference-options.
- Cadastro de parceiro WMP ja usa categoria, UF e municipio dinamicos do Core.
- Catalogo de modelos continua por enriquecimento curado; nao aceitar texto livre na tabela principal.

## Talentos — restauracao real do backend e contexto empresarial
### Front candidato
- `src/routes/_authenticated/talentos.cadastro.tsx` migrou de ViaCEP direto para `lookupCEP()` do Core no commit `475626ab3a23e2bfceece203d1a9cc092c5dfd57`.
- Cadastro agora exige e envia `municipio_ibge` junto com cidade/UF.
- Ainda pendente selection-first completo para cargo/CBO, idiomas, formacao, instituicoes e habilidades.

### Backend live
Foi detectado em 2026-08-15 que o Supabase atual NAO possuia as tabelas `talentos_*`, embora houvesse migration historica antiga misturada com Educacao. A migration antiga nao foi reaplicada.

Restauracao limpa aplicada:
- `20260815111041 talentos_backend_restore_selection_first_20260815`
- cria `talentos_candidatos`, `talentos_curriculos`, `talentos_company_settings`, `talentos_vagas`, `talentos_matches`;
- RLS ativo;
- candidato com CEP/UF/cidade/municipio IBGE canonico;
- vagas com municipio IBGE;
- pipeline suporta `novo`, `favorito`, `entrevista`, `contratado`, `banco` e compatibilidade com `descartado` legado;
- `contratado_em` e `desligado_em` presentes.
GitHub: commit `2286cc528d0f99fd8992c60b4a928d3eb39554be`.

### Empresa canonica
- Migration live `20260815111258 current_company_resolver_and_talentos_rls_20260815`.
- `current_user_company_id()` resolve empresa por `user_roles`, `communication_tenant_members -> communication_tenants.company_id`, ou empresa master para staff/superadmin.
- Nunca usar `auth.uid()` como `company_id`.
- RLS de Talentos usa `user_belongs_to_company()` e candidato visivel exige contexto empresarial valido.
- GitHub migration commit `ac69da971f607ad5d5940ed6152d32ef2e4e2f3a`.
- Helper front `src/lib/current-company.ts`, commit `e08ef14046e7a5a8eed92cc81baabee1be0c3222`.

### Acoes empresariais
- Migration live `20260815111459 talentos_company_actions_20260815`.
- RPC `talentos_favorite_candidate(uuid)` resolve empresa no servidor e faz favorito atomico sem receber `company_id` do browser.
- GitHub migration commit `d97c0c10d6b4b2f02d976c391bfa4f17936e2ad7`.

### Telas empresariais corrigidas
- Dashboard: contexto empresarial canonico, commit `324ad86459ef3891cb5bc5a897d8a3876a5cdef8`.
- Pipeline candidatos: contexto empresarial canonico, commit `1ec5f008a2ec0f56064bdb46988c0a13fed00d7d`.
- Busca/favoritos: remove `companies.owner_id/niche` obsoletos e usa RPC de favorito, commit `3430c8d5c1232eaad0efbe758e77c5024ff3fa14`.
- Configuracao de rede: contexto empresarial canonico, commit `ff80476b3c37bddf29d3ff9680b7b060fce4feec`.
- PENDENTE: cidades/bairros da configuracao de rede ainda sao texto separado por virgula; migrar para UF/municipio IBGE e bairro aprendido pelo Core.

## Outros fronts ja migrados para CEP Core
- `quero-comecar.tsx`.
- `chrismed.domiciliar.tsx`.
- `Colors PreCheckoutModal.tsx`.
- Colors valida CPF opcional no Core. PENDENTE: persistir municipio IBGE no contrato/tabela Colors se mantido no escopo.

## Infraestrutura confirmada
- Supabase principal: `arygtqrdpcdkwnuwsgmm`, us-east-2, Postgres 17.6.1.155, plano PRO.
- HIBP/leaked-password protection habilitado.
- Publicacao principal em VPS/Hostinger com Traefik.
- GitHub Actions cobre build, deploy, migrations, seguranca, E2E, DNS/VPS e monitoramento.
- Em 2026-08-15 o HEAD voltou a responder consistentemente: `ff80476b3c37bddf29d3ff9680b7b060fce4feec` antes deste update de estado.
- Para esse HEAD foram disparados 11 workflows; Build Core Docker Image e monitor pos-deploy estavam `in_progress` na ultima verificacao. Nao considerar homologado ate conclusao.

## CHRISMED
- Dominio: `https://chrismed.impulsionando.com.br`.
- Auth correta `/auth`; `/alth` e legado incorreto.
- Remetente oficial `sac@chrismed.com.br`.
- Agenda, pacientes, profissionais, especialidades, eventos, pega-agenda, teleconsulta, carteira, gravacoes e comunicacoes existem em estagios avancados, mas nao declarar 100% sem E2E.
- Politica de copia gerencial esta implantada no worker; conteudo clinico sensivel usa `metadata_only`. Falta homologacao controlada de recebimento sem PII.
- Evento cientifico real oficial ainda nao foi criado; apenas homologacao controlada.

## Impulsionito / conversas
- Impulsionito: master/orquestrador ativo.
- Oliver: CHRISMED.
- Milito: WMP.
- Universal conversation protocol/export existe no banco (`20260815023718`).
- PENDENTE: migrar integralmente `src/lib/agents/omnichannel.server.ts` e demais rotas para `communication_conversation_tickets`/export universal, removendo acoplamento WMP-only.
- PENDENTE: revisar texto visivel `Millito` em `/api/wmp/millito/chat.ts`; manter apenas chaves tecnicas legadas quando necessario.

## n8n
- Inventario anterior: 31 workflows, 28 ativos em 2026-08-14.
- Core possui captacao, conversao, relacionamento, onboarding e Impulsionito proativo.
- CHRISMED usa worker/outbox compartilhado; evitar duplicacao de workflows.
- WMP `wmp_lead_intake` ativo; proposal/DJ/post-event permanecem READY ate homologacao transacional real.

## Pagamentos — bloqueio critico
- `mpago-create-payment` e `mpago-webhook` estao implantados.
- Ultima auditoria: `mpago_credentials = 0` e Vault vazio.
- Nao declarar checkout/recorrencia Mercado Pago funcional ate restaurar segredos por canal seguro e executar PIX + webhook E2E.
- Nunca pedir segredos para serem colados no chat.

## Billing / suporte — pendencias
- `support-pro.functions.ts` ainda usa contrato antigo de `support_tickets`; reconciliar com `ticket_code`, `category`, `source_channel`, `assigned_user_id`, `requester_user_id`, etc.
- Billing: front Essencial/Ideal/Full diverge da tabela live ESSENCIAL/PRO/ENTERPRISE/WHITE_LABEL. Nao ativar checkout direto ate fonte unica de planos e MP estarem resolvidos.

## Marocas / RioMed / CP
- Marocas: modulos existem; reconciliacao front-back/identidade/agent ainda pendente. Nao inventar marca/agente.
- RioMed: modulos existem; legado que dependia de `companies.subdomain` deve migrar para identidade Core. `companies.subdomain` nao existe no schema atual.
- CP — Chat Privado: convite com duplo aceite; usuarios visiveis por celular + apelido, nunca nome civil; retencao configuravel e exclusao irreversivel com confirmacao.

## Seguranca
- `.gitignore` bloqueia novos `.env`; segredos antigos rastreados exigem migracao segura antes de remocao.
- Nao criar policy permissiva apenas para zerar advisor.
- SECURITY DEFINER deve ser auditado funcao a funcao.
- `btree_gist` em public permanece pendente de analise.

## Definicao de pronto
Nenhum recurso e pronto apenas porque arquivo/tabela existe. Exigir quando aplicavel: build + lint + testes + persistencia real + auth + autorizacao/RLS + rotas + botoes + comunicacao + deploy + monitoramento + E2E.

## Proximo checkpoint — continuar daqui
1. Revalidar os 11 GitHub Actions do HEAD atual e registrar quais passaram/falharam.
2. Talentos selection-first: integrar catalogo oficial CBO pesquisavel; idiomas; formacao/cursos/instituicoes com estrategia canonica; habilidades com taxonomia + excecao curada.
3. Talentos rede: substituir cidades/bairros CSV por UF/municipio IBGE e bairros aprendidos pelo Core.
4. WMP: remover event types/UF hardcoded do front e consumir reference-options; criar UI completa de equipamentos usando fabricantes/modelos + fila de excecao.
5. Varredura global por ViaCEP/IBGE direto, `auth.uid()` usado como `company_id`, campos classificaveis em texto livre e CPF/CNPJ sem Core.
6. Reconciliar universal conversations/Milito e `support-pro.functions.ts`.
7. Reconciliar billing e restaurar Mercado Pago por canal seguro.
8. Continuar Marocas/RioMed selection-first e front-back.
9. Homologar blocos publicados e manter percentuais de implementacao separados da homologacao.

## Regra operacional final
- Nao usar Codex.
- Nao refazer trabalho concluido.
- Nao declarar 100% sem evidencia.
- Corrigir e testar diretamente quando houver conector.
- Quando faltar acesso externo, registrar a dependencia com precisao e continuar tudo que puder ser feito de forma independente.
