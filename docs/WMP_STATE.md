# WMP — ESTADO OPERACIONAL

Atualizado em: 2026-08-15

## Regra de continuidade
Este arquivo e a fonte de checkpoint especifica da WMP — Wagner Miller Producoes dentro do repositorio `raygsm/impulsionando`.
Ao receber `Continue`, `Siga` ou `Retome do ultimo checkpoint` em contexto WMP:
1. validar o HEAD real de `main`;
2. validar o Supabase principal `arygtqrdpcdkwnuwsgmm`;
3. validar build, deploy e producao em `https://wmp.impulsionando.com.br`;
4. validar n8n pelo registry antes de declarar uma jornada ativa;
5. nunca reiniciar trabalho pronto;
6. nunca declarar GO-LIVE sem E2E real.

## Identidade e arquitetura
- Cliente exclusivo: WMP — Wagner Miller Producoes.
- Dominio oficial: `https://wmp.impulsionando.com.br`.
- Repositorio oficial: `raygsm/impulsionando`.
- Core universal Impulsionando; evitar modulos paralelos.
- Agente visivel: **Milito**.
- Chaves tecnicas legadas `wmp-millito`/`millito` podem permanecer somente quando necessarias para compatibilidade.

## Milito
Estado implementado:
- `communication_agents`: Milito ativo no tenant WMP.
- `communication_agent_runtime`: CLIENT_INSTANCE com vision/multimodal, structured output, confidence policy, handoff, CRM update, image analysis, proposal draft, lead qualification, setup recommendation, DJ availability lookup e equipment catalog lookup.
- Config live e migration rastreada com `name_spelling=Milito` e rotas canonicas.
- Rotas: briefing `/wmp/orcamento`, contratar DJ `/wmp/djs`, B2B `/wmp/empresas`, parceiro `/wmp/parceiro`, agenda `/wmp/onde-estou`.
- Chat `/api/wmp/millito/chat` consulta agenda publicada futura no banco a cada requisicao e nao reutiliza agenda historica como atual.
- Dock possui atalhos por intencao e links clicaveis de continuidade/exportacao.
- Policy de exportacao alinhada: nome completo, e-mail e celular obrigatorios; CPF/CNPJ/endereco/empresa opcionais; no maximo 10 perguntas.
- Tela de exportacao usa apenas a grafia publica Milito.

## Front comercial
Implementado no `main`:
- Home orientada por jornadas e Milito.
- `/wmp/djs` — contratar DJ.
- `/wmp/empresas` — hoteis e empresas.
- `/wmp/onde-estou` — agenda publica validada.
- `/wmp/orcamento` — briefing inteligente.
- `/wmp/parceiro` — cadastro de DJ/parceiro.
- menu principal e mobile expoem contratar DJ, B2B, Onde Estou, servicos, cases, sobre e parceiros.
- widget Onde Estou usa asset `public/wmp/wagner-miller.webp`.

## Briefing e evidencias privadas
Implementado no codigo e no Supabase live:
- CEP-first e municipio IBGE mediados pelo Core.
- briefing em seis etapas: Contato, Evento, Ambiente, Uso, Evidencias, Revisao.
- ate 8 anexos privados, 50 MB cada.
- MIME: JPEG, PNG, WEBP, PDF, MP4, WEBM, MOV.
- bucket privado `wmp-briefing-evidence`.
- token efemero de upload, somente hash armazenado, validade 45 minutos.
- consumo atomico do grant de upload.
- append atomico dos metadados de evidencia em `wmp_briefings.ambiente_imagens`.
- retry de arquivo sem duplicar briefing/lead.
- imagens acionam pre-diagnostico multimodal server-side; falha de IA nao perde o arquivo e deixa analise pendente.
- analise visual nao pode inventar dimensoes, lotacao, potencia eletrica, carga, dB, certificacao ou conformidade.

## B2B multi-data e proposta
Implementado no banco e no `main`:
- `wmp_briefing_dates` como tabela filha normalizada do briefing-mestre.
- 1 a 100 datas por solicitacao corporativa.
- cada data tem local, horario, municipio IBGE, observacao e status independente.
- status: REQUESTED, QUOTED, CONFIRMED, CANCELLED.
- RLS e isolamento por cliente ativo.
- `/wmp/empresas` incorpora o planner de agenda corporativa.
- `submitWmpCorporateDemand` cria um unico briefing/lead-mae e varias datas, evitando duplicacao de CRM.
- Central Operacional consulta e gerencia as datas corporativas separadamente dos bookings de DJs.
- cada data corporativa possui CTA de criacao de proposta sem expor PII na URL; apenas `briefing_date_id` interno e autenticado e transportado.
- `getWmpCorporateProposalPrefill` busca briefing + data no servidor e preenche cliente, evento, data, local e publico no editor de proposta.
- ao criar a proposta vinculada, a data passa automaticamente para `QUOTED`.
- o `briefing_id` e `briefing_date_id` permanecem associados a proposta para rastreabilidade.
- quando a proposta vinculada recebe transicao `ACCEPTED`, a data corporativa passa automaticamente para `CONFIRMED`.
- contrato formal continua posterior ao aceite comercial; nenhuma mudanca alterou essa regra.

## Propostas e protecao financeira
- editor real `/wmp/propostas/nova` existente e preservado.
- regra de alimentacao por DJ: R$ 50,00.
- regra de estacionamento por DJ: R$ 50,00.
- quando contratante fornece diretamente um item, o respectivo allowance e zerado.
- margem bruta minima: 10%.
- margem liquida operacional minima: 15%.
- proposta pode ser salva para revisao abaixo do limite, mas o envio deve permanecer bloqueado pelo guardrail.

## Migrations WMP recentes rastreadas no GitHub
- `20260815232926_wmp_private_briefing_evidence_uploads_20260815.sql`
- `20260815233120_wmp_atomic_briefing_upload_grant_20260815.sql`
- `20260815233136_wmp_atomic_briefing_evidence_append_20260815.sql`
- `20260815233322_wmp_atomic_multimodal_analysis_append_20260815.sql`
- `20260815233603_wmp_milito_runtime_canonical_routes_20260815.sql`
- `20260815234151_wmp_corporate_briefing_dates_20260815.sql`

## Drift de schema
- O drift conhecido de multimodal/runtime foi reconciliado: as migrations live agora tambem possuem arquivo no GitHub.
- Continuar comparando `supabase_migrations.schema_migrations` com `supabase/migrations` antes de qualquer nova DDL.

## n8n — fonte real de status
Validado novamente em 2026-08-15:
- `wmp_lead_intake`: ACTIVE; workflow id `wmpLeadIntake01`; webhook canonico `https://n8n.impulsionando.com.br/webhook/wmp-lead-intake` verificado.
- `wmp_partner_intake`: ACTIVE; compartilha intencionalmente `wmpLeadIntake01` e o mesmo webhook.
- `wmp_proposal_lifecycle`: READY; `n8n_workflow_id=null`; eventos preparados mas sem workflow/webhook real.
- `wmp_dj_booking_lifecycle`: READY; `n8n_workflow_id=null`; eventos preparados mas sem workflow/webhook real.
- `wmp_post_event_relationship`: READY; `n8n_workflow_id=null`; eventos preparados mas sem workflow/webhook real.
Nao alterar READY para ACTIVE sem workflow real, webhook verificado, HMAC/idempotencia e teste transacional.

## Onde Estou
- Tabelas live: `wmp_whereabouts_daily_requests` e `wmp_whereabouts_entries`.
- Status validos: DRAFT, PUBLISHED, CANCELLED, ARCHIVED.
- Em 2026-08-15 havia zero entradas futuras `PUBLISHED` com `published_at` preenchido.
- Milito deve responder que nao ha agenda publica confirmada quando essa condicao persistir.

## Producao e CI
- O deploy universal passou a ter WMP como gate obrigatorio de producao.
- Rotas WMP testadas no deploy: `/`, `/djs`, `/empresas`, `/orcamento`, `/parceiro`, `/onde-estou`.
- Falha em rota critica WMP deve impedir sucesso do deploy e acionar rollback do Core.
- Producao ainda estava servindo versao antiga na verificacao anterior, portanto continua proibido declarar GO-LIVE antes da homologacao deste HEAD.
- HEAD funcional deste checkpoint inclui a ponte B2B -> proposta -> aceite -> confirmacao da data.
- workflow `Deploy Core Frontend` do HEAD esta em execucao; checkout, setup, instalacao de dependencias e teste de roteamento ja passaram e o build esta em andamento.

## Pendencias prioritarias
1. fechar build/deploy do HEAD WMP e verificar producao nas seis rotas gate;
2. executar E2E do briefing com anexo privado + analise multimodal + intake;
3. executar E2E do B2B multi-data -> proposta -> aceite -> status CONFIRMED;
4. criar/ativar workflows n8n reais para proposta, DJ booking e pos-evento quando houver acesso n8n;
5. validar proposta -> aceite -> contrato -> DJ -> equipamento -> locacao -> evento -> pos-evento;
6. validar mobile, RLS, perfis, botoes, logs e observabilidade;
7. somente entao avaliar `WMP — GO-LIVE APROVADO`.
