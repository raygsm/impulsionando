
# MÓDULO 1 — CRM (Bloco 1/4) — Plano de execução

Vou expandir a DEMO já existente em `/demo/crm` (não recriar). O CRM hoje tem 7 abas (Painel, Leads, Pipeline, Atividades, Templates, Automações, Parametrização) e usa `createCrmMock()` + `useDemoState` para persistência local. Vou aproveitar 100% disso e acrescentar o que falta para atender o briefing, sem tocar em rotas, auth, banco, checkout real ou outros módulos.

## Escopo (apenas /demo/crm)

### 1. Rota e contratação-DEMO
- Manter rota `/demo/crm` (já existe, com `DemoModeBanner` e `DemoContractCTA`).
- Garantir que `DemoContractCTA(slug="crm")` registre contratação fictícia em `localStorage` com status `PAGO — DEMO` e redirecione/permaneça em `/demo/crm`. Se o helper já marca isso (em `src/lib/demoContracting.ts`), apenas exibir badge "PAGO — DEMO" no topo quando o flag estiver presente; caso contrário, gravar `imp.demo.crm.contracted = true` ao clicar no CTA.
- Adicionar chancela permanente no topo da página: `DEMONSTRAÇÃO — VERSÃO TESTE` (badge fixa, separada do `DemoModeBanner` existente).

### 2. Mock próprio do CRM (expandir `createCrmMock`)
Em `src/lib/demoModuleMocks.ts`, manter os dados atuais e adicionar:
- `clientes` (Clínica Saúde Mais, Restaurante Villa Rio, Andrade & Costa)
- `empresas` (PJ vinculadas aos clientes)
- `produtos` (CRM Profissional, WhatsApp Inteligente, Agenda Online)
- `planos` (Inicial, Profissional, Completo) com preço e ciclo
- `servicos` (consultoria, onboarding, suporte)
- `prazosDias` (retorno 3d, proposta 5d, reativação 30d, recompra 90d, cobrança 7d)
- `funis` + `etapas` (Funil Comercial Padrão com as 8 etapas do briefing)
- `regras` (ex.: lead sem resposta 3d → mover para Reativação)
- `tags`, `origens`, `campanhas` (listas do briefing)
- `followups`, `usuarios` (Admin/Vendedor/Atendimento/Financeiro Demo), `permissoes`, `logs`
- Bump da chave de marker para `crm:v3` para que visitantes existentes recebam o mock atualizado uma vez.

### 3. Novas áreas / abas no `/demo/crm`
Reorganizar o `Tabs` atual em **grupos** para caber as 24 áreas sem poluir mobile (usar `Tabs` aninhadas ou agrupar em seções rolante por grupo + sub-abas). Áreas a entregar:

1. Visão Geral (7 cards comerciais do briefing + 3 CTAs)
2. Dashboard (KPIs já existentes + porEstagio + receita)
3. Leads (já existe — manter)
4. Clientes (nova) — tabela CRUD local
5. Empresas (nova)
6. Produtos (nova)
7. Planos (nova)
8. Serviços (nova)
9. Prazos em Dias (nova — lista de prazos configuráveis)
10. Funis (nova)
11. Etapas (nova, dentro de Funis)
12. Regras (nova — quando X → ação Y)
13. Tags (nova)
14. Origens (nova)
15. Campanhas (nova)
16. Follow-ups (nova)
17. Atividades (já existe — manter)
18. Templates (já existe — manter, sob "Comunicação")
19. Automações (já existe — manter)
20. Usuários (nova — lista mock)
21. Permissões (nova — matriz por papel × ação, toggle local)
22. Comunicação (engloba Templates + simulação de envio com prefixo `TESTE — DEMONSTRAÇÃO — VERSÃO TESTE`)
23. Logs (nova — registro local de ações)
24. Jornada Guiada (nova — passo-a-passo com setas)
25. Parametrizações (expandir a aba atual com os 16 toggles SIM/NÃO do briefing + tooltips)

Rodapé da página com:
- Botão **OUTROS MÓDULOS** (reaproveitar `DemoModuleSwitcher`)
- Botão **ZERAR DADOS DA DEMO** (já existe, ajustar mensagem para a do briefing e zerar apenas chaves `imp.demo.crm.*`)
- Bloco **CTA de contratação real**: "Contratar CRM real", "Adicionar CRM ao orçamento", "Ver planos", "Falar com consultor" linkando para `/planos`, `/orcamento?modulo=crm`, `/contato`.

### 4. Parametrizações SIM/NÃO (16 toggles)
Substituir o `Params` atual por todos os 16 itens do briefing com tooltips. Persistência: mesma chave `crm.params` (com merge para chaves novas mantendo defaults). Tooltips usando `Tooltip` do shadcn já no projeto.

### 5. Estados visuais e feedback
- Padronizar badges: Ativo / Inativo / Configurado / Aguardando configuração / Simulado — DEMO / Enviado — DEMO / Pendente / Concluído / Falhou / Aguardando credenciais externas / PAGO — DEMO.
- Toda ação (criar, editar, excluir, simular envio) dispara `toast` com mensagem clara.
- Toda comunicação simulada exibe prefixo `TESTE — DEMONSTRAÇÃO — VERSÃO TESTE` no corpo da mensagem renderizada.

### 6. Ajuda contextual
Pequenos componentes `<HelpTip>` (já existe em `src/components/demo/HelpTip.tsx`) ao lado de parâmetros, status e botões críticos com os textos do briefing.

### 7. Responsividade
Tabs em `flex-wrap`; em mobile, agrupar por accordions quando a lista de abas ficar > 8 itens. Botões grandes nas áreas de cadastro. Modais usam `Dialog` shadcn padrão.

### 8. Reset local — escopo restrito ao CRM
Atualizar o `resetAll` da página para limpar somente as chaves `imp.demo.crm.*` e o marker `imp.demo.mock.crm`. Mensagens exatamente como o briefing pede.

## Arquivos afetados

```text
edit  src/lib/demoModuleMocks.ts        # createCrmMock expandido (clientes, produtos, planos, funis, etapas, etc.)
edit  src/routes/demo.crm.tsx            # nova estrutura de abas, parametrizações ampliadas, CTAs reais, badge VERSÃO TESTE, reset local restrito
new   src/components/demo/crm/           # subcomponentes por aba (Clientes, Empresas, Produtos, Planos, Funis, Regras, Permissoes, Logs, JornadaGuiada, etc.)
edit  src/lib/demoContracting.ts         # se necessário, marcar PAGO — DEMO para slug "crm"
```

Nenhuma outra rota, módulo, componente compartilhado, autenticação, banco, edge function ou checkout real será tocado. Outros módulos da DEMO permanecem intactos.

## Critérios de aceite do Bloco 1/4
1. `/demo/crm` carrega com banner permanente `DEMONSTRAÇÃO — VERSÃO TESTE`.
2. CTA de contratação marca `PAGO — DEMO` e libera o conteúdo do CRM.
3. Mock do CRM tem leads, clientes, empresas, produtos, planos, funis, etapas, origens, campanhas, usuários — separado de outros módulos.
4. Visão Geral com os 7 cards e 3 CTAs do briefing.
5. Parametrizações com os 16 toggles SIM/NÃO + tooltips.
6. Botões "OUTROS MÓDULOS", "ZERAR DADOS DA DEMO" e CTAs de contratação real presentes no rodapé.
7. Reset local zera só dados do CRM e exibe as mensagens exatas do briefing.
8. Nenhum outro módulo é alterado.

Blocos 2/4, 3/4 e 4/4 do briefing serão tratados em prompts seguintes.
