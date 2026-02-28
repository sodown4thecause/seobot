# Topical Authority Map Rollout Report

Date: 2026-02-27
Owner: SEO/AEO product engineering
Status: Implemented (Tasks 5-11)

## Shipped Scope

- Integrated topical map payload generation into `POST /api/audit` and persisted-result reads in `GET /api/audit/results/[id]`.
- Added normalization and scoring wiring for DataForSEO, Firecrawl, and AI diagnostics with graceful provider-status degradation.
- Added results UI modules:
  - `TopicalAuthorityMap` score cards + topic rows + priority actions
  - `SharePanel` for competitor-safe social copy artifacts
- Added unlisted-first visibility controls:
  - Default `publicVisibility` is `unlisted`
  - New endpoint `PATCH /api/audit/results/[id]/visibility`
  - UI controls for `unlisted -> public -> private`
  - Client noindex/nofollow behavior for non-public states
- Converged landing lead magnet path to canonical `/audit` flow and removed duplicate embedded legacy auditor from landing surfaces.

## Test Coverage Added

- Unit:
  - `tests/unit/audit/topical-map-types.test.ts`
  - `tests/unit/audit/topical-map-scoring.test.ts`
  - `tests/unit/audit/topical-map-normalizer.test.ts`
  - `tests/unit/audit/topical-map-payload.test.ts`
  - `tests/unit/audit/topical-authority-map-component.test.ts`
  - `tests/unit/audit/share-artifacts.test.ts`
- Integration:
  - `tests/integration/audit-topical-map-api.test.ts`
  - `tests/integration/audit-visibility-flow.test.ts`
  - `tests/integration/audit-topical-map-live-wiring.test.ts`
  - `tests/integration/landing-to-audit-cta.test.ts`

## Known Limitations

- Database migration for `ai_visibility_audits.public_visibility` is not included in this rollout patch; endpoint expects column availability.
- Build/typecheck failures are currently dominated by existing workspace configuration and route-segment config issues unrelated to topical-map changes.
- Live provider wrappers currently return minimal data contracts and rely on fallback topic synthesis when providers return empty data.

## Metric Dashboard Definitions

- `audit_completion_rate`: completed audits / started audits on `/audit`.
- `topical_map_render_rate`: result payloads containing `topicalMapPayload` / completed audits.
- `share_action_rate`: clicks on share actions / topical map result views.
- `publish_transition_rate`: reports transitioned from `unlisted` to `public` / topical map results.
- `provider_partial_rate`: runs with any provider status not equal to `ok` / topical map runs.

## Rollback Toggles

- API fallback: omit `topicalMapPayload` in `app/api/audit/route.ts` and `app/api/audit/results/[id]/route.ts` response shaping.
- UI rollback: hide topical map and share modules in `app/audit/results/[id]/page.tsx`.
- Visibility rollback: disable PATCH usage in results page and keep hardcoded `unlisted` response defaults.
- Provider rollback: return synthetic topic nodes only from workflow when provider wrappers fail.
