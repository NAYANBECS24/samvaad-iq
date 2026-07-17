# SAMVAAD-IQ

SAMVAAD-IQ is the conversational investigation workspace for **NETRA**, with the explainable **KAVACH Crime DNA** engine providing case-similarity reasoning.

It addresses **Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**.

> This public build contains synthetic demonstration data only. Every result is an investigative lead that requires human verification and, where applicable, supervisory approval.

## What the winner build demonstrates

The product follows one evidence-grounded loop:

1. Ask in English, Kannada, or Kanglish.
2. Retrieve synthetic FIR evidence and show exact citations.
3. Open the case workspace and inspect source fields.
4. Run KAVACH similarity, network, area-hotspot, or patrol-scenario analysis.
5. Validate and hash an evidence file in Evidence Lab.
6. Accept, reject, or escalate the lead through a human review action.
7. Produce an auditable supervisor-approved evidence brief.

The application never presents a person-level risk score, automated guilt label, or unsupported legal conclusion.

## Runtime modes

| Mode | Meaning |
| --- | --- |
| `Catalyst Live` | The versioned API is reachable and the configured Catalyst capabilities are verified at runtime. |
| `Offline Demo` | The shared deterministic engine is running locally against a smaller synthetic dataset. Changes are not persisted. |
| `Capability Unavailable` | A specific provider such as OCR, object storage, or server PDF rendering is not enabled. The UI does not simulate success. |

The public UI displays the current mode at all times. Provider availability comes from `GET /api/v1/capabilities`; it is not hard-coded into presentation labels.

## Architecture

```text
React/Vite client
  ├── Catalyst runtime and capability probe
  ├── Ask SAMVAAD evidence workspace
  ├── Case and intelligence workspaces
  ├── Real browser evidence parsers
  └── Read-only offline repository
             │
             ▼
Versioned /api/v1 contract
  ├── Advanced I/O request handler
  ├── server-side validation, role checks, CORS and rate limits
  ├── tamper-evident audit hash chain
  └── Catalyst provider adapters
             │
             ▼
Shared explainable intelligence core
  ├── deterministic synthetic generator
  ├── multilingual intent and filter extraction
  ├── evidence retrieval and citations
  ├── KAVACH factor-level similarity
  ├── graph, area hotspots and scenarios
  └── insufficient-evidence and out-of-scope refusals
```

The same shared core runs in the API and in the labeled offline fallback, preventing frontend/backend scoring drift.

## Verified baseline

The current automated evaluation uses 1,000 deterministic synthetic FIRs and 30 English, Kannada, and Kanglish queries.

| Metric | Measured result |
| --- | ---: |
| Intent accuracy | 100% |
| Citation coverage for supported evaluation queries | 100% |
| Refusal queries with fabricated citations | 0 |
| Reference-run deterministic p95 evaluation time | 67 ms |
| Initial application JavaScript | ~98 KB gzip |

Run `npm run evaluate` to reproduce the intelligence metrics. Claims in submission materials must be updated if the measured output changes.
`npm run validate` also runs the four role-aware browser checks and the complete judge journey.

## Local development

Requirements:

- Node.js 24
- npm
- Zoho Catalyst CLI for Catalyst validation/deployment

Install dependencies:

```bash
npm ci
npm --prefix client ci
npm --prefix functions/api ci
```

Start the API and client in separate terminals:

```bash
npm run api:dev
npm run client:dev
```

The Vite development server proxies `/api/v1` to `http://127.0.0.1:3001`.

Validate everything:

```bash
npm run validate
npm --prefix client audit --omit=dev
npm --prefix functions/api audit --omit=dev
```

Offline mode is read-only: when `VITE_OFFLINE_DEMO_PASSWORD` is unset, selecting a role profile grants a clearly labeled local demo persona without pretending that it is police authentication. Hosts may set that environment variable to add a presentation gate. Local API demo authentication additionally requires `ALLOW_DEMO_AUTH=true`, `DEMO_PASSWORD`, and `DEMO_AUTH_SECRET`; production uses Catalyst Auth and keeps demo authentication disabled. Live judging credentials are distributed out of band, never committed.

## API contract

The versioned interface includes:

- `GET /api/v1/health`
- `GET /api/v1/capabilities`
- `GET /api/v1/cases` and `/cases/:firId`
- `POST /api/v1/query`
- `POST /api/v1/analytics/similarity`
- `POST /api/v1/analytics/graph`
- `POST /api/v1/analytics/hotspots`
- `POST /api/v1/scenarios`
- `POST /api/v1/evidence/uploads`
- `POST /api/v1/evidence/:id/analyze`
- `POST /api/v1/reports`
- `GET /api/v1/audit`
- `POST /api/v1/feedback`

Successful query responses contain `requestId`, `mode`, `intent`, `filters`, `answer`, `citations`, `confidence`, `evidence`, `visualizations`, `limitations`, `nextActions`, and `auditRef`.

## Catalyst configuration

The Advanced I/O function is under `functions/api` and includes a Node 24 `catalyst-config.json`.

Capabilities are opt-in environment flags and become `available` only when both the Catalyst runtime and the relevant service flag are enabled:

- `CATALYST_AUTH_ENABLED`
- `CATALYST_DATASTORE_ENABLED`
- `CATALYST_SMARTBROWZ_ENABLED`
- `CATALYST_STRATUS_ENABLED` or `CATALYST_FILESTORE_ENABLED`
- `CATALYST_CIRCUITS_ENABLED`
- `CATALYST_ZIA_ENABLED`
- `CATALYST_QUICKML_ENABLED`

The canonical Catalyst-hosted client should build with `VITE_API_BASE=/server/api/api/v1` unless API Gateway maps `/api/v1/*` to the Advanced I/O function. Slate uses the full approved API origin or the Gateway path configured for that site.

See [Catalyst deployment](docs/catalyst-deployment.md), [capability matrix](docs/capability-matrix.md), and [Data Store schema](data/catalyst-schema.md).

## Evidence Lab

Accepted files are PDF, DOCX, XLSX, CSV, JSON, PNG, and JPEG up to 10 MB.

- SHA-256 is calculated from the actual file bytes.
- PDF, DOCX, first-sheet XLSX, CSV, and JSON text is extracted in the browser.
- Images expose verified dimensions and provenance; OCR is not inferred unless a live OCR capability is enabled.
- Extracted facts remain distinct from matched cases and analyst decisions.
- Offline analysis is not persisted and says so explicitly.

## Safety and privacy

- All public identifiers are synthetic or illustrative hashes.
- No real KSP FIR, complainant, accused, phone, bank, or location-level personal data belongs in this repository.
- Hotspots are area/time/category summaries, not person-level predictions.
- Legal mappings are review support only.
- Reports require Supervisor or Admin approval.
- API roles are derived from an authenticated session, never a request body.
- CORS uses an allowlist and API responses include security headers and request IDs.

See the [data card](docs/data-card.md) and [privacy and threat model](docs/privacy-threat-model.md).

## Submission assets

- [Master project document](docs/submission/SAMVAAD-IQ_Master_Project_Document.md)
- [Technical appendix](docs/submission/SAMVAAD-IQ_Technical_Appendix.md)
- [Three-minute judge demo](docs/judge-demo.md)
- Editable PowerPoint deck in `docs/submission/`

Earlier prototype documents are retained under `docs/submission/archive/` for traceability and are not the source of current deployment claims.
