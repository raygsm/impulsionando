# Plano de Produção

Só chega aqui workflow com `Fase 3` da homologação completa +
Checklist de Ativação assinado.

## Go-live por tenant

1. **Freeze**: nenhuma alteração no JSON do workflow por 24h antes do
   go-live.
2. **Ativação**: responsável do tenant altera `modo_padrao` para
   `producao` em `/core/automacao/modelos-tenant/{slug}` (ação registra
   log de auditoria).
3. **Canary**: primeiras 24h em 10% do volume (quando aplicável, via
   node `IF random < 0.1`). Métricas revisadas a cada 4h.
4. **Ramp-up**: 25% → 50% → 100% em 72h se sem incidentes.
5. **Post-mortem**: revisão obrigatória D+7 com responsável do tenant.

## Rollback

Gatilhos automáticos para pausar:
- Taxa de falhas > 5% em janela de 15 min.
- Latência P95 > 15s.
- Opt-out > 3% em 24h.
- Alerta LGPD (qualquer).

Ação: workflow marcado `pausado`, notificação `int.workflow-falhou`
para responsável + admin do core.

## Monitoramento

- Painel `/core/automacao/monitoramento`:
  - Execuções por hora × workflow.
  - Taxa de sucesso/erro.
  - Latência P50/P95.
  - Fila de retries.
- Alertas via `notify_user` para severidade `error`.

## Segurança contínua

- Rotação semestral de `IMPULSIONANDO_WEBHOOK_SECRET`.
- Auditoria mensal de templates ativos.
- Revisão trimestral de consentimento LGPD.
- Retenção de logs: 180 dias (default) — configurável por tenant.

## Comunicação

- Novos workflows entram no changelog interno.
- Mudanças materiais em templates enviadas ao responsável do tenant
  com 48h de antecedência.
- Incidentes críticos: comunicado em até 1h.
