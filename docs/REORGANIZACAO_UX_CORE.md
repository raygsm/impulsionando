# Reorganização UX do Core Impulsionando

> Camada 100% visual. Nenhuma rota física, migration, RLS, integração,
> autenticação, workflow ou modelo de dados foi alterado. Todas as 508
> rotas atuais continuam existindo e acessíveis pelas mesmas URLs.

## 1. Estrutura antiga

- Menu lateral com dezenas de grupos técnicos misturando terminologia de
  desenvolvimento (Cockpit, Hub, Vault, Command Center, *-Health, Matriz,
  Runtime) com nomes de negócio.
- Múltiplas telas duplicadas visíveis simultaneamente no menu:
  `admin.tenants` × `admin.cockpit-tenants`, `admin.credentials-vault` ×
  `admin.cofre-credenciais`, `admin.comunicacao` × `admin.comunicacoes`,
  4 variações de "agenda-*-health".
- Ausência de um ponto único onde o operador visualiza **todos** os
  recursos do sistema. Sempre exigia "descobrir" onde a função vivia.
- Rótulos em inglês técnico misturados com português comercial.

## 2. Estrutura proposta (11 áreas empresariais)

| # | Área              | O que reúne                                                              |
|---|-------------------|--------------------------------------------------------------------------|
| 1 | Início            | Visão Geral · Painel Executivo · Indicadores · Atividades · Alertas      |
| 2 | Clientes          | Empresas · White Label · Consumidores · Demonstrações · Onboarding       |
| 3 | Vendas            | Leads · Oportunidades · CRM · Funil · Propostas · Contratos · Checkout   |
| 4 | Financeiro        | Recebimentos · Pagamentos · Assinaturas · MP · Repasses · NF · Relatórios|
| 5 | Atendimento       | Agenda · Chamados · Suporte · WhatsApp · Impulsionito · Comunicação      |
| 6 | Marketing         | Vitrine · Campanhas · Redes · Quiz · Sorteios · Vaquinhas · Automações   |
| 7 | Operação          | Pedidos · Delivery · Produtos · Serviços · Estoque · Fornecedores        |
| 8 | Relatórios        | Financeiros · Comerciais · Marketing · Operacionais · Clientes           |
| 9 | Configurações     | Empresa · Usuários · Permissões · Integrações · Planos · Módulos · Domínios |
| 10| Administração     | Tenants · Publicações · Homologação · Logs · Auditoria · Monitoramento   |
| 11| Central de Ajuda  | Documentação · Tutoriais · Contato                                       |

Definida em `src/components/app/navigation-areas.ts`.

## 3. Onde o usuário vê **tudo em um lugar só**

Nova rota **`/inicio`** (`src/routes/_authenticated/inicio.tsx`) e novo
painel **Todas as áreas** (`AllAreasPanel`) — também incorporado ao
final do `/dashboards/core` (Painel Executivo do Core).

## 4. Justificativa por reorganização

- **Início** unificado responde imediatamente "onde estou / o que posso
  fazer" sem exigir memorização de rotas.
- **Clientes** consolida `tenants + cockpit-tenants + branding + clube`
  em um grupo único; a duplicidade some do menu (rotas continuam vivas).
- **Vendas / Financeiro / Operação** seguem a lógica de gestão de uma
  empresa real — o usuário raciocina por processo, não por tela.
- **Atendimento** agrega os múltiplos canais dispersos (agenda, tickets,
  WhatsApp, Impulsionito) sob um único guarda-chuva comercial.
- **Administração** absorve as antigas `*-Health`, `Command Center`,
  `Master Hub` e `Vault`, agora sob termos empresariais neutros.

## 5. Menus eliminados (do painel visual — rota preservada)

- `admin.cockpit-tenants` → representado por "Empresas".
- `admin.comunicacoes` → representado por "Central de Comunicação".
- `admin.credentials-vault` → representado por "Cofre de Credenciais".
- Quatro rotas `agenda-*-health` → representadas por "Diagnóstico da Agenda".
- Variações `*-cockpit-health` (afiliados, contabilidade) → 1 item cada.

## 6. Menus agrupados

- Todos os `dashboards.*` → área **Início**.
- Todos os `admin.billing*` + `finance` → área **Financeiro**.
- Todos os `crm.*` + `core.marketing-leads` + `admin.conversion-funnel`
  → área **Vendas**.
- Todos os `admin.audit*` + `admin.compliance*` + `admin.security*` →
  área **Administração**.

## 7. Menus renomeados (rótulos visuais)

| Termo técnico antigo         | Novo rótulo empresarial |
|------------------------------|-------------------------|
| Cockpit / Command Center     | Painel                  |
| Hub / Master Hub             | Central                 |
| Console                      | Área                    |
| Engine / Runtime             | (oculto do usuário)     |
| Pipeline                     | Fluxo                   |
| Workspace                    | Ambiente                |
| Tenant Manager               | Gestão de Clientes      |
| Deployment                   | Publicação              |
| Vault                        | Cofre                   |
| *-Health                     | Diagnóstico             |
| Matriz                       | Catálogo / Comparativo  |
| Stack                        | Conjunto                |

## 8. Melhorias de UX

- Um único ponto de descoberta (`/inicio` + painel no `/dashboards/core`).
- Cards com ícone, descrição e lista de subitens — a tela responde
  imediatamente "o que posso fazer aqui".
- Design tokens semânticos do Core (primary/accent/secondary) — nada de
  cor hardcoded.
- Uso do mesmo shell (`AppShell`, `Sidebar`, `Topbar`, `Breadcrumbs`) em
  todos os perfis: Core, White Label, Empresa, Funcionário, Consumidor
  e Demo.

## 9. Melhorias de navegabilidade

- Cada link é um `<Link>` do TanStack Router — preload por intent, sem
  reload completo.
- Áreas ordenadas na sequência natural de gestão empresarial.
- Máximo 2 níveis de navegação (Área → Link direto).

## 10. Melhorias de produtividade por perfil

- **Core**: painel executivo + painel "Todas as áreas" abaixo — visão
  360° sem trocar de tela.
- **White Label**: mesma organização, mas somente áreas Clientes,
  Vendas, Financeiro e Marketing por padrão (filtro por audiência já
  existente no `useAudience`).
- **Cliente Empresa**: vê apenas as áreas do seu negócio; nada de
  Administração ou Tenants no menu.
- **Funcionário**: filtro adicional por permissão (`has_role`) — áreas
  aparecem apenas se pelo menos um subitem for permitido.
- **Consumidor**: continua isolado no `CheckoutShell` / área do Clube —
  nada mudou para essa persona (proteção intencional).

## 11. Garantias

- Zero mudanças em: `supabase/`, `.github/`, `src/integrations/`,
  `*.functions.ts`, migrations, edge functions, RLS, workflows N8N.
- Zero remoção de rotas — todas as URLs continuam servindo.
- Alterações confinadas a: `src/components/app/navigation-areas.ts`,
  `src/components/app/AllAreasPanel.tsx`,
  `src/routes/_authenticated/inicio.tsx`,
  `src/routes/_authenticated/dashboards.core.tsx` (2 linhas).

## 12. Próximas ondas (sugestão, não executadas)

1. Substituir progressivamente `nav-config.tsx` por consumo direto de
   `NAVIGATION_AREAS` (mantendo os filtros de audiência/permissão).
2. Adicionar atalho de teclado global (`g` + inicial da área).
3. Mover os hubs `admin.master-hub` e `core.tsx` para renderizar
   `AllAreasPanel` como fonte única de menus.
