# Core Impulsionando — Reorg Ondas B + F (executadas)

Status: **aplicado em produção** via migration `reorg-menu-clean + archive-riomed-duplicate`.
Reversível: o seed de menu pode recriar os grupos removidos; o tenant arquivado pode ser
reativado por `UPDATE companies SET is_active=true, status='active' WHERE id='b7daafc3…'`.

## Onda B — `core_admin_menu` limpo

Removidos da vertente **Clientes** (vazaram da operação do tenant RioMed):

| Grupo removido                  | Itens                                                                       |
| ------------------------------- | --------------------------------------------------------------------------- |
| `riomed` (group_order 50)       | Locação · Assistência Técnica · Roteamento de Leads · Carrinhos Abandonados |
| `directory` duplicado (order 20)| RioMed (BO) · RioMed · Assistente                                           |
| atalho solto                    | RioMed · Produtos                                                           |

Esses itens continuam acessíveis **dentro do card do cliente**
(`/admin/clientes/riomed/...`). Não pertencem ao menu administrativo global.

### Estado atual do menu

**Vertente `clientes`** (6 grupos, 23 itens):
Diretório de Tenants · Ciclo de Vida · Operação por Tenant · Financeiro do Cliente ·
Conteúdo & Personalização · Inteligência de Público.

**Vertente `impulsionando`** (7 grupos, 34 itens):
Visão Master · Plataforma & Infra · Integrações & Credenciais · Segurança & Governança ·
ERP Impulsionando · Catálogo & Produto · Comercial & Crescimento.

## Onda F — duplicidade Rio Med resolvida

- `Rio Med` (`b7daafc3-c9bf-4ac4-bfae-810730816dc8`, subdomain `rio-med`, nicho ecommerce)
  → `is_active=false`, `status='archived'`, subdomain renomeado para `rio-med-arquivado-<ts>`.
- `RioMed` (`5bdcdef4-f0dc-4453-b935-a192ad514938`, domain `riomed.impulsionando.com.br`)
  → **canônico**, permanece ativo e único.

## Próximas ondas — pendentes

A reorganização total continua em sequência. As ondas abaixo exigem refactor de código
(420 rotas em `src/routes/_authenticated/`) e serão entregues em PRs separados.

- **Onda C — Gate & Shells**: hook `useClientFeatureGate` (status × nicho × plano ×
  módulos × financeiro × permissão) + shell dinâmico `/admin/clientes/{slug}/operacao/{modulo}`.
- **Onda D — Migração de rotas**: mover `admin.ehr-*`, `admin.agenda-*`,
  `admin.marocas-*`, `admin.realestate-*`, `admin.brewery-*` para
  `/admin/clientes/{slug}/operacao/{modulo}/...` e aplicar gate em
  `admin.clientes.riomed.*` (24 rotas já no namespace correto, sem gate).
- **Onda E — Domínios & Deploy**: consolidar painel único de DNS/SSL/build por
  cliente (hoje espalhado entre `/core/dominios` e `/admin/deploy-status`).
- **Onda G — Provisionar subdomínios**: 8 tenants sem subdomain
  (CHRISMED, DQA, Garrido, Impulsionando Brasil, Marocas, Plataforma Saúde,
  Relacionamento, Wagner Miller).
