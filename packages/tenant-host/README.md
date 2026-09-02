# @impulsionando/tenant-host

Shared hostname → tenant path resolution for Phase 4B `tenant-web` and future strangler slices.

Authority: legacy `src/lib/subdomain.ts` (monolith). This package holds the **minimal subset** needed for independent tenant-web routing until routes migrate out of the root app.
