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
- Config live corrigida para `name_spelling=Milito`.
- Rotas canonicas live: briefing `/wmp/orcamento`, contratar DJ `/wmp/djs`, B2B `/wmp/empresas`, parceiro `/wmp/parceiro`, agenda `/wmp/onde-estou`.
- Chat `/api/wmp/millito/chat` consulta agenda publicada futura no banco a cada requisicao e nao reutiliza agenda historica como atual.
- Dock possui atalhos por intencao e links clicaveis de continuidade/exportacao.

## Front comercial
Implementado no `main`:
- Home orientada por jornadas e Milito.
- `/wmp/djs` — contratar DJ.
- `/wmp/empresas` — hoteis e empresas.
- `/wmp/onde-estou` — agenda publica validada.
- `/wmp/orcamento` — briefing inteligente.
- `/wmp/parceiro` — cadastro de DJ/parceiro.
- menu principal e mobile expõem contratar DJ, B2B, Onde Estou, servicos, cases, sobre e parceiros.
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

## Migrations WMP recentes rastreadas no GitHub
- `20260815232926_wmp_private_briefing_evidence_uploads_20260815.sql`
- `20260815233120_wmp_atomic_briefing_upload_grant_20260815.sql`
- `20260815233136_wmp_atomic_briefing_evidence_append_20260815.sql`

## Drift conhecido: live aplicado, arquivo ainda nao rastreado
As migrations abaixo estao aplicadas e registradas em `supabase_migrations.schema_migrations`, mas duas tentativas de criar o arquivo correspondente pelo conector GitHub foram bloqueadas pelo proprio conector. NAO reaplicar nem renomear sem reconciliacao:
- `20260815233322_wmp_atomic_multimodal_analysis_append_20260815`
- `20260815233603_wmp_milito_runtime_canonical_routes_20260815`

## n8n — fonte real de status
Live registry:
- `wmp_lead_intake`: ACTIVE; workflow id `wmpLeadIntake01`; webhook verificado no host canonico n8n.
- `wmp_partner_intake`: ACTIVE; compartilha workflow de intake.
- `wmp_proposal_lifecycle`: READY; sem workflow id/webhook.
- `wmp_dj_booking_lifecycle`: READY; sem workflow id/webhook.
- `wmp_post_event_relationship`: READY; sem workflow id/webhook.
Nao alterar READY para ACTIVE sem workflow real, webhook verificado e teste transacional.

## Onde Estou
- Tabelas live: `wmp_whereabouts_daily_requests` e `wmp_whereabouts_entries`.
- Status validos: DRAFT, PUBLISHED, CANCELLED, ARCHIVED.
- Em 2026-08-15 havia zero entradas futuras `PUBLISHED` com `published_at` preenchido.
- Milito deve responder que nao ha agenda publica confirmada quando essa condicao persistir.

## DJs
Em 2026-08-15 o banco tinha, internamente:
- 3 DJs APPROVED;
- 1 PENDING;
- 1 REVIEWING.
Nao expor dados pessoais ou contagens internas como promessa comercial sem necessidade.

## Producao e CI
Problema confirmado durante a auditoria: producao ainda servia versao antiga com claims/cases/precos nao homologados enquanto `main` ja havia removido esse conteudo.
O build Docker mais recente deve ser validado ate conclusao, seguido de deploy e nova verificacao externa.
Nenhum status GO-LIVE pode ser emitido enquanto producao estiver divergente do `main`.

## Pendencias prioritarias
1. fechar build/deploy do HEAD WMP e verificar producao;
2. executar E2E do briefing com anexo privado + analise multimodal + intake;
3. reconciliar no GitHub as duas migrations live sem arquivo;
4. criar agenda corporativa multi-data normalizada para hoteis/empresas, sem duplicar CRM;
5. criar/ativar workflows n8n reais para proposta, DJ booking e pos-evento quando houver acesso n8n;
6. validar proposta → aceite → contrato → DJ → equipamento → locacao → evento → pos-evento;
7. validar mobile, RLS, perfis, botoes, logs e observabilidade;
8. somente entao avaliar `WMP — GO-LIVE APROVADO`.
