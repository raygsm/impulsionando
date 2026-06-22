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

## Onda C — Gate unificado (executada — scaffolding)

Criados dois primitivos reutilizáveis por qualquer rota operacional de tenant:

- `src/hooks/use-client-feature-gate.ts` — `useClientFeatureGate(companyId, moduleSlug)`
  cruza status do tenant, financeiro, módulo instalado e bypass de staff Impulsionando.
  Retorna `{ allowed, reason, tenant, ... }`.
- `src/components/core/ClientOperationShell.tsx` — wrapper visual padrão para
  `/admin/clientes/{slug}/operacao/{modulo}`. Renderiza bloqueio explicado quando
  o gate nega (arquivado, inativo, módulo não instalado, suspenso, sem permissão).

Adoção é progressiva: rotas operacionais novas já nascem dentro do shell; rotas
existentes serão envelopadas na Onda D.

## Onda G — Domínios provisionados (executada)

7 tenants reais ganharam `domain = <subdomain>.impulsionando.com.br`:
DQA, Imobiliária Garrido, Impulsionando Brasil, Marocas, Plataforma Saúde,
Relacionamento, Wagner Miller Produções. CHRISMED mantém domínio próprio
(`agenda.chrismed.com.br`) e RioMed mantém `riomed.impulsionando.com.br`.
Tenants `Demo *` e `Impulsionando Sistemas` permanecem sem domínio público
(propositadamente — sandbox/plataforma).

> DNS/SSL na Lovable: cada subdomínio precisa do registro A → `185.158.133.1`
> + TXT `_lovable` configurado no DNS de `impulsionando.com.br` antes de
> publicar. O painel consolidado de status virá na Onda E.

## Próximas ondas — pendentes

- **Onda D — Migração de rotas operacionais**: mover `admin.ehr-*`, `admin.agenda-*`,
  `admin.marocas-*`, `admin.realestate-*`, `admin.brewery-*` para
  `/admin/clientes/{slug}/operacao/{modulo}/...` e envelopar 24 rotas
  `admin.clientes.riomed.*` no `ClientOperationShell`.
- **Onda E — Domínios & Deploy**: consolidar painel único de DNS/SSL/build por
  cliente em `/admin/clientes/{slug}/dominio`, unificando o que hoje vive em
  `/core/dominios` e `/admin/deploy-status`.

