# NETRA OS Architecture

NETRA OS uses a routed application shell rather than simulated draggable windows. That preserves deep links, responsive behavior, role guards, keyboard access, and a stable judge journey.

```text
Browser
  NETRA OS shell
    ├─ Mission Control / Ask SAMVAAD / Case Desk
    ├─ Evidence Vault / Intelligence Studio / Field Operations
    ├─ Briefing & Governance / Administrative Console
    ├─ shared Investigation Context
    └─ read-only 250-case deterministic fallback
                         │
                         │ versioned JSON /api/v1
                         ▼
Catalyst Advanced I/O (Node 24)
    ├─ request validation and structured errors
    ├─ session identity and server-side role enforcement
    ├─ query planning, citations, KAVACH, graph, hotspot, trend and scenario logic
    ├─ deterministic answer and optional NVIDIA phrasing
    ├─ evidence/report/capability adapters
    └─ audit event generation
                         │
                         ▼
Catalyst managed services after live verification
    ├─ Auth + API Gateway
    ├─ Data Store + Search/ZCQL
    ├─ Stratus or File Store
    ├─ SmartBrowz
    ├─ QuickML + Zia
    └─ Circuits + logs/monitoring
```

## Shared domain and repository boundary

The API and the browser fallback call the same deterministic generation, retrieval, scoring, graph, hotspot, and scenario rules. Pages consume repository/runtime services instead of redefining analytical formulas. Every response carries a data version so chat, cases, maps, similarity, reports, and evaluation can be compared against the same source.

The canonical 1,000-case corpus is intended for Catalyst Data Store after atomic activation. The browser fallback is a smaller, read-only subset. Evaluation truth is separate from both runtime repositories.

## Query path

1. Normalize English, Kannada, or Kanglish and resolve active conversation/investigation context.
2. Extract intent, FIR aliases, locations, dates, categories, statuses, sections, entities, comparison targets, and requested analysis.
3. Retrieve structured fields, lexical matches, relations, and approved knowledge.
4. Run the requested deterministic KAVACH or aggregate analytical operation.
5. Construct the evidence projection and claim citations.
6. Optionally ask NVIDIA NIM to phrase only that bounded projection.
7. Reject generated FIR claims not present in the citation set.
8. Return one explicit answer class with limitations, next actions, provider, data version, and audit reference.

## Trust boundaries

- The browser is untrusted and cannot assign its own role, provider status, approval, or official-report authority.
- Environment flags authorize a canary attempt; only a successful call makes a provider available.
- General AI is visually separate from database-grounded output and may not invent FIR identifiers or imply current internet/private-data access.
- Evidence bytes, extraction facts, analyst notes, approval, and report output are separate records.
- Area/time/category analyses are permitted; person-level predictive or guilt scoring is not.

## Deployment topology

The canonical judge target is Catalyst Web Client plus same-platform Advanced I/O/API Gateway routing. Slate is a synchronized mirror and rollback. Because Slate serves a static SPA, it must use an absolute approved Catalyst API origin when same-origin `/api/v1` routing is unavailable.

No provider or deployed URL is considered live merely because its adapter, flag, or console resource exists. The deployed smoke test must prove JSON routing and each optional service needs its own canary.
