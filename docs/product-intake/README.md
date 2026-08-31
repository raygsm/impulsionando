# Intake de produto — ideias, problemas e funcionalidades

**Aberto em:** 2026-08-31  
**Dono de produto:** Raygs  
**Intake técnico:** Cauã  
**Status:** ATIVO

## Para que serve

Canal oficial para **Raygs, clientes e equipe** registrarem o que precisa entrar no produto — sem depender só de WhatsApp ou call.

Cada item vira um **arquivo markdown completo** (problema, ideia ou melhoria) que engenharia e agentes conseguem implementar sem adivinhar.

> Este diretório é **entrada de produto**. Não substitui as fases de reengenharia (`docs/reengineering/STATUS.md`). Só vira código quando a fase e as ADRs permitirem.

## Como usar (resumo)

```text
1. Abra um chat no Cursor e cole o prompt de docs/product-intake/AGENTS.md
2. O agente entrevista quem está reportando (perguntas simples, em português)
3. Rascunho vai para caixa-de-entrada/
4. A cada bloco gravado (e no fechamento), o agente faz commit+push
   automático só de docs/product-intake/ — sem pedir permissão
5. Quando completo, o arquivo é movido para aplicacoes/<tenant>/<categoria>/
6. Raygs lê a seção "Resumo para o dono de produto" e aprova
7. Engenharia pega quando a fase permitir
```

## Hierarquia de pastas

```text
docs/product-intake/
├── AGENTS.md                 ← prompt para colar no chat (entrevistador)
├── README.md                 ← este arquivo
├── modelos/                  ← templates em português
├── caixa-de-entrada/         ← rascunhos em entrevista
├── arquivo/                  ← rejeitados / substituídos
├── guias-operacionais/       ← runbooks (testes, auditorias)
└── aplicacoes/               ← destino final por tenant/app
    ├── plataforma/           ← Impulsionando (apex, app, www)
    │   ├── modulos/          ← auth, billing, crm, agenda, …
    │   ├── problemas/
    │   ├── novas-funcionalidades/
    │   └── melhorias/
    ├── chrismed/
    ├── colors-saude/
    ├── wmp/
    ├── csi/
    ├── anamadu/
    ├── riomed/
    ├── marocas/
    ├── revela/
    └── outros/
```

### Categorias (em cada aplicação)

| Pasta | Quando usar |
| --- | --- |
| `problemas/` | Algo **quebrou** ou está errado (bug, tela branca, login, dado errado) |
| `novas-funcionalidades/` | Comportamento **novo** que ainda não existe |
| `melhorias/` | Já existe, mas precisa **ficar melhor** (UX, performance, copy) |
| `especifico-tenant/` | Pedido **só daquele cliente** (custom, exceção, regra local) |
| `modulos/<nome>/` | Só na **plataforma** — quando afeta um módulo do Core (auth, CRM, etc.) |

### Onde salvar o arquivo

| Se afeta… | Caminho |
| --- | --- |
| Site/app Impulsionando (venda, planos, admin master) | `aplicacoes/plataforma/` + módulo se couber |
| Chrismed (clínica, agenda, paciente) | `aplicacoes/chrismed/` |
| Colors Saúde (catálogo, pedidos) | `aplicacoes/colors-saude/` |
| WMP (eventos, propostas) | `aplicacoes/wmp/` |
| Outro subdomínio / vitrine | pasta correspondente ou `aplicacoes/outros/` |

## Nome dos arquivos

```text
YYYY-MM-DD-<tipo>-<slug-curto>.md

Exemplos:
  2026-08-31-problema-login-app-auth.md
  2026-08-31-funcionalidade-exportar-tickets-crm.md
  2026-08-31-melhoria-checkout-copy-planos.md
```

Tipos: `problema` · `funcionalidade` · `melhoria` · `especifico`

## Linear vs repositório

| Ferramenta | Papel |
| --- | --- |
| **Este repo** | Spec **canônica** — critérios, contexto, entrevista |
| **Linear** (opcional) | Status / kanban — ID no nome do arquivo se usar |
| **WhatsApp** | Sempre virar arquivo aqui — nunca ficar só na conversa |

## O que é "completo"

Pronto para **Raygs assinar** quando:

- [ ] `Resumo para o dono de produto` preenchido em linguagem simples
- [ ] Critérios de aceite testáveis
- [ ] Fora de escopo escrito
- [ ] Tenant / ambiente (prod vs staging) explícitos

Pronto para **engenharia** quando additionally:

- [ ] Status = `aprovado`
- [ ] Fase de reengenharia ou hotfix legacy indicada
- [ ] Sem bloqueios em "Perguntas em aberto"

## Agentes

- Entrevista: [`AGENTS.md`](AGENTS.md)
- Regra Cursor: [`.cursor/rules/impulsionando-feature-intake.mdc`](../../.cursor/rules/impulsionando-feature-intake.mdc)

## Relacionados

- Mapa de tenants: `docs/reengineering/01-current-state/product-map/TENANTS-AND-SURFACES.md`
- Reengenharia: `docs/reengineering/README.md`
