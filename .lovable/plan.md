
# Fase 2 + Fase 3 — Plano de execução enxuto (máximo reuso)

## Diagnóstico

A maior parte do que a Fase 2 e a Fase 3 pedem **já existe** no projeto. Recriar é o que devo evitar.

| Fase pedida | Já existe |
|---|---|
| Wizard "Criar Projeto" (etapas 1–7) | `/core/nova-implantacao` (prompt → análise → provisionamento async, com merge por CPF/CNPJ e ambiente DEMO/TESTE/REAL) |
| Cadastro/seleção de cliente | tabela `companies` (34 colunas) + lógica de reuso já no wizard atual |
| Escolha de template / clonagem / vazio | tabela `site_templates` + `/core/templates` (Fase 1) + `/admin/modulos/clonagem` |
| Seleção de módulos | `/core/modulos` + `modules` + `company_modules` + `InstallModuleDialog` (instalação em 1 clique com `installModuleWithTemplate`) |
| Preset por nicho | `src/data/moduleSegmentTemplates.ts` (`SEGMENT_LABELS`) — já consumido pelo `InstallModuleDialog` |
| Configurações iniciais (SIM/NÃO) | `setting_definitions` + `company_settings` |
| Permissões / automações / templates de mensagem / dashboard / logs | `permissions`, `message_templates`, `audit_logs`, `notifications` |
| Logs do provisionamento | `ai_project_generations` (eventos + status em tempo real) + `audit_logs` |
| Mocks DEMO vs REAL limpo | já isolados via `companies.environment` + rotas `/demo.*` |

**Conclusão:** não preciso de novo wizard de 7 etapas nem de uma "Central de Instalação" inteira. Preciso de **2 orquestradores enxutos** que costuram o que já existe, mais um pouco de UI.

## O que vou construir (deltas mínimos)

### Delta 1 — Página "Criar Projeto" assistida (`/core/criar-projeto`)
Wizard curto de **3 passos** que apenas orquestra peças existentes:

1. **Cliente + Projeto** — formulário único com busca por CPF/CNPJ que reusa `companies` existentes (mesma lógica já implementada no `nova-implantacao`); campos: nome, fantasia, responsável, WhatsApp, email, documento, nicho, ambiente (DEMO/TESTE/REAL), domínio, status, observações.
2. **Modelo + Módulos + Preset** — uma tela só: radio de modelo (Template / Clonar / Vazio / DEMO base / Módulo-base / Combinação), seleção múltipla de módulos (lista vinda de `modules`), preset por nicho (`SEGMENT_LABELS`), toggles SIM/NÃO de comunicação/dashboard/permissões/automações.
3. **Revisão** — resumo + checkbox de confirmação + botão "Criar Projeto". Pós-criação: tela de sucesso com 5 botões (Acessar / Configurar módulos / Criar páginas / Ver logs / Voltar).

O wizard chama UMA server fn nova `createProjectFromFactory` em `src/lib/factory.functions.ts` que:
- cria/atualiza `companies` (com merge por documento);
- para cada módulo selecionado, chama `installModuleWithTemplate` (já existe — instala estrutura + dependências + preset, NUNCA copia dados reais);
- aplica toggles em `company_settings`;
- grava `ai_project_generations` (status + events) para log/timeline;
- registra entradas em `audit_logs`.

> Mantém `/core/nova-implantacao` como caminho "via prompt de IA". A nova rota é o caminho "sem IA, sem consumir crédito".

### Delta 2 — "Instalar Módulo" no Cliente 360 (Fase 3)
Não preciso de uma nova área. O `InstallModuleDialog` já instala em 1 clique com preset. Vou:
- Adicionar uma rota leve `/core/instalar-modulo` (atalho a partir do menu) que apenas abre o mesmo dialog em modo "selecionar cliente + projeto + módulo + preset" e, depois de instalar, redireciona para um "Assistente de Configuração do Módulo Instalado".
- Criar o **Assistente de configuração pós-instalação** (`/core/cliente/$id/modulo/$slug/configurar`) com 8 passos curtos (Identificação → Recursos → Permissões → Comunicação → Integrações → Automação → Dashboard → Finalização) — usa `setting_definitions` por módulo + toggles. Para o módulo **Agenda Online** (prioritário), os SIM/NÃO específicos (profissionais, serviços, salas, fila, no-show, lembrete 24h/2h, WhatsApp/email/VoIP) viram um preset declarativo em `src/data/moduleAssistantSteps.ts`.
- Status do módulo instalado já existe em `company_modules.status` — só preciso pintar o badge (instalado / aguardando configuração / configurado / ativo / pausado / suspenso / arquivado / erro).

### Delta 3 — Log/timeline visível
Aproveito `ai_project_generations.events` (já gravado pelo wizard atual). Para o novo `createProjectFromFactory`, gravo no mesmo formato (`projeto_iniciado`, `cliente_criado`, `projeto_criado`, `template_aplicado`, `modulos_instalados`, `preset_aplicado`, `config_salva`, `projeto_concluido`, `erro`). A página de logs já existe.

### Delta 4 — Menu
No `core.tsx`, adicionar 2 itens: **Criar Projeto** (`/core/criar-projeto`) e **Instalar Módulo** (`/core/instalar-modulo`). Sem novas seções/agrupamentos visuais.

## O que NÃO vou fazer (e por quê)

- ❌ Reescrever `/core/nova-implantacao` — ele é o caminho via IA e continua existindo.
- ❌ Nova tabela `projects` — `companies` + `company_modules` já cobrem.
- ❌ Nova tabela de logs — `ai_project_generations` + `audit_logs` cobrem.
- ❌ Recriar `InstallModuleDialog`, `OnboardingWizard`, `ClientSettingsPanel` — todos reusados.
- ❌ Nova lógica de "nunca copiar dados reais" — `installModuleWithTemplate` já é estrutural.
- ❌ Mexer em DEMO/`/demo.*` ou trials.

## Arquivos a criar / editar

**Novos (4):**
- `src/lib/factory.functions.ts` — adicionar `createProjectFromFactory` (append à existente)
- `src/routes/_authenticated/core.criar-projeto.tsx` — wizard 3 passos
- `src/routes/_authenticated/core.instalar-modulo.tsx` — atalho + escolha + dispara `InstallModuleDialog`
- `src/routes/_authenticated/core.cliente.$id.modulo.$slug.configurar.tsx` — assistente pós-instalação
- `src/data/moduleAssistantSteps.ts` — passos declarativos por módulo (Agenda primeiro)

**Editados (1):**
- `src/routes/_authenticated/core.tsx` — 2 itens no menu

**Sem migration nova.** Tudo cabe nas tabelas atuais.

## Estimativa
1 server fn + 3 rotas novas + 1 patch de menu. Nada apagado. Nenhum módulo recriado.

## Confirma para eu executar?
