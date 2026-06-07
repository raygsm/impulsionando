## Bloco 5/5 — Agenda Online: dashboard, jornada guiada, nichos, logs e fechamento

Tudo permanece no escopo `demo` (frontend, localStorage, nenhum dado real afetado). Reaproveita estados já criados nos blocos 1–4: `agendaDemoConfig`, `agendaResources`, `agendaFluxos`, `agendaComunicacao` e o `cloneCentral` da Central Interna.

### 1. Novo arquivo `src/lib/agendaNichos.ts`
Preset central por nicho (`clinicas`, `estetica`, `fitness`, `juridico`, `bar`, `eventos`, `servicos`). Para cada um:
- `labels` (Paciente/Cliente/Aluno, Médico/Professor/Advogado, Consulta/Aula/Reserva, Sala/Mesa/Turma…);
- `recursosPrioritarios` (lista de chaves de `AGENDA_PARAM_DEFS` que ficam em destaque/ligadas no preset);
- `servicosExemplo` (textos prontos para popular `Servico[]` do mock);
- `ctas` específicas e textos de jornada adaptados.
Função `getNichoPreset(nicho)` e `applyNichoPreset(nicho)` que reescreve labels/serviços no localStorage da demo, gera log e dispara toast de confirmação. Sem mexer em dados reais.

### 2. Novo `src/lib/agendaLogs.ts`
Log unificado da Agenda (independente dos logs internos de Clonagem do Bloco 4 da Central). Tipos:
- `AgendaLogEntry { id, modulo:"Agenda Online", area, acao, sessao, lead?, cliente?, profissional?, dataHora, status:"concluido"|"simulado_demo"|"pendente"|"falhou"|"aguardando_credenciais"|"cancelado", ambiente:"DEMO"|"TESTE"|"REAL", canal?, destinatario?, origem?, erro? }`.
- API: `appendAgendaLog(entry)`, `listAgendaLogs(filters?)`, `clearAgendaLogs()`.
- Helpers especializados (`logAgendamentoCriado`, `logCancelamento`, `logReagendamento`, `logNoShow`, `logPagamentoDemo`, `logQrCode`, `logComunicacao`, `logJornada`, `logResetLocal`, `logCtaClicado`, etc.) para garantir cobertura dos 30+ eventos do Bloco 47.
- Substituir os `appendLog` ad-hoc dos `agendaFluxos`/`agendaComunicacao` por um shim que também grava neste log unificado.

### 3. Novo painel `src/components/demo/agenda/AgendaDashboard.tsx`
Dashboard **específico** da Agenda — não reutiliza o KPI genérico atual. Lê estados de `agendaResources`, agendamentos (`ag.agds`), `agendaFluxos` (pagamentos/fila/encaixes/retornos/pesquisas) e `agendaComunicacao` (envios). Composto por:

- Cabeçalho com 3 botões: **Atualizar dashboard**, **Exportar demo** (mostra texto "Exportação preparada para próxima fase técnica.") e seletor de período.
- Faixa de filtros: Período, Profissional, Serviço, Unidade, Sala, Status, Pagamento, Origem, Cliente, Canal, Ambiente.
- Grade de KPIs (cards pequenos), cobrindo os 30 indicadores do Bloco 43 (Agendamentos do dia/semana/mês, Confirmados, Aguardando confirmação, Aguardando pagamento, PAGO — DEMO, Cancelados, Reagendados, No-show, Atendidos, Retornos, Fila, Encaixes, Horários livres, Bloqueados, Pagamentos simulados, QR Codes, Lembretes/WhatsApps/E-mails enviados-simulados, Taxa de confirmação/cancelamento/no-show).
- Seções de gráficos/tabelas (recharts já está no projeto):
  - Agenda por status (barras);
  - Agendamentos por profissional / por serviço;
  - Ocupação por dia (linha);
  - Ocupação por profissional / sala / unidade (barras horizontais);
  - Cancelamentos por motivo, No-show por cliente, Fila por serviço;
  - Pagamentos simulados por status (pizza);
  - Lembretes enviados por canal;
  - Origem dos agendamentos;
  - Top serviços, top profissionais, horários mais procurados.
- Rodapé com atalhos: Ver agendamentos, Ver profissionais, Ver pagamentos, Ver fila, Ver no-show, Ver logs — todos navegam para a aba/tab correspondente já existente (set `aba`).

Nova aba "Dashboard" entra na barra de tabs do `demo.agenda.tsx`, como **primeira** aba (ou logo após Visão Geral), conforme a regra do Bloco 43 ("não usar dashboard genérico"). O `painel` atual é mantido como histórico simples, mas o `Painel` antigo deixa de ser a referência principal.

### 4. Novo `src/components/demo/agenda/AgendaJornadaGuiada.tsx`
Wizard de 18 etapas (Bloco 44) em `Dialog` cheio, com `step`, `setStep`, barra de progresso, e três botões: **Voltar**, **Pular etapa**, **Continuar**. Cada etapa traz:
- título, texto curto (exatamente os textos do bloco),
- ação ilustrativa (ex: "abrir aba Profissionais", "abrir simulação de pagamento") que muda a aba ativa via callback,
- feedback visual (toast + checkmark verde),
- registro no `agendaLogs` (`jornada_etapa_concluida` / `jornada_etapa_pulada`).

No final: tela de conclusão com texto oficial e CTAs:
- Contratar Agenda real (`/planos?modulo=agenda`);
- Adicionar Agenda ao orçamento (`/contratar?incluir=agenda`);
- Testar outros módulos (chama o seletor "Outros Módulos");
- Falar com consultor (`/contato?assunto=agenda`).

Botão **INICIAR JORNADA GUIADA DA AGENDA** entra no topo da rota (perto do banner DEMO) e no dashboard.

### 5. Aplicação de nicho na rota `src/routes/demo.agenda.tsx`
- Já existe `nichoDemo` (query `?nicho=…`). Adicionar `Select` no topo da página com os 7 nichos do Bloco 45; ao trocar, chamar `applyNichoPreset(nicho)` (com confirmação) e re-renderizar labels.
- Substituir strings hard-coded ("Cliente", "Profissional", "Serviço") por `labels.cliente` / `labels.profissional` / `labels.servico` lidos do preset, em todas as tabs (mantém código intacto, só troca textos).
- Botão **Outros Módulos** (já obrigatório no Bloco 48) — abrir `Dialog` listando os módulos disponíveis em `cloneCentral.MODULOS_BASE`/lista existente, com Nome/Categoria/Descrição. Ao escolher, navegar para `/demo/<modulo>` preservando o lead capturado.
- Botão **ZERAR DADOS DA DEMO** (Bloco 49) já existe via `useDemoState` resets; consolidar em um único botão com `confirm` exibindo o texto oficial, e que chame `resetAll()` (profs, servs, agds, espera, params, fluxos, comunicação, logs locais). Mantém lead capturado para não bloquear a demo.

### 6. CTAs de contratação real (Bloco 50)
Componente `AgendaCtaStrip` reutilizável, inserido em:
- topo do dashboard (banner);
- final da jornada guiada;
- rodapé da rota.
Cada botão chama `logCtaClicado({ destino, lead })` antes de navegar.

### 7. Estados vazios e botões "vivos"
- Substituir `<p>Sem profissionais.</p>` etc. pelas frases do Bloco 52 ("Nenhum profissional cadastrado ainda. Crie o primeiro…").
- Para qualquer ação que dependa de credenciais externas (WhatsApp real, e-mail real, VoIP), mostrar a string oficial: **"Recurso preparado — aguardando credenciais externas."** Já há sinal visual com selo TESTE; reforçar nos handlers para evitar clique morto.
- Garantir que cada botão da lista do Bloco 51 tenha pelo menos um `toast`/log de retorno.

### 8. Aba "Logs" da Agenda
Reaproveita a tabela já existente de `EnvioLog` no painel de Comunicação, mas adiciona, em uma nova aba "Logs" (ou subaba no dashboard), o feed completo de `agendaLogs` com filtros por área/ação/status/canal/ambiente e botão Limpar (somente registros locais). Cada linha mostra módulo, área, ação, status, ambiente, data, e — se houver — canal/destinatário/erro.

### 9. Checklist e testes (Blocos 53–54)
Não precisa de código adicional além do que está acima; o plano cobre todos os 50 itens. A verificação será feita após implementar:
- abrir `/demo/agenda` em desktop + mobile (viewport 375),
- rodar a jornada guiada do início ao fim,
- conferir indicadores do dashboard após criar/cancelar/pagar,
- conferir adaptação de labels ao trocar para "clinicas", "fitness" e "bar",
- confirmar que `Zerar dados` só limpa localStorage da Agenda.

### Resumo de arquivos
**Novos**
- `src/lib/agendaNichos.ts`
- `src/lib/agendaLogs.ts`
- `src/components/demo/agenda/AgendaDashboard.tsx`
- `src/components/demo/agenda/AgendaJornadaGuiada.tsx`
- `src/components/demo/agenda/AgendaCtaStrip.tsx`
- `src/components/demo/agenda/OutrosModulosDialog.tsx`

**Editados**
- `src/routes/demo.agenda.tsx` (novas abas Dashboard / Logs, jornada, seletor de nicho, Outros Módulos, Zerar dados consolidado, labels dinâmicos, estados vazios)
- `src/lib/agendaFluxos.ts` e `src/lib/agendaComunicacao.ts` (encaminhar `appendLog` para `agendaLogs`)

### Garantias
- Tudo permanece em `/demo/*` — sem mudanças em rotas autenticadas, sem migrações de banco, sem chamadas a APIs reais.
- Nenhum pagamento, credencial ou dado real é tocado. Toda comunicação mantém o selo "TESTE — DEMONSTRAÇÃO — VERSÃO TESTE".
- Recursos da Central Interna de Clonagem (Bloco 46) já existem em `src/lib/cloneCentral.ts`; o plano apenas confirma que a Agenda continua marcada como **módulo-base v1.0.0** e exclusiva da Impulsionando — nenhuma alteração necessária para o item 46.