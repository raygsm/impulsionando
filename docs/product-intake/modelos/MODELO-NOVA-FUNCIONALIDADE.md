# Modelo — nova funcionalidade

Copie para `caixa-de-entrada/YYYY-MM-DD-funcionalidade-<slug>.md` e preencha. Apague linhas marcadas `(guia)`.

---

## Metadados

| Campo | Valor |
| --- | --- |
| ID | _ex.: FEAT-001 ou LIN-42_ |
| Título | _nome curto_ |
| Tipo | nova funcionalidade |
| Aplicação | _plataforma / chrismed / colors-saude / wmp / …_ |
| Módulo | _auth / crm / billing / … / geral / n/a_ |
| Solicitado por | _Raygs / nome do tenant / interno_ |
| Data do intake | _AAAA-MM-DD_ |
| Status | rascunho · revisao-produto · aprovado · em-progresso · concluido · rejeitado |
| Prioridade | _P0 bloqueio / P1 / P2 / desejável_ |
| Fase alvo | _hotfix legacy / Fase 1–7 / pós-reengenharia / desconhecido_ |

---

## Resumo para o dono de produto

(guia: 3–6 frases que o Raygs entende sem jargão. O que muda para o usuário? Que dor some?)

---

## Problema e objetivo

### Problema

(guia: O que incomoda hoje? Quem sente? Com que frequência?)

### Objetivo

(guia: Um resultado mensurável — ex.: "Operador exporta tickets em CSV sem pedir ao dev.")

### Fora de escopo

- 
- 

---

## Usuários e contexto

| Quem | Papel | Precisa de quê |
| --- | --- | --- |
| | | |

### Onde no produto

(guia: URLs, menus, tenant, mobile vs desktop.)

---

## Comportamento atual

(guia: O que acontece hoje? Links/prints — sem segredos no repo.)

---

## Comportamento desejado

(guia: Jornada passo a passo em linguagem simples.)

1. 
2. 
3. 

---

## Estrutura conceitual

(guia: Entidades e relações em termos de negócio — ainda não SQL.)

```text
Exemplo:
  Ticket pertence à Empresa (tenant)
  Operador pertence à Empresa com papel Suporte
  Exportação = lista filtrada → arquivo CSV
```

### Regras de negócio

- 
- 

---

## Definições técnicas (engenharia)

(guia: Preencher após entrevista; marcar DESCONHECIDO se pendente.)

| Tópico | Definição |
| --- | --- |
| Tenants afetados | _todos / lista / só plataforma_ |
| Superfície de auth | _logado / público / API_ |
| Dados lidos/escritos | _domínios; staging primeiro?_ |
| Integrações | _Supabase / n8n / pagamento / WhatsApp / nenhuma_ |
| Isolamento multi-tenant | _não vazar company_id — testes de negação?_ |
| Prod vs staging | _provar em staging antes?_ |

### Pontos de API / UI (se souber)

- 

### Migração / schema

- _expand-only / sem schema / DESCONHECIDO_

---

## Critérios de aceite

(guia: Testáveis. Preferir Dado / Quando / Então.)

- [ ] **CA-1:** Dado … Quando … Então …
- [ ] **CA-2:** 
- [ ] **Caso negado:** Usuário do tenant B não pode …

---

## Riscos e dependências

| Risco | Mitigação |
| --- | --- |
| | |

Dependências:

- 

---

## Perguntas em aberto

| # | Pergunta | Dono | Resposta |
| ---: | --- | --- | --- |
| 1 | | Raygs / Cauã | _pendente_ |

---

## Log da entrevista

| Pergunta | Resposta (palavras de quem reportou) | Interpretação |
| --- | --- | --- |
| | | |

---

## Aprovação

| Papel | Nome | Data | OK |
| --- | --- | --- | --- |
| Dono de produto | Raygs | | ☐ |
| Técnico | Cauã | | ☐ |

---

## Registro de implementação

| Campo | Valor |
| --- | --- |
| Início | |
| Branch / PR | |
| Evidências | |
| Verificado em | |
