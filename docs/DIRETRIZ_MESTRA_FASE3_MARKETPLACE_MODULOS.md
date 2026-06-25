# Diretriz Mestra Final - Fase 3: Marketplace de Modulos

Data: 2026-06-25  
Branch: `codex/security-autonomy-audit`  
Escopo: consolidar base backend de marketplace de modulos, precificacao administravel e rollback por tenant. Nao houve alteracao visual, producao ou banco real.

## Total de fases

O plano completo tem 7 fases:

1. Auditoria do Core.
2. Criacao segura de tenants.
3. Marketplace de modulos.
4. Cobranca, wallet e Mercado Pago.
5. N8N e automacoes por tenant.
6. Reducao do Lovable a legado.
7. Validacao final de independencia.

## Objetivo da Fase 3

Preparar o Core Impulsionando para controlar, pelo dashboard master:

- quais modulos existem;
- quais modulos podem ser contratados;
- preco mensal e setup por modulo;
- versao instalada por cliente;
- rollback de modulo por tenant;
- auditoria de alteracoes.

## Decisao tecnica

O preco de modulo nao deve depender da constante estatica `MODULE_PRICE_CENTS` como fonte oficial.

O Core ja possui colunas comerciais em `modules`:

- `monthly_price`;
- `setup_fee`;
- `status_comercial`;
- `show_in_checkout`;
- `show_in_plans`;
- `allow_standalone`;
- `allow_combo`;
- `allow_white_label`;
- `allow_trial`.

Assim, a Fase 3 usa `modules` como fonte de verdade para o marketplace administravel.

## Correcoes aplicadas

### 1. Catalogo comercial vindo do Core

Arquivo: `src/lib/modules.functions.ts`

Nova funcao:

- `listModuleMarketplacePricing`

Ela retorna modulos ativos com:

- preco mensal em centavos (`monthly_price_cents`);
- setup em centavos (`setup_fee_cents`);
- flags comerciais;
- status tecnico/comercial;
- indicacao se o modulo esta contratavel (`is_contractable`).

### 2. Conversao padronizada de preco

Nova funcao:

- `moduleMonthlyPriceCents`

Ela converte `monthly_price` decimal para centavos e aceita `base_price_cents` quando existir.

### 3. Rollback versionado por tenant

Nova funcao:

- `rollbackClientModuleVersion`

Regras:

- exige `companyId`, `slug`, `version` e `reason`;
- valida se o modulo existe;
- valida se a versao existe em `module_versions`;
- valida se o modulo esta ativo no cliente;
- troca `company_modules.installed_version`;
- registra auditoria com `module.rollback`.

## Teste adicionado

Arquivo: `tests/module-marketplace-static.test.ts`

Ele bloqueia regressao para:

- ausencia da funcao de catalogo comercial;
- rollback sem validar `module_versions`;
- backend de modulos usando `MODULE_PRICE_CENTS` ou `CATALOG_MODULES` como fonte de verdade.

## Validacao executada

O workspace local segue sem `node_modules`; por isso a validacao executavel foi feita com Node puro, replicando as regras criticas dos testes estaticos.

Tambem foi executado:

- `git diff --check`

## Proxima fase

Fase 4 - Cobranca, wallet e Mercado Pago.

Objetivo:

- definir Mercado Pago como gateway oficial;
- parametrizar fallback Pix/WhatsApp;
- validar taxas da plataforma;
- preparar upgrade/downgrade financeiro por plano/modulo;
- consolidar repasses, wallet e suspensao automatica.
