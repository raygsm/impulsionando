# PT-BR copy deck

Created: **2026-09-04**  
UI strings. Do not ship English leftovers in `app-web`.

## Navigation

| id | Label |
| --- | --- |
| nav.home | Início |
| nav.growth | Crescimento |
| nav.customers | Clientes |
| nav.operations | Operações |
| nav.management | Gestão |
| nav.help | Ajuda |
| nav.settings | Configurações |
| nav.more | Mais |
| nav.aria | Áreas principais |
| nav.unavailablePlan | Indisponível no plano |
| nav.configuring | Em configuração |

## Growth children

| id | Label |
| --- | --- |
| growth.overview | Visão geral |
| growth.leads | Leads |
| growth.campaigns | Campanhas |
| growth.followup | Follow-up |
| growth.conversion | Conversão |
| growth.retention | Retenção |
| growth.reactivation | Reativação |
| growth.attribution | Atribuição |

## Niche terms (swap labels, not routes)

| Default | Restaurant | Clinic | Real estate |
| --- | --- | --- | --- |
| Lead | Cliente potencial | Paciente potencial | Interessado |
| Opportunity | Pedido em aberto | Agendamento proposto | Negócio |
| Order | Pedido | — (hide widget) | — |
| Appointment | Reserva | Consulta | Visita |
| No-show | Falta | Falta | Visita não realizada |
| Inventory | Estoque | — / materiais `OPEN` | — |
| Document | Documento | Prontuário/arquivo `OPEN` | Contrato/documento |

`OPEN`: exact clinic document noun needs product decision; until then **Documento**.

## Status (modules)

| Enum | Label |
| --- | --- |
| NOT_ENTITLED | Fora do plano |
| CONFIGURING | Configurando |
| READY | Pronto para usar |
| ACTIVE | Ativo |
| DEGRADED | Instável |
| SUSPENDED | Suspenso |
| DISABLED | Desligado |
| UNKNOWN | Sem dados |

## Dashboard

| id | Copy |
| --- | --- |
| home.h1 | Início |
| home.briefing.empty | Ainda não há movimento hoje. Complete a configuração para ver o briefing. |
| home.queue.empty | Nada precisa de você agora. |
| home.queue.title | Precisa de você |
| home.agent.placeholder | Pergunte sobre hoje… |
| home.funnel.acquisition | Aquisição |
| home.funnel.followup | Follow-up |
| home.funnel.conversion | Conversão |
| home.funnel.retention | Retenção |
| home.nba.title | Próximas ações |
| home.setup.cta | Completar configuração |
| widget.unknown | Sem dados |
| widget.unknown.help | Ainda não temos essa informação. |
| widget.error | Não foi possível carregar. |
| widget.retry | Tentar de novo |
| widget.forbidden | Sem permissão para ver isto. |
| widget.configuring | Este módulo ainda está sendo configurado. |
| widget.degraded | Integração instável. Nada foi marcado como concluído sem confirmação. |

## Auth

| id | Copy |
| --- | --- |
| login.h1 | Entrar |
| login.sub | Acesso ao painel da sua empresa. |
| login.email | E-mail |
| login.password | Senha |
| login.submit | Entrar |
| login.forgot | Esqueci a senha |
| login.error | Não foi possível entrar. Confira os dados ou tente de novo. |
| reset.h1 | Redefinir senha |
| reset.send | Enviar instruções |
| reset.sent | Se houver uma conta neste e-mail, enviaremos as instruções. |

## AI

| id | Copy |
| --- | --- |
| ai.chip.internal | {agent} · {tenant} |
| ai.chip.impulsionito | Impulsionito · Impulsionando |
| ai.chip.client | Assistente · {tenant} |
| ai.state.read | Leitura |
| ai.state.recommend | Recomendação |
| ai.state.prepared | Preparada — não executada |
| ai.state.approval | Precisa da sua aprovação |
| ai.state.executed | Executada |
| ai.state.failed | Não concluída |
| ai.state.forbidden | Sem permissão |
| ai.state.handoff | Encaminhada a uma pessoa |
| ai.approve | Aprovar |
| ai.discard | Descartar |
| ai.stop | Parar |
| ai.handoff | Falar com pessoa |
| ai.stale | Pode estar desatualizado |
| ai.sources | Fontes consultadas |
| ai.risk.finance | Esta ação afeta dinheiro ou clientes. Confira antes de aprovar. |
| ai.unavailable | O assistente está indisponível no momento. |
| ai.degraded | O assistente está instável. Você pode falar com uma pessoa. |
| ai.send | Enviar |
| ai.receipt | Executada. Comprovante {id}. |

## Branding fallback

| id | Copy |
| --- | --- |
| brand.adjusted | Cor da marca ajustada para leitura. |
| brand.companyFallback | Empresa |

## Help

| id | Copy |
| --- | --- |
| help.h1 | Ajuda |
| help.new | Novo chamado |
| help.empty | Nenhum chamado ainda. |
| help.handoffConfirm | Abrimos um chamado para uma pessoa da Impulsionando. |

## Finance

| id | Copy |
| --- | --- |
| fin.payables | Contas a pagar |
| fin.receivables | Contas a receber |
| fin.forbidden | Você não tem permissão para ver informações financeiras. |

## Destructive

| id | Copy |
| --- | --- |
| destroy.title | Confirmar |
| destroy.body | Esta ação não pode ser desfeita. |
| destroy.confirm | Confirmar |
| destroy.cancel | Cancelar |

## Misc chrome

| id | Copy |
| --- | --- |
| user.signout | Sair |
| user.theme | Aparência |
| theme.light | Claro |
| theme.dark | Escuro |
| theme.system | Sistema |
| cmd.placeholder | Ir para… |
| skip | Ir para o conteúdo |
| synthetic | Dados ilustrativos |
