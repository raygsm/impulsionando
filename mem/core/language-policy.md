---
name: Idioma único — Português (Brasil)
description: Todo texto voltado ao usuário (e-mails, WhatsApp, SMS, push, chat, notificações, rodapés, botões CTA, mensagens de erro em canais de atendimento) DEVE estar em português. Nenhum termo/frase em inglês — nem em rodapés de e-mail.
type: constraint
---

Regra inegociável de todos os canais de atendimento e comunicação da Impulsionando e de todos os tenants:

- Idioma único: português brasileiro (pt-BR).
- Aplicável a: e-mails (assunto, corpo, preheader, rodapé, unsubscribe), WhatsApp/Z-API, SMS, push, in-app notifications, chat/atendimento, respostas automáticas, mensagens de status, botões CTA de comunicação e templates de N8N.
- Rodapé de e-mail também em português — inclui link/rótulo "Cancelar inscrição" (nunca "Unsubscribe").
- `Html lang="pt-BR"` em todo template React Email.
- Ao criar/editar qualquer template ou copy de canal, revisar por termos em inglês antes de publicar.
- Se algum footer for anexado pela plataforma (Lovable Emails), garantir que o texto configurado esteja em português; se estiver em inglês, sinalizar ao usuário para trocar em Cloud → Emails.

**Por que:** identidade da marca é 100% Brasil; texto misto quebra confiança e leitura do público-alvo.
