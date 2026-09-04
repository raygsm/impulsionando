# Canonical SQL apply policy

**Default:** do not apply.

| Gate | Required before apply |
| --- | --- |
| DB0 | Product decisions for the target slice (P-DB-01/02/04/05/06; P-DB-09 if agents) |
| DB1 | Physical/access ADR (T-DB-01/02/03/05/08) — this draft assumes Option A |
| DB2 | F-DATA + writer inventory for the aggregate |
| DB3 | Contract/schema review of these files (or revised successors) |
| DB4 | Isolated or staging expand + RLS allow+deny evidence |
| DB5+ | Backfill/reconcile/shadow/write-authority — separate jobs, not this expand |

## Hard bans

- No `supabase db push` / reset against production
- No destructive contract (drop/rename/NOT NULL on legacy) in the same release as expand
- No dual live authority for platform Support (`support_tickets` stays sole authority until P-DB-05 bridge)
- No dual live queues/outbox without T-DB-05 authority plan
- No secrets in SQL or docs

## Promotion path (later)

When DB4 passes for an aggregate:

1. Copy or re-home the reviewed files into the controlled release migration path decided in T-DB-08  
2. Apply via release job only  
3. Record SHA, project ref, timestamps in evidence docs — never secrets  
4. Keep this draft corpus as history or freeze superseded versions
