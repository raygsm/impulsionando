---
name: RioMed como tenant do core Impulsionando
description: Impulsionando é core/master; RioMed é tenant. Proibido deletar arquivos riomed em lote sem verificar imports/rotas/links/redirects.
type: constraint
---
Impulsionando é o sistema mãe/master. RioMed é apenas cliente/tenant dentro do core — não é projeto independente neste repositório.

**Proibido:**
- Deletar arquivos `riomed.*` (rotas, componentes, lib, functions, docs, n8n) em lote.
- Remover qualquer arquivo riomed sem antes verificar: (1) imports cruzados, (2) entradas em `src/routeTree.gen.ts`, (3) `<Link to="/riomed/...">` e `navigate("/riomed/...")` no core, (4) redirects/aliases no router, (5) referências em docs/n8n/migrations.

**Obrigatório antes de qualquer remoção:**
1. `rg -l "riomed" src/` para mapear referências.
2. Confirmar que nada no core (não-riomed) importa o arquivo.
3. Preservar redirects para URLs públicas já indexadas.
4. Remover item a item, validando build entre cada um.

**Why:** Remoções em lote anteriores quebraram o route tree e exigiram rollback. RioMed convive no core como tenant — não como projeto paralelo descartável.
