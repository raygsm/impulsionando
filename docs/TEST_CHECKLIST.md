# TEST_CHECKLIST — Homologação Onda 3

Checklist de aceite antes de publicar em produção.

## Pré-requisitos

- [ ] Migrations da Onda 3.3 e 3.4 aplicadas.
- [ ] Security scan sem findings críticos abertos.
- [ ] Contas de teste disponíveis:
  - `raygs@hotmail.com` (admin master)
  - `raygsmonnerat@gmail.com` (cliente-teste padrão)

## Shell Core

- [ ] `/core` carrega para staff Impulsionando.
- [ ] `/core` **nega** acesso para não-staff (mostra cartão “Acesso restrito”).
- [ ] Menu Core mostra grupos com **Hub Cobrança & MP** e **Hub Automações & N8N** como primeiros itens.
- [ ] Busca por nome de seção filtra grupos.

## Cliente 360

- [ ] `/admin/clientes/<slug>` mostra 12 abas oficiais na ordem correta.
- [ ] Header exibe o badge **Cortesia Full · Nd** quando ativa.
- [ ] Tab **Dados**, **Módulos**, **Automações**, **Financeiro**, **Mercado Pago**, **Domínios**, **Publicação**, **Logs**, **Configurações** carregam sem erro.
- [ ] Copy visível não usa a palavra “tenant”.

## Cortesia Full (aba Plano e cortesia)

- [ ] Estado inicial de um cliente sem cortesia mostra botão “Conceder cortesia”.
- [ ] Conceder cria evento em `core_courtesy_events` e ativa o badge.
- [ ] Estender +7d e +30d atualizam `full_courtesy_ends_at`.
- [ ] Revogar move para status `revoked` e limpa o badge.
- [ ] Converter para cobrança marca `converted` e mantém histórico.
- [ ] Alterar padrão global grava em `core_settings.full_courtesy_days_default`.
- [ ] Usuário sem `is_impulsionando_staff` não consegue chamar nenhuma dessas RPCs.

## Cérebro IA (aba Cérebro IA)

- [ ] Criar rascunho por cliente persiste em `core_ai_brains` (única por `company_id`).
- [ ] Ativar/inativar registra evento.
- [ ] Adicionar/remover item da KB reflete em `core_ai_brain_knowledge`.
- [ ] Histórico da aba lista eventos em ordem cronológica.
- [ ] Membro de outra empresa **não** enxerga a configuração de Cliente A logado como Cliente B.

## Hub Cobrança & MP

- [ ] `/core/hub-cobranca` mostra KPIs (MRR, contratos ativos, recebido 30d, faturas vencidas, cortesias).
- [ ] Bloco “Clientes em Cortesia Full” lista somente cortesias `active`.
- [ ] Marcador “termina em ≤ 7d” aparece para casos válidos.
- [ ] Link “gerenciar” abre `/admin/clientes/<slug>/plano`.
- [ ] Bloco Mercado Pago mostra eventos processados / assinatura inválida / erros.
- [ ] Atalhos abrem as telas oficiais existentes.

## Hub Automações & N8N

- [ ] `/core/hub-automacoes` mostra KPIs N8N + webhooks + integrações.
- [ ] “Credenciais pendentes” lista integrações inativas / not_configured.
- [ ] Top réguas N8N e canais carregam.
- [ ] Nenhum botão dispara mensagem real.

## Segurança / RLS

- [ ] `is_impulsionando_staff` filtra escrita em `core_courtesy_events`, `core_ai_brains`, `core_ai_brain_knowledge`, `core_ai_brain_events`.
- [ ] Membros de um cliente enxergam apenas o próprio Cérebro IA e sua KB.
- [ ] Nenhum secret aparece em bundle client (`grep` por Access Token deve dar vazio).

## Publicação

- [ ] Rodar Publish → Update em Lovable somente após tudo acima marcado.
- [ ] Validar em produção: `/core`, `/core/hub-cobranca`, `/core/hub-automacoes`, `/admin/clientes/<slug>` para 2+ clientes reais.
- [ ] Custom domains ainda respondem.
