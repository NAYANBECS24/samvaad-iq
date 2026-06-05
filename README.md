# SAMVAAD-IQ / NETRA

Conversational Crime Intelligence OS prototype for Karnataka Police hackathon submission.

NETRA means **Neural Evidence-based Threat Reasoning Architecture**. In this prototype, NETRA is the wider crime-intelligence concept, SAMVAAD-IQ is the conversational interface, and KAVACH is the Crime DNA reasoning engine.

All case records, users, identifiers, and evidence references are synthetic demo data. The system is built for investigative lead generation only; it does not predict guilt, accuse a person, or automate enforcement decisions.

## Submission Status

- Frontend prototype: React + Vite
- Local API prototype: Node.js HTTP server
- Deployment target: Zoho Catalyst compatible function structure
- Slate Git deployment: build from repository root with output path `dist`
- Catalyst Pipelines: root `catalyst-pipelines.yaml` prepared for GitHub auto-fetch deployment
- Catalyst service map: visible in the app and available at `GET /api/catalyst/readiness`
- Data mode: bundled synthetic JSON fallback
- Secrets: no real `.env` file is committed; only `.env.example` is provided
- Submission documents: included in `docs/submission/`

## Key Features

- Role-based demo login for Admin, Investigator, Analyst, and Supervisor
- Dashboard with synthetic FIR counts, charts, latest cases, and live field-condition metrics
- FIR Case Explorer with filters, table view, and quick links into investigation workflows
- FIR Dossier with Overview, Evidence, Crime DNA, Legal XAI, Action Plan, and Audit tabs
- English/Kanglish investigation chat with deterministic responses for demo reliability
- Browser speech input on supported browsers
- NETRA Evidence Lab: upload-style evidence intake, Zia-style OCR/STT/entity extraction, FIR linking, Crime DNA matching, QuickML RAG chunks, SmartBrowz report staging, Signals/Circuits audit trail, and Catalyst Cache precompute view
- Detective Room reasoning cards with source FIRs and evidence chips
- Hotspot Map with Leaflet risk markers
- Crime Contagion Diffusion page with Rc-style area risk and repeated-identifier corridors
- Network Graph using React Flow
- KAVACH Crime DNA similar-case scoring
- Patrol What-If simulation with ACSE-style displacement risk and recommended time windows
- Governance Audit page with RBAC matrix, audit trail, evidence controls, and skeptic guardrails
- PDF-ready investigation brief export
- API routes for auth, dashboard summary, chat, similar cases, hotspots, diffusion, Legal XAI, audit, patrol simulation, and reports
- API routes for Evidence Lab profiles, evidence analysis, SmartBrowz-style report handoff, and cache precompute readiness

## Next-Level Prototype Layer

The latest build adds **NETRA Evidence Lab**, an end-to-end evidence intelligence workflow designed to match the required Zoho Catalyst services while staying safe for a synthetic hackathon demo.

Evidence Lab flow:

```text
Upload Evidence -> Zia Extraction -> QuickML RAG -> Crime DNA Match -> SmartBrowz Report -> Signals Audit
```

Supported simulated evidence types:

- FIR PDF intake with OCR-style extraction
- CCTV image analysis with object recognition and plate OCR
- ID/document scan with masked entity extraction
- Audio clip intake with speech-to-text and translation-style transcript extraction

What the workflow shows:

- Extracted vehicle number, phone hash, location, time window, legal hints, and suspect/entity mentions
- Linked synthetic FIR records with confidence scores
- KAVACH Crime DNA match results against related FIRs
- QuickML-style RAG source chunks from FIR text, evidence metadata, legal support notes, and SOP guardrails
- SmartBrowz-style official report staging
- Stratus object metadata for evidence and generated reports
- Catalyst Signals + Circuits style supervisor review timeline
- Catalyst Cache precompute cards for hotspot, graph, dashboard, and similar-case outputs
- Audit log entries for evidence upload, extraction, entity matching, review, report render, and notification

## Catalyst Service Alignment

| Capability | Catalyst Service Used In Prototype |
| --- | --- |
| Frontend / SPA | Catalyst Slate or Web Client Hosting |
| Serverless API | Catalyst Serverless Functions |
| Evidence upload/object storage | Catalyst Stratus |
| OCR, STT, image/object recognition, ID extraction | Catalyst Zia Services |
| FIR/legal/SOP knowledge retrieval | Catalyst QuickML RAG |
| FIR tables, audit tables, report metadata | Catalyst Data Store |
| Agent traces and evidence session metadata | Catalyst NoSQL |
| Repeated graph, hotspot, dashboard, and Crime DNA lookups | Catalyst Cache |
| Upload/extraction/match/report events | Catalyst Signals + Event Functions |
| Supervisor review workflow | Catalyst Circuits |
| Official PDF rendering path | Catalyst SmartBrowz |
| Supervisor notification | Catalyst Mail |
| GitHub auto-fetch deployment | Catalyst Pipelines |

## Repository Layout

```text
samvaad-iq/
  client/                 React + Vite frontend
  functions/api/          Local Node API used for prototype testing
  functions/samvaad-api/  Catalyst-name compatibility wrapper
  data/                   Synthetic source data and import notes
  data/evidence-intelligence.json  Evidence Lab profiles, workflow events, cache plan, and RAG corpus
  docs/                   Architecture images, environment notes, submission bundle
  demo/                   Demo script for judges
  catalyst.json           Catalyst deploy map for generated client and API function
  catalyst-pipelines.yaml Catalyst Pipelines GitHub auto-fetch workflow
```

## Quick Start

Use Node.js 20 or newer.

```powershell
npm --prefix client install
npm start
```

The Vite app will print a local URL, usually `http://localhost:5173/`.

## Demo Login

Use any of these accounts with password `demo123`:

- `admin@ksp.demo`
- `investigator@ksp.demo`
- `analyst@ksp.demo`
- `supervisor@ksp.demo`

The implementation guide aliases are also accepted, for example `investigator@samvaad.local` with `demo123`.

## Local API

The frontend can run with bundled local data, but the Node API is available for API-backed checks.

```powershell
npm run api:dev
```

Useful routes:

- `GET /api/health`
- `GET /api/seed/summary`
- `GET /api/dashboard/summary`
- `POST /api/auth/login`
- `GET /api/cases`
- `POST /api/chat`
- `GET /api/similar/FIR-2025-BLR-027`
- `GET /api/graph/FIR-2025-BLR-001`
- `GET /api/hotspots?district=Mysuru&crimeType=Chain%20Snatching`
- `GET /api/diffusion?district=Mysuru&crimeType=Motorcycle%20Theft`
- `POST /api/whatif`
- `POST /api/simulate/patrol`
- `POST /api/crime-dna/similar`
- `POST /api/legal/map`
- `GET /api/audit/logs`
- `GET /api/catalyst/readiness`
- `GET /api/evidence/profiles`
- `POST /api/evidence/analyze`
- `POST /api/evidence/report`
- `GET /api/cache/precompute`
- `POST /api/report`

Example Evidence Lab API check:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3001/api/evidence/analyze `
  -ContentType application/json `
  -Body '{"profileId":"cctv-image","fileName":"judge-cctv.png"}'
```

## Judge Demo Flow

Detailed steps are in `demo/demo-script.md`. Recommended short flow:

1. Login as `investigator@ksp.demo` / `demo123`.
2. Open Investigation and ask: `Saar, Mysuru alli last 6 months motorcycle theft pattern show maadi`.
3. Show Detective Room, source FIRs, and linked dossier evidence.
4. Open Evidence Lab, choose CCTV Image or FIR PDF, show extracted entities, FIR matches, RAG chunks, Signals/Circuits workflow, and cache cards.
5. Click `Stage Report`, then open Reports to show the SmartBrowz, Stratus, and Mail handoff path.
6. Open Hotspots and Diffusion for Mysuru motorcycle theft.
7. Ask whether `FIR-2025-BLR-001` and `FIR-2025-BLR-014` are connected.
8. Open Network Graph, Crime DNA, Patrol What-If, Governance Audit, and Pipeline.

## Submission Bundle

The following judge-facing materials are committed under `docs/submission/`:

- `SAMVAAD-IQ_Complete_Prototype_Document.pdf`
- `SAMVAAD-IQ_Complete_Prototype_Document.docx`
- `SAMVAAD-IQ_Chapter_Wise_Build_Process_Document.docx`
- `SAMVAAD-IQ_Prototype_Seed_Data.json`
- `SAMVAAD-IQ_Test_Query_Response_Set.json`

Architecture and workflow images are available in `docs/` and are also used by the frontend.

## Validation

```powershell
npm run client:lint
npm run client:build
npm run build
npm run api:smoke
```

## Live Metrics

Dashboard and Patrol views fetch current field weather context from Open-Meteo, which does not require an API key for this prototype. If the network is slow or unavailable, the app falls back to synthetic field-condition metrics so the demo remains usable.

## Catalyst Deployment Notes

The working API lives in `functions/api`. `functions/samvaad-api` is kept as a Catalyst-name compatibility wrapper matching the implementation guide.

The root `catalyst.json` deploys the generated React client from `dist` and the `functions/api` serverless target. The root `catalyst-pipelines.yaml` is prepared for Catalyst Pipelines so a linked GitHub repository can be fetched and deployed on push.

Account-owner steps for final Catalyst deployment:

```powershell
catalyst login
catalyst init --force
catalyst serve
catalyst deploy
```

For Git-based Slate deployment, set the Slate app to build from the repository root:

- Framework: React + Vite, or Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output path: `dist`

Detailed GitHub-to-Catalyst steps are in `docs/catalyst-github-deployment.md`.

Keep Catalyst local state, generated deploy output, and real environment files out of GitHub. This repository intentionally tracks `.env.example` only.

## Safety And Governance

- Synthetic records only
- Human review required for every investigative lead
- Legal XAI maps sections and evidence context but does not provide legal determination
- RBAC and audit screens are included for accountability demonstration
- Reports include source FIR references and confidence notes
