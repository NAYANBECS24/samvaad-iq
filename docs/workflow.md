# NETRA OS Investigation Workflow

## Primary judge journey

```text
Start investigation
      ↓
Ask by text or voice
      ↓
Classify answer: database / knowledge / general / clarify / refuse
      ↓
Inspect source citations and limitations
      ↓
Pin case and hand context to KAVACH / graph / hotspot / trend
      ↓
Validate a synthetic evidence file and its SHA-256 provenance
      ↓
Request Supervisor review
      ↓
Approve or reject
      ↓
Export complete auditable brief
```

## Conversation outcomes

| Answer class | Required presentation |
| --- | --- |
| Database grounded | `Database Grounded`, synthetic source citations, confidence explanation, data version, limitations, review actions |
| Approved knowledge | Citable prototype knowledge/SOP support plus a warning to verify the applicable KSP source |
| General AI | `General AI — not a police-database result`; no invented FIRs or current/private-data claims |
| Clarification | One focused request for the missing case, location, date, category, or analysis |
| Safety/jurisdiction refusal | Plain explanation, no fabricated evidence, and a safe next action when possible |

NVIDIA failure, timeout, rate limiting, or invalid output returns the deterministic answer. Authentication and validation failures remain visible and do not silently switch modes.

## Context handoff

The shared investigation context carries the active investigation and conversation, pinned FIRs, filters, citations, evidence references, tasks, notes, analysis runs, and report draft. A user can move between routes without losing the source set or silently changing the data version.

## Evidence workflow

1. Validate supported extension, MIME/type expectations, non-empty bytes, and the 10 MB limit.
2. Calculate SHA-256 over the selected bytes.
3. Extract supported document text or image dimensions and preserve parser limitations.
4. Match extracted terms only against the active synthetic repository.
5. Keep machine facts separate from analyst edits.
6. Persist bytes/provenance only after Stratus or File Store has passed a live canary.
7. Require a human decision before a match enters an official report.

The current browser workflow performs real local validation, hashing, and supported parsing. The API also validates base64 evidence, enforces the decoded 10 MB limit, recalculates SHA-256, and calls the configured storage adapter. It does not claim persistence or OCR until the corresponding live canary succeeds.

## Approval and reporting

All roles may draft. An Investigator or Analyst can request review; a Supervisor/Admin decides. An official brief includes the complete conversation, query and message IDs, filters, citations, confidence/limitations, provider and model where applicable, data version, analyst, approval state, audit reference, and the human-review disclaimer.

SmartBrowz is used only after a verified server render. Otherwise the report endpoint returns a labeled HTML/browser-print fallback.

## Safety checkpoints

- No real FIR, citizen data, credential, or operational detail enters the public repository.
- Similarity and graphs are leads, never proof.
- Hotspots, trends, cohorts, and patrol scenarios remain aggregate area/time/category analyses.
- Synthetic cohorts require at least 10 records; no demographic or person prediction is allowed.
- Unknown or unsupported questions produce no invented evidence.
- A model response cannot add a case identifier outside the server citation set.
