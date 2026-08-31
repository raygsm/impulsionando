# Resumo para Raygs — Intake de produto

**Para:** Raygs (dono de produto)  
**De:** Cauã / equipe técnica  
**Data:** 2026-08-31

---

## O que é

Um **caderno oficial** dentro do repositório (`docs/product-intake/`) onde toda ideia, bug ou pedido seu vira um **documento organizado** — não fica só no WhatsApp.

Engenharia e agentes de IA leem esse documento e implementam **sem adivinhar**.

---

## Como você usa (3 passos)

1. Abre o Cursor (ou pede pro Cauã abrir).
2. Cola este texto e completa a frase no final:

```text
Quero registrar algo no intake de produto da Impulsionando.

Siga docs/product-intake/AGENTS.md — entreviste-me em português e crie o arquivo no lugar certo.

Minha ideia em uma frase:
[ESCREVA AQUI]
```

3. Responde as perguntas simples que o agente fizer (uma de cada vez). No final você recebe um arquivo com **resumo em português claro** para você aprovar.

---

## Como fica organizado

Tudo separado por **aplicação** (marca/produto):

| Pasta | O quê |
| --- | --- |
| **Plataforma** | Site Impulsionando, app, planos, admin master, login geral |
| **Chrismed** | Clínica, agenda, pacientes |
| **Colors Saúde** | Loja, pedidos |
| **WMP** | Eventos, propostas |
| **Outros** | CSI, RioMed, vitrines, etc. |

Dentro de cada uma, 4 tipos:

| Tipo | Exemplo |
| --- | --- |
| **Problemas** | "Login não funciona", "tela branca" |
| **Novas funcionalidades** | "Quero exportar relatório X" |
| **Melhorias** | "Deixar checkout mais claro" |
| **Específico do tenant** | "Só pro Chrismed, regra especial" |

Na **Plataforma**, ainda tem **módulos** (auth, CRM, billing, agenda…) quando o pedido é de uma parte específica do sistema.

---

## O que você precisa aprovar

Cada documento tem uma seção **"Resumo para o dono de produto"** — é isso que você lê. Se fizer sentido, marca aprovação no final. Só depois vira código (respeitando também as fases de reengenharia).

---

## O que NÃO muda

- WhatsApp continua valendo para conversa rápida — mas **sempre** vira arquivo aqui depois.
- Linear (se usarmos) é só **status** (aberto/feito); o texto completo fica no repo.
- Isso **não substitui** o plano de reengenharia — só organiza **o que construir**.

---

## Onde olhar no repo

- Guia completo: `docs/product-intake/README.md`
- Prompt do agente: `docs/product-intake/AGENTS.md`
- Rascunhos em andamento: `docs/product-intake/caixa-de-entrada/`
- Por app: `docs/product-intake/aplicacoes/`

---

Qualquer dúvida, manda pro Cauã: "quero registrar X no intake" que a gente roda o fluxo junto.
