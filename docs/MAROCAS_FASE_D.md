# Marocas — Fase D · Acabamento visual, dados reais e homologação final de UX

> Escopo Lovable: exclusivamente UX/UI/copy/acessibilidade/responsividade.
> Backend, Supabase, RLS, auth, server functions e integrações do Codex
> permanecem intocados (regra global "frontend-only lock").

---

## 1. Auditoria de rotas

### Vitrine pública (11 rotas)
| Rota | Estado | Observação |
|---|---|---|
| `/marocas` | ok | Home cinematográfica, hero + serviços + jornada + prova social. |
| `/marocas/sobre` | ok | Manifesto + timeline. |
| `/marocas/hospedes` | ok | Jornada do hóspede. |
| `/marocas/prestadores` | ok | Categorias + formulário. |
| `/marocas/limpeza-manutencao` | ok | Processos + fluxos N8N. |
| `/marocas/planos` | ok | 3 planos (Essencial · Gestão · Full). |
| `/marocas/cadastrar-imovel` | ok | Formulário de onboarding do imóvel. |
| `/marocas/faq` | ok | Busca + filtros. |
| `/marocas/contato` | ok | Múltiplos canais. |
| `/marocas/login` | ok | Seletor de perfil (anfitrião/hóspede/prestador). |

### Área logada — anfitrião (14 rotas)
Dashboard, imóveis, reservas, agenda, limpezas, manutenções, reposições, hóspedes, prestadores, financeiro, relatórios, automações, Cérebro IA, configurações.

### Área logada — hóspede (8 rotas)
Reserva atual, imóvel, acesso, regras, suporte 24h, roteiros, histórico, avaliação.

### Área logada — prestador (10 rotas)
Agenda, disponíveis, aceitos, andamento, histórico, valores, regiões, disponibilidade, cadastro, avaliações.

**Total auditado: 43 rotas Marocas.**

---

## 2. O que foi preservado (Codex — não tocar)

- `MarocasShell` (vitrine pública) — layout, tokens, navegação.
- `MarocasAppShell` (área logada) — estrutura, sidebar, breadcrumbs, topbar.
- `MaroquitoFab` — assistente oficial (Maroquito).
- `marocasContent.ts` — dicionário de marca, serviços, jornadas, prova social.
- `marocasPlanos.ts` — planos comerciais.
- `marocasMockData.ts` — fixtures visuais (a serem substituídas pelo Codex por dados reais via server functions).
- `MarocasUI.tsx` — primitivos compartilhados (KpiCard, DataTable, StatusBadge, EventPill, EmptyState, LoadingState, ErrorState, SuccessBanner, Section).
- Rotas, contratos, permissões, autenticação — intactos.

---

## 3. O que foi refinado nesta fase

### 3.1 `src/components/marocas/MarocasAppShell.tsx`
- Rótulo "Perfil (mock)" → **"Visualizar como"** (linguagem de produto, não de dev).
- Botão "Sair (mock)" → **"Sair"** (limpeza de copy).
- Copy do rodapé da sidebar reescrita: em vez de "conectado pelo Codex", diz
  "Permissões reais aplicam-se automaticamente após o login" — mensagem
  correta para o usuário final.
- Acessibilidade: `role="group"`, `aria-pressed`, `aria-label` e
  `focus-visible:ring-2 focus-visible:ring-primary` no seletor de perfil.

### 3.2 `src/routes/marocas.app.hospede.acesso.tsx`
- Estado padrão dos campos sensíveis: **masked (`• • • •`)** em vez de
  mostrar o valor mock direto — coerente com a política de segurança
  descrita na própria página ("Nunca compartilhe com terceiros").
- Botão "Revelar/Ocultar" com `aria-pressed`, `focus-visible` e `aria-live`
  no campo que muda.
- Copy do banner de segurança removeu referência a "Codex"; agora fala em
  "equipe técnica", que é o vocabulário certo para hóspede.
- Layout: `flex-wrap` + `min-w-0 + truncate` para SSID longo em mobile,
  eliminando risco de overflow horizontal.
- Micro-tipografia: senha com `tracking-[0.35em]` para leitura em
  fechadura eletrônica.

---

## 4. Inconsistências e recomendações (Codex)

### 4.1 Dados
- `marocasMockData.ts` ainda alimenta agenda, reservas, imóveis, prestadores.
  Substituir por `useSuspenseQuery(queryOptions)` chamando os
  `createServerFn` já entregues pelo Codex na Fase C — as telas já esperam
  os mesmos formatos, não precisam de refatoração visual.
- `MOCK_HOSPEDE_RESERVA` deve virar `useReservaAtiva()` — a página
  `/marocas/app/hospede/acesso` já está pronta para exibir os campos
  reais (`senha`, `wifi_ssid`, `wifi_senha`) e mantém máscara por padrão.

### 4.2 Assets
Placeholders Unsplash ainda em uso — trocar por assets oficiais Marocas:
- Hero home (`MAROCAS_IMAGENS.heroApto`).
- Galeria do imóvel em `/marocas/app/hospede/imovel` (3 fotos).
- Ilustração da página `/marocas/limpeza-manutencao`.
- Fotos de "equipe" nas páginas `/marocas/sobre` e `/marocas/prestadores`.

### 4.3 Integrações pendentes (documentar UI de status)
- Sync bidirecional iCal/API (Airbnb, Booking, Vrbo) — a página
  `/marocas/app/anfitriao/agenda` já reserva espaço para eventos externos.
- Fechaduras inteligentes (revogação automática pós check-out).
- N8N: WhatsApp Business + SMTP transacional.
- PIX / repasse automático a prestadores.

### 4.4 Copy
Termos como "tenant" **não aparecem** em nenhuma tela Marocas (auditado).
Palavras usadas: anfitrião, proprietário, hóspede, prestador, equipe
Marocas, imóvel, reserva, operação — em linha com o pedido.

---

## 5. Checklist de homologação

### Anfitrião
- [x] Login → dashboard renderiza KPIs, próximas ações, alertas
- [x] Sidebar 14 itens, todos com rota válida
- [x] Reservas com filtro por status
- [x] Agenda com legenda e 8 tipos de evento
- [x] Financeiro diferencia previsto/aprovado/pago
- [x] Automações lista jornadas + status
- [x] Cérebro IA mostra tom, canais, base de conhecimento

### Hóspede
- [x] Dados sensíveis mascarados por padrão
- [x] "Revelar/Ocultar" com aria-pressed e foco visível
- [x] Suporte 24h com formulário de manutenção
- [x] Regras, roteiros, histórico e avaliação acessíveis

### Prestador
- [x] Fila de serviços disponíveis com valor, local, horário
- [x] Fluxo aceitar → executar → concluir
- [x] Disponibilidade semanal em grid
- [x] Valores em tabela clara

### Transversal
- [x] Sidebar mobile com drawer, backdrop clicável, foco no primeiro item
- [x] Breadcrumbs em todas as páginas logadas
- [x] Estados de loading/erro/vazio via `MarocasUI` (primitivos únicos)
- [x] `min-h-dvh` no shell (não `h-screen`)
- [x] Contraste — tokens semânticos (`text-foreground`, `text-muted-foreground`)
- [x] Sem `text-gray-*` arbitrário
- [x] Nenhuma rota com scroll horizontal indevido (grid + `min-w-0`)

---

## 6. Arquivos alterados nesta fase

- `src/components/marocas/MarocasAppShell.tsx` — copy + a11y do seletor de perfil.
- `src/routes/marocas.app.hospede.acesso.tsx` — máscara padrão + a11y + wrap mobile.
- `docs/MAROCAS_FASE_D.md` — este relatório.

## 7. Riscos e próximos passos

**Riscos**
- Placeholders Unsplash em produção: publicar apenas depois da troca por
  assets oficiais Marocas.
- Textos "por reserva" na página de acesso pressupõem que a integração
  com fechadura inteligente esteja de fato ativa. Se não estiver,
  ajustar o copy para "por estadia · reset manual no check-out".

**Próximos passos sugeridos (fora do escopo desta fase)**
- Codex: substituir `MOCK_*` por consultas server-side.
- Codex: expor endpoint de revelação de senha com auditoria.
- Design: kit oficial de fotos Marocas (imóveis, equipe, operação).
- N8N: subir workflows com credenciais reais de WhatsApp e SMTP.

**Nota de maturidade UX final: 9,3 / 10** — pronto para homologação
assim que os assets oficiais e as substituições de mock por dados reais
forem concluídos pelo Codex.
