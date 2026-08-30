# Visão do stakeholder — Raygs

Origem: material enviado por Raygs a Cauã em 2026-08-30.

Estado: **direção de produto não validada**.

Este documento resume a intenção do stakeholder. Ele não comprova que capacidades existem, não substitui evidência do legado, não autoriza implementação e não prevalece sobre ADRs, gates ou o estado registrado do programa.

## Visão central

A Impulsionando deve tornar-se uma plataforma SaaS multi-tenant central. Cada cliente é um tenant configurável da mesma plataforma, e não uma aplicação independente criada manualmente.

O modelo desejado é:

```text
Impulsionando
→ tenant
→ plano
→ módulos
→ usuários e permissões
→ agente
→ integrações
→ automações
→ comunicações
→ operação
→ BI
```

Um novo cliente deve ser provisionado de forma idempotente, rastreável e recuperável, minimizando alterações específicas no código, proxy e infraestrutura.

## Prioridade imediata declarada

Estabilizar a cadeia de publicação:

```text
Git
→ commit/SHA
→ build
→ imagem ou artefato
→ runtime
→ reverse proxy
→ Cloudflare/DNS
→ domínio
→ tenant
→ frontend correto
```

Para cada tenant, deve ser possível provar domínio, HTTPS, SHA, runtime, configuração e frontend servidos. HTTP 200 isolado não constitui sucesso.

## Capacidades desejadas

### Plataforma e tenants

- provisionamento de tenant;
- planos, módulos, limites e feature flags configuráveis;
- identidade visual centralizada;
- usuários, RBAC e isolamento;
- admin global e admin restrito ao tenant;
- publicação contínua com rollback.

### Comercial e financeiro

- captação, contratação, checkout e onboarding;
- pagamentos, Pix, cartão e recorrência;
- cobrança, pró-rata, inadimplência, suspensão e reativação;
- faturamento, fiscal e certificado digital;
- CRM, funil, retenção, NPS e BI.

### Operação dos tenants

- comunicação omnichannel;
- WhatsApp QR/oficial, e-mail, SMS e voz;
- n8n e jornadas configuráveis;
- ERP, PDV, estoque e agenda;
- módulos clínicos/prontuário quando aplicável;
- templates e automações por tenant.

### Engenharia e governança

- APIs e integrações desacopladas;
- eventos, filas, retries e idempotência;
- logs, auditoria e observabilidade;
- RLS, RBAC, MFA e gestão de secrets;
- LGPD, retenção e segregação;
- backups restauráveis e disaster recovery;
- infraestrutura como código e testes por jornada.

## Princípios aceitos como direção

- requisito não é prova de implementação;
- comportamento observado e teste real prevalecem sobre código/documentação;
- preservar o correto e remover somente o comprovadamente obsoleto;
- tenant A nunca acessa dados do tenant B;
- frontend não decide valor, plano ou autorização;
- pagamentos e webhooks devem ser autenticados, idempotentes e auditáveis;
- backup só é confiável após restauração testada;
- configuração variável por tenant não deve virar `if tenant === ...` espalhado;
- releases devem ser imutáveis, identificáveis e reversíveis;
- secrets não entram em repositório, frontend ou logs.

## Relação com o programa de reengenharia

| Intenção do stakeholder                                                     | Fase do programa                |
| --------------------------------------------------------------------------- | ------------------------------- |
| descobrir estado real e impedir mudanças concorrentes                       | Fase 0 — contenção e descoberta |
| confirmar contratos, identidade tenant, segurança e regras centrais         | Fase 1 — contratos e fundação   |
| reconstruir plataforma/VPS com staging, Dokploy, imagens por SHA e rollback | Fase 2 — plataforma e staging   |
| consolidar regras e integrações em API modular                              | Fase 3 — API                    |
| padronizar domínios, frontends e provisionamento de tenants                 | Fase 4 — tenants                |
| separar n8n, workers, eventos, retries e comunicações                       | Fase 5 — integrações            |
| governar agentes e recursos de IA                                           | Fase 6 — IA                     |
| direcionar tráfego ao novo runtime e retirar o legado                       | Fase 7 — cutover                |

## Reconstrução da VPS

A reconstrução da plataforma de execução está aprovada como objetivo do programa, mas não é uma ação inicial cega.

No momento atual:

- a VPS possui runtimes Docker e systemd concorrentes;
- domínios e paths podem servir releases diferentes;
- publishers externos ainda precisam ser completamente mapeados;
- backup restaurável não foi comprovado;
- banco, migrations e tipos possuem drift grave.

Por isso, a ordem segura é:

```text
inventariar e conter
→ definir contratos
→ construir servidor/staging limpo em paralelo
→ provar deploy e rollback
→ migrar tráfego tenant por tenant
→ retirar legado após janela de retorno
```

“Reconstruir a VPS” significa substituir progressivamente a autoridade do runtime legado por uma plataforma reproduzível. Não significa apagar ou reorganizar a VPS atual durante a descoberta.

## Hipóteses que exigem confirmação

Os itens abaixo aparecem na visão, mas ainda não são requisitos aprovados:

- n8n como motor obrigatório de todas as automações;
- vencimento universal no dia 5 e fórmula oficial de pró-rata;
- ERP, PDV, estoque, prontuário, fiscal, SMS e voz para todos os tenants;
- provedores oficiais de pagamento e comunicação;
- escopo legal/regulatório de saúde, fiscal e LGPD;
- agentes de IA como aprovadores de releases;
- estimativa comercial fixa de R$ 50/h;
- entrega simultânea de toda a visão funcional.

Agentes podem produzir evidência e recomendação; aprovação de produção pertence a Cauã e Raygs.

## Regra de uso

Ao avaliar uma capacidade desta visão, registrar:

```text
visão
→ requisito confirmado
→ código
→ banco
→ infraestrutura
→ integração
→ teste
→ resultado
```

Até a confirmação, a capacidade permanece como backlog aspiracional e não pode ser usada para declarar o produto pronto.
