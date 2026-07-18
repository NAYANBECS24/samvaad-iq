# NETRA OS Catalyst-First Deployment

## Release posture

The canonical judge target is Catalyst Web Client plus the Node 24 `api` Advanced I/O function. Slate is a synchronized mirror and rollback, not a dependable same-origin API host.

This document does not assert a current public URL as release-ready. Deployment acceptance requires the smoke tests and judge journey below. The source rollback tag is `pre-netra-os-edef150`; development occurs on `feat/netra-os` without force-pushing.

## Required project preparation

1. Revoke the NVIDIA credential exposed outside the secret store.
2. Authenticate the Catalyst CLI with the authorized project-owner account and bind the intended Development project.
3. Provision the normalized tables from `data/catalyst-schema.md` and the required indexes/constraints.
4. Configure invited Catalyst Auth users and server-owned role mappings; keep public registration disabled.
5. Configure API Gateway routes, authentication, throttling, request-size rules, and exact approved CORS origins.
6. Add a replacement NVIDIA key and other provider identifiers only to Catalyst secrets/environment settings.
7. Keep Data Store, NVIDIA, QuickML, Zia, storage, SmartBrowz, and Circuits unavailable until each real Development canary succeeds.

## Local release gate

```powershell
npm ci --ignore-scripts
npm --prefix client ci
npm --prefix functions/api ci
npm run generate:data
npm run validate
npm --prefix client audit --omit=dev --audit-level=high
npm --prefix functions/api audit --omit=dev --audit-level=high
```

The measured artifact authority is `data/generated/manifest.json` plus `evaluation-metrics.json`.

The API dependency is locked to `zcatalyst-sdk-node` 3.3.0; keep the lockfile and function package in sync during deployment.

## Data activation

1. Insert the new `DataVersions` record as `staging`.
2. Load the 1,000 synthetic cases, 2,000 translations, 19 stations, entities/relations, and approved prototype knowledge for one version.
3. Validate checksums, counts, bilingual fields, referential integrity, synthetic labels, and absence of evaluation truth in runtime rows.
4. Atomically retire the former version and activate `synthetic-20260717-1000`.
5. Confirm every UI/API/report displays the same active version.
6. Leave a failed/partial version in `staging` and test rollback.

## Client/API routing

Build the canonical Catalyst client with the same-platform API base supported by the deployed Gateway/function mapping, commonly `/server/api/api/v1` unless Gateway exposes `/api/v1`.

Build Slate with the full approved Catalyst/API Gateway origin. Relative `/api/v1` on a static Slate origin is invalid when Slate returns the SPA HTML.

## Provider activation

- **NVIDIA NIM:** grounded and general canaries, uncited-FIR rejection, deterministic fallback, measured end-to-end latency.
- **QuickML A:** published case-link model with held-out high-confidence precision at least 90%.
- **QuickML B:** published aggregate model with temporal backtesting, uncertainty, and feature explanations.
- **Storage:** real upload, server-side hash, retrieval, provenance, authorization, and lifecycle test.
- **Zia OCR:** real synthetic image call; no face/object/plate inference unless separately implemented and governed.
- **SmartBrowz:** real PDF containing complete transcript, approval, audit, data version, and disclaimer.
- **Circuits:** real upload-to-review workflow with a genuine run ID.

## Deployed smoke test

```powershell
$env:SAMVAAD_WEB_URL='https://<canonical-client>'
$env:SAMVAAD_API_BASE='https://<canonical-api>/server/api/api/v1'
npm run deployed:smoke
```

The release fails if health/capability/AI routes return HTML, data version is absent/mismatched, role denial can be bypassed, a provider badge lacks a successful canary, or the complete judge mission fails in a fresh profile.

## Remaining production-specific proof

- Atomic cross-instance audit sequence and concurrent chain verification.
- Persistent conversation/investigation/report recovery after restart.
- Evidence retention/deletion and storage authorization.
- Accessibility at least 90 plus 320px/200% zoom checks.
- Desktop/tablet/mobile English/Kannada/Kanglish text/voice journey.
- No high/critical production dependency vulnerability.
- Logs/monitoring with correlation IDs and no secrets.

## Promotion and rollback

Promote Catalyst only after all required gates pass. Then build the Slate mirror from the accepted revision and verify its asset hash plus remote JSON API origin in a fresh browser. Merge to `main` after the reviewed deployed judge mission.

Rollback to the previous successful Catalyst deployment and `pre-netra-os-edef150` if authentication, JSON routing, active data version, grounded chat, evidence handling, approvals, or reports fail. Never force-push or rewrite `main`.
