# Omnichannel activation — WhatsApp QR + Instagram

## Objective
One tenant agent brain across web chat, WhatsApp and Instagram, with channel-specific transport but shared tenant knowledge, policies, CRM lifecycle and audited omnichannel ledger.

Identity is NOT silently merged across channels. A web visitor, WhatsApp number and Instagram-scoped ID become one CRM person only after deterministic matching or explicit verification/consent.

## Transport A — WhatsApp QR (immediate compatibility)
Provider: Evolution API, isolated instance per tenant.

Initial order:
1. Impulsionando -> `impulsionando-impulsionito`
2. CHRISMED -> `chrismed-oliver`
3. Colors Saude -> `colors-iris`

Required runtime secrets per tenant:
- `<TENANT>_EVOLUTION_BASE_URL`
- `<TENANT>_EVOLUTION_API_KEY`
- `<TENANT>_EVOLUTION_WEBHOOK_SECRET`

Never expose API keys to browser, agent prompt, logs or database plaintext. QR payload may be returned only to an authenticated tenant/admin pairing UI and must expire quickly.

Webhook rules:
- secret-authenticated request;
- exact instance/tenant validation;
- ignore groups/status broadcasts unless a product explicitly supports them;
- ignore `fromMe` to prevent loops;
- deduplicate by provider message id;
- persist inbound before model invocation;
- persist outbound result/status;
- rate limit and retry through bounded outbox for production scale.

## Transport B — Meta official
Instagram Messaging uses Meta webhooks and Graph API credentials. WhatsApp Cloud API may coexist with QR transport; endpoint status determines which transport is active for a number.

### Impulsionando Instagram
Webhook: `https://impulsionando.com.br/api/public/hooks/meta-impulsionando`
Required secrets:
- `IMPULSIONANDO_META_APP_SECRET`
- `IMPULSIONANDO_META_VERIFY_TOKEN`
- `IMPULSIONANDO_META_IG_TOKEN`
- `IMPULSIONANDO_META_IG_ACCOUNT_ID`
- optional `IMPULSIONANDO_META_GRAPH_VERSION`
Agent: `impulsionito-core`

### CHRISMED Instagram
Webhook: `https://impulsionando.com.br/api/public/hooks/meta-chrismed`
Required secrets:
- `CHRISMED_META_APP_SECRET`
- `CHRISMED_META_VERIFY_TOKEN`
- `CHRISMED_META_IG_TOKEN`
- `CHRISMED_META_IG_ACCOUNT_ID`
- optional `CHRISMED_META_GRAPH_VERSION`
Agent: `chrismed-oliver`
Clinical guardrails remain unchanged.

### Colors Instagram/WhatsApp official
Webhook already implemented: `https://impulsionando.com.br/api/public/hooks/meta-colors`
Required secrets already declared by the endpoint configuration and code.
Agent: `colors-iris`.

## Unified brain contract
All transports must call the same tenant agent logic and use `communication_conversation_messages` as the channel ledger. The brain receives channel + tenant context but does not become a different persona per channel.

Shared memory means shared verified CRM/tenant knowledge and authorized long-term context, NOT unsafe automatic identity merging. Cross-channel continuity requires a verified CRM contact link.

## Lead capture lifecycle
Every inbound contact starts or updates a CRM lifecycle record:
`NEW -> IDENTIFIED -> QUALIFIED -> CONVERTING -> CUSTOMER -> RETENTION`

The agent should progressively request only the minimum useful data (name, consented contact details, intent and relevant business fields), explain why it is needed, and link the channel identity to the CRM contact after verification.

After capture, n8n workflows may run only when present in `n8n_workflow_registry`, enabled in `tenant_workflow_state`, signed with HMAC and audited in `communication_workflow_runs`.

## Journeys
- Capture: first contact, identity, consent, intent.
- Conversion: qualification, site/deep link, booking/checkout/payment when applicable.
- Relationship: follow-up, useful content, status updates, service.
- Retention: NPS/CSAT, reactivation, renewal, voucher/benefit under tenant policy.

## Go-live gates
For each tenant/channel:
1. credentials stored in runtime secret manager;
2. endpoint bound to correct tenant/agent;
3. webhook verification passes;
4. inbound message recorded once;
5. correct agent answers;
6. outbound delivery confirmed;
7. CRM lifecycle updated;
8. opt-out respected;
9. no cross-tenant access;
10. monitoring/healthcheck green;
11. rollback/disable switch tested.
