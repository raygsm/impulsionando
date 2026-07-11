# CHRISMED V4 — componentes visuais isolados (NÃO MONTADOS)

Estes componentes existem apenas como esqueletos visuais. Nenhum é
importado por rotas, layouts, providers ou hooks ativos.

Regras:

- sem `useEffect` de fetch, sem `supabase`, sem `setInterval` de UX;
- sem mocks, sem fixtures embutidas;
- todo dado entra por props tipadas em `src/content/chrismed/v4/contracts.ts`;
- estados são renderizados a partir da prop `state`, jamais inferidos por timer;
- countdown de hold e expiração PIX renderizam `expires_at` do backend — se
  ausente, mostram placeholder textual, nunca contagem client-side.

Antes de montar qualquer arquivo daqui em uma rota real, o Codex precisa
entregar os contratos listados como `TODO(Codex)` em `contracts.ts` e a
recompilação da V4 deve passar por nova auditoria.
