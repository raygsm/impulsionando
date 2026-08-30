# Contas, ambientes e lançamento

Data da entrevista: 2026-08-28

## Contas e ambientes informados

| Recurso        | Situação informada                        | Owner/acesso                                  | Confirmação pendente                                  |
| -------------- | ----------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| Supabase       | aparentemente um único projeto, plano Pro | Raygs owner; Cauã e Raygs com acesso integral | confirmar ausência de staging/projetos antigos        |
| dados Supabase | existem pessoas reais cadastradas         | Cauã e Raygs administram                      | classificar pacientes, documentos e pagamentos        |
| Cloudflare     | zone `impulsionando.com.br` visível       | Raygs owner; Cauã com acesso                  | identificar registrador e exportar zone/rules         |
| Hostinger      | aparentemente uma única VPS               | Raygs owner; Cauã com acesso root             | confirmar snapshots, recovery e servidores adicionais |
| pagamentos     | ambiente e contas desconhecidos           | não confirmado                                | identificar produção/sandbox e owners                 |

Nenhuma credencial ou secret foi solicitada ou armazenada.

## Gate de segunda-feira

O objetivo informado é que Impulsionando, Chrismed, Colors Saúde e WMP estejam production-ready em 2026-08-31. Salvo exceção por tenant, isso inclui domínio, landing, cadastro, login, painel, pagamentos, WhatsApp, e-mail, agendamento, automações, administração e dados reais.

Cauã e Raygs validarão os fluxos.

O prazo orienta priorização; não autoriza reduzir gates de perda de dados, isolamento, cobrança, webhook, backup ou rollback.
