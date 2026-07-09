# Imobiliária Garrido — Checklist de Ativação Completa

Empresa: **Imobiliária Garrido** (`id: 8e90a584-a5f6-40b3-8975-dad968db39ba`, subdomain `garrido`)
Nicho: `imobiliaria`

## Onda 2.6 — Refinamento premium (concluído)

Reposicionada como **referência do ecossistema para imobiliárias, corretores, incorporadoras, construtoras e administradoras**.

### Shell & navegação
- `src/components/garrido/GarridoShell.tsx` novo — header/footer/skip-link/mobile-nav padronizados; WhatsApp restrito a suporte no rodapé + PDP.
- Nav com landings dedicadas: `/garrido/comprar`, `/alugar`, `/temporada`, `/lancamentos`, `/comercial`, `/rural`.
- FAB global "**Há mais conteúdo — role para ver**" (`MoreContentFab`).

### Busca
- `garrido.buscar.tsx` reescrita: filtros ampliados (cidade, bairro, diferencial/tag, mín. quartos, mín. vagas, área mínima, preço máximo, ordenação) sincronizados à URL via `validateSearch` (Zod).
- Estado vazio educacional + "Limpar filtros" + "Cadastrar interesse".

### PDP
- CTA primário **Agendar visita** (rola para `#agendar-visita`), secundário **Solicitar proposta**, terciário **Favoritar** (localStorage).
- WhatsApp reduzido a link discreto de suporte pós-venda.
- `RealEstateListing` JSON-LD (área, quartos, banheiros, endereço, geo, oferta).
- `BreadcrumbList` JSON-LD nas leaves.
- Formulário "Agendar visita ou solicitar proposta" embutido ao fim do artigo.

### Contas & jornadas
- `/garrido/entrar`, `/cadastro`, `/recuperar` — bridges para o Core Auth.
- `/garrido/area` — hub do cliente (favoritos, propostas, visitas, documentos, notificações, histórico); `noindex`.
- `/garrido/corretor` — hub do corretor (carteira, leads, agenda, propostas, funil, comissões, indicadores); `noindex`.

### Institucional
- `/garrido/faq` com `FAQPage` JSON-LD.
- `/garrido/politicas` — Privacidade, Termos, Condições de anúncio, DPO.
- Todas as leaves com `head()` completo, `canonical` self-referencing e `BreadcrumbList`.

### Compliance
- Removidos "desde 1998", "27 anos de mercado", "CRECI-J-RJ 12.345", "+18.000 leads/ano", "45 dias em média".
- Depoimentos fictícios substituídos por bloco institucional (política de consentimento).
- WhatsApp posicionado apenas como suporte/pós-venda.

### Padrões globais (Onda 2.6, aplicados a partir da Garrido)
- **Scrollbar contrastada** via `html` + utilitários `@utility scroll-contrast` / `.scroll-invert` em `src/styles.css`.
- **`MoreContentFab`** em `src/components/impulsionando/` — próxima rodada instala nos demais tenants.

## Backend
Nenhuma alteração nesta onda. Módulos, seeds e demos mantidos.

## Pendências para o Codex

1. Wire real do formulário de visita/proposta → `realestate_search_intents` + notificação ao corretor (`crm_notifications`).
2. Favoritos persistentes por usuário (`localStorage` → tabela com RLS `auth.uid()`).
3. Área do cliente real (favoritos, propostas, visitas, documentos, notificações via Core).
4. Área do corretor real (kanban de funil, matching via `realestate_run_match_for_property`, comissões).
5. Contratos digitais + boletos + repasse (módulo aluguel).
6. WhatsApp IA (Impulsionito) para captação/qualificação.
7. App do corretor mobile-first (PWA em campo).

## Oportunidades futuras
- Motor de matching bidirecional (imóvel↔perfil) com alertas push.
- Página do bairro com dados de mercado (preço médio, tempo de venda).
- Integração com bancos parceiros para pré-aprovação real.
- Painel do proprietário administrado.

## Nota de maturidade UX
**Avançado** — jornadas principais completas (busca sólida, PDP premium com JSON-LD real, contas institucionalizadas, políticas publicadas, SEO leaf-a-leaf, WhatsApp fora do caminho comercial). Premium chega com os wires reais em `realestate_*`.

## Top 5 melhorias de maior impacto pendentes
1. Wire real Agendar visita/Solicitar proposta.
2. Favoritos persistentes por conta + alerta de queda de preço.
3. Área do cliente logada com dados reais do Core.
4. Administração de aluguel completa (contrato + boleto + repasse).
5. App do corretor + IA de captação (Impulsionito).
