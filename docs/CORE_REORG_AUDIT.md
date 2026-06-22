# Core Impulsionando — Auditoria de Reorganização (Onda A)

**Data:** 22-06-2026
**Escopo:** levantamento do estado atual do menu administrativo, das rotas operacionais expostas no Core, dos clientes (tenants) reais e dos projetos paralelos detectáveis.
**Nada foi alterado.** Este documento é a base para as ondas B–F.

---

## 1. Estado atual do menu (`core_admin_menu`)

Duas vertentes, **15 grupos**, **64 itens ativos**:

### Vertente `impulsionando` (7 grupos, 34 itens) — predominantemente administrativa ✅
- Visão Master (4) · Plataforma & Infra (4) · Integrações & Credenciais (4) · Segurança & Governança (5) · ERP Impulsionando (6) · Catálogo & Produto (6) · Comercial & Crescimento (5)

### Vertente `clientes` (8 grupos, 30 itens) — **contém vazamentos operacionais** ❌
| Grupo | Itens | Diagnóstico |
|---|---|---|
| Diretório de Tenants | 3 | OK (admin) |
| Ciclo de Vida | 4 | OK (admin) |
| Operação por Tenant | 4 | OK (admin) |
| Financeiro do Cliente | 4 | OK (admin) |
| Conteúdo & Personalização | 4 | OK (admin) |
| Inteligência de Público | 4 | OK (admin) |
| **Diretório (duplicado)** | 2 | ❌ Atalhos diretos para RioMed BO e Assistente — vazamento de tenant específico no menu raiz |
| **RioMed** | 4 | ❌ Grupo inteiro dedicado a um cliente (Locação, Assistência Técnica, Roteamento, Carrinhos) — viola "operação dentro do cliente" |

**Conclusão:** o menu tem dois grupos inteiros que pertencem **dentro** da ficha RioMed, não na raiz do Core.

---

## 2. Rotas operacionais expostas no Core (vazamentos)

Total de arquivos em `src/routes/_authenticated/`: **420** (cresceu de forma orgânica, sem governança de namespace).

### 2.1 Rotas `admin.*` com nicho/módulo embutido no slug
Devem migrar para `/admin/clientes/{slug}/operacao/...`:

| Rota atual | Domínio operacional | Cliente de destino |
|---|---|---|
| `admin.ehr-clinical-health` | Prontuário eletrônico | CHRISMED + Plataforma Saúde |
| `admin.ehr-compliance` | EHR | CHRISMED |
| `admin.brewery-clube-health` | Microcervejaria | (sem cliente real ainda — vira modelo de nicho) |
| `admin.marocas-health`, `admin.marocas-ops-health` | Serviços Airbnb | Marocas |
| `admin.realestate-cockpit`, `admin.realestate-health` | Imobiliária | Garrido |
| `admin.clientes.riomed.*` (×24 arquivos) | Equipamentos médicos | RioMed |
| `admin.agenda-*-health` (×4) | Agenda médica | CHRISMED |
| `admin.contab-*-health` (×2) | Contabilidade | (sem cliente real ainda) |

### 2.2 Rotas `core.*` que misturam admin de plataforma com atalhos a cliente
- ✅ Administrativas (manter): `core.clientes`, `core.modulos`, `core.planos`, `core.dominios`, `core.financeiro-*`, `core.integracoes.*`, `core.menus`, `core.tenants.*`, `core.parametros`, `core.releases`, `core.observabilidade`, `core.saude`, `core.suporte`
- ⚠️ Ambíguas (revisar na Onda B): `core.cliente.$id.*` já está no namespace correto; manter
- ❌ Operacionais soltas: nenhuma encontrada em `core.*` — vazamento está só em `admin.*`

### 2.3 Itens do menu que devem **sair do Core e ir para dentro de RioMed**
- "RioMed (BO)" → ficha do cliente
- "RioMed · Assistente" → aba dentro de RioMed
- Grupo "RioMed" inteiro (Locação, Assistência Técnica, Routing, Carrinhos) → área operacional do cliente RioMed

---

## 3. Tenants (clientes reais ativos)

| Cliente | Subdomínio | Domínio próprio | Nicho atual | Status | `external_url` (projeto paralelo?) |
|---|---|---|---|---|---|
| CHRISMED | `chrismed` | `agenda.chrismed.com.br` | `saude` | active | `https://chrismed.lovable.app` |
| DQA | `dqa` | — | (sem nicho) | active | `https://dqa-impulsionando.lovable.app` |
| Imobiliaria Garrido | `garrido` | — | `imobiliaria` | active | `https://garrido-impulsionando.lovable.app` |
| Impulsionando Brasil | `impulsionando-brasil` | — | `marketing-tecnologia` | active | — |
| Marocas | `marocas` | — | `servicos` | active | `https://marocas.lovable.app` |
| Plataforma Saúde | `plataforma-saude` | — | `saude` | active | `https://patricia-lenine.lovable.app` |
| Relacionamento | `relacionamento` | — | `servicos` | active | — |
| **Rio Med** ⚠️ | `rio-med` | — | `ecommerce` | active | — |
| **RioMed** ⚠️ | `riomed` | `riomed.impulsionando.com.br` | `medico-hospitalar` | active | — |
| Wagner Miller Produções | `wmp` | — | `eventos` | active | `https://sweet-summit-platform.lovable.app` |

### 3.1 Duplicata RioMed (resolver na Onda F)
- **Manter:** `RioMed` (id `5bdcdef4…`), domínio `riomed.impulsionando.com.br`, nicho `medico-hospitalar` ← este é o canônico
- **Arquivar:** `Rio Med` (id `b7daafc3…`), subdomínio `rio-med`, nicho `ecommerce` ← registro órfão

### 3.2 Lixo de testes E2E (limpeza opcional)
9 registros `CHRISMED E2E 178190xxxx` já estão `archived` + `is_active=false`. Não bloqueiam. Sugestão: purga em rotina separada, não nesta reorganização.

---

## 4. Projetos paralelos — veredito provisório

Detectados via `migration_source_project_id` e `external_url`. **Nenhum será excluído nesta sequência** — preciso da sua confirmação por projeto antes.

| Projeto paralelo (origem) | Tenant correspondente no Core | Domínio em produção aponta para? | Veredito provisório |
|---|---|---|---|
| `d8bc1159…` (chrismed.lovable.app) | CHRISMED | `agenda.chrismed.com.br` (próprio) | ⚠️ **NÃO PODE EXCLUIR AINDA** — domínio próprio precisa ser apontado para o Core antes |
| `a8fe6eef…` (dqa-impulsionando.lovable.app) | DQA | desconhecido | ⚠️ **NÃO PODE EXCLUIR AINDA** — confirmar se há tráfego/dados não migrados |
| `505ffaf6…` (garrido-impulsionando.lovable.app) | Imobiliaria Garrido | desconhecido | ⚠️ **NÃO PODE EXCLUIR AINDA** — repasses imobiliários ativos? confirmar |
| `5c9b7a46…` (marocas.lovable.app) | Marocas | desconhecido | ⚠️ **NÃO PODE EXCLUIR AINDA** — operação em curso, validar dados |
| `3563120a…` (patricia-lenine.lovable.app) | Plataforma Saúde | desconhecido | ⚠️ **NÃO PODE EXCLUIR AINDA** — confirmar uso real |
| `c0567cbc…` (Relacionamento, sem URL externa) | Relacionamento | n/d | ✅ **Provavelmente pode arquivar** — sem `external_url`, parece já consolidado |
| `ea8d56ef…` (sweet-summit-platform.lovable.app) | Wagner Miller Produções | desconhecido | ⚠️ **NÃO PODE EXCLUIR AINDA** — confirmar status |

**Critério para liberar exclusão de um projeto paralelo (a aplicar em onda futura, projeto por projeto):**
1. Domínio público apontando 100% para o Core (`{slug}.impulsionando.com.br` ou domínio próprio com A-record para Lovable Core)
2. Banco de dados do paralelo migrado / sem escritas nos últimos 30 dias
3. Webhooks (MercadoPago, Z-API, n8n) reapontados para o Core
4. Sem usuários autenticando lá nos últimos 14 dias

Hoje **nenhum dos 7 atende todos os critérios**.

---

## 5. Domínios — situação atual

Apenas **2 clientes** têm domínio configurado:
- `agenda.chrismed.com.br` → CHRISMED (domínio próprio, herdado do projeto paralelo)
- `riomed.impulsionando.com.br` → RioMed (subdomínio Impulsionando, já no Core) ✅

Os outros 8 clientes ativos rodam só com o slug base (sem subdomínio real ainda provisionado). A Onda E vai expor isso no painel `/admin/dominios` com botão "Provisionar subdomínio".

---

## 6. Próximas ondas (sem execução nesta entrega)

| Onda | Entrega | Reversível? |
|---|---|---|
| **B** — Menu novo | Migração reescreve `core_admin_menu` em 12 grupos administrativos puros. Itens "RioMed (BO)/Assistente/Locação/Assistência/Routing/Carrinhos" saem do menu raiz e viram entradas dentro da ficha RioMed | ✅ rollback por flag `enabled` |
| **C** — Gate + shell de cliente | `useClientFeatureGate({company,module})`, layout `/admin/clientes/$slug/operacao/$modulo`, ficha do cliente com 14 abas | ✅ código novo, não destrutivo |
| **D** — Migração de rotas operacionais | EHR/Brewery/RealEstate/Marocas/RioMed-ops movem para dentro do cliente; rotas antigas viram redirect 301 client-side | ⚠️ requer cuidado, mas redirects mantêm compat |
| **E** — Painel `/admin/dominios` | Status DNS/SSL/commit publicado por cliente, botão "Verificar" e "Republicar" | ✅ |
| **F** — Consolidação de tenants | Arquivar duplicata "Rio Med", garantir nicho/plano de CHRISMED/Garrido/Marocas, validar seed do cliente-teste | ✅ |

---

## 7. Resposta direta aos 26 itens do entregável obrigatório

Esta auditoria só responde os itens **diagnósticos**. Os itens de execução (1, 11–21) só serão respondidos após as ondas B–F. Itens diagnosticáveis agora:

- **22.** Recursos protegidos por nicho/plano/cliente/permissão? **NÃO hoje.** Hoje qualquer admin master enxerga tudo no menu raiz. Será resolvido na Onda C com `useClientFeatureGate`.
- **23.** Super Admin consegue criar/editar/suspender qualquer cliente? **Parcialmente.** Existe `/core/clientes` + `/core/tenants/novo` + `/core/implantacoes`. Suspensão/reativação/arquivamento ainda não tem UI unificada — Onda C entrega na ficha do cliente.
- **24.** Cliente vê apenas sua própria operação? **NÃO hoje.** Não existe gate por tenant — qualquer rota admin é "tudo ou nada" via `has_role('admin')`. Onda C resolve.
- **25.** Pronto para criar novos clientes sem novos projetos paralelos? **Sim arquiteturalmente** (Core é multi-tenant via `companies` + RLS por `company_id`), **não operacionalmente** (faltam shells operacionais genéricos por módulo). Onda C/D entrega.
- **26.** Projetos paralelos podem ser excluídos com segurança? **Hoje: NÃO, nenhum dos 7.** Ver seção 4 para critérios.

---

## 8. O que eu preciso de você para prosseguir

1. **Aprovação para executar a Onda B** (reescrever `core_admin_menu` para 12 grupos administrativos puros). Reversível por flag.
2. **Confirmação de prioridade** dos clientes — começo por CHRISMED + RioMed + Garrido + Marocas? Ou outra ordem?
3. **Confirmação sobre o tenant "Rio Med" (id `b7daafc3…`)** — posso marcar como `status='archived'` na Onda F? Ele tem nicho `ecommerce` e parece ser registro de teste anterior ao tenant canônico `RioMed`.

Sem essas três confirmações eu não avanço para a Onda B. Nenhuma alteração em código ou banco foi feita nesta entrega.
