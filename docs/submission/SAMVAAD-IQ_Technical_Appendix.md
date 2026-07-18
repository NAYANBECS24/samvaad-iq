# NETRA OS / SAMVAAD-IQ Technical Appendix

## 1. Public API

All routes are under `/api/v1`.

| Area | Routes |
| --- | --- |
| Runtime | `GET /health`, `/capabilities`, `/ai/status`, `/data/versions` |
| Auth | `POST /auth/demo-session`, `GET /auth/secure-url`, `POST /auth/logout`, `GET /auth/me` |
| Cases/search | `GET /cases`, `/cases/:id`, `/search`, `/knowledge/search` |
| Investigations | `GET/POST /investigations`, `PATCH /investigations/:id` |
| Conversations | `GET /conversations`, `GET /conversations/:id/messages` |
| Copilot | `POST /query` |
| Analytics | `POST /analytics/similarity`, `/graph`, `/hotspots`, `/trends`, `/alerts`, `/cohorts`, `/scenarios` |
| Evidence | `POST /evidence/uploads`, `POST /evidence/:id/analyze` |
| Review | `GET /tasks`, `POST /approvals`, `PATCH /approvals/:id`, `POST /feedback` |
| Reports/audit | `POST /reports`, `GET /reports/:id`, `GET /audit` |
| Administration | `POST /admin/seed` |

`GET /cases` supports query/filter parameters, `limit`, `offset`, total count, and `nextOffset`.

## 2. Query contract

Input fields:

```text
message, conversationId, investigationId, answerMode,
language, contextRefs, dataVersion (optional)
```

Response fields:

```text
answerClass, conversationId, messageId, requestId, mode, dataVersion,
intent, queryPlan, filters, answer, claimCitations/citations, confidence,
evidence, visualizations, limitations, nextActions, provider, latency,
approvalState, auditRef
```

The response may also contain response-mode pipeline and investigation-insight objects. Additive fields do not change the evidence source set.

Failures use:

```json
{
  "requestId": "REQ-...",
  "code": "VALIDATION_ERROR",
  "message": "...",
  "retryable": false,
  "mode": "server-seed"
}
```

Only network, timeout, rate-limit, or server failures may invoke the read-only deterministic fallback. Authentication and validation errors remain visible.

The client query window is 25 seconds. The NVIDIA timeout stays below that budget so the API can return deterministic cited output after a provider failure.

## 3. Runtime truth

Runtime state is independent across `apiReachable`, `authentication`, `dataSource`, `persistence`, `generativeAi`, `quickMl`, `ocr`, `storage`, `reports`, and `orchestration`.

Availability requires a successful canary, not only an environment flag. The UI summaries—`Catalyst Live`, `Server AI · Synthetic Seed`, `Offline Demo`, and `Capability Unavailable`—are derived from those fields.

## 4. Roles and authorization

| Capability | Admin | Investigator | Analyst | Supervisor |
| --- | :---: | :---: | :---: | :---: |
| Mission Control / chat / cases / intelligence / draft reports / governance | ✓ | ✓ | ✓ | ✓ |
| Evidence intake / field tablet | ✓ | ✓ | — | ✓ |
| Official report approval/export | ✓ | — | — | ✓ |
| Administrative Console / seed | ✓ | — | — | — |

The server resolves role from Catalyst Auth or a signed, environment-gated demo session. A role in a request body is never authorization. Public registration is disabled.

## 5. Shared domain/repository model

The API and browser fallback share deterministic generation, multilingual intent/filter extraction, retrieval, KAVACH scoring, graphs, hotspots, and scenarios. Every case, query, citation, analysis, report, and audit record carries a data version.

Normalized storage domains:

`Cases`, `CaseTranslations`, `Stations`, `Entities`, `CaseEntities`, `Relations`, `EvidenceObjects`, `EvidenceFacts`, `EvidenceExtractions`, `KnowledgeDocuments`, `KnowledgeChunks`, `Investigations`, `Conversations`, `ConversationMessages`, `QueryRuns`, `QueryCitations`, `AnalysisRuns`, `Reports`, `Approvals`, `Notifications`, `AuditEvents`, `Feedback`, `EvaluationRuns`, and `DataVersions`.

`EvaluationTruth` is restricted and never joins a runtime response.

## 6. KAVACH factor model

| Factor | Weight |
| --- | ---: |
| Crime category | 25% |
| Modus operandi | 20% |
| Shared masked entities | 20% |
| Geography | 15% |
| Time pattern | 10% |
| Narrative similarity | 10% |

Each factor returns a raw score, weighted contribution, source description, inclusion threshold, and limitation. These are transparent prototype defaults and require revalidation on an approved representative dataset.

## 7. Dual-mode conversation safeguards

The query pipeline returns one of database grounded, approved knowledge, general AI, clarification, or safety/jurisdiction refusal.

For grounded requests, NVIDIA receives only the retrieved evidence projection. The server rejects generated FIR identifiers outside the citation set. Provider failure returns deterministic cited prose. For general requests, the system labels the response as non-database, forbids invented FIRs, and does not imply current internet or private-data access.

Conversations retain ordered user/assistant messages, active investigation, pinned cases, filters, provider, data version, query plan, citations, confidence, limitations, latency, and review state. Reports use the complete transcript rather than the last answer only.

## 8. Evidence handling

Accepted types: PDF, DOCX, XLSX, CSV, JSON, PNG, and JPEG, maximum 10 MB.

- SHA-256 is calculated over actual file bytes.
- Supported documents are locally parsed; image dimensions/metadata are verified.
- Extracted machine facts remain separate from analyst edits and decisions.
- OCR, object/face/plate interpretation, storage keys, and workflow IDs are absent unless the corresponding server canary succeeds.
- The server binary-upload route validates base64 content, decoded type/size, the 10 MB limit, and SHA-256 before calling Stratus/File Store; it reports unavailable until a real destination passes its canary.

## 9. Reports and audit

The official report API requires Supervisor/Admin. It includes the complete transcript and review metadata. SmartBrowz is capability-gated; otherwise the system returns a clearly labeled HTML/browser-print fallback.

Application audit events include actor, action, resource, request ID, timestamp, mode, details, previous hash, and current SHA-256 hash. Local writes are serialized; Data Store mode reloads the authoritative head and retries on the unique sequence constraint. A deployed multi-instance concurrency canary remains a release gate, so no live concurrency claim is made.

## 10. QuickML assets

### Case-link classification

- File: `data/generated/quickml-case-link-training.csv`
- Rows: 1,452; positives: 252
- Features: `crime_type_match`, `mo_similarity`, `geography_match`, `time_pattern_match`, `shared_entity_score`, `narrative_similarity`
- Target: `linked`
- Split: fixed `train`/`validation`/`test` column
- Excluded: FIR IDs, truth-group labels, and deterministic final KAVACH score

The release gate for a published model is at least 90% held-out high-confidence precision. The current 95.5% value is the deterministic planted-link evaluation; it is not a live QuickML result.

### Aggregate area-pattern early warning

- File: `data/generated/quickml-area-pattern-training.csv`
- Rows: 6,935
- Dimensions: synthetic district/station/category and week
- Historical features: prior count, rolling mean/std, trend, night share, and seasonal encodings
- Target: `target_next_week_count`
- Excluded: person/entity fields

Publishing requires held-out backtesting, uncertainty, feature explanations, and a live endpoint canary. Until then, deterministic descriptive trends/alerts remain the honest fallback.

## 11. Verified generated state

Data version `synthetic-20260717-1000`, seed `20260717`: 1,000 cases, 19 stations, 2,000 translation rows, six planted pattern families, 58 restricted truth rows, 1,452 case-link rows, and 6,935 area-pattern rows.

The verified 30-query run reports 100% intent accuracy, 100% citation coverage for supported evaluation queries, zero refusal fabrication failures, 95.5% high-confidence planted-link precision, 100% planted-link recall, 252 evaluated planted pairs, and 118.03 ms deterministic p95.

## 12. Security controls

- Node 24 Advanced I/O handler and locked dependencies.
- Catalyst Node SDK pinned to `zcatalyst-sdk-node` 3.3.0.
- Runtime schema validation and one-megabyte JSON body limit.
- Exact CORS allowlist, no-store API responses, CSP, `nosniff`, frame denial, and request IDs.
- Server-side role checks and invitation-only secure-user design.
- Server-only secrets and capability-specific live canaries.
- Synthetic-only public data and separate restricted evaluation truth.
- Aggregate analytical boundaries and Supervisor/Admin official-report gate.

API Gateway throttling, persistent rate limiting, malware scanning, live multi-instance audit verification, managed retention, and deployed provider/access tests remain production requirements.

## 13. Release gates

Measured artifacts currently satisfy the documented deterministic thresholds for intent, citations, refusal fabrication, planted-link precision/recall, and p95.

Promotion still requires:

- JSON `/health`, `/capabilities`, and `/ai/status` from the deployed origin;
- identical active data version across all pages/routes;
- direct server-side authorization rejection by role;
- complete conversation survival and export after refresh;
- real upload/hash/storage/extraction/approval tests;
- one concurrency-safe verifiable audit chain;
- no evaluation labels or secrets in API/client bundles;
- desktop/tablet/mobile English/Kannada/Kanglish text/voice judge journey;
- accessibility at least 90, 320px/200% zoom without page overflow;
- no high/critical production dependency vulnerability;
- deployed end-to-end NVIDIA p95 below 10 seconds if NVIDIA is enabled.

No unverified release gate is reported as passed.
