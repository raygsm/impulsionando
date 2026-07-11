# CrisMed · Auditoria Wave 1

**Data:** 2026-07-11  
**Escopo:** 17 rotas `/chrismed/*`, viewports 390×844 (mobile) e 1280×1800 (desktop).  
**Evidências:** `/mnt/documents/chrismed-audit/{mobile,desktop}_<rota>.png` (34 arquivos).

---

## 1. Veredito

A base editorial está madura (tom, tipografia serif, paleta verde-marfim, ausência de excessos), mas a plataforma ainda entrega **percepção de "template editorial", não de clínica premium**. Faltam três dimensões estruturais:

1. **Direção de arte visual** (fotos, vídeos, ilustrações, ritmo, profundidade). Hoje tudo é tipografia + ícone monocromático sobre bege.
2. **Sistema de header/navegação real** (o header atual quebra em mobile e desktop simultaneamente — problema crítico de confiança).
3. **Provas, números e camadas de reasseguramento** (CRM, LGPD, ANVISA, depoimentos, indicadores) — obrigatórias em medicina privada de alto padrão.

Antes de qualquer novo módulo, a Wave 2 (arquitetura) e a Wave 3 (design system) precisam eliminar os 7 pontos críticos abaixo.

---

## 2. Achados críticos (bloqueiam a percepção premium)

### C1. Logo `CHRISMED` estoura o container em todas as rotas
- **Desktop 1280:** o wordmark "CHRISMED" ocupa ~480px e colide com o menu; a última letra fica atrás da barra de idioma. Aparece ainda uma versão duplicada "MD" fantasma logo abaixo (fallback de logo mal posicionado).
- **Mobile 390:** o wordmark é cortado no "E" — o usuário vê "CHRISME".
- **Impacto:** primeira coisa que qualquer visitante vê está quebrada. Zero credibilidade.
- **Correção Wave 2/3:** substituir wordmark por marca compacta (monograma "C" + wordmark responsivo com `clamp()`), remover o "MD" fantasma, garantir `max-width` do container do logo.

### C2. Menu desktop com wraps de 2–3 linhas
- Itens com labels compostas ("Dra. Christiane", "Consulta domiciliar", "Consulta no consultório", "Área dos Médicos") quebram dentro do header, empurram o layout e desalinham o CTA "Empresa".
- Não há tratamento de nowrap, nem agrupamento por dropdown, nem versão compacta.
- **Correção Wave 2:** IA reorganizada em 5 grupos → `Clínica ▾  Modalidades ▾  Médicos  Empresa  Contato` com dropdown desktop.

### C3. Sem menu mobile
- Em 390×844 o header inteiro desaparece: só sobra o logo cortado e o botão flutuante do Oliver. **Não existe hamburger nem drawer.**
- **Impacto:** navegação impossível em mobile — que é ≥70% do tráfego esperado.
- **Correção Wave 2:** drawer full-height com CTAs, contato, idioma e link direto para Oliver.

### C4. Sem hero visual em toda a plataforma pública
- Home, especialidades, Dra. Christiane, ocupacional, teleconsulta, domiciliar, exames, internacional, ofertas, FAQ, contato — **nenhuma rota tem foto, vídeo, ilustração ou padrão gráfico**. Só tipografia sobre bege.
- Isso é o principal motivo da percepção "site de conteúdo", não "clínica premium".
- **Correção Wave 3/4:** direção de arte com (a) retrato editorial da Dra. Cristiane, (b) fotografia de consultório em Copacabana, (c) vídeo curto looped no hero, (d) padrão gráfico sutil de fundo (grain + gradient verde profundo).

### C5. Rodapé com logo duplicado
- Nas rotas com footer (especialidades, checkout) o wordmark "CHRISMED" repete o problema do header e ainda mostra "M D" sobreposto ao "M" do CHRISMED — dois logos empilhados.
- **Correção Wave 3:** marca única no footer, alinhamento com grid.

### C6. Selo de dev exposto no footer
- Footer mostra `PUBLICAÇÃO EM TEMPO REAL · v.e241b6e · há 4 d`. É log de build — aparece como "beta" para o paciente.
- **Correção Wave 4:** remover ou mover para o admin.

### C7. Estados vazios de filtros em `/medicos`
- Selects de especialidade e modalidade aparecem como dois retângulos brancos sem placeholder — mobile e desktop.
- **Correção Wave 3:** placeholders "Todas as especialidades" / "Todas as modalidades" + ícone.

---

## 3. Achados de aviso (degradação da experiência)

### A1. Stepper de 9 passos ocupa 4 linhas no mobile em `/chrismed/agendar`
Consolidar em stepper compacto (`Etapa 2 de 9 · Médico`) + barra de progresso fina.

### A2. Botão "Empresa" amarelo é o item visualmente mais pesado do header
Amarelo puro compete com o CTA principal "Agendar consulta". Reduzir peso: outline amarelo + ícone `Building2`, deixando o amarelo para conversão real.

### A3. `Falar com Oliver` flutuante cobre conteúdo no mobile
Em várias rotas o pill do Oliver esconde o último card / última linha. Adicionar `padding-bottom` de safe-area ou ancorar em `bottom-sheet` com handle.

### A4. Cards de especialidades sem hierarquia
9 cards idênticos em `/especialidades`. Clínica Médica e Medicina Internacional (diferenciais da Dra.) deveriam ter tratamento featured.

### A5. Tipografia display muito literária
Cormorant/Playfair combina com magazine, mas em medicina premium moderna cria dissonância com Inter. Testar Wave 3 com par **Fraunces (display humanista) + Söhne/Geist (sans premium)** para um tom mais clínico e menos "revista de moda".

### A6. Área do paciente com abas cortadas no mobile
"Meus dado…" é cortado. Migrar para tab-scroll ou ícones-only no mobile.

### A7. Sem breadcrumbs em rotas profundas
Sem contexto de onde o usuário está dentro da jornada.

### A8. Copy dos H1 muito longos
Home: "Cuidado clínico que pertence a você." → 4 linhas no mobile. Reduzir para 2 linhas com quebra intencional.

### A9. Checkout desktop com resumo mal proporcionado
Coluna do resumo (direita) ocupa 1/3 e deixa vazio abaixo; PIX preenchido escuro versus Cartão outline claro criam desequilíbrio visual.

---

## 4. Achados de polimento

- **P1.** Ícones lucide monocromáticos genéricos — substituir por iconografia própria (linear, peso 1.5, com cantos suavizados) em áreas de destaque (modalidades, especialidades principais).
- **P2.** Nenhum indicador quantitativo público (anos de atuação, pacientes atendidos, idiomas, tempo médio de resposta). Obrigatório em clínica premium.
- **P3.** Nenhum selo regulatório visível (CRM da Dra., LGPD, ANVISA quando aplicável).
- **P4.** Nenhum depoimento / prova social — nem placeholder para receber quando existirem.
- **P5.** Foco visível ausente em botões escuros (`focus-visible` outline sumindo sobre verde).
- **P6.** Nenhuma microinteração: hover em cards não muda profundidade, CTAs não respiram.
- **P7.** `og:image` provavelmente ausente ou genérico — verificar Wave 4.
- **P8.** Nenhuma preparação para vídeo institucional / vídeo Dra. / vídeo consultório.
- **P9.** Motion: zero motion tokens definidos. Wave 3 precisa entregar 4 curvas (entry, exit, hover, section-reveal).
- **P10.** Header/footer aparecem em `/chrismed/agendar` (fluxo transacional) — deveriam ser reduzidos (só logo + safety exit + progress) para reduzir abandono no funil.

---

## 5. Prioridades para as próximas ondas

| Onda | Escopo | Achados endereçados |
|------|--------|--------------------|
| **Wave 2** — Arquitetura | IA + navegação (header desktop com dropdown, drawer mobile, breadcrumbs, header reduzido no funil) | C1, C2, C3, A7, P10 |
| **Wave 3** — Design System | Nova paleta (verde profundo + marfim + âmbar accent), tipografia (Fraunces + Geist), motion tokens, componentes (Button, Card, Section, Hero, Media, Stepper, Stat, Quote, Timeline, FAQ), estados vazios, foco visível | C4 (base), C5, C7, A1, A2, A5, A6, A8, A9, P1, P5, P6, P9 |
| **Wave 4** — Experiência Pública | Hero visual real, seções para vídeo/imagem, provas sociais, indicadores, selos, direção de arte por rota | C4, C6, A4, P2, P3, P4, P7, P8 |
| **Wave 5** — Oliver | Concierge integrado em todas as rotas, contextual por página, handoff humano | A3 |
| **Wave 6** — Conversão & Relacionamento | Régua visual, provas, CTAs por estágio | P2, P4 |
| **Wave 7** — Mobile Premium | Refino 380px → 1440px, thumb-zone, sticky CTAs | A3, A6 |
| **Wave 8** — Refinamento | Micro-interações, polimento tipográfico, acessibilidade AA | P5, P6 |

---

## 6. Guardrails inegociáveis para todas as próximas ondas

1. **Zero cor hardcoded** em componentes. Tudo via tokens `--chrismed-*`.
2. **Toda dependência de dado real → `Pendente Codex`** documentada e visualmente sinalizada.
3. **Core Impulsionando preservado**: auth `_authenticated`, RLS, billing, branding, server functions.
4. **Mobile-first**: cada componente nasce em 380px.
5. **Autocrítica ao final de cada onda** antes de declarar concluída.

---

## 7. Próximo passo

Seguir para **Wave 2 — Arquitetura** com foco em resolver C1, C2, C3 (header/logo/mobile menu) e reorganizar a IA em 5 grupos. Entregue como novo `ChrismedShell` + `ChrismedHeader` responsivo + `ChrismedMobileDrawer` + breadcrumbs + variante reduzida para o funil `/agendar` e `/checkout`.
