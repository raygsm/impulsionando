# Impulsionando Tour — Private Product Baseline

## Positioning
Impulsionando Tour is an invitation-only, high-ticket private concierge operation launching in Rio de Janeiro. The customer-facing professional is always **CP — Concierge Privado**. Do not market or label the CP as a tourism guide.

Core promise: **Zero preocupação. Tranquilidade de A a Z.**

The product combines the iconic Rio with the lived/native Rio. It is not a fixed sightseeing catalogue. It is a curated, flexible operating layer around a guest or group.

## Closed referral network
- Entry is by a private, numbered referral.
- Each referral has an internal immutable number plus a non-guessable secret token.
- A referral opens qualification; it does not guarantee acceptance or availability.
- Referrer, conversion, expiry, status and provenance are auditable.
- Public pages must never expose guest itineraries, referral graphs, precise live locations or sensitive security data.

## CP — Concierge Privado
The CP is positioned around discretion, reliability, hospitality, local operational knowledge and problem solving. Activities that legally require a licensed/regulated professional or operator must be delivered by appropriately qualified suppliers. Naming the CP does not replace legal compliance.

## Rio operating doctrine
Rio is simultaneously a global destination, a large metropolis and a collection of distinct territories. Experience design must consider time of day, route, traffic, weather, event calendar, local context, guest profile, mobility and current operational intelligence.

Safety is contextual and dynamic; never promise zero risk. Maintain Plan A/B/C, reconfirm critical suppliers, and allow the operation to change when conditions change.

### Communities and local territories
Communities are living neighborhoods, not attractions or scenery. Any experience in a community must prioritize local consent/context, qualified local operators where appropriate, dignity, photography rules, economic benefit to local participants and the right to cancel or reroute when conditions are unsuitable.

## Product axes
1. Iconic Rio — landmarks and recognized experiences, optimized by context.
2. Native Rio — neighborhoods, gastronomy, music, culture and daily-life experiences selected with care.
3. Extraordinary Rio — premium mobility, sea, mountain, aviation, gastronomy and bespoke experiences supplied by compliant operators.
4. Beyond Rio — Costa Verde, Angra, Paraty, Região dos Lagos, Búzios, Cabo Frio, Arraial do Cabo, Petrópolis and Teresópolis as operational coverage expands.

## Guest briefing
Post-contract briefing is conversational and progressive. Capture language, group composition, pace, food, music, nightlife, beach, nature, adventure, culture, comfort, budget envelope, mobility, restrictions, privacy/image preferences, dislikes and non-negotiables. Do not collect sensitive data without a legitimate purpose and appropriate consent.

## Experience engine
Every itinerary item can have a plan_variant (A/B/C). Local intelligence stores best windows, audience fit, operational notes, safety context, accessibility, community protocol and last verification. Recommendations should show internal confidence and freshness rather than claiming certainty.

## Confirmation engine / n8n contract
Use `tour_experience_confirmations` as the operational source for automation. Recommended event triggers:
- trip.created -> briefing invitation
- briefing.completed -> concierge review / itinerary draft
- itinerary.item.created -> supplier confirmation request
- T-72h -> first reconfirmation
- T-24h -> critical reconfirmation + weather/traffic/context review
- status.changed -> guest notification when material
- assignment.checkin -> internal arrival/check-in state
- assignment.checkout -> service completion
- trip.completed +24h -> satisfaction request
- high review / NPS promoter -> private referral eligibility
- referral.created -> private invitation delivery
- referral.opened -> qualification journey
- referral.converted -> attribution ledger

Automation must be idempotent, logged and safe to retry. Failed critical confirmations escalate to a human operator and activate the fallback plan; they must not silently continue.

## Hospitality and Airbnb/hotel layer
Impulsionando Tour may curate and recommend hotels, serviced apartments and Airbnb listings according to guest needs, but should not imply ownership, endorsement by a third-party platform or guaranteed third-party availability unless contractually true. Store the reason for each recommendation: location fit, privacy, access, check-in, mobility, service level, neighborhood, group configuration and operational suitability.

## High-ticket UX
The public surface should feel selective rather than mass-market: editorial typography, dark premium palette, restrained gold accent, strong Rio imagery, few calls to action, no discount language and no giant public catalogue. The primary conversion is **validate private referral**, followed by qualification and briefing.

## Backend baseline
Existing Core tables cover guests, trips, members, itinerary, suppliers, services, requests, offers, assignments, incidents, reviews and commissions. Added tables:
- `tour_private_referrals`
- `tour_local_intelligence`
- `tour_experience_confirmations`

All new tables use tenant isolation through the existing `tour_user_has_tenant_access(tenant_id)` RLS pattern.

## Non-negotiables
- Never call CP a tourism guide in customer-facing copy.
- Never promise absolute safety or perfection.
- Never romanticize or objectify communities.
- Never expose live guest location publicly.
- Never use fake inventory, fake partners, fake prices or fake availability.
- Regulated transport, aviation, maritime, security and other specialist activities require compliant providers.
- Guest privacy and discretion outrank marketing content.
