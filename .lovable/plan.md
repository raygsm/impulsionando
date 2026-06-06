# Revisão estratégica e incremental — Impulsionando

Regra de ouro: **reorganizar, conectar e detalhar o que já existe.** Nenhuma rota funcional será apagada; nenhum componente duplicado; o banco só recebe o ajuste já aprovado anteriormente (gravar `external_message_id` no outbox para fechar o ciclo da Z-API).

## Onda 1 — Salvar `external_message_id` no outbox (1 edição)
Sem isso o webhook da Z-API recém-criado não consegue marcar `delivered/read`.
- Editar `src/lib/zapi.server.ts`: `sendWhatsAppText` passa a retornar `messageId` extraído da resposta JSON.
- Editar **apenas** os 4 pontos que já enviam WhatsApp e gravam no outbox (`marketing-lead-notify`, `comms-self-test`, `uptime-whatsapp-test`, `uptime-check`) para fazer `update message_outbox set external_message_id, status='sent'` quando houver `outboxId`.
- Nenhuma migração nova.

## Onda 2 — Reorganização do menu público (1 arquivo)
Editar **só** `src/components/marketing/PublicHeader.tsx` + `PublicFooter.tsx` para chegar em:

```
Início | Soluções ▾ | Nichos ▾ | Planos ▾ | Demonstração ▾ | Contato | Entrar
```

- **Soluções ▾** vira agrupado por áreas funcionais (8 grupos: Comercial/CRM, Atendimento, Agenda/Eventos, Vendas/Pagamentos, Operações/Estoque, Pessoas/Permissões, Afiliados, Dashboards/BI). Cada item aponta para rota **já existente** (`/modulos#crm`, `/modulos#agenda` etc.) — não criamos rotas mortas.
- **Nichos ▾** passa a listar 7 categorias-mãe (Saúde, Alimentação, Serviços, Varejo, Viagens, Eventos, White Label), cada uma linkando para `/nichos/<slug>` que já existe (ou um anchor em `/nichos`).
- **Planos ▾**: já tem `Planos e preços` + `Orçamento personalizado` (feito na turma anterior).
- **Demonstração ▾**: move "Cliente Final", "White Label", "Showroom Fitness", "Showroom Eventos" para dentro — saem do nível raiz.
- Nenhum item de menu deletado: tudo é reorganizado.

## Onda 3 — Detalhamento dos nichos (data files, sem rotas novas)
Ampliar **somente** o data file `src/components/marketing/nichoDetails.ts` (já existe) para incluir:
- 7 categorias-mãe com os segmentos listados na briefing.
- Para cada nicho: lista de **exemplos logísticos**, **módulos aplicáveis**, **formulário típico** (campos), **dashboard típico** (cards), texto comercial fornecido.
- A página `/nichos` e `/nichos/$slug` (já existentes) leem desse data file → renderização automática, **zero rota nova**.

## Onda 4 — Afiliados: detalhamento conceitual (página + textos)
Sem mexer no banco ainda. Só conteúdo apresentável:
- Adicionar bloco "Afiliados" em `/modulos` (anchor `#afiliados`) com: cadastro/aprovação, link/cupom/QR, painel afiliado, painel gestor, regras de comissão.
- Adicionar bloco **"Splits e prazos"** explicando a regra: **3 dias úteis internos + prazo do gateway**, com tabela Pix / Crédito / Débito / Boleto e a lista de status (Venda registrada → Disponível para saque → Pago).
- Mockups visuais (cards) do "Painel do Afiliado" e "Painel do Gestor" como apresentação — implementação funcional fica para uma onda futura, fora deste escopo.

## Onda 5 — Teste end-to-end de comunicação
Após Ondas 1-4 publicadas:
- Disparar `/api/public/hooks/comms-self-test` com `email=sac@impulsionando.com.br` e `phone=5521995077375`.
- Conferir no painel Z-API que o webhook de status está chamando `/api/public/hooks/zapi-status` e que `whatsapp_message_events` recebe linhas (SENT → RECEIVED → READ).
- Conferir `message_outbox` com `external_message_id` preenchido e status evoluindo.
- Relatório final no chat com o resultado de cada canal.

## Fora de escopo desta passada (não fazer agora)
- Criar tabelas novas de afiliados/splits/saques.
- Implementar painéis funcionais de afiliado.
- Mexer em auth, RLS, edge functions ou módulos operacionais.
- Refazer páginas que já estão funcionais.

## Tamanho estimado
Cerca de **8 arquivos editados, 0 rotas novas, 0 migrações novas** — fica dentro do "ajuste pontual" que você pediu.

---

**Confirma esse plano (Ondas 1 → 5 em sequência)?** Se quiser, posso começar só pela Onda 1 e parar para você revisar antes de seguir.