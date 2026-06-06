# Demos por nicho — começando por Eventos / WMP

Hoje as demos (`/demo/crm`, `/demo/agenda`, `/demo/checkout`, `/demo/whatsapp`, etc.) usam o mesmo mock genérico, independente do nicho. O objetivo é fazer cada demo refletir o nicho escolhido **e** criar uma página agregadora por nicho — começando por **Eventos / WMP** (DJs, artistas, contratantes).

## 1. Filtro `?nicho=...` nas demos existentes

Criar um helper único `src/lib/demoNicho.ts`:

- `useNichoParam()` lê `?nicho=eventos` da URL (TanStack search param) com fallback `"generico"`.
- `getNichoMock(nicho, modulo)` devolve dataset específico (clientes, serviços, produtos, mensagens, KPIs) por par `(nicho, modulo)`.
- Catálogo inicial cobre `eventos` em: `crm`, `agenda`, `checkout`, `whatsapp`, `parceiros`, `afiliados`, `cliente-final`, `simulador`. Demais nichos caem no mock atual.

Em cada `demo.<modulo>.tsx`:
- Trocar arrays mockados embutidos por `getNichoMock(nicho, "<modulo>")`.
- Substituir rótulos genéricos (“Cliente”, “Serviço”, “Venda”) pelos termos do nicho (“Contratante”, “Cachê”, “Evento”, “Casa noturna”) via mapa de labels.
- Mostrar uma badge no topo: “Demonstração — nicho: Eventos (WMP)”.

Para Eventos / WMP, os datasets passam a usar:
- CRM: leads = contratantes (casas, prefeituras, formaturas) com pipeline “Briefing → Proposta → Contrato → Sinal pago → Evento → Pós-evento”.
- Agenda: bloqueios por DJ/artista, sets, passagem de som, turnês.
- Checkout: sinal + saldo, cachê fechado, taxa WMP, repasse ao parceiro.
- WhatsApp: templates “Confirmação de evento”, “Lembrete 72h”, “Aviso de cancelamento com multa”.
- Parceiros: já é WMP, só ajustar o link de retorno para o agregador.
- Afiliados: produtores/agentes que indicam contratos.
- Cliente-final: visão do contratante (status do contrato, sinal, rider técnico).
- Simulador ROI: presets de cachê médio, nº eventos/mês, comissão WMP.

## 2. Página agregadora `/demo/nicho/$slug`

Novo arquivo `src/routes/demo.nicho.$slug.tsx`:

- Carrega o mesmo `getNichoMock(slug, ...)` para todos os módulos relevantes do nicho.
- Layout em abas (Tabs do shadcn) com a jornada WMP:
  1. **Briefing & Contratante** (CRM)
  2. **Disponibilidade & Agenda** (Agenda)
  3. **Parceiros / Artistas** (Parceiros — regras 72h, multa, bônus)
  4. **Contrato & Sinal** (Checkout)
  5. **Comunicação** (WhatsApp + Email)
  6. **Resultado** (ROI / financeiro do evento)
- Cada aba reusa os componentes-chave das demos atuais (cards/listas), não duplica lógica — importa de `demo.<modulo>.tsx` quando viável; caso o componente esteja inline, extrai para `src/components/demo/<modulo>/...` em uma única passagem mínima.
- Botão “Abrir demo completa do módulo” em cada aba leva para `/demo/<modulo>?nicho=eventos`.

`demo.nicho.$slug.tsx` só suporta `slug = "eventos"` no primeiro passo; outros slugs mostram um estado “Em breve” com link para `/demo/modulos`.

## 3. Pontos de entrada

- `src/components/marketing/NichoPage.tsx` (rota `/nichos/$slug`): se `slug === "eventos"`, CTA principal vira “Abrir demo do nicho” → `/demo/nicho/eventos`. Mantém CTA secundário para `/demo/modulos`.
- `src/routes/showroom.eventos.tsx`: adicionar bloco final “Veja em ação” → `/demo/nicho/eventos`.
- `src/routes/demo.index.tsx`: nova seção “Demos por nicho” com card “Eventos / WMP”.
- `src/routes/modulos.$slug.tsx` (módulos de WMP — parceiros, etc.): botão “Testar no contexto Eventos” → `/demo/nicho/eventos`.

## 4. Detalhes técnicos

- Search params validados com `zodValidator` + `fallback`: `z.object({ nicho: fallback(z.enum(["eventos","fitness","saude","estetica","generico"]), "generico").default("generico") })` num arquivo compartilhado, reaproveitado por cada demo.
- Persistência local (`useDemoState` já existente) recebe sufixo do nicho na chave, para não misturar dados entre nichos.
- Nenhuma rota existente é apagada; URLs sem `?nicho` continuam funcionando exatamente como hoje (fallback `"generico"`).
- Nenhuma alteração de backend / schema; tudo frontend + mock.

## 5. Fora de escopo desta rodada

- Demos específicas para Fitness / Saúde / Estética (mantêm o mock atual; ficam para próximas rodadas usando o mesmo helper).
- Mexer em rotas autenticadas (`/_authenticated/*`).
- Alterar conteúdo dos e-mails/WhatsApp reais — só os templates de demonstração.

## Entregáveis

- `src/lib/demoNicho.ts` (helper + datasets WMP)
- `src/routes/demo.nicho.$slug.tsx` (nova rota agregadora)
- Edição pontual de cada `demo.<modulo>.tsx` listado para consumir o helper
- Ajustes de CTA em `NichoPage.tsx`, `showroom.eventos.tsx`, `demo.index.tsx`, `modulos.$slug.tsx`
