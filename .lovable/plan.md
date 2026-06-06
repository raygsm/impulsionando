## Diagnóstico do que já existe

- `/demo` (`demo.index.tsx`) — landing com 2 trilhas (white-label / cliente final), já com tooltips e badge "sem cadastro".
- `/demo/white-label` (601 linhas) e `/demo/cliente-final` (1018 linhas) — áreas administrativas demo extensas, já navegáveis.
- `/demo/checklist` — checklist de prontidão.
- `/demo/trial` (82 linhas) — **conceitualmente errado**: trata trial como "ciclo de demonstração de 7 dias" em vez de contratação real com cartão e reembolso.
- `/trial` + `/trial/cadastro` — fluxo real de contratação trial (já existente, com seleção de plano e formulário).
- `/reembolso` — página pública existente.
- Área `_authenticated/` — sistema real completo (CRM, agenda, finance, sales, ehr, affiliates, etc.) já implementado.

**Conclusão:** a maior parte do que o prompt pede já existe. O que falta de verdade é pequeno e cirúrgico.

## O que NÃO vou fazer (evita queimar créditos e quebrar coisas)

- Não reescrever `demo.white-label.tsx` nem `demo.cliente-final.tsx` (1.600 linhas combinadas, já funcionais).
- Não duplicar tooltips/help já existentes.
- Não criar "Tour da Plataforma" como wizard completo (escopo de semanas) — entrego apenas um banner-guia com checklist clicável.
- Não mexer em banco, auth, RLS, edge functions.
- Não tocar nas rotas `_authenticated/*` reais (CRM, agenda, etc.).
- Não implementar fluxo real de reembolso automático no gateway (depende de credenciais externas).

## Plano em 4 ondas pequenas

### Onda A — Correção conceitual de `/demo/trial` (prioridade máxima)

Reescrever `src/routes/demo.trial.tsx` para deixar claro que **trial é contratação real**, não demonstração:

- Bloco comparativo **Demonstração × Trial** (gratuita/fictícia vs contratação real com cartão).
- Explicação: cartão de crédito, acesso liberado, cancelamento + reembolso automático em até 7 dias após o horário do pagamento.
- Lista de status do trial (contratado → aprovado → liberado → cancelamento → reembolso processando/concluído/indisponível → convertido).
- Aviso: "Reembolso automático preparado — aguardando credenciais do gateway."
- CTAs: **Contratar Trial** (→ `/trial`) e **Conhecer Demonstração** (→ `/demo`).
- Tooltip em cada regra (prazo, reembolso, cartão).

Mantém todos os elementos visuais existentes (header/footer públicos, Card, Badge).

### Onda B — Banner "Modo Demonstração" + estados vazios padronizados

Criar 2 componentes reutilizáveis pequenos (não duplicar o que existe):

1. `src/components/demo/DemoModeBanner.tsx` — banner discreto e dispensável (localStorage) que aparece em `/demo/*` com texto "Demonstração — dados fictícios, sem impacto em dados reais" + link para checklist.
2. `src/components/demo/EmptyDemoState.tsx` — estado vazio inteligente com mensagem contextual + botão "Criar exemplo demo" (callback opcional). Reutilizar onde já houver lista vazia óbvia em `demo.white-label.tsx` e `demo.cliente-final.tsx` **sem reescrever as páginas** — só importar e usar em 4-6 pontos.

### Onda C — Tooltips de conceitos-chave

Criar `src/components/demo/HelpTip.tsx` (wrapper fino sobre Tooltip + HelpCircle) com biblioteca de termos: `crm`, `baixa-automatica`, `split-automatico`, `parametrizacao`, `first-touch`, `last-touch`, `permissoes`, `trial`, `reembolso-auto`, `coproducer`, `gerente-afiliados`, `bump`, `upsell`.

Aplicar em **2-3 pontos por página demo** (cliente-final, white-label, affiliates dashboard). Não vou poluir todas as telas.

### Onda D — Auditoria de links mortos nas páginas demo

Script rápido (`rg` em `src/routes/demo.*.tsx` e cards do dashboard) procurando:
- `<Button>` sem `asChild`/`onClick`/`disabled`
- `<Link to="#">` ou `href="#"`
- CTAs que não levam a lugar nenhum

Corrigir os que encontrar (esperado: <10 ocorrências). Se algum recurso não estiver pronto, trocar por mensagem **"Recurso preparado — aguardando configuração final."**

## O que fica explicitamente fora desta entrega

- Onda 4 do checklist gigante (split, comissões, etc.) — já entregue na Onda 4 anterior.
- Tour guiado interativo (driver.js / shepherd) — escopo de feature própria, posso fazer numa próxima rodada se você quiser.
- Reescrita das 2 demos administrativas (1.600 linhas).
- Implementação real de reembolso automático via gateway.
- Revisão de responsividade pixel-a-pixel (entregamos com classes Tailwind já responsivas, sem auditoria visual em 4 viewports).
- Toggles SIM/NÃO em todos os módulos — já existem nas páginas de configurações reais; não vou recriar uma "tela demo de toggles" porque duplicaria.

## Estimativa

- Onda A: 1 arquivo reescrito (~150 linhas).
- Onda B: 2 componentes novos + ~6 substituições.
- Onda C: 1 componente novo + ~8 aplicações.
- Onda D: 0-10 correções pontuais.

Total: ~5 arquivos novos, ~4-5 arquivos editados pontualmente. Nenhuma migração de banco.

## Pergunta

Posso executar as 4 ondas em sequência nesta mensagem, ou você prefere fazer apenas a **Onda A (correção do `/demo/trial`)** primeiro e validar antes de seguir?
