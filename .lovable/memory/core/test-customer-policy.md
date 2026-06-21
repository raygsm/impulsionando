---
name: Cliente-teste padrão Impulsionando
description: raygsmonnerat@gmail.com é cliente-teste obrigatório em todo tenant Impulsionando; raygs@hotmail.com é admin master global
type: preference
---

# Política de contas master Impulsionando

Toda implementação Impulsionando (atual e futura) deve garantir:

## 1. `raygs@hotmail.com` — Admin master global
- Papel `admin` em `public.user_roles` **sem `company_id`** (vale para todos os tenants).
- Acesso pleno, indeterminado, sem qualquer gate de billing/módulo/tenant.
- `is_impulsionando_staff(auth.uid())` deve retornar true.

## 2. `raygsmonnerat@gmail.com` — Cliente-teste padrão
- `consumer_profiles` + `consumer_memberships` (plan `premium`, status `active`) ativos.
- Cadastrada como `customers` em **toda empresa real** (não master, não demo, não E2E), com tags `impulsionando_test` e `cliente_teste_master`.
- Função `public.ensure_impulsionando_test_customer(company_id uuid)` faz o vínculo idempotente.
- Trigger `companies_seed_impulsionando_test_customer` (AFTER INSERT em `public.companies`) cadastra automaticamente em novas empresas reais.
- Objetivo: navegar e testar como cliente real (pushes, avisos, campanhas, jornadas).

## Em projetos novos
Ao criar a base Impulsionando: rodar a mesma estrutura (função `ensure_impulsionando_test_customer` + trigger em `companies`) e fazer backfill nas empresas já cadastradas.
