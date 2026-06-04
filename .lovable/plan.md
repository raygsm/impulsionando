O logo foi aumentado para h-16 / h-20 / h-24, e o container do header para h-20 / h-24 / h-28. Os itens de navegação e botões continuam com espaçamento pequeno (px-3 py-2, gap-1, text-sm, size="sm"), o que deixa o header visualmente desbalanceado — os elementos internos parecem "flutuando" em um container muito alto.

Ajustes no `PublicHeader.tsx`:

1. **Aumentar o gap da nav desktop** de `gap-1` para `gap-2` para melhor respiro entre os itens.
2. **Aumentar o padding vertical dos links de navegação** (`Início`, `Planos`, `Orçamento`) de `py-2` para `py-2.5` no mobile/tablet e `py-3` no desktop, mantendo `text-sm` legível.
3. **Aumentar o padding dos dropdown triggers** (`Soluções`, `Demonstrações`, `Empresa`) de `px-3 py-2` para `px-3 py-2.5` no mobile/tablet e `px-4 py-3` no desktop.
4. **Aumentar os botões de ação** (`Demonstração`, `WhatsApp`, `Entrar`) de `size="sm"` para `size="default"` no desktop (lg) para que tenham altura proporcional ao header maior. Manter `size="sm"` apenas em telas menores onde o espaço é restrito.
5. **Aumentar o ícone do logo** se necessário e ajustar o `Link` container do logo para melhor alinhamento vertical (`items-center` já existe, verificar se precisa de ajuste fino).
6. **Ajustar o menu mobile** — os itens do Sheet continuam bons, mas os botões de ação no final do menu mobile podem passar para `size="default"` para melhor área de toque.

Mudanças apenas no arquivo `src/components/marketing/PublicHeader.tsx`, sem afetar rotas ou lógica.