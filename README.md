# NETRA OS / SAMVAAD-IQ

**NETRA OS** is a role-aware, evidence-grounded crime-intelligence workspace designed for **Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**.

- **NETRA** is the wider investigation operating system.
- **SAMVAAD-IQ** is the multilingual conversational copilot.
- **KAVACH** is the explainable Crime DNA and pattern-reasoning engine.

> **Responsible-use statement**  
> This repository and public prototype use **synthetic data only**. Every generated result is an investigative lead—not proof, a legal conclusion, an accusation, or an individual risk score. Human verification and supervisory approval remain mandatory.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Product Identity](#product-identity)
5. [Core Principles](#core-principles)
6. [Implemented Features](#implemented-features)
7. [End-to-End Investigation Workflow](#end-to-end-investigation-workflow)
8. [System Architecture](#system-architecture)
9. [Runtime Truth and Capability States](#runtime-truth-and-capability-states)
10. [Synthetic Dataset](#synthetic-dataset)
11. [KAVACH Crime DNA](#kavach-crime-dna)
12. [Conversational Intelligence](#conversational-intelligence)
13. [Evidence Processing](#evidence-processing)
14. [Hotspot, Diffusion, and Patrol Intelligence](#hotspot-diffusion-and-patrol-intelligence)
15. [Governance and Human Oversight](#governance-and-human-oversight)
16. [Roles and Access Model](#roles-and-access-model)
17. [Technology Stack](#technology-stack)
18. [Repository Structure](#repository-structure)
19. [Local Development](#local-development)
20. [Validation and Testing](#validation-and-testing)
21. [API Reference](#api-reference)
22. [Deployment](#deployment)
23. [Demo Flow](#demo-flow)
24. [Verified Evaluation](#verified-evaluation)
25. [Known Limitations](#known-limitations)
26. [Roadmap](#roadmap)
27. [Security and Privacy](#security-and-privacy)
28. [Contribution Guidelines](#contribution-guidelines)
29. [License and Disclaimer](#license-and-disclaimer)

---

# Project Overview

NETRA OS converts fragmented FIR-style records into one connected investigation environment where police users can:

- ask questions in English, Kannada, or Kanglish;
- inspect source-backed answers and citations;
- open a complete FIR dossier;
- compare similar cases using KAVACH Crime DNA;
- explore hidden entity relationships through a network graph;
- inspect station-area hotspot patterns;
- review historical pattern diffusion;
- simulate patrol allocation;
- validate synthetic evidence files;
- generate evidence-grounded investigation briefs;
- route sensitive actions through human approval;
- inspect runtime capability status instead of relying on simulated claims.

The system is designed as an **investigation operating system**, not a normal chatbot and not a traditional static dashboard.

---

# Problem Statement

Crime data is usually distributed across multiple systems and documents, including FIR records, accused and victim details, police-station registers, district reports, investigation notes, evidence files, spreadsheets, and vehicle, phone, account, and location references.

This fragmentation creates several operational problems:

1. **Manual searching is slow** — investigators may need to compare many records one by one.
2. **Hidden relationships are difficult to detect** — similar modus operandi, shared phone hashes, repeated vehicles, related locations, and connected FIRs may remain unnoticed.
3. **Dashboards show counts but not reasoning** — a chart may show that theft increased, but it does not explain which FIRs are linked or why.
4. **Crime analysis remains reactive** — existing systems often describe historical records but do not support similar-case discovery, pattern review, or patrol what-if analysis.
5. **AI outputs can become unsafe if not grounded** — a police-intelligence system must show evidence, limitations, confidence, role boundaries, and human-review requirements.

NETRA OS addresses these gaps by combining conversational search, visual analytics, explainable matching, evidence provenance, governance, and operational decision support in one interface.

---

# Solution Overview

NETRA OS follows a simple operational model:

```text
ASK → RETRIEVE → VERIFY → CONNECT → VISUALIZE → SIMULATE → REVIEW → REPORT
```

An investigator can ask:

```text
Mysuru alli motorcycle theft hotspot show maadi
```

The system then:

1. detects the intended location, crime type, and analysis type;
2. searches the active synthetic FIR data version;
3. returns matching records and source identifiers;
4. explains the result and its limitations;
5. allows the same context to be opened in Hotspots, Network, Crime DNA, Diffusion, or Patrol;
6. generates an investigation brief with citations, confidence, audit reference, and safety notes.

---

# Product Identity

| Name | Meaning | Role |
|---|---|---|
| **NETRA** | Neural Evidence-based Threat Reasoning Architecture | Wider investigation operating system and visual intelligence workspace |
| **SAMVAAD-IQ** | Conversational Investigative Intelligence | Text-and-voice copilot for asking crime-data questions |
| **KAVACH** | Protective intelligence layer | Explainable Crime DNA, case similarity, and pattern-reasoning engine |

## What “OS” Means

NETRA OS is **not** a device operating system like Windows or Linux.

It is an **investigation operating system**: a unified digital workspace where authorized users can search, analyze, visualize, verify, simulate, approve, and report without leaving the same investigation context.

---

# Core Principles

## 1. Evidence First

Every supported answer should link back to source FIRs, evidence records, filters, or a documented prototype-knowledge source.

## 2. Human Authority Stays in the Loop

The platform supports decision-making but does not replace an investigator, supervisor, legal reviewer, or authorized authority.

## 3. Runtime Truth

The UI must distinguish between a real live service, an API-backed synthetic seed, a read-only browser fallback, and an unavailable capability. A configured flag is not treated as proof that a service is live.

## 4. No Simulated Success

When storage, OCR, authentication, AI, or reporting is unavailable, the application must show that limitation instead of pretending the operation succeeded.

## 5. Area-Level and Pattern-Level Intelligence

Hotspots, diffusion, anomaly alerts, and patrol simulations operate on aggregated historical patterns. They must not be presented as person-level guilt or future-crime predictions.

## 6. Role-Based Governance

Administrative data operations, report approvals, and official exports remain restricted to permitted roles.

---

# Implemented Features

## 1. NETRA OS Shell

The shared application shell provides:

- role-aware navigation;
- a global system bar;
- `Ctrl+K` application launcher;
- shared investigation context;
- runtime mode indicator;
- English and Kannada interface controls;
- evidence/task inspector;
- preserved deep links for every major module.

The shell keeps all tools inside one connected investigation environment.

## 2. Role-Aware Login and Session Model

The prototype supports Admin, Investigator, Analyst, and Supervisor roles. The demo gateway provides fixed synthetic profiles for judging and testing.

In a production-oriented deployment, authorization should be derived from the authenticated server session. Client-supplied roles must never be trusted as authorization.

## 3. Mission Control Dashboard

The dashboard provides an operational overview of the active data version.

Typical elements include:

- total FIR records;
- active cases;
- repeat-offender indicators;
- hotspot zones;
- active-case share;
- most frequent crime category;
- pending investigations;
- similar-case alerts;
- patrol recommendations;
- data-version status;
- time-of-day patterns;
- police-station summaries;
- live field context where available.

Its purpose is to show the overall state of the investigation dataset before the officer opens a specific case or query.

## 4. Ask SAMVAAD

Ask SAMVAAD is the main conversational interface.

It supports:

- English queries;
- Kannada text;
- Kanglish text;
- browser speech input using `en-IN` and `kn-IN` where supported;
- speech output;
- follow-up context;
- answer modes;
- citations;
- query-plan display;
- timelines;
- confidence and limitation notes;
- suggested next questions;
- complete conversation-history reporting.

### Example

```text
Mysuru alli motorcycle theft hotspot show maadi
```

A grounded response may include the number of matching synthetic records, the strongest station-area cluster, cited FIR identifiers, a descriptive limitation, a link to open the hotspot map, and suggested next actions.

### Supported Answer Classes

1. **Database-grounded answer** — generated from matching FIR-style records.
2. **Approved prototype-knowledge answer** — generated from verified project documentation.
3. **General AI answer** — used only where the question is outside the crime-data source but still safe and relevant.
4. **Focused clarification** — returned when important information such as district, date range, or crime type is missing.
5. **Safety or jurisdiction refusal** — returned when the request is unsafe, unsupported, or outside permitted scope.

A deterministic fallback is available so the interface does not return an empty answer when NVIDIA NIM or another generative provider is unavailable.

## 5. Case Desk and FIR Dossier

The Case Desk allows investigators to browse FIR-style records, filter by district, crime type, status, station, or date, open a selected case, and move directly into evidence, network, Crime DNA, or report workflows.

A complete FIR dossier can include:

- case overview;
- station and district;
- date and time;
- narrative summary;
- modus operandi;
- involved entities;
- linked identifiers;
- evidence references;
- Crime DNA matches;
- legal context;
- action plan;
- audit history.

## 6. Evidence Lab

The Evidence Lab performs local validation and analysis for supported synthetic evidence files.

### Supported Formats

- PDF
- DOCX
- XLSX
- CSV
- JSON
- PNG
- JPEG

### File Limit

```text
10 MB
```

### Local Processing

The browser can validate file type and size, calculate SHA-256, parse supported structured content, extract supported text, create provenance metadata, compare extracted facts with synthetic FIR records, and show grounded case matches.

### Capability Boundaries

The interface clearly indicates whether server-side evidence persistence, verified server OCR, visual object recognition, number-plate recognition, biometric or face identification, and remote evidence storage are available. Unavailable capabilities must not be simulated.

## 7. Intelligence Analytics Workspace

The Intelligence Analytics page serves as the central entry point for evidence-grounded analysis. It connects KAVACH Crime DNA, Evidence Network, Area Hotspots, Cold Case Review, Patrol Scenarios, and Pattern Diffusion.

Each analysis remains linked to synthetic source records and is subject to human verification.

## 8. Geospatial Hotspots

The Hotspots module provides a station-area and district-level geospatial FIR view.

Capabilities include district filter, crime-type filter, cases-in-view count, cluster count, concentration indicator, station-level FIR count, map markers, cluster visualization, and query-linked navigation from SAMVAAD-IQ.

The module describes historical concentration. It does not predict that a specific person will commit a crime.

## 9. Shared Entity Network

The Network module visualizes relationships between FIRs, accused records, victims, police stations, locations, phone hashes, vehicles, financial identifiers, and evidence references.

The interface displays node count, edge count, graph density, node-type legend, relationship labels, filters, and source FIR context. Every edge should correspond to a visible entity field or source-backed relationship.

## 10. Digital Evidence Workbench

The Digital Evidence Workbench records locally available evidence metadata and provenance.

It distinguishes between local browser metadata, locally extracted text, server-persisted evidence, verified OCR output, verified visual extraction, and unsupported inference.

The system does not infer face identity, object identity, plate OCR, or confidence scores unless a verified server capability returns source-backed output.

## 11. KAVACH Crime DNA

KAVACH Crime DNA compares cases using explainable factor-level scoring.

Typical comparison factors include:

| Signal | Purpose |
|---|---|
| Crime category | Checks whether the cases belong to the same crime type |
| Modus operandi | Compares behavior, target, entry method, tools, and escape pattern |
| Geography | Compares district, station, area, and location proximity |
| Time pattern | Compares night, day, weekend, market-hour, or other time windows |
| Shared identifiers | Checks common accused IDs, phone hashes, vehicles, accounts, or devices |
| Narrative similarity | Compares FIR summaries and repeated language patterns |

The output includes the selected source case, ranked similar cases, factor-level reasons, contradictions, similarity score, lead strength, and links to dossier and graph views.

The score is an explainable investigative similarity measure—not proof that two cases were committed by the same person.

## 12. Cold Case Pattern Revival

The Cold Cases module compares older unresolved cases against newer patterns.

It can surface possible relationships based on crime category, geography, time pattern, modus operandi, shared identifiers, and narrative overlap.

Each result is labelled:

```text
Investigative lead only
```

The module is designed to help reviewers revisit older cases—not to automatically reopen, accuse, or conclude a case.

## 13. Pattern Diffusion

The Diffusion module studies historical area-level activity.

It can display active linked incidents, inactive or resolved records, expanding-pattern areas, repeated-identifier corridors, district and crime-type filters, and an `Rc`-style area activity ratio.

The `Rc` value summarizes historical synthetic area/time/category activity. It is not a forecast and not a score about any person.

## 14. Patrol Coverage Simulation

The Patrol module allows supervisors to test resource-allocation scenarios.

Inputs may include district, crime category, patrol-unit count, time window, and field context.

Outputs may include historical hotspot coverage, recommended focus areas, expected coverage change, displacement warning, priority time windows, and field-condition context.

This is a planning simulation. It is not a guarantee of crime reduction and does not automate deployment decisions.

## 15. Tablet Patrol

Tablet Patrol converts selected intelligence into a field-oriented command view. Its purpose is to make relevant information easier to review on a mobile or tablet device during patrol operations.

Possible information includes selected district, selected patrol window, priority areas, current assignment context, map or zone display, operational notes, and offline-demo status.

## 16. Evidence-Grounded Reports

The Reports module generates an investigation brief that can include report title, report ID, audit reference, timestamp, selected case IDs, conversation ID, transcript, query filters, cited excerpts, source count, confidence, runtime mode, data version, provider information, approval status, and safety disclaimer.

All roles may draft a report. Only Supervisor or Admin roles should be allowed to approve and produce an official server report.

When managed report generation is unavailable, the application may provide a clearly labelled browser-print fallback.

## 17. Governance

The Governance module makes the system's control boundaries visible.

It displays defined roles, synthetic public-record count, verified audit events, human-review requirement, live capability registry, role matrix, server-enforced decision boundaries, available and unavailable service states, and a decision-support-only warning.

The key design rule is:

```text
Human authority stays in the loop.
```

## 18. Trend and Anomaly Alerts

The Trend Alerts module monitors aggregated synthetic data for unusual spikes in case volume, emerging category patterns, abnormal station-area activity, repeated identifier exposure, and time-window anomalies.

When no critical anomaly is present, the system explicitly shows that no critical trend anomaly was detected.

An alert is an operational signal for review, not evidence against an individual.

## 19. Cohort Analysis

The Cohorts module provides safe aggregate grouping. It is designed to reveal broad community-impact patterns while avoiding individual profiling.

Controls include minimum group-size thresholds, exclusion of personally identifiable information, aggregate-only reporting, bias-protection messaging, and no person-level risk score.

Cohort analysis must never be used to infer guilt, criminality, or enforcement priority from protected or sensitive characteristics.

## 20. Approval Inbox

The Approval Inbox supports human-in-the-loop review for sensitive workflows.

It may include pending investigation tasks, report-export requests, supervisor-review items, approval status, reviewer notes, and completed approvals.

Sensitive actions should remain pending until reviewed by an authorized Supervisor or Admin.

## 21. Intelligence Pipeline

The Pipeline view explains the full system capability chain:

1. Synthetic FIR Store
2. Query Engine
3. Evidence Lab
4. KAVACH Crime DNA
5. Hotspot and Patrol Intelligence
6. Report Builder

Additional tabs can explain Data Flow, Agent Room, API Layer, Catalyst Map, Deployment, readiness gates, code/schema artifacts, GitHub auto-fetch steps, and service mapping.

This page helps judges and developers understand how the visible modules connect technically.

## 22. Admin Data

The Admin Data module allows an authorized Admin to review manual test data, paste or import JSON, validate schema, inspect parsed records, prevent duplicate seeding, stage a new data version, validate checksums, and activate a version after validation.

The one-time seed process should refuse to run when active case records already exist, preventing accidental duplication.

---

# End-to-End Investigation Workflow

```text
1. LOGIN
   ↓
2. DASHBOARD
   ↓
3. ASK SAMVAAD
   ↓
4. INSPECT CITATIONS AND LIMITATIONS
   ↓
5. OPEN CASE / DOSSIER
   ↓
6. VALIDATE EVIDENCE
   ↓
7. ANALYZE HOTSPOTS / NETWORK / CRIME DNA
   ↓
8. REVIEW COLD CASES / DIFFUSION
   ↓
9. RUN PATROL WHAT-IF
   ↓
10. REQUEST HUMAN APPROVAL
   ↓
11. EXPORT INVESTIGATION BRIEF
```

## Example Judge Flow

1. Sign in as an Investigator.
2. Open Mission Control.
3. Ask `Mysuru alli motorcycle theft hotspot show maadi`.
4. Inspect the cited FIRs and source count.
5. Open Hotspots for Mysuru.
6. Open a linked FIR in the Network graph.
7. Compare it in KAVACH Crime DNA.
8. Review an older match in Cold Cases.
9. Open Pattern Diffusion.
10. Run Patrol Coverage Simulation.
11. Open Reports.
12. Switch to Supervisor or Admin to demonstrate approval and governance.

---

# System Architecture

## High-Level Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                    NETRA OS FRONTEND                       │
│ React + Vite · Role-aware shell · Chat · Maps · Graphs     │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                NODE 24 ADVANCED I/O API                    │
│ Validation · Security headers · RBAC · Structured errors   │
└───────────────┬───────────────────┬────────────────────────┘
                │                   │
                ▼                   ▼
┌────────────────────────┐   ┌───────────────────────────────┐
│  SYNTHETIC DATA LAYER  │   │  INTELLIGENCE SERVICES       │
│ Cases · Stations       │   │ Query · Crime DNA · Graph    │
│ Evidence · Relations   │   │ Hotspot · Diffusion · Patrol │
│ Audit · Reports        │   │ Report · Approval            │
└────────────────────────┘   └───────────────────────────────┘
                │                   │
                └─────────┬─────────┘
                          ▼
┌────────────────────────────────────────────────────────────┐
│                ZOHO CATALYST TARGET                        │
│ Web Client · Auth · Data Store · Functions/AppSail         │
│ File Store/Stratus · API Gateway · SmartBrowz              │
└────────────────────────────────────────────────────────────┘
```

## Current Implementation

| Layer | Current State |
|---|---|
| Frontend | React + Vite |
| API | Node.js 24 Advanced I/O API |
| Data | Versioned synthetic server dataset plus browser fallback |
| Authentication | Demo session profiles; secure Catalyst Auth redirect path planned/configurable |
| Intelligence | Deterministic analytics with optional verified provider integration |
| Reporting | Browser-print fallback; managed report service only when verified |
| Hosting | Catalyst-first target with synchronized Slate mirror |

---

# Runtime Truth and Capability States

Runtime is represented as independent capabilities rather than one optimistic live/offline flag.

Tracked capability categories include:

```text
apiReachable
authentication
dataSource
persistence
generativeAi
quickMl
ocr
storage
reports
orchestration
```

## UI States

| UI Label | Meaning |
|---|---|
| `Catalyst Live` | Required Catalyst services for the current operation passed live canaries |
| `Server AI · Synthetic Seed` | API is reachable and verified server AI may be available, but managed case persistence is unavailable |
| `Offline Demo` | Read-only browser repository and deterministic engine are active; changes are not server-persisted |
| `Capability Unavailable` | The requested provider has not passed verification; no success is simulated |

A route returning the SPA HTML is not considered a working API. Health and capability endpoints must return JSON.

---

# Synthetic Dataset

The project uses a versioned synthetic dataset so the complete workflow can be demonstrated without real police records or PII.

## Verified Reference Dataset

| Item | Value |
|---|---:|
| Data version | `synthetic-20260717-1000` |
| Seed | `20260717` |
| Server synthetic cases | 1,000 |
| Browser fallback cases | 250 |
| Stations | 19 |
| English/Kannada translation rows | 2,000 |
| Planted pattern families | 6 |
| Evaluation-truth rows | 58 |
| Case-link training rows | 1,452 |
| Positive case-link rows | 252 |
| Area-pattern training rows | 6,935 |

The release authority is represented by generated manifest and evaluation files.

Training artifacts are not live models. Evaluation truth must never appear in runtime records, browser bundles, citations, or user-facing query results.

---

# KAVACH Crime DNA

KAVACH creates an explainable case fingerprint and compares it against other FIRs.

A reference weighted formula may include:

```text
Crime DNA Similarity =
  Crime Type
+ Modus Operandi
+ Geography
+ Time Pattern
+ Shared Identifiers
+ FIR Narrative Similarity
```

Weights must be treated as prototype configuration and displayed transparently.

A Crime DNA result should include source FIR, matched FIR, similarity score, factor-level contributions, matched fields, contradictions, evidence identifiers, limitation note, and human-review warning.

---

# Conversational Intelligence

## Query Input

```json
{
  "message": "Mysuru alli motorcycle theft hotspot show maadi",
  "conversationId": "optional",
  "investigationId": "optional",
  "answerMode": "grounded",
  "language": "kanglish",
  "contextRefs": [],
  "dataVersion": "optional"
}
```

## Query Output

```json
{
  "answerClass": "database_grounded",
  "answer": "Grounded response text",
  "queryPlan": {},
  "filters": {},
  "citations": [],
  "confidence": {},
  "evidence": [],
  "visualizations": [],
  "limitations": [],
  "nextActions": [],
  "provider": "deterministic",
  "latencyMs": 0,
  "approvalState": "draft",
  "auditReference": "AUD-..."
}
```

## Failure Format

```json
{
  "requestId": "REQ-...",
  "code": "CAPABILITY_UNAVAILABLE",
  "message": "Requested capability is not available.",
  "retryable": false,
  "mode": "offline-demo"
}
```

---

# Evidence Processing

## Browser Evidence Flow

```text
Choose File
   ↓
Validate Type and Size
   ↓
Calculate SHA-256
   ↓
Extract Supported Content
   ↓
Create Provenance Record
   ↓
Match Extracted Facts to Synthetic FIRs
   ↓
Display Capability Limitations
```

## Server Upload Flow

When real storage is configured, the server must:

1. validate the base64 payload;
2. enforce the decoded 10 MB limit;
3. recalculate SHA-256 from decoded bytes;
4. compare the submitted and calculated hashes;
5. persist only through a verified storage adapter;
6. return a source-backed persistence record.

Until storage passes live verification, the upload route must return an explicit unavailable response.

---

# Hotspot, Diffusion, and Patrol Intelligence

## Hotspots

Hotspots summarize historical cases by area, station, category, and time.

## Diffusion

Diffusion reviews whether linked historical patterns appear across multiple areas or corridors.

## Patrol What-If

Patrol What-If compares a baseline with a simulated patrol plan.

Safe interpretation:

```text
The system estimates historical-pattern coverage under the selected allocation.
It does not guarantee crime reduction or automatically deploy personnel.
```

---

# Governance and Human Oversight

The system uses multiple control layers:

- role-based access;
- capability registry;
- approval workflow;
- audit references;
- source citations;
- confidence notes;
- limitation notes;
- bias controls;
- minimum cohort size;
- no individual future-crime score;
- no automatic accusation;
- no automated enforcement;
- no hidden unsupported service claims.

---

# Roles and Access Model

| Role | Access |
|---|---|
| **Admin** | All applications and administration |
| **Investigator** | Operational applications except the Administrative Console |
| **Analyst** | Mission Control, Ask SAMVAAD, Case Desk, Intelligence Studio, Reports, and Governance |
| **Supervisor** | Operational applications except the Administrative Console; may approve and export official reports |

All roles may create report drafts. Only Supervisor or Admin roles should be allowed to approve and produce an official server report.

The API derives the role from the authenticated session and does not trust a client-supplied role.

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling/UI | Custom responsive NETRA OS interface |
| Backend | Node.js 24, Catalyst Advanced I/O style API |
| Maps | Leaflet-compatible geospatial rendering |
| Graphs | React Flow or equivalent node-edge visualization |
| Data | Versioned synthetic JSON and Catalyst Data Store target |
| Authentication | Demo sessions with Catalyst Auth target |
| Evidence | Local file parsing, SHA-256 provenance |
| Reports | Browser-print fallback with managed report target |
| Deployment | Zoho Catalyst-first, Slate mirror/rollback |
| Optional AI | NVIDIA NIM or other provider only after verification |
| Optional ML | QuickML only after provisioning and canary verification |
| Optional OCR | Zia OCR only after provisioning and canary verification |

---

# Repository Structure

```text
samvaad-iq/
├── README.md
├── package.json
├── catalyst.json
├── client/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── data/
│       └── styles/
├── functions/
│   ├── api/
│   │   ├── package.json
│   │   ├── index.js
│   │   └── modules/
│   └── samvaad-api/
├── data/
│   ├── generated/
│   │   ├── manifest.json
│   │   ├── release-manifest.json
│   │   └── evaluation-metrics.json
│   └── source/
├── docs/
│   ├── architecture.md
│   ├── workflow.md
│   ├── capability-matrix.md
│   ├── data-card.md
│   ├── privacy-threat-model.md
│   ├── judge-demo.md
│   ├── judge-access.md
│   └── submission/
├── demo/
│   └── demo-script.md
└── tests/
```

The exact repository structure may evolve, but generated data, documentation, runtime code, and evaluation truth should remain clearly separated.

---

# Local Development

## Requirements

- Node.js 24
- npm
- Zoho Catalyst CLI for Catalyst validation or deployment
- Git

## Install Dependencies

```bash
npm ci
npm --prefix client ci
npm --prefix functions/api ci
```

## Start the API

```bash
npm run api:dev
```

Expected local API origin:

```text
http://127.0.0.1:3001
```

## Start the Frontend

In a second terminal:

```bash
npm run client:dev
```

The Vite development server proxies `/api/v1` to `http://127.0.0.1:3001`.

---

# Validation and Testing

Run the complete local validation gate:

```bash
npm run validate
```

Run dependency audits:

```bash
npm --prefix client audit --omit=dev --audit-level=high
npm --prefix functions/api audit --omit=dev --audit-level=high
```

Run the deterministic evaluation:

```bash
npm run evaluate
```

Additional project commands may include:

```bash
npm run client:lint
npm run client:build
npm run build
npm run api:smoke
```

## Minimum Manual Test Checklist

- Login works for every demo role.
- Dashboard loads the active data version.
- Ask SAMVAAD returns a non-empty grounded response.
- Citations open the correct synthetic FIR records.
- Hotspot filters change the visible area.
- Network edges correspond to visible source fields.
- Crime DNA explains the score.
- Cold Case results include an investigative-lead warning.
- Diffusion remains area-level.
- Patrol output includes a planning disclaimer.
- Evidence Lab shows SHA-256 and capability limits.
- Reports include source IDs, data version, and audit reference.
- Governance displays role and capability boundaries.
- Admin seed prevents duplicate activation.

---

# API Reference

All routes are versioned under `/api/v1`.

## Runtime

- `GET /health`
- `GET /capabilities`
- `GET /ai/status`
- `GET /data/versions`

## Authentication

- `POST /auth/demo-session`
- `GET /auth/secure-url`
- `POST /auth/logout`
- `GET /auth/me`

## Cases and Search

- `GET /cases`
- `GET /cases/:id`
- `GET /search`
- `GET /knowledge/search`

## Investigations and Conversations

- `GET /investigations`
- `POST /investigations`
- `PATCH /investigations/:id`
- `GET /conversations`
- `GET /conversations/:id/messages`

## Conversational Copilot

- `POST /query`

## Intelligence

- `POST /analytics/similarity`
- `POST /analytics/graph`
- `POST /analytics/hotspots`
- `POST /analytics/trends`
- `POST /analytics/alerts`
- `POST /analytics/cohorts`
- `POST /analytics/scenarios`

## Evidence and Review

- `POST /evidence/uploads`
- `POST /evidence/:id/analyze`
- `GET /tasks`
- `POST /approvals`
- `PATCH /approvals/:id`

## Reports and Governance

- `POST /reports`
- `GET /reports/:id`
- `GET /audit`
- `POST /feedback`

## Administration

- `POST /admin/seed`

The administration route requires an authenticated Admin session.

---

# Deployment

## Target Platform

The canonical deployment target is Catalyst Web Client, Node 24 Advanced I/O API, Catalyst Authentication, Catalyst Data Store, Catalyst Functions or AppSail, Catalyst API Gateway, optional Stratus/File Store, and optional SmartBrowz.

## Catalyst Commands

```bash
catalyst login
catalyst init --force
catalyst serve
catalyst deploy
```

## Release Verification

A public URL should not be considered release-ready until a deployed smoke test confirms:

- API routes return JSON;
- authentication works;
- the active data version is correct;
- AI status is accurate;
- runtime capabilities are truthful;
- the complete judge mission works;
- report generation behaves according to available capability;
- no secret or evaluation-truth data is exposed.

## Slate Mirror

Slate can be maintained as a synchronized public mirror or rollback target. When same-origin API routing is unavailable, it must use an approved absolute Catalyst/API Gateway origin.

---

# Demo Flow

A recommended 2.5–3 minute demo sequence:

```text
1. Dashboard
2. Ask SAMVAAD
3. Evidence Lab
4. Intelligence Analytics
5. Hotspots
6. Network
7. Digital Evidence
8. KAVACH Crime DNA
9. Cold Cases
10. Diffusion
11. Patrol
12. Tablet Patrol
13. Reports
14. Governance
15. Alerts
16. Cohorts
17. Approval Inbox
18. Pipeline
19. Admin Data
```

Use one prepared investigation context throughout the demo so the flow appears connected rather than like a collection of unrelated pages.

---

# Verified Evaluation

The current reference evaluation covers 30 English, Kannada, and Kanglish queries over 1,000 deterministic synthetic cases.

| Metric | Reference Result |
|---|---:|
| Intent accuracy | 100% |
| Citation coverage for supported evaluation queries | 100% |
| Refusal fabrication failures | 0 |
| High-confidence planted-link precision | 95.5% |
| Planted-link recall | 100% |
| Evaluated planted pairs | 252 |
| Deterministic p95 | 354.16 ms |

These are prototype measurements on synthetic data. They are not operational KSP accuracy, safety, latency, crime-reduction, or social-impact claims.

Reproduce the reference run with:

```bash
npm run evaluate
```

---

# Known Limitations

The following capabilities remain unavailable until provisioned and verified:

- managed conversation persistence;
- Catalyst Authentication production binding;
- live Catalyst Data Store activation;
- NVIDIA NIM;
- QuickML;
- Zia OCR;
- live Stratus/File Store persistence;
- SmartBrowz;
- Catalyst Circuits;
- production-grade audit persistence;
- production KSP data integration.

The public interface must never present configuration flags as proof that these services are operational.

---

# Roadmap

## Phase 1 — Stable Prototype

- deterministic query engine;
- synthetic data;
- evidence citations;
- Crime DNA;
- hotspots;
- network;
- diffusion;
- patrol simulation;
- reports;
- governance.

## Phase 2 — Catalyst Service Binding

- Catalyst Authentication;
- Catalyst Data Store;
- secure server sessions;
- persistent investigations;
- persistent evidence;
- persistent reports;
- immutable audit records.

## Phase 3 — Verified AI and ML Providers

- verified generative provider;
- QuickML model serving;
- OCR integration;
- multilingual improvements;
- advanced graph analysis;
- calibrated confidence.

## Phase 4 — Controlled Pilot

- policy review;
- legal review;
- security testing;
- fairness evaluation;
- authorized pilot dataset;
- station-level training;
- incident-response process;
- human-override procedures.

---

# Security and Privacy

## Data Rules

- No real police records in the public repository.
- No personal secrets or real credentials.
- No evaluation-truth data in runtime bundles.
- No unmasked sensitive identifiers.
- No client-supplied authorization role.
- No silent upload.
- No unverified server persistence.
- No unsupported OCR or identity inference.

## Repository Rules

Do not commit:

```text
.env
real API keys
judge passwords
production Catalyst secrets
NVIDIA credentials
QuickML credentials
storage identifiers
real police data
private evidence
```

Use `.env.example` for documented configuration names only.

---

# Contribution Guidelines

Before submitting a pull request:

1. Ensure the deterministic engine passes `npm run evaluate` with zero failures.
2. Confirm the offline fallback mode continues to operate securely.
3. Validate all new features against synthetic, not actual, data.
4. Adhere to the established Catalyst and React conventions.
5. Provide evidence-based unit tests for all new analytical algorithms.

---

# License and Disclaimer

This project is released strictly for the Datathon 2026 Challenge 1 competition. 

> **Disclaimer:** All case data, locations, scenarios, and analytical outcomes contained in this prototype are purely fictional and synthetic. They are constructed for testing predictive models and interface operations. Do not deploy or rely on this system for real-world policing, intelligence, or law enforcement decisions.
