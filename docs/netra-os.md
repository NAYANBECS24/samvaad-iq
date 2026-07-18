# NETRA OS Product and Interaction Architecture

NETRA OS is the persistent, role-aware application shell for the NETRA crime-intelligence platform. SAMVAAD-IQ is its universal conversational copilot and KAVACH is its explainable intelligence kernel.

## Applications

| NETRA OS application | Preserved routes | Purpose |
| --- | --- | --- |
| Mission Control | `/dashboard` | Measured data, investigations, alerts, and judge mission |
| Ask SAMVAAD | `/chat` | English, Kannada, and Kanglish text/voice investigation |
| Case Desk | `/cases`, `/cases/:id` | Search, dossier, evidence, actions, and handoffs |
| Evidence Vault | `/evidence-lab`, `/evidence` | File provenance, extraction, matching, and review |
| Intelligence Studio | `/analytics`, `/similar`, `/network`, `/map`, `/cold-cases`, `/diffusion` | KAVACH, graph, area/time patterns, and hypothesis analysis |
| Field Operations | `/patrol`, `/tablet` | Transparent area-coverage scenarios and field view |
| Briefing & Governance | `/report`, `/governance` | Approvals, reports, capabilities, safeguards, and audit |
| Administrative Console | `/pipeline`, `/admin-data` | Data activation, pipeline evidence, and system readiness |

`/login` remains the branded gateway, and `/cases/:id` remains the deep-linked dossier route.

## Role access

| Role | Applications |
| --- | --- |
| Admin | Every application, approval/export, and Administrative Console |
| Investigator | Operational applications except Administrative Console |
| Analyst | Mission Control, Ask SAMVAAD, Case Desk, Intelligence Studio, reports, and governance; no evidence intake, patrol/tablet, or administration |
| Supervisor | Operational applications except Administrative Console; approval and official export |

All roles may draft a report. Only Supervisor/Admin may approve and produce an official server export. Client navigation improves usability; server authorization remains the security boundary.

## Shared investigation context

Every application receives the same active `investigationId`, `conversationId`, selected FIRs, filters, evidence object references, analysis runs, tasks, and report draft. A handoff uses the same repository, score rules, and data version rather than recomputing from a page-specific engine.

## Runtime truth

The shell reports API reachability, authentication, data source, persistence, generative AI, QuickML, OCR, storage, report rendering, and orchestration independently. User-facing summaries are `Catalyst Live`, `Server AI · Synthetic Seed`, `Offline Demo`, or `Capability Unavailable`.

## Responsive model

- Desktop: collapsible dock, system bar, central routed workspace, and optional evidence/task inspector.
- Tablet: icon rail and overlay drawers.
- Mobile: compact system bar, bottom navigation, full-screen sheets, and accessible list alternatives for complex visualizations.

NETRA OS deliberately uses routed applications and tabs instead of free-form draggable windows so keyboard access, responsive behavior, deep links, and judge reliability remain strong.
