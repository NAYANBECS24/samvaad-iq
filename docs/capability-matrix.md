# Catalyst Capability Matrix

The application reports provider status from `/api/v1/capabilities`. An environment flag is permission to attempt a provider call, not proof that a call succeeded.

| Capability | Core behavior | Offline behavior | Live verification required |
| --- | --- | --- | --- |
| Advanced I/O | Versioned JSON API | Shared core runs in browser | `/api/v1/health` returns JSON with `catalyst-live` |
| Auth | Server derives role from Catalyst user | Explicit demo identity | Protected audit/report requests reject missing or wrong roles |
| Data Store | Cases and query/audit metadata | Deterministic in-memory dataset | `Cases` rows load and data version changes |
| Stratus/File Store | Evidence object persistence | No persistence | Approved bucket/folder can accept and retrieve a synthetic file |
| SmartBrowz | Server PDF rendering | Browser-print fallback | Returned PDF opens and includes audit reference |
| Zia/QuickML | Optional OCR or model enrichment | Deterministic retrieval | Real provider response and entitlement verified |
| Circuits | Optional asynchronous evidence workflow | Synchronous local analysis | Workflow run is visible in Catalyst console |

Unavailable capabilities must remain visibly unavailable. No fake object key, render job, model response, or workflow ID may be generated.
