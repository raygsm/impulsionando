# A — Auditoria Visual do Site Público (W110.A)

> Escopo: **site público** do Core Impulsionando e tenants públicos (`chrismed.*`, `riomed.*`, `marocas.*`, `wmp.*`, `clube`, `showroom.*`, `demo.*`, marketing). 100% visual/UX/SEO — sem mexer em backend, RLS, auth, tenants ou pagamentos (trava `frontend-only-lock`).
>
> Complementa `AUDIT_FRONTEND_CORE_W110.md` (que cobria também área autenticada). Aqui a lente é do visitante anônimo.

Legenda de severidade:
- **P0** — bloqueia conversão / erra a marca / quebra confiança.
- **P1** — atrito significativo, dá para navegar mas com fricção.
- **P2** — polimento, ganho incremental.

---

## 1. Núcleo Institucional

Rotas: `/`, `/sobre`, `/contato`, `/ecossistema`, `/solucoes`, `/empresas`, `/consumidor`, `/canal-oficial`, `/central-de-ajuda`, `/suporte`, `/termos`.

| Achado | Severidade | Recomendação |
|---|---|---|
| Home mistura demonstrações, showroom e institucional sem hierarquia clara acima da dobra | P0 | Definir 1 promessa + 1 CTA primário + 1 CTA secundário; empurrar demos/showroom para segunda dobra |
| `/sobre`, `/ecossistema`, `/solucoes` compartilham vocabulário sem diferencial visível | P1 | Padronizar template (proposta → prova → jornada → CTA), diferenciar por escopo (empresa, ecossistema técnico, catálogo) |
| `/canal-oficial` e `/central-de-ajuda` sem sinalização visual de "canal oficial verificado" | P1 | Selo/badge de verificação, número WhatsApp oficial em destaque, aviso de golpe |
| `/termos` sem sumário/âncoras internas | P2 | TOC lateral com scroll spy |
| Rodapé padrão sem prova social (contadores, clientes, imprensa) | P1 | Bloco de logos + "quem confia" antes do rodapé legal |
| Meta description genérica em várias rotas institucionais | P0 | Reescrever `<meta name="description">` únicos por rota (≤ 160 chars) |
| `og:image` do core aparece em todas as rotas de tenant (chrismed, riomed, marocas) | P1 | `og:image` por leaf/tenant no `head()` da rota |

## 2. Onboarding / Ativação

Rotas: `/contratar`, `/contratar/sob-medida`, `/checkout`, `/checkout/$slug`, `/checkout/success`, `/trial`, `/trial_/cadastro`, `/demo`, `/demo/*`, `/escolher-nicho`, `/como-funciona/fitness`.

| Achado | Severidade | Recomendação |
|---|---|---|
| Existem 2 fluxos de "escolher nicho" (`/escolher-nicho` e `/demo/escolher-nicho`) sem diferenciação | P0 | Unificar em `/escolher-nicho` com estados (demo x contratação) via querystring |
| 22 rotas `/demo/*` sem página-índice que apresente o que existe | P0 | `/demo` deve ser catálogo visual dos demos, agrupado por vertical |
| Sem indicador de progresso em `/contratar` → `/checkout/$slug` → `/checkout/success` | P1 | Stepper (Escolher plano · Dados · Pagamento · Confirmação) |
| `/checkout/success` sem próximos passos claros (baixar app, entrar no portal, WhatsApp) | P0 | Cards de "próximos 3 passos" + link para /clube ou /app |
| `/trial` e `/trial_/cadastro`: nomenclatura de arquivo com underscore confunde link builder | P2 | Renomear para `/trial/cadastro` (rota, não arquivo) — sinalizar ao Codex quando trava permitir |
| `/como-funciona/fitness` é o único vertical documentado — 12 nichos sem página equivalente | P1 | Criar template dinâmico `/como-funciona/$nicho` reaproveitando conteúdo do showroom |

## 3. Showroom / Vitrine de Módulos

Rotas: `/showroom` (55 leaves), `/vitrine`, `/vitrine/$slug`, `/catalogo`.

| Achado | Severidade | Recomendação |
|---|---|---|
| `/showroom` tem 55 páginas sem hub de navegação | P0 | Reorganizar `showroom.index.tsx` em 4-6 categorias (Vendas · Operação · Financeiro · Marketing · Integrações · Confiança) com busca |
| Falta breadcrumb entre `/showroom` → `/showroom/crm` etc. | P1 | Breadcrumb + link "ver todos" no header |
| Cada leaf do showroom precisa de: hero + 3 benefícios + demonstração visual + CTA "testar grátis" | P1 | Auditar amostra (crm, agenda, financeiro, whatsapp, marketing) e padronizar |
| `/vitrine/$slug` e `/catalogo` não deixam claro o que é catálogo de módulos vs. catálogo de produtos B2B | P0 | Definir escopo em cada H1 e no `<title>`; separar visualmente |
| Nenhum leaf do showroom tem `og:image` próprio | P1 | Gerar 3-6 capas reutilizáveis por categoria e mapear no `head()` |
| Comparativo de concorrentes (`/showroom/comparativo-concorrentes`) sem prova/fonte | P0 | Tabela com fontes citadas, data e disclaimer — risco reputacional |

## 4. Tenants Públicos

### 4.1 CHRISMED (`/chrismed/*` — 12 leaves)

| Achado | Severidade | Recomendação |
|---|---|---|
| Cabeçalho e rodapé usam o do Core (logo Impulsionando visível) | P0 | `TenantBrandingProvider` deve trocar logo, cores primárias e rodapé para CHRISMED |
| `og:image` = capa Impulsionando; deveria ser branding CHRISMED | P0 | `head()` por rota com imagem CHRISMED |
| `/chrismed/agendar` sem confirmação visual pós-envio | P1 | Tela/estado de sucesso com número de protocolo e canais alternativos |
| `/chrismed/dra-cristiane` sem schema `Person`/`MedicalBusiness` | P1 | JSON-LD via `scripts` do `head()` |
| Ausência de sinal "Powered by Impulsionando" opcional no rodapé | P2 | Componente `PoweredByImpulsionando` (já existe) precisa ser ligado no shell público |

### 4.2 RIOMED (`/riomed/*` — 13 leaves, mercado LATAM)

| Achado | Severidade | Recomendação |
|---|---|---|
| Mistura pt-BR e es-ES em vários leaves (`cotizar` × `cotização`) | P0 | Definir idioma primário (es-419) e usar `lang` no `<html>` da subárvore |
| Sem seletor de país/idioma visível | P1 | Language switcher no topbar do tenant |
| `/riomed/v/$slug` (vitrine dinâmica) sem loader que popule `head()` — títulos genéricos | P0 | `loader` + `head({ loaderData })` com título/descrição/og:image do vendedor |
| CTAs de cadastro (fornecedor, técnico, vendedor) espalhados sem hub | P1 | `/riomed/participar` como hub único |

### 4.3 Marocas / Beer House / Eventos

| Achado | Severidade | Recomendação |
|---|---|---|
| `/demo/beer-house` e `/demo/eventos` são as únicas amostras visíveis do vertical | P1 | Promover a `/nichos/bar` e `/nichos/eventos` com dados de demo |
| Não há vitrine pública equivalente para bar/eventos | P1 | Criar template mínimo (hero + módulos + preço + CTA demo) |

### 4.4 WMP (`/wmp/*`)

| Achado | Severidade | Recomendação |
|---|---|---|
| `/wmp` sem hero que explique quem é WMP para quem chega direto | P0 | Bloco de contexto: o que é, para quem, como funciona, próximo passo |
| `/wmp/orcamento` sem sinal de tempo de resposta | P1 | "Retorno em até X h úteis" + canais alternativos |
| `/wmp/obrigado/$tipo` sem cross-sell/próximo passo | P2 | 2 CTAs (WhatsApp e retornar ao site) |

## 5. Clube (Consumidor Final)

Rotas: `/clube`, `/clube/login`, `/clube/cadastro`, `/consumidor`.

| Achado | Severidade | Recomendação |
|---|---|---|
| `/clube` e `/consumidor` competem sem hierarquia | P0 | `/clube` é a página comercial; `/consumidor` deve redirecionar ou ser removida |
| Falta prova de benefícios com números (quantas marcas, quanto economiza) | P1 | Bloco "por que Clube" com métricas reais |
| Login/cadastro sem opção social (Google) visível | P1 | Botão Google no topo do formulário (config depende de backend, mas UI deve prever) |

## 6. Sinal / Confiança / Legal

Rotas: `/status`, `/status/$slug`, `/status/embed`, `/termos`, `/unsubscribe`, `/conta-suspensa`.

| Achado | Severidade | Recomendação |
|---|---|---|
| `/status` sem "última atualização" em destaque | P1 | Timestamp fixo no topo + auto-refresh |
| `/conta-suspensa` sem CTA claro para regularizar | P0 | 2 CTAs (Regularizar pagamento · Falar com atendimento) |
| Ausência de página `/privacidade` (LGPD) | P0 | Criar `/privacidade` linkada no rodapé e no LGPDBanner |
| `/unsubscribe` sem confirmação visual do e-mail removido | P1 | Estado de sucesso com opção de reinscrever |

## 7. SEO Público Transversal

| Achado | Severidade | Recomendação |
|---|---|---|
| Somente `__root.tsx` seta `og:image` — ele vaza para todas as rotas | P0 | Mover para leaves; nunca setar `og:image` no root (já corrigido em W109, revisar) |
| `canonical` ausente na maioria das rotas | P0 | Adicionar `links: [{ rel:"canonical", href:"https://impulsionando.com.br/…" }]` em cada leaf |
| Falta `sitemap.xml` atualizado para as rotas públicas | P1 | Regenerar `public/sitemap.xml` cobrindo as 177 rotas públicas |
| JSON-LD `Organization` apenas no root | P1 | Adicionar `Article` em blog/showroom, `Product` em vitrine, `LocalBusiness` em chrismed/riomed |
| Meta OG por tenant não segue branding do tenant | P0 | ver seção 4 |
| Tempo até 1ª interação (TTI) impactado por logo grande e sem `width/height` até W109 | P2 | Já corrigido (`LogoImpulsionando` dimensionado); manter regra para novas imagens |

## 8. Acessibilidade Pública

| Achado | Severidade | Recomendação |
|---|---|---|
| Botões-ícone sem `aria-label` em vários shells públicos | P1 | Auditar `<Button size="icon">` e adicionar label |
| Contraste em cards translúcidos sobre hero escuro fica < 4.5:1 | P1 | Tokens `bg-card/80` sobre imagens: usar `bg-card` sólido ou `backdrop-blur` mais escuro |
| Skip-link ("Pular para conteúdo") ausente no shell público (existe no autenticado) | P1 | Portar `<a href="#main-content">` para o layout marketing |
| Vídeos/animações sem `prefers-reduced-motion` respeitado | P2 | CSS media query global |

## 9. Mobile

| Achado | Severidade | Recomendação |
|---|---|---|
| Menu público em rotas de tenant colapsa mas esconde CTAs primários | P0 | CTA primário fixo no bottom em mobile (`fixed bottom-0`) por tenant |
| Hero do showroom tem tipografia grande demais em < 375px | P1 | `clamp()` na tipografia do hero |
| Formulários (`/contato`, `/chrismed/agendar`) sem `inputMode`/`autocomplete` | P1 | Adicionar por campo (`tel`, `email`, `postal-code`, etc.) |

---

## Ordem sugerida de execução (dentro da trava)

1. **P0 SEO transversal** — canonicals + og:image por leaf + descriptions únicas (rotas /, /sobre, /contato, /clube, cada tenant index, cada showroom leaf).
2. **P0 CHRISMED/RIOMED branding** — `TenantBrandingProvider` deve trocar logo/cores/og por hostname.
3. **P0 Hub do Showroom** — reorganizar `showroom.index.tsx` em categorias + busca.
4. **P0 Home hero + CTA hierarchy**.
5. **P0 /checkout/success + /conta-suspensa** próximos passos.
6. **P0 /privacidade** (LGPD).
7. **P1** em ondas por vertical.

Nada aqui altera backend. Cada item vira uma PR de front curta.
