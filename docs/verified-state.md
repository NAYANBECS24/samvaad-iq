# NETRA OS Verified State Manifest

This file is the human-readable release snapshot for **Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**. The single machine-readable release authority is `data/generated/release-manifest.json`; it is generated from:

- `data/generated/manifest.json`
- `data/generated/evaluation-metrics.json`

If generated values change, regenerate and review this document, the README, master document, technical appendix, and deck before release.

## Identity and safety boundary

- Product: NETRA OS
- Conversational copilot: SAMVAAD-IQ
- Explainable intelligence kernel: KAVACH
- Public data: synthetic only
- Active generated version: `synthetic-20260717-1000`
- Generator seed: `20260717`
- Operational decision authority: human reviewer; Supervisor/Admin approval for official reports
- Forbidden claims: automated guilt, person risk, operational KSP accuracy, live provider availability without a canary, or access to current internet/private records

## Verified data inventory

| Artifact | Value | Status |
| --- | ---: | --- |
| Cases | 1,000 | Generated runtime corpus |
| Browser fallback | 250 | Read-only local subset |
| Stations | 19 | Generated |
| Translation rows | 2,000 | English and Kannada |
| Planted pattern families | 6 | Evaluation design |
| Planted/evaluation-truth rows | 58 | Restricted evaluation asset |
| Case-link rows | 1,452 | QuickML training artifact |
| Positive case-link rows | 252 | QuickML target positives |
| Area-pattern rows | 6,935 | QuickML training artifact |

`truth_group` and other evaluation labels are forbidden in runtime cases, API projections, citations, and browser assets. The model status recorded in the generated manifest is `training-artifacts-only-not-live`.

## Verified reference evaluation

| Metric | Result |
| --- | ---: |
| Evaluation queries | 30 |
| Intent accuracy | 100% |
| Supported-query citation coverage | 100% |
| Refusal fabrication failures | 0 |
| High-confidence planted-link precision | 95.5% |
| Planted-link recall | 100% |
| Evaluated planted pairs | 252 |
| Deterministic p95 | 118.03 ms |

The reference run is deterministic and synthetic. It does not establish operational accuracy, fairness, workload reduction, or end-to-end NVIDIA latency.

## Implemented repository capabilities

| Capability | Implemented evidence | Persistence/status boundary |
| --- | --- | --- |
| NETRA OS shell | Responsive app shell, system bar, command palette, shared context, inspector, judge mission | Browser state; server persistence depends on Data Store |
| SAMVAAD dual-mode chat | Grounded, knowledge, general, clarification, and refusal outcomes; deterministic fallback | NVIDIA phrasing is optional and unverified until canary |
| KAVACH analytics | Explainable factors, search, graph, hotspot, trend, alert, cohort, and scenario routes | Deterministic synthetic analysis |
| Conversation/report flow | Ordered transcript, context IDs, approvals, report HTML/browser-print fallback | Process/browser local unless Data Store and SmartBrowz are verified |
| Evidence Lab | Local type/size validation, real-byte SHA-256 and parsing; server base64 validation, 10 MB decoded-byte limit, SHA-256 recheck, and storage adapters | Live persistence still requires a verified Stratus/File Store canary |
| API | Node 24 Advanced I/O handler, versioned routes, validation, security headers, role checks, structured errors | Deployment and Gateway routing require Catalyst authority |
| Audit | Hash-linked events with unique-sequence optimistic retry | Requires a live multi-instance Data Store concurrency canary and unique sequence constraint |
| QuickML assets | Leakage-controlled case-link and aggregate area-pattern CSV files | Artifacts only; no live/published model is claimed |

## Live-service truth

The repository includes adapters and configuration boundaries, not evidence that a Catalyst entitlement or provider is live. A capability may be marked available only after a real Development call succeeds and `/api/v1/capabilities` reports the verified state.

| Service | Repository readiness | Live status asserted here |
| --- | --- | --- |
| Catalyst Web Client / Slate | Build output and routing guidance present | No canonical release URL asserted |
| Advanced I/O | Node 24 function present | Deployment must pass JSON smoke test |
| Catalyst Auth | Secure redirect and role adapter present | Not asserted |
| Data Store | Schema, adapter, generated assets present | Not asserted |
| API Gateway | Route and throttling design documented | Not asserted |
| NVIDIA NIM | Server-only grounded adapter present | Not asserted |
| QuickML | Two training artifacts prepared | Not published/live |
| Stratus/File Store | Capability boundary present | Not asserted |
| Zia OCR | Capability boundary present | Not asserted |
| SmartBrowz | Report adapter/fallback boundary present | Not asserted |
| Circuits | Orchestration boundary present | Not asserted |

## Release blockers requiring external verification

1. Revoke the NVIDIA credential exposed outside the secret store and configure a replacement only in Catalyst.
2. Authenticate the Catalyst CLI and bind the intended Development project.
3. Make `/health`, `/capabilities`, and `/ai/status` return JSON from the deployed API origin.
4. Provision the tables, run the implemented staging/validation/checksum activation job, and verify the normalized 1,000-case Data Store version.
5. Provision invited secure users and prove direct API authorization failures for every restricted role.
6. Verify the implemented binary upload, storage retrieval, and server-side hash check against the live Stratus/File Store destination.
7. Publish and measure both QuickML pipelines; do not infer live quality from deterministic evaluation.
8. Prove OCR, SmartBrowz, and Circuits separately before exposing them as available.
9. Enforce the unique `AuditEvents.sequence` constraint and verify the implemented retrying hash-chain append under concurrent multi-instance writes.
10. Run deployed browser, voice, security, accessibility, dependency, and full judge-mission gates before promotion.

## Release rule

Implemented code, configured entitlement, successful canary, measured model, and promoted deployment are different states. Documentation and UI labels must identify which state is true.
