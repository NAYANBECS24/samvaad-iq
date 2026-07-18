# NETRA OS / SAMVAAD-IQ — Master Project Document

## 1. Official challenge

This submission targets [**Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**](https://hack2skill.com/event/datathon2026).

Crime data is useful only when an authorized user can ask a natural question, find the supporting record, understand why an analysis was produced, carry context between tools, and retain human authority over the outcome. A persuasive answer without traceable evidence is not enough.

## 2. Product model

- **NETRA OS** is the persistent, role-aware police-intelligence application shell.
- **SAMVAAD-IQ** is the universal English/Kannada/Kanglish text-and-voice copilot.
- **KAVACH** is the explainable intelligence kernel for retrieval, similarity, graphs, aggregate patterns, trends, and scenarios.

The product is organized around one defensible loop:

`ask → inspect citations → open case → analyze → validate evidence → request review → approve → export`

Every public record is visibly synthetic. Every supported crime-data claim carries source evidence. Every analytical lead remains subject to human review.

## 3. NETRA OS experience

NETRA OS uses stable routed applications rather than fragile draggable windows:

| Application | Purpose |
| --- | --- |
| Mission Control | Active investigations, measured dataset/evaluation state, alerts, and judge mission |
| Ask SAMVAAD | Natural-language and voice investigation with citations and follow-up context |
| Case Desk | Search, dossier review, case actions, and pinned evidence |
| Evidence Vault | Local file provenance/extraction and capability-gated persistence |
| Intelligence Studio | KAVACH similarity, graph, map, cold-case, trend, and aggregate signal views |
| Field Operations | Transparent area-level patrol scenarios and tablet workflow |
| Briefing & Governance | Tasks, approvals, reports, safeguards, runtime capabilities, and audit |
| Administrative Console | Synthetic data activation and deployment-readiness views for Admin only |

The shell provides a persistent system bar, `Ctrl+K` command/application search, active investigation, data version, runtime truth, language, notifications, approvals, and user controls. A shared Investigation Context carries conversations, selected FIRs, filters, citations, evidence references, analyses, tasks, notes, and a report draft between modules.

Desktop, tablet, and mobile use the same route model with a collapsible dock, icon rail, or bottom navigation. Keyboard focus, skip navigation, reduced motion, responsive targets, and textual alternatives support accessibility.

## 4. SAMVAAD-IQ conversation contract

Every valid input produces one explicit outcome:

1. **Database grounded:** synthetic crime-data retrieval/analysis with citations, confidence explanation, data version, limitations, and review controls.
2. **Approved knowledge:** citable prototype knowledge/SOP support with a verification warning.
3. **General AI:** a normal conversational answer labeled `General AI — not a police-database result`.
4. **Clarification:** a focused request for the missing case, place, date, category, or analysis.
5. **Safety/jurisdiction refusal:** no fabricated evidence and a safe next action where possible.

The structured pipeline normalizes English, Kannada, or Kanglish; extracts case aliases, location, station, category, status, date/time, section, entity, comparison, aggregation, graph, hotspot, trend, forecast, and scenario intent; resolves the active context; retrieves source fields and relations; executes deterministic analysis; validates claim citations; and records reproducibility metadata.

NVIDIA NIM is optional server-side phrasing. It receives only the bounded evidence projection for grounded questions, and its output is rejected if it introduces an FIR outside the citation set. General mode cannot imply current internet/private-data access. Provider failure returns the deterministic answer rather than an empty chat.

The interface preserves four presentation modes—Investigator, Command Brief, Timeline, and Skeptic—without changing the underlying evidence set.

## 5. KAVACH explainability and safe analytics

KAVACH exposes category, modus-operandi, shared masked-entity, geographic, temporal, and narrative factor scores. Each factor shows its weight, raw value, contribution, matched source, threshold, and limitation. Results are reviewable leads, never probability of guilt.

Graphs include source-backed edges. Hotspots, descriptive anomalies, cohorts, and patrol scenarios operate only over aggregate area/time/category patterns. Synthetic cohort output requires at least 10 records. The system does not generate person-level threat, behavioral-risk, guilt, or demographic predictions.

## 6. Evidence, review, and reports

Evidence Vault accepts PDF, DOCX, XLSX, CSV, JSON, PNG, and JPEG up to 10 MB. The current browser implementation validates actual files, calculates SHA-256 over their bytes, parses supported document content or image dimensions, and separates extraction from analyst judgment.

The API binary-upload path validates base64 input, enforces the decoded 10 MB limit, recomputes SHA-256, and calls Stratus/File Store adapters. Persistence, OCR, and orchestration are presented as available only after Stratus/File Store, Zia, and Circuits respectively pass real canaries. Until then, the UI states the limitation and does not invent a bucket key, OCR percentage, identity, object, plate, or workflow run.

All roles may draft a report. Only Supervisor/Admin may approve an official server report. The report contract includes the complete conversation history, query IDs, filters, citations, confidence/limitations, provider/model where applicable, data version, analyst, approval state, audit reference, and human-review disclaimer. SmartBrowz is optional; a labeled HTML/browser-print fallback remains available.

## 7. Architecture and Catalyst strategy

The React/Vite client calls a versioned Node 24 Advanced I/O API. The API validates input, emits structured errors/correlation IDs, resolves session identity, enforces privileged routes, reports runtime truth, runs shared domain logic, and calls capability adapters.

The canonical judge target is Catalyst Web Client plus same-platform Advanced I/O/API Gateway routing. Catalyst Data Store is the target repository for versioned cases, context, evidence metadata, reports, approvals, feedback, evaluation aggregates, and audit events. Slate is a synchronized mirror and rollback; it must use an absolute approved Catalyst API origin when static same-origin paths return SPA HTML.

Adapters exist for Catalyst Auth, Data Store, NVIDIA NIM, QuickML, Stratus/File Store, Zia, SmartBrowz, and Circuits. This document does not claim those services are live. Each capability requires a real Development call and runtime verification before its badge changes.

## 8. Synthetic data and evaluation

The generated data version is `synthetic-20260717-1000`, seed `20260717`:

- 1,000 runtime cases and a 250-case read-only browser fallback;
- 19 fictionalized stations;
- 2,000 English/Kannada translation rows;
- six planted pattern families and 58 restricted evaluation-truth rows;
- 1,452 case-link training rows, including 252 positives;
- 6,935 aggregate area-pattern training rows.

Evaluation truth is excluded from runtime cases, API projections, citations, prompts, and browser data. Both QuickML datasets are training artifacts only; no published/live model is claimed.

The verified 30-query deterministic reference run reports:

| Metric | Result |
| --- | ---: |
| Intent accuracy | 100% |
| Citation coverage for supported evaluation queries | 100% |
| Refusal fabrication failures | 0 |
| High-confidence planted-link precision | 95.5% |
| Planted-link recall | 100% |
| Evaluated planted pairs | 252 |
| Deterministic p95 | 118.03 ms |

These are synthetic prototype results, not operational KSP accuracy, fairness, latency, or impact claims.

## 9. Security, privacy, and human authority

- No real FIR, citizen identity, evidence, police credential, or restricted operational detail belongs in the public project.
- The browser cannot supply its own trusted role or provider state.
- Public registration is disabled; secure Catalyst users are invitation-only.
- Secrets live in Catalyst environments, never Git or the client bundle.
- Cross-origin access is allowlisted; input size/type and role checks run server-side.
- Unsupported, contradictory, insufficient, unsafe, or out-of-jurisdiction requests do not fabricate evidence.
- Application audit events are hash-linked and use unique-sequence optimistic retry in Data Store mode. A live multi-instance concurrency canary remains required before a production claim.
- Human review is mandatory for case links, legal support, forecasts/scenarios, evidence conclusions, and reports.

## 10. Current readiness and delivery

Implemented and locally testable: the NETRA OS shell, shared context, dual-mode chat pipeline, deterministic KAVACH/repository, versioned API surface, synthetic artifacts/evaluation, local evidence provenance, role-aware flows, approval/report contracts, and honest runtime capability reporting.

External release work: rotate the exposed NVIDIA credential, authenticate/bind Catalyst, verify JSON API routing, provision Auth/Data Store/API Gateway, run and verify the staged synthetic-version activation, verify the implemented binary storage path against a live destination, publish and measure both QuickML pipelines, verify optional provider canaries, prove the retrying audit chain under multi-instance concurrency, and run deployed security/browser/voice/accessibility/judge-mission gates.

Development occurs on `feat/netra-os` from rollback tag `pre-netra-os-edef150`. The branch should merge to `main` only after the deployed Catalyst judge mission passes. Slate follows the accepted Catalyst release and remains a rollback/mirror.

## 11. Impact hypothesis

NETRA OS is designed to reduce query-to-evidence and cross-case review time while increasing traceability and supervisory control. A controlled KSP pilot must measure task completion, citation correctness, missed evidence, analyst override, false linkage, accessibility, end-to-end latency, and user trust. No unverified percentage improvement is claimed.
