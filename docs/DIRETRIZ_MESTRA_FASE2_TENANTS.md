# Diretriz Mestra Final - Fase 2: Criacao de Tenants

Data: 2026-06-25  
Branch: `codex/security-autonomy-audit`  
Escopo: consolidar a criacao segura de tenants/clientes no Core, sem alterar frontend visual, producao ou banco real.

## Objetivo

Reduzir risco no nascimento de novos clientes e preparar o Core Impulsionando para ser a fonte oficial de criacao de tenants, sem depender do Lovable.

## Decisao tecnica

A Fabrica de Projetos (`createProjectFromFactory`) e o caminho canonico para novos clientes.

O provisionador antigo (`tenant-provisioning.functions.ts`) ainda e usado por telas existentes. Por isso ele nao foi removido nesta fase. Ele foi compatibilizado para nao criar dados invalidos enquanto a migracao de telas para a Fabrica acontece em fase posterior.

## Correcoes aplicadas

### 1. Tipo de empresa valido

Antes:

- o provisionador antigo gravava `company_kind = 'tenant'`;
- migrations do banco aceitam apenas `real`, `demo`, `sandbox` e `interna`.

Agora:

- Fabrica grava `real`, `demo` ou `sandbox` conforme ambiente;
- provisionador antigo grava `real`;
- listagem antiga busca `real`, `demo` e `sandbox`, nao mais `tenant`.

### 2. Identidade canonica do tenant

Agora os dois fluxos chamam `provision_tenant_identity` depois de criar/reaproveitar a empresa.

Isso garante registro em `core_tenant_identity`, que e a base para subdominio, dominio proprio, email aliases e isolamento por cliente.

### 3. Vinculo do administrador

Antes:

- o provisionador antigo tentava inserir `user_profiles` sem `profile_id`.

Agora:

- busca o perfil `gestor-empresa`;
- vincula o administrador com `profile_id`;
- preserva `user_roles` para compatibilidade com partes antigas.

### 4. Plano do tenant

Antes:

- o provisionador antigo tentava gravar plano em `core_company_plans`, que e catalogo de planos, nao contrato do cliente.

Agora:

- quando plano e informado, cria/atualiza `billing_contracts`, seguindo o modelo correto do Core.

## Teste adicionado

Arquivo: `tests/tenant-provisioning-static.test.ts`

Este teste bloqueia regressao para:

- `company_kind = 'tenant'`;
- filtro por `company_kind = 'tenant'`;
- fluxo sem `provision_tenant_identity`;
- vinculo de admin sem `profile_id`;
- plano gravado no catalogo em vez de contrato.

## Validacao executada

Como o workspace local nao possui `node_modules` e o ambiente nao conseguiu baixar Vitest, a validacao foi feita com Node puro, replicando as mesmas regras do teste.

Resultado: passou.

`git diff --check`: passou.

## Pendencias da proxima fase

Fase 3 deve consolidar marketplace de modulos:

- preco de modulo vindo de configuracao/banco, nao constante fixa;
- upgrade/downgrade por plano;
- rollback versionado por tenant;
- instalacao/desinstalacao governada pelo dashboard master.
