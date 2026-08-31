# Modelo — problema / bug

Copie para `caixa-de-entrada/YYYY-MM-DD-problema-<slug>.md`.

---

## Metadados

| Campo | Valor |
| --- | --- |
| ID | _ex.: PROB-001 ou LIN-43_ |
| Título | |
| Tipo | problema |
| Aplicação | _plataforma / chrismed / …_ |
| Módulo | _se plataforma; senão n/a_ |
| Reportado por | |
| Data | |
| Status | rascunho · confirmado · em-progresso · corrigido · nao-vai-corrigir |
| Severidade | _P0 prod parado / P1 grave / P2 menor / cosmético_ |
| Ambiente | _prod / staging / local + URL_ |

---

## Resumo para o dono de produto

(Linguagem simples: o que está quebrado na visão do usuário.)

---

## Passos para reproduzir

1. 
2. 
3. 

**Esperado:**  
**O que acontece:**  

---

## Escopo

| Pergunta | Resposta |
| --- | --- |
| Quem é afetado? | _um tenant / todos / um usuário_ |
| Desde quando? | _data ou "sempre"_ |
| Bloqueia trabalho? | _sim/não_ |
| Regressão? | _funcionava antes? última versão boa?_ |

---

## Evidências (sem segredos)

- URL / tenant / tela:
- Print ou vídeo: _caminho ou "no Linear"_
- Mensagem de erro (texto exato):

---

## Notas técnicas

| Tópico | Notas |
| --- | --- |
| Camada provável | _frontend / API / Supabase / nginx / DNS / desconhecido_ |
| Legacy vs reengenharia | |
| Seguro testar em staging? | |

---

## Critérios de aceite (corrigido quando)

- [ ] Passos de reprodução não falham em _ambiente_
- [ ] Sem regressão em _fluxo relacionado_
- [ ] _opcional: teste automatizado_

---

## Log da entrevista

| Pergunta | Resposta | Notas |
| --- | --- | --- |
| | | |

---

## Registro de resolução

| Campo | Valor |
| --- | --- |
| Causa raiz | |
| PR / commit | |
| Verificado por | |
| Data de fechamento | |
