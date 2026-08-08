# Auditoria consolidada do ecossistema

> Gerado por `npm run audit:ecosystem` em 2026-08-02T19:19:49.351Z. O inventário comprova o repositório; estados de serviços externos permanecem explicitamente bloqueados até validação autenticada.

## Resultado executivo

- **Conclusão verificável:** 96% (161 verificações locais; 6 grupos externos bloqueados).
- **Core:** único pacote central; 0 tenant(s) do registro sem rota-raiz.
- **Inventário:** 8 clientes/projetos, 76 domínios, 30 dashboards, 4 URLs administrativas, 869 URLs públicas e 195 workflows N8N.
- **Agente mestre:** Impulsionito. O vínculo subordinado completo somente pode ser confirmado consultando o banco/N8N de produção.

## Clientes cadastrados no registro oficial

| Cliente | Slug | URL local |
|---|---|---|
| CHRISMED | `chrismed` | `/chrismed` |
| RIOMED | `riomed` | `/riomed` |
| Colors Saúde | `colors` | `/colors` |
| Imobiliária Garrido | `garrido` | `/garrido` |
| Marocas | `marocas` | `/marocas` |
| Food Service | `foodservice` | `/foodservice` |
| WMP | `wmp` | `/wmp` |
| White Label Impulsionando | `whitelabel` | `/white-label` |

## Artefatos completos

O inventário integral de dashboards, URLs, domínios, agentes, workflows, integrações, SEO, duplicidades e pendências está em [`ecosystem-audit.json`](./ecosystem-audit.json).

## Correções e garantias

- Inventário passou a ser automático, determinístico e repetível, evitando confirmações sem evidência.
- JSON inválido e workflow sem nós são classificados como inválidos/órfãos.
- Integração encontrada no código é classificada como **parcialmente ativa**, nunca como ativa sem teste autenticado.
- Nenhum layout, UX ou identidade visual foi alterado.

## Pendências externas

- Credenciais de produção e consultas administrativas do Supabase.
- API e credenciais da instância N8N.
- OAuth/contas Google e GitHub.
- tokens OpenAI, WhatsApp, Mercado Pago e APIs externas.
- credenciais SMTP e DNS SPF/DKIM/DMARC.
- testes autenticados de dashboards e URLs privadas.
