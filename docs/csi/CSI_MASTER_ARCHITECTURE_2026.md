# CSI Invest — Master Architecture 2026

## Positioning
CSI Intelligence Experience: boutique high-ticket de investimentos + inteligência patrimonial + relacionamento humano + experiência digital editorial.

## Verified public proof points
- CSI Invest / CSI Agentes Autônomos de Investimentos has public evidence of partnership/relationship with BTG Pactual.
- Public BTG materials reference CSI in recognition/ranking contexts, including Best Performer 2023 and 1st place in Fundos de Investimentos at BTG Summit 2024.
- Paulo Luiz Cardoso e Silva (Paulo Cardoso) is the CEO reference supplied for the CSI project. Do not confuse with homonyms.
- Rio de Janeiro tourism/economic indicators used in public content must carry source/date.
- Historical brAAA references for Rio must always be labeled historical, never current unless revalidated.

## Product layers
1. Public portal: authority, intelligence, editorial, proof, CTA.
2. CSI Pulse: macro, rates, FX, indices, real assets and portfolio context.
3. CSI Radar: curated news/event intelligence.
4. Investor portal: consolidated view, documents, watchlist, alerts, suitability.
5. CRM journey: source/UTM -> qualification -> suitability -> advisor -> regulated partner handoff -> relationship.
6. Investment intent: transparent pre-checkout UX for expression of interest and partner handoff. It is NOT brokerage execution, custody or settlement.
7. Partner layer: BTG and future brokers/custodians only through homologated integrations.
8. Compliance layer: consent, suitability, evidence, audit trail and disclosure versioning.

## Competitive benchmark
### BTG Pactual
Strengths: broad platform, wealth/private segmentation, research, products, digital access.
CSI response: boutique relationship, contextual intelligence, curated high-ticket experience and a lighter executive UX.

### XP
Strengths: broad product shelf, advisor network, content, retail-to-high-net-worth funnel.
CSI response: avoid mass-market visual language; emphasize curation, privacy, executive service and patrimonial context.

### International wealth UX benchmark
Use principles seen in modern private-banking/broker experiences: portfolio aggregation, explainable performance, document center, alerts, secure messaging, suitability and advisor contact. Never copy protected UI or imply unsupported functionality.

## Brand experience
- Dark navy / warm gold / high contrast.
- Editorial rather than promotional.
- Financial entertainment means habit-forming intelligence, never gambling mechanics.
- Every metric must expose source and timestamp when real-time data is enabled.
- No fictitious balances, returns, portfolio holdings, ratings or awards.

## Social distribution
LinkedIn: CEO authority, institutional intelligence, market theses, awards/proof, long-form insights.
Instagram: visual CSI Radar, short market context, Rio & Capital, events, executive backstage, education.
Portal: canonical destination for every social CTA.

## Back-end implemented
Supabase tenant CSI with strict compliance / real-data-only settings.
RLS-protected tables for investor profiles, alerts, documents, watchlists, partner connections, editorial feed, leads, investment intents, client events and compliance reviews.
BTG partner record is marked as homologation: public relationship verification does NOT equal active API integration.

## Regulatory/product boundary
The CSI web layer can qualify, educate, collect suitability/consent, display properly sourced data, capture investment intent and hand off to a regulated partner. It must not claim to execute an order, custody assets, settle transactions or display live positions unless the corresponding regulated integration is contractually and technically homologated.

## Required production integrations
- Auth/MFA
- Market-data provider with commercial license
- BTG/broker API or approved deep-link/SSO/handoff
- KYC/AML provider where applicable
- secure document storage
- transactional email and approved WhatsApp templates
- n8n CRM journeys
- observability, audit and incident alerts

## Go-live gate
Never mark full investment execution green until partner API, credentials, legal/compliance approval, sandbox/homologation, E2E tests and production monitoring are evidenced.
