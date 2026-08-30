# Registro inicial de riscos

| Risco | Impacto | Mitigação | Gate |
|---|---|---|---|
| Reescrita big bang | perda de comportamento e atraso indefinido | strangler e fluxo vertical piloto | todas as fases |
| Produção muda durante inventário | baseline inválido | freeze e owner único | fase 0 |
| Drift entre migrations e Supabase | perda ou quebra de dados | auditoria e staging restaurável | fases 0-2 |
| Vazamento entre tenants | incidente crítico | identidade canônica, RLS e testes deny | fases 1-7 |
| Dois escritores para o mesmo fluxo | duplicação/inconsistência | owner único, idempotência e reconciliação | fases 3-5 |
| Dokploy virar nova fonte de configuração manual | drift operacional | infra versionada e runbooks | fase 2 |
| n8n conter regras críticas invisíveis | migração incompleta | catálogo de workflows e adapters | fases 0 e 5 |
| IA executar ação indevida | risco financeiro, clínico ou reputacional | policy gates, approval e audit | fase 6 |
| Migração destrutiva sem rollback | indisponibilidade ou perda | expand/contract e backup testado | fases 2-7 |
| Limpeza prematura do legado | perda de fluxo desconhecido | telemetria, janela e aprovação | fase 7 |

Este registro deve ganhar owner, probabilidade, severidade e revisão periódica quando a Fase 0 começar.

