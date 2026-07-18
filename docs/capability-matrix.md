# NETRA OS Capability and Service Matrix

This matrix separates repository implementation from live Catalyst verification. `/api/v1/capabilities` and `/api/v1/ai/status` are the runtime authority; an environment flag means “attempt the canary,” not “show success.”

## Core and optional services

| Capability | Repository implementation | Offline/server-seed behavior | Required live proof | Current documented status |
| --- | --- | --- | --- | --- |
| NETRA OS Web Client | React/Vite routed shell, responsive navigation, command palette, shared investigation context | Full read-only UI over a 250-case browser subset | Hashed build loads from the promoted Catalyst URL and all route families pass browser tests | Implemented; promoted URL not asserted |
| Advanced I/O API | Node 24 handler, `/api/v1` routes, validation, errors, security headers, role checks | Local API uses the reproducible 1,000-case server seed without managed persistence | `/health`, `/capabilities`, and `/ai/status` return JSON from the deployed origin | Implemented; deployment verification required |
| API Gateway | Route contract, CORS and rate-limit boundary documented | Direct local API | Authenticated routing, throttling, request-size rules, and JSON errors pass deployed tests | Not live-asserted |
| Catalyst Auth | Identity adapter, secure redirect endpoint, fixed demo-session boundary | Branded Judge Demo profile uses a short-lived signed session only when server demo auth is explicitly enabled | Invited account signs in; direct unauthorized API calls fail by role; public registration remains disabled | Not live-asserted |
| Catalyst Data Store | Normalized schema, adapter, versioned seed artifacts, active-version response | Process memory/server seed or browser session only | Staging validation and atomic activation complete; every page/API reports the same active version | Not live-asserted |
| Catalyst Search/ZCQL | Indexed/paginated target design | Shared deterministic lexical/structured retrieval | Query plan uses indexed Data Store access and p95 is measured on the deployed 1,000-case version | Not live-asserted |
| NVIDIA NIM | Server-only adapter, evidence projection, uncited-FIR rejection, deterministic fallback, general-answer guardrails | Deterministic grounded/general response remains available | Replacement secret configured; supported and general canaries succeed; `/ai/status.verified=true`; no uncited case claim | Adapter implemented; not live-asserted |
| QuickML case link | Leakage-controlled `quickml-case-link-training.csv` | Deterministic KAVACH factor score | Published endpoint passes held-out high-confidence precision ≥90% and returns a secondary model signal | 1,452-row training artifact only |
| QuickML aggregate early warning | Leakage-controlled `quickml-area-pattern-training.csv` | Descriptive deterministic trends/alerts | Published endpoint reports backtesting, uncertainty, and feature explanations | 6,935-row training artifact only |
| Stratus/File Store | Base64 binary upload, decoded-byte/type/size validation, server SHA-256 recheck, storage adapters, provenance and audit metadata | Local file validation, SHA-256, supported parsing; no server persistence | Upload, server hash, retrieval, provenance, authorization, and deletion/retention behavior pass with a synthetic file | Code path implemented; live storage not asserted |
| Zia OCR | Capability boundary and honest unavailable state | Image dimensions/metadata only; no OCR/face/object/plate inference | A real synthetic image OCR call succeeds and source/limitations are preserved | Not live-asserted |
| SmartBrowz | Report adapter and complete HTML/browser-print fallback | Labeled local/browser print | Returned PDF opens and contains full transcript, data version, approval, audit reference, and disclaimer | Not live-asserted |
| Circuits | Workflow boundary | Synchronous local sequence | Real upload → extraction → matching → human review → report run has a Catalyst run ID | Not live-asserted |
| Audit | Hash-linked events; process queue plus Data Store unique-sequence optimistic retry | Process-local serialized chain | Concurrent multi-instance Data Store appends produce one gap-free verifiable chain | Implementation complete; live constraint/canary required |
| Monitoring/logs | Request/correlation IDs and structured error boundary | Local process logs | Catalyst logs show correlated health, query, provider, auth, and failure events without secrets | Not live-asserted |

## Runtime truth fields

| Field | Question answered |
| --- | --- |
| `apiReachable` | Did the browser receive a valid API response? |
| `authentication` | Which verified identity provider protects this session? |
| `dataSource` | Is data coming from Catalyst Data Store, the server seed, or browser fallback? |
| `persistence` | Will conversations, evidence, reports, and audit survive process/browser restart? |
| `generativeAi` | Did the configured NVIDIA canary succeed? |
| `quickMl` | Did a published QuickML endpoint return a valid response? |
| `ocr` | Did a real OCR call succeed? |
| `storage` | Can the server store and retrieve the evidence bytes? |
| `reports` | Can the server render a genuine PDF? |
| `orchestration` | Did a real workflow run complete with a run ID? |

The UI may summarize combinations as `Catalyst Live`, `Server AI · Synthetic Seed`, `Offline Demo`, or `Capability Unavailable`, but it must continue exposing the independent fields.

## Verification discipline

- Never generate a fake bucket key, OCR percentage, face/object result, render job ID, QuickML score, workflow run, or provider-success label.
- Do not enable a capability after a console resource is merely created; run its Development canary first.
- Provider failures preserve deterministic cited output and record the limitation.
- Keep credentials and endpoint keys outside Git and the browser bundle.
- Treat managed-service activation, deployed smoke tests, and model evaluation as release gates, not completed prototype facts.
