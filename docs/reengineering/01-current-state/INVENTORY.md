# Inventário necessário antes de implementar

O objetivo da Fase 0 é transformar suposições em um catálogo verificável.

Atualizado em: 2026-08-30.

## Produto e tenants

- [x] Listar domínios/subdomínios declarados no código e configuração.
- [x] Confirmar resolução DNS pública dos hosts P0 (dig 2026-08-30); export Cloudflare rules completo ainda pendente.
- [x] Identificar product owner (Raygs) e technical approvers (Cauã+Raygs) por vertical P0.
- [x] Registrar classificação inicial de páginas públicas, áreas autenticadas e jornadas críticas.
- [ ] Identificar funcionalidades realmente usadas nos últimos 30/90 dias.
- [ ] Classificar duplicações e código aparentemente abandonado.

## API e jobs

- [x] Catalogar estaticamente os 111 arquivos de endpoint HTTP.
- [x] Medir e localizar os 331 arquivos com server functions.
- [x] Catalogar as 8 Supabase Edge Functions do repositório.
- [x] Catalogar workers e candidatos estáticos a cron/tick.
- [x] Registrar sinais heurísticos de autenticação e idempotência.
- [x] Trace estático auth/session/membership (J-02).
- [ ] Confirmar manualmente autenticação, autorização e idempotência de entradas críticas (allow/deny).
- [ ] Identificar consumidores externos live de webhooks/cron.

## Dados

- [x] Exportar snapshot do código: 465 tables, 19 views, 105 functions e 20 enums tipados.
- [x] Exportar o catálogo do Supabase live e comparar com o snapshot ([`phase-0/SUPABASE-LIVE-AUDIT.md`](phase-0/SUPABASE-LIVE-AUDIT.md)).
- [x] Mapear sinais de `tenant_id`, `company_id` e `user_id` no snapshot tipado e no live.
- [x] Registrar decisão de SoT observacional live ([`phase-0/SCHEMA-SOURCE-OF-TRUTH.md`](phase-0/SCHEMA-SOURCE-OF-TRUTH.md)).
- [ ] Auditar corpos das 47 functions `anon` DEFINER (amostra residual OK).
- [x] Mapear buckets candidatos nas migrations.
- [x] Confirmar buckets live (12) na auditoria estrutural.
- [x] Confirmar divergência migrations aplicadas versus arquivos do repositório (drift documentado).
- [ ] Definir classificação de dados e política de retenção.

## Integrações

- [x] Localizar superfícies de Mercado Pago, Paddle e outros pagamentos no código.
- [x] Localizar superfícies de n8n no código; container live Up; workflows UI pendentes.
- [x] Localizar Evolution/WhatsApp, Meta e e-mail no código; containers Evolution Up; instâncias pendentes.
- [x] Localizar Google Drive e callbacks OAuth no código; apps live pendentes.
- [x] Localizar provedores/superfícies de IA; inventário profundo pendente (high-prio backlog).
- [x] Catalogar candidatos a webhooks recebidos; consumidores live pendentes.

## Infraestrutura

- [x] DNS resolução pública P0 + Cloudflare na borda (headers); rules export pendente.
- [x] Registrar snapshot observado de Nginx, containers, systemd, portas e releases.
- [x] Revalidar mapa live host→Nginx→upstream→runtime→SHA (2026-08-30) incl. candidate `:3500`.
- [x] Catalogar os 168 workflows do checkout e conter sete publishers mutáveis.
- [x] Conciliar registry 209 vs checkout 168; classificar 41 orphans; autoridade temporária documentada.
- [x] Auditar presença/falha de backups sem executar limpeza; documentar postura Pro.
- [ ] Provar restore isolado do Supabase (bloqueio + próximo passo em BACKUPS.md).
- [ ] Exportar logs/métricas completos e dependência SentinelX.

## Saída obrigatória

Cada item deve registrar proprietário, criticidade, origem, consumidor, ambiente, evidência, decisão de manter/migrar/remover e dependências. Use os templates desta pasta raiz.
