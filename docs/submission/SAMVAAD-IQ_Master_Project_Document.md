# SAMVAAD-IQ — NETRA Crime Intelligence Platform

## Challenge

Datathon 2026 Challenge 1 asks for intelligent conversational access to the Karnataka State Police crime database. Investigators need more than a chatbot: they need retrieval across case narratives and structured fields, multilingual interaction, evidence traceability, explainable connections, and human-controlled operational outputs.

## Solution

NETRA is an evidence-grounded crime-intelligence platform. SAMVAAD-IQ is its conversational workspace. KAVACH Crime DNA is its explainable cross-case similarity engine.

The system turns a question into a structured intent and filters, retrieves supporting synthetic FIR fields, runs the requested deterministic analysis, returns citations and confidence limitations, and records a reviewable audit reference. It supports English, Kannada, and Kanglish demonstration queries.

## Differentiation

1. **Evidence before eloquence:** supported answers carry exact citations; unsupported questions refuse to fabricate.
2. **Explainable similarity:** KAVACH exposes feature weights, contributions, shared hashed entities, thresholds, and contradictions.
3. **Human decision authority:** analysts accept or reject leads; supervisors approve reports and operational scenarios.
4. **Capability honesty:** Catalyst providers are discovered at runtime and unavailable services are never simulated as successful.
5. **Synthetic-by-design public demo:** planted truth patterns make evaluation reproducible without exposing police or citizen information.

## End-to-end workflow

1. Investigator authenticates with a role-scoped session.
2. Investigator asks a multilingual crime-data question.
3. SAMVAAD-IQ retrieves and cites supporting records.
4. KAVACH explains similar cases or relationships.
5. Analyst opens the case, map, graph, or scenario workspace.
6. Evidence Lab validates, hashes, parses, and grounds a synthetic file.
7. Human reviewer accepts, rejects, or escalates the lead.
8. Supervisor approves an auditable report.

## Architecture

The React/Vite frontend calls a versioned Advanced I/O API. The API validates requests, resolves identity, enforces roles, limits cross-origin access, records hash-chained audit events, and delegates to Catalyst provider adapters. A shared pure intelligence core powers both the API and the visibly labeled read-only fallback.

Core Catalyst targets are Advanced I/O, Auth, Data Store, and SmartBrowz. Stratus/File Store, Zia, QuickML, and Circuits are enabled only when the actual project capability is verified.

## Data and evaluation

The public API generates 1,000 deterministic `SYN-*` FIR-like records, including planted cross-case patterns. A 30-query English/Kannada/Kanglish reference run measured 100% intent accuracy, 100% citation coverage for supported evaluation queries, zero fabricated citations on refusal queries, and 67 ms deterministic p95 processing on the development machine.

These are measured prototype results, not KSP operational-performance claims.

## Safety

- No public real FIR or personal data.
- No individual risk ranking or automated guilt label.
- Area-level hotspot and patrol planning only.
- Legal mapping remains review support.
- Every lead carries limitations and requires verification.
- Supervisor approval is mandatory for reports.

## Impact hypothesis

SAMVAAD-IQ is designed to reduce query-to-evidence and cross-case review time while improving traceability. Operational impact must be measured in a controlled KSP pilot using approved data, task completion time, citation correctness, analyst override rate, and user trust—not projected as an unverified percentage.

## Delivery path

The winner build uses blue-green deployment: validate the full Catalyst candidate separately, retain the existing Slate site as a rollback path, promote only after authentication/API/judge-journey tests, then configure Slate to publish the same `dist` artifact.
