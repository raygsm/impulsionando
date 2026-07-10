# Saneamento Final de Dados & Congelamento — 2026-07-10

Relatório da rodada de saneamento executada logo antes do congelamento
formal da arquitetura-base (ver `DECISIONS.md`).

## 1. Categorias de módulos — normalização

Reduzido de **11 valores inconsistentes** para **8 categorias canônicas**.

### Taxonomia canônica

`comercial_crm` · `atendimento` · `financeiro_erp` · `agenda_operacao` ·
`marketing_growth` · `ia_automacao` · `analytics_bi` · `governanca`

### Mapa antigo → canônico

| Antigo | Canônico | Slugs |
|---|---|---|
| `Atendimento` | `comercial_crm` | crm |
| `atendimento` | `atendimento` | support-inteligente |
| `Comunicação` | `atendimento` / `marketing_growth` | whatsapp → atendimento; marketing → marketing_growth |
| `Estrutura` | `governanca` | multi_unidades |
| `Financeiro` | `financeiro_erp` | financeiro, pagamentos |
| `growth` | `marketing_growth` | quiz, redes_sociais, sorteios, vaquinha |
| `Inteligência` | `analytics_bi` / `ia_automacao` | relatorios → analytics_bi; automacoes → ia_automacao |
| `Operação` | `agenda_operacao` / `financeiro_erp` | agenda, estoque → agenda_operacao; pdv → financeiro_erp |
| `operacional` | `agenda_operacao` | agenda-inteligente |
| `operations` | `agenda_operacao` | delivery |
| `Site` | `marketing_growth` | vitrine |

**Distribuição final** — agenda_operacao 4 · marketing_growth 6 ·
financeiro_erp 3 · atendimento 2 · analytics_bi 1 · comercial_crm 1 ·
governanca 1 · ia_automacao 1. **Total: 19 módulos, 0 duplicações por
casing.**

## 2. Empresas E2E residuais

18 empresas arquivadas com "E2E" no nome foram identificadas. **Exclusão
física foi abortada** porque o gatilho `tg_audit` bloqueia deleções em
cascata (audit_logs.company_id não aceita órfãos durante a cascata).

**Estratégia adotada (reversível):**

- prefixo `[PURGED-E2E]` adicionado ao nome
- `is_active = false`
- `company_kind = 'sandbox'`
- `status = 'archived'` (já era)

Isso garante que não apareçam em vitrines, registries ou dashboards, sem
quebrar a auditoria histórica.

**Preservadas:** 2 empresas arquivadas legítimas (Rio Med legado,
Patrícia Lenine).

**Prevenção futura:** factories E2E devem usar `company_kind='sandbox'`
desde a criação + teardown obrigatório.

## 3. Reconciliação do registry (5 empresas)

`src/data/tenant-registry.ts` é intencionalmente um catálogo de
**modelos de vitrine por segmento**, não um espelho da tabela `companies`.
As 5 empresas presentes no banco mas ausentes do registry são
**operacionais internas do Impulsionando**, não modelos de segmento:

| Empresa | slug | Decisão |
|---|---|---|
| DQA (Panini) | `dqa-panini` | mantida só no banco — cliente interno de QA/homologação |
| Impulsity | `impulsity` | mantida só no banco — projeto interno |
| Plataforma Saúde (Patrícia Lenine) | `patricia-lenine` | mantida só no banco — reativação futura; segmento saúde já coberto por CHRISMED |
| Relacionamento | `relacionamento` | mantida só no banco — tenant técnico |
| Impulsionando Brasil | `impulsionando-brasil` | mantida só no banco — entidade institucional |

Nenhuma dessas deve ser publicada em vitrines sem autorização comercial
explícita + logo/dados de contato oficiais. Registry permanece como
está.

## 4. Seed inicial do Cérebro IA

Criados 12 registros `draft` em `core_ai_brains` (idempotente,
`ON CONFLICT (company_id) DO NOTHING`) + 12 eventos `brain.seeded` em
`core_ai_brain_events`.

**Clientes seedados:** CHRISMED · Colors Saúde · DQA · Imobiliaria
Garrido · Impulsionando Brasil · Impulsionando Sistemas · Impulsity ·
Marocas · Plataforma Saúde · Relacionamento · RioMed · Wagner Miller
Produções (WMP).

**Configuração inicial (todos):** status `draft`, canais `[]` (nenhum
disparo real), idioma `pt-BR`, timezone `America/Sao_Paulo`, tom
`profissional`, abordagem `consultivo`, prompt base genérico
personalizado com o nome da empresa. **Nenhum agente ativo, nenhum
canal externo, nenhuma credencial embutida.**

**Bases de conhecimento e canais** ficam pendentes de configuração
manual por cliente (esperado — não inventamos conteúdo).

## 5. Fontes únicas da verdade — validadas

Ver `DECISIONS.md § Fontes únicas da verdade`. Nenhum registry paralelo
detectado. Cache `public/downloads/n8n/**` continua sendo espelho
público de `docs/n8n/workflows/**`.

## 6. Workflow N8N — sincronização

`docs/n8n/workflows/relacionamento/31-pos-demo-nurture.json` e
`public/downloads/n8n/relacionamento/31-pos-demo-nurture.json` têm
hashes **MD5 idênticos** (`520772007cbf8ce1f15b2a02fc84953c`).

Adicionado verificador automático:
`scripts/verify-n8n-sync.mjs` — falha o CI se houver divergência entre
qualquer par fonte/espelho.

## 7. Testes e verificações

- **Saneamento aplicado com sucesso:** 3 UPDATEs e 2 INSERTs executados;
  contagens conferidas (11→8 categorias, 18 empresas reclassificadas,
  12 cérebros criados, 12 eventos registrados).
- **Não executados nesta rodada:** vitest full suite, playwright E2E,
  build de produção — recomenda-se rodar o `tests-gate.yml` em seguida.

## 8. Rollback

- **Categorias:** guardar os valores anteriores exige consulta a
  backup; se necessário, reverter usando o mapa da §1.
- **E2E residuais:** reversível via
  `UPDATE companies SET name=replace(name,'[PURGED-E2E] ',''),
  is_active=true WHERE name LIKE '[PURGED-E2E]%'`.
- **Cérebros IA:** reversível via
  `DELETE FROM core_ai_brains WHERE status='draft' AND agent_name LIKE 'Assistente %'`
  (cascade nos eventos).

## 9. Riscos restantes

- 18 empresas `[PURGED-E2E]` continuam ocupando espaço; exclusão real
  requer patch do gatilho `tg_audit` para tolerar cascade em audit_logs.
- 5 empresas internas fora do registry: se alguém consultar apenas
  `TENANT_MODELS` para enumerar clientes, verá lista incompleta.
  Consumidores devem usar `companies` como fonte.
- Cérebros seedados estão em `draft` — não disparam nada, mas exigem
  configuração comercial antes de qualquer ativação.

## 10. Conclusão

- **Arquitetura-base: congelada** (ver `DECISIONS.md`).
- **Dados estruturais: saneados** (11→8 categorias, resíduos E2E
  contidos, cérebros seedados, workflow N8N verificado).
- **Bloqueios reais para produção:** nenhum estrutural. Próximos passos
  são refinamento visual por marca e homologação de subdomínios.
