# Fase H (Blocos 40–51) — Fechamento do /demo/crm

Implementar os últimos blocos da especificação do CRM DEMO em uma única entrega, reaproveitando o que já existe (DemoTestContactPanel, simulateSend, pushLog, ConfigPanels, CrudPanels, ClientesPanel, LeadsPanel) e adicionando o que ainda falta.

## Escopo por bloco

**40. Comunicação do CRM** — Nova aba "Comunicação" com:
- Lista dos 17 tipos obrigatórios (boas-vindas lead/cliente, follow-up, proposta, cobrança, lembrete, pesquisa, reativação, recompra, convite, confirmação, aviso de plano) por canal (e-mail / WhatsApp / notificação interna).
- Modal "Configurar envio de teste" com campos completos de e-mail e de WhatsApp.
- Tela de prévia obrigatória (módulo, evento, canal, remetente, destinatário, assunto, corpo, ambiente DEMO, status, real vs simulado, credencial pendente, log previsto).
- Botões: Enviar teste / Simular envio / Cancelar. Sem credencial → simula e grava log. Prefixo `TESTE — DEMONSTRAÇÃO — VERSÃO TESTE` aplicado em assunto e corpo.

**41. Modelos de Mensagem** — Nova aba "Modelos":
- CRUD dos 6 modelos obrigatórios já com conteúdo seed (Boas-vindas lead/cliente, Follow-up, Reativação, Recompra, Pesquisa).
- Campos: nome, canal, evento, assunto, corpo, variáveis, ativo/inativo.
- Botões: Ver prévia (renderiza substituindo `{{variaveis}}` por mocks) e Simular envio (reaproveita fluxo do bloco 40).
- Lista de variáveis disponíveis exibida no editor.

**42. Logs do CRM** — Nova aba "Logs":
- Tabela do array `logs` já existente em estado global (CrmState).
- Filtros: área, ação, canal + "Limpar filtros".
- Botão "Ver detalhes" abre Dialog com todos os campos do log.
- Botão "Exportar demo" → toast "Exportação preparada — recurso disponível em ambiente real conforme contratação."
- Texto de apoio padronizado.

**43. Dashboard do CRM** — Substituir a aba inicial "Visão geral" por dashboard específico:
- 10 cards calculados a partir do estado (leads novos, clientes ativos, oportunidades, propostas, follow-ups pendentes, conversão estimada, origem top, receita prevista, automações ativas, mensagens enviadas).
- Listas simples (sem libs novas): leads por origem, leads por etapa, clientes por produto, propostas por status, follow-ups por prazo, campanhas por conversão.
- Botões: Atualizar / Ver leads / Ver clientes / Ver follow-ups / Ver campanhas / Ver logs (trocam aba ativa).

**44. Jornada guiada** — Botão "Iniciar jornada guiada do CRM" no topo:
- Dialog stepper de 14 etapas conforme especificado, com texto curto, Continuar / Voltar / Pular etapa.
- Cada etapa avançada gera log e, quando aplicável, faz ação real no estado (cria lead mock, qualifica, converte, vincula produto/plano, etc.).
- Tela final com CTAs: Contratar CRM real, Adicionar CRM ao orçamento, Testar outros módulos (rotas existentes /planos, /orcamento, /demo).

**45. CTAs** — Barra de CTAs persistente no rodapé do shell do CRM:
- Contratar CRM real → /planos com `?modulo=crm`.
- Adicionar CRM ao orçamento → /orcamento com `?add=crm`.
- Ver planos → /planos.
- Falar com consultor → /contato.
- Testar outros módulos → reaproveita DemoModuleSwitcher.
Preserva qualquer carrinho/orçamento (apenas usa query params, sem limpar localStorage).

**46. Outros módulos** — Já existe o DemoModuleSwitcher no banner. Garantir botão dedicado no painel lateral logo acima de "Zerar dados da DEMO" com texto de apoio.

**47. Zerar dados** — Ajustar `resetData` do DemoShell para, em /demo/crm, zerar SOMENTE chaves `impulsionando:demo:crm:*` e gerar log de reset (área CRM, ação `reset_local`).

**48. Responsividade** — Auditoria visual rápida: forçar grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-…`), garantir que todos os Dialog têm `X` + Cancelar (já vem do shadcn) e que abas usam scroll horizontal no mobile.

**49. Validação de botões** — Varredura nos painéis Crud/Config/Clientes/Leads/Comunicação/Modelos/Dashboard/Jornada confirmando que todo `<Button>` chama handler. Onde dependa de credencial externa: mensagem "Recurso preparado — aguardando credenciais externas." (já é o caminho atual do simulateSend quando o backend retorna falha).

**50/51. Checklist e entrega** — Resposta final lista item a item o que foi auditado/reaproveitado/incrementado e instruções de uso.

## Arquivos previstos

```
src/components/demo/crm/
  ComunicacaoPanel.tsx         (novo — blocos 40 + 41 compartilham helpers)
  ModelosPanel.tsx             (novo)
  LogsPanel.tsx                (novo)
  DashboardPanel.tsx           (novo — substitui "Visão geral" do CRM)
  JornadaGuiadaDialog.tsx      (novo)
  CtaBar.tsx                   (novo — barra inferior do CRM)
src/lib/
  demoModuleMocks.ts           (estender: templates seed, eventos, tipos de comunicação)
  demoCrmCrud.ts               (helpers de envio/simulação reaproveitando simulateSend e pushLog)
src/routes/
  demo.crm.tsx                 (registrar abas: Dashboard, Comunicação, Modelos, Logs, Jornada; barra CTA; ajustar reset)
```

Sem mudanças em rotas existentes, sem migrações, sem novas dependências, sem alteração de fluxo real (apenas DEMO local).

## Aceite

- /demo/crm abre direto no novo Dashboard com dados calculados.
- Cada nova aba funciona com CRUD/ação + log correspondente.
- Toda comunicação passa por modal de configuração → prévia → envio/simulação, sempre com prefixo TESTE.
- Jornada guiada conclui sem erro e gera ≥14 logs.
- Reset local toca apenas chaves do CRM e registra log.
- Nenhum botão sem ação.
