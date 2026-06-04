## Objetivo

Criar/incrementar a apresentação comercial por nicho usando a estrutura e a copy que você forneceu, **sem tocar em banco, autenticação, módulos do app autenticado, nem nas demos já funcionais** (`/demo/cliente-final`, `/demo/white-label`, `/showroom/fitness`, `/modulos/$slug`, etc.).

## O que já existe e será preservado

- `/` Home (com SAIBA MAIS por módulo)
- `/modulos` (lista) e `/modulos/$slug` (página por módulo)
- `/solucoes` (visão geral por setor)
- `/demo/cliente-final`, `/demo/white-label`, `/demo/index`
- `/showroom/fitness`, `/como-funciona/fitness`
- `/orcamento`, `/contato`, `/planos`, `/trabalhe-conosco/*`
- `/auth`, `/reset-password*`, termos, privacidade
- Toda a área `/_authenticated/*` (CRM, agenda, vendas, BI etc.)

Nada disso será removido nem refeito.

## Arquitetura (nova, aditiva)

1. **Novo catálogo central** `src/components/marketing/nichoDetails.ts`
   - Tipo `NichoDetail` com: `slug`, `title`, `subtitle`, `icon`, `hero`, `pains[]`, `silentLosses[]`, `solution[]`, `journey[]` (passos), `modules[]` (referência aos módulos), `benefits[]`, `whatsappBlock` (override opcional), `ctaPrimary`, `ctaSecondary`, `demoRoute?`.

2. **Componente reutilizável** `src/components/marketing/NichoPage.tsx`
   - Renderiza hero + dores + perdas silenciosas + solução + jornada visual passo-a-passo + módulos recomendados (chips clicáveis para `/modulos/$slug`) + bloco WhatsApp passivo+ativo + benefícios + CTA fixo (WhatsApp + demo + consultor).
   - Inclui SEO `head()` por nicho (title, description, og:*).

3. **Rota dinâmica** `src/routes/nichos.$slug.tsx`
   - Carrega o nicho do catálogo, 404 se não existir, usa `NichoPage`.

4. **Índice** `src/routes/nichos.index.tsx`
   - Grid de todos os nichos com o card e link para a página.

5. **Nichos entregues nesta etapa** (todos com a copy que você passou):
   - `clinicas` — Clínicas Médicas e Consultórios
   - `bares-restaurantes` — Bares e Restaurantes
   - `microcervejarias` — Microcervejarias
   - `fornecedores` — Fornecedores e Distribuidores
   - `servicos` — Empresas de Serviços
   - `ecommerce` — E-commerce e Varejo
   - `white-label` — White Label (CTA leva para `/demo/white-label`)
   - `fitness` (atalho, reaproveita `/showroom/fitness` como demo)

6. **Bloco WhatsApp universal** `src/components/marketing/WhatsAppBlock.tsx`
   - Texto base passivo 24h + ativo (follow-ups, lembretes, campanhas), embutido em cada nicho e na home.

## Ajustes pontuais em páginas existentes (não-destrutivos)

- `PublicHeader`: adicionar item de menu **Nichos** apontando para `/nichos`.
- `/solucoes`: cada card de setor passa a linkar para `/nichos/<slug>` quando o nicho já existir, mantendo "em breve" para os demais.
- `HomePage`: nova faixa "Soluções por nicho" abaixo dos módulos com 6 cards principais → `/nichos/<slug>`.

## CTAs padrão por página de nicho

- Primário (gradient): **WhatsApp** (`wa.me/5521993075000` com mensagem pré-pronta do nicho).
- Secundário: **Demo do nicho** (link interno quando existe demo; senão `/demo/cliente-final`).
- Terciário: **Orçamento** (`/orcamento`) e **Falar com consultor** (`/contato`).
- CTA fixo no rodapé da página com WhatsApp + demo (igual ao já feito em `/modulos/$slug`).

## Bloco "Módulos recomendados" por nicho

Renderizado a partir do catálogo já existente em `moduleDetails.ts`, escolhendo os ids que fazem sentido (ex.: clínicas → agenda, crm, whatsapp, pagamentos, fiscal, bi). Cada chip leva para `/modulos/$slug`.

## Fora de escopo desta etapa

- Mudanças em RLS, migrations, edge functions ou esquema.
- Refazer/mover demos existentes.
- Novas rotas autenticadas, novos módulos do produto.
- Tradução automática / i18n real (mantemos só o destaque "atendimento em múltiplos idiomas" como mensagem comercial).

## Entregáveis

- 1 catálogo + 1 componente + 2 rotas (`nichos.index`, `nichos.$slug`) + 1 bloco WhatsApp.
- Toda a copy dos 7 nichos seguindo exatamente a estrutura e os textos que você passou (título, subtítulo, dores, perdas silenciosas, como resolve, jornada prática, módulos, benefícios, CTAs).
- Pequenos ajustes em `PublicHeader`, `HomePage` e `/solucoes` para conectar as novas páginas.

Confirma esse plano para eu executar?
