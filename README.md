# NETRA OS / SAMVAAD-IQ

NETRA OS is a role-aware police-intelligence workspace for [**Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**](https://hack2skill.com/event/datathon2026). **SAMVAAD-IQ** is its text-and-voice copilot, and **KAVACH** is its explainable intelligence kernel.

> This repository and public demonstration contain synthetic data only. A result is an investigative lead, never proof, a legal conclusion, or an individual risk score. Human verification and supervisory approval remain mandatory.

## What is implemented

- A responsive NETRA OS shell with a system bar, `Ctrl+K` launcher, shared investigation context, role-aware navigation, evidence/task inspector, and a guided three-minute judge mission.
- Preserved deep links for Mission Control, Ask SAMVAAD, Case Desk, Evidence Vault, Intelligence Studio, Field Operations, Briefing & Governance, and the Administrative Console.
- English, Kannada, and Kanglish text queries, `en-IN`/`kn-IN` browser speech input, speech output, four answer modes, follow-up context, citations, timelines, skeptic checks, feedback, and complete conversation-history reporting.
- Five explicit chat outcomes: database-grounded answer, approved prototype-knowledge answer, general AI answer, focused clarification, or safety/jurisdiction refusal.
- A deterministic fallback that never returns an empty answer when NVIDIA NIM is unavailable.
- KAVACH factor-level similarity, source-backed graphs, aggregate area/time/category hotspots, descriptive trends, synthetic anomaly alerts, cohorts with minimum group-size controls, and patrol what-if scenarios.
- A versioned 1,000-case server dataset and a 250-case read-only browser fallback generated from the same domain logic.
- Local Evidence Lab processing for PDF, DOCX, XLSX, CSV, JSON, PNG, and JPEG files up to 10 MB, including SHA-256 provenance and capability-aware limitations.
- A Node 24 Catalyst Advanced I/O API with validation, security headers, role checks, structured errors, runtime capability reporting, deterministic analytics, and browser-print report fallback.

The server binary-upload path now validates base64 payloads, enforces the 10 MB decoded-byte limit, recalculates SHA-256, and calls Stratus/File Store adapters. The Data Store seed endpoint now stages, validates, checksums, and activates a version before it becomes readable. Managed conversation persistence, Catalyst Auth, live Data Store activation, NVIDIA NIM, QuickML, Zia OCR, live Stratus/File Store persistence, SmartBrowz, and Circuits remain unavailable until each service is provisioned and passes a live Development canary. The UI must not present a configured flag as proof of availability.

## Investigation workflow

1. Start an investigation or open a pinned case.
2. Ask SAMVAAD in English, Kannada, or Kanglish.
3. Inspect claim-to-source citations, confidence, limitations, and the query plan.
4. Hand the same context to Case Desk, KAVACH, network, hotspot, trend, or patrol analysis.
5. Validate a synthetic evidence file and keep extracted facts separate from analyst notes.
6. Request human review; only a Supervisor or Admin may approve an official export.
7. Export a brief containing the complete conversation, query IDs, filters, citations, data version, provider, approval, audit reference, and safety disclaimer.

## Runtime truth

Runtime is represented independently, not as one optimistic live/offline flag:

`apiReachable`, `authentication`, `dataSource`, `persistence`, `generativeAi`, `quickMl`, `ocr`, `storage`, `reports`, and `orchestration`.

| UI label | Meaning |
| --- | --- |
| `Catalyst Live` | Required Catalyst services for the current operation have passed live canaries. |
| `Server AI · Synthetic Seed` | The API is reachable and may use verified server AI, but managed case persistence is unavailable. |
| `Offline Demo` | The read-only browser repository and deterministic engine are active; changes are not server-persisted. |
| `Capability Unavailable` | A requested provider has not passed verification; no success is simulated. |

`GET /api/v1/health`, `/capabilities`, and `/ai/status` must return JSON. A Slate route that returns the SPA HTML is not a working API.

## Verified synthetic dataset

The machine-readable release authority is [release-manifest.json](data/generated/release-manifest.json), generated from [manifest.json](data/generated/manifest.json) and [evaluation-metrics.json](data/generated/evaluation-metrics.json). Do not copy a metric or live-service claim into submission material without matching those files.

| Item | Verified value |
| --- | ---: |
| Data version | `synthetic-20260717-1000` |
| Seed | `20260717` |
| Synthetic cases | 1,000 |
| Stations | 19 |
| English/Kannada translation rows | 2,000 |
| Planted pattern families | 6 |
| Evaluation-truth rows | 58 |
| Case-link training rows | 1,452 |
| Positive case-link rows | 252 |
| Area-pattern training rows | 6,935 |

The generated model assets are **training artifacts only, not live models**. Evaluation truth is restricted to evaluation jobs and must never appear in runtime records, query responses, citations, or the browser bundle.

## Verified evaluation

The current reference run covers 30 English, Kannada, and Kanglish evaluation queries over 1,000 deterministic synthetic cases.

| Metric | Measured result |
| --- | ---: |
| Intent accuracy | 100% |
| Citation coverage for supported evaluation queries | 100% |
| Refusal fabrication failures | 0 |
| High-confidence planted-link precision | 95.5% |
| Planted-link recall | 100% |
| Evaluated planted pairs | 252 |
| Deterministic p95 | 118.03 ms |

These are prototype measurements on synthetic data, not operational KSP accuracy, safety, latency, or impact claims. Reproduce them with `npm run evaluate`.

## Role model

| Role | Access |
| --- | --- |
| Admin | All applications and administration. |
| Investigator | Operational applications except the Administrative Console. |
| Analyst | Mission Control, Ask SAMVAAD, Case Desk, Intelligence Studio, reports, and governance. |
| Supervisor | Operational applications except the Administrative Console; may approve and export official reports. |

All roles may draft a report. Only Supervisor/Admin may approve and produce an official server report. The API derives the role from the session; it does not accept a client-supplied role as authorization.

## Local development

Requirements: Node.js 24, npm, and the Zoho Catalyst CLI for Catalyst validation or deployment.

```bash
npm ci
npm --prefix client ci
npm --prefix functions/api ci
npm run api:dev
```

In a second terminal:

```bash
npm run client:dev
```

The Vite development server proxies `/api/v1` to `http://127.0.0.1:3001`.

Run the complete local gate:

```bash
npm run validate
npm --prefix client audit --omit=dev --audit-level=high
npm --prefix functions/api audit --omit=dev --audit-level=high
```

The branded `/login` gateway offers fixed synthetic Judge Demo profiles. Secure access is invitation-only through a configured Catalyst Auth redirect; public registration and the embedded Catalyst widget are intentionally absent. Demo/session secrets, judge instructions, NVIDIA keys, QuickML keys, and storage identifiers are distributed outside Git.

## API surface

All routes are versioned under `/api/v1`.

- Runtime: `GET /health`, `/capabilities`, `/ai/status`, `/data/versions`
- Authentication: `POST /auth/demo-session`, `GET /auth/secure-url`, `POST /auth/logout`, `GET /auth/me`
- Cases and search: `GET /cases`, `/cases/:id`, `/search`, `/knowledge/search`
- Context: `GET/POST/PATCH /investigations`, `GET /conversations`, `/conversations/:id/messages`
- Copilot: `POST /query`
- Intelligence: `POST /analytics/similarity`, `/graph`, `/hotspots`, `/trends`, `/alerts`, `/cohorts`, and `/scenarios`
- Evidence and review: `POST /evidence/uploads`, `/evidence/:id/analyze`, `GET /tasks`, `POST/PATCH /approvals`
- Reports and governance: `POST /reports`, `GET /reports/:id`, `GET /audit`, `POST /feedback`
- Administration: `POST /admin/seed` with an authenticated Admin session

The upload route returns an explicit unavailable error until real storage is configured. When storage is verified, the server revalidates the decoded bytes and hash before persisting them; local file processing never masquerades as server persistence.

Query input accepts `message`, `conversationId`, `investigationId`, `answerMode`, `language`, `contextRefs`, and optional `dataVersion`. The response includes the answer class, identifiers, runtime mode, data version, query plan, filters, citations, confidence, evidence, visualizations, limitations, next actions, provider, latency, approval state, and audit reference.

Failures use `requestId`, `code`, `message`, `retryable`, and `mode`.

## Catalyst-first release

The canonical judge target is Catalyst Web Client plus the Node 24 Advanced I/O API. Slate is a synchronized mirror and rollback, and must build with an absolute approved Catalyst/API Gateway origin when it cannot use same-origin API routing.

No current public URL is documented as release-ready until the deployed smoke test verifies JSON routing, authentication, data version, AI status, and the complete judge mission. See [Catalyst deployment](docs/catalyst-deployment.md) and [GitHub/Catalyst/Slate release flow](docs/catalyst-github-deployment.md).

## Documentation

- [Verified state manifest](docs/verified-state.md)
- [NETRA OS applications](docs/netra-os.md)
- [Architecture](docs/architecture.md)
- [Investigation workflow](docs/workflow.md)
- [Capability matrix](docs/capability-matrix.md)
- [Data card](docs/data-card.md)
- [Privacy and threat model](docs/privacy-threat-model.md)
- [Three-minute judge demo](docs/judge-demo.md)
- [Judge access instructions](docs/judge-access.md)
- [Master project document](docs/submission/SAMVAAD-IQ_Master_Project_Document.md)
- [Technical appendix](docs/submission/SAMVAAD-IQ_Technical_Appendix.md)

Earlier binary documents are retained in `docs/submission/archive/` for history only. They are not the source for challenge numbering, architecture, provider status, metrics, or deployment claims.
