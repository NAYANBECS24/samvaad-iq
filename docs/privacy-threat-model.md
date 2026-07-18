# NETRA OS Privacy, Safety, and Threat Model

## Scope

This threat model covers the public synthetic Datathon 2026 Challenge 1 prototype. It does not authorize real KSP data or operational use.

## Protected assets

- Case, relation, knowledge, and evidence content.
- User identity, role, invitation, and session.
- Uploaded bytes, SHA-256 provenance, extracted facts, and analyst notes.
- Investigation context, conversations, query plans, citations, feedback, approvals, reports, and audit records.
- Catalyst project configuration, NVIDIA/QuickML/provider keys, judge instructions, and deployment tokens.
- Restricted evaluation truth and train/validation/test labels.

## Trust boundaries

1. **Browser:** untrusted. It may request an action but cannot assign its role, declare a provider available, approve its own official report, or change an active data version.
2. **Advanced I/O/API Gateway:** validates input, resolves identity, applies role checks/rate limits, minimizes provider payloads, and creates correlation/audit records.
3. **Catalyst managed services:** trusted only after project binding, least-privilege configuration, and a successful Development canary.
4. **NVIDIA NIM/optional model provider:** receives only the minimized evidence projection or an explicitly general prompt. It is not a crime-database source.
5. **Evaluation boundary:** restricted truth may be used by evaluation jobs only; it cannot enter runtime retrieval, prompts, responses, citations, or client assets.

## Threats and controls

| Threat | Control | Residual/release requirement |
| --- | --- | --- |
| Real PII or FIR disclosure | Synthetic-only public dataset; `SYN-*` labels; masked entities; no real uploads in the repository | A private operational environment needs lawful basis, classification, redaction, retention, and KSP approval |
| Client role manipulation | Server-owned identity and route/API role checks; public registration disabled | Test direct endpoint denial for every role after Catalyst Auth is provisioned |
| Demo-session misuse | Demo auth disabled by default; environment-only signing secret; fixed synthetic profiles; session storage | Keep it off for private operational deployments and rotate leaked secrets |
| Cross-origin/API abuse | Exact CORS allowlist, request-size limits, security headers, structured errors, request IDs, application rate window | Configure API Gateway throttling and approved origins in Development/Production |
| Secret leakage | Keys only in Catalyst environment/secret storage; no key in client, docs, screenshots, or Git | Revoke the NVIDIA key previously exposed outside the secret store before any live call |
| Prompt injection from evidence | Parse as data; minimized evidence projection; instructions separate from evidence; provider output is not trusted | Add adversarial upload/query tests and record provider/model/version |
| Model hallucinated FIR | Deterministic retrieval first; claim-to-citation validation; reject generated FIR IDs outside the citation set; deterministic fallback | Verify 100% claim/source coverage on the deployed corpus |
| General answer mistaken for database evidence | Visible `General AI — not a police-database result`; no citations/data claims; current/private-data disclaimer | Test that general answers invent no FIR identifier or live-current fact |
| Malicious or oversized file | Extension/type/size/decode/parser checks; 10 MB cap; no executable formats | Add malware scanning/content disarm before operational evidence intake |
| Evidence substitution | SHA-256 over actual bytes; separate provenance, extraction, edits, and approval | Complete server-side hash verification and immutable storage lifecycle |
| Fake OCR/model/provider result | Capability-specific canary and explicit unavailable state | Never infer availability from flags or console resource creation |
| Over-reliance on KAVACH/QuickML | Factor evidence, weights, thresholds, contradictions, limitations, secondary-model labeling, human decision | Revalidate thresholds/fairness on an approved representative dataset |
| Predictive/person profiling | Only aggregate area/time/category trends, minimum cohort size 10, incident-MO signatures; no person risk or guilt label | Review every new feature for demographic proxy leakage |
| Legal overreach | Advisory support only; source citation and human verification | Applicable law/SOP must be reviewed by authorized KSP personnel |
| Audit alteration or fork | Previous-hash linkage, append-only behavior, and unique-sequence optimistic retry | Enforce the unique sequence constraint and complete concurrent multi-instance Data Store verification before production claims |
| Partial/corrupt seed activation | Staging, count/schema/checksum validation, atomic activation, active-version filtering | Prove rollback and concurrent-read behavior in Catalyst Data Store |
| Stale frontend/API mismatch | Runtime data version and API status; deployed JSON smoke test; hashed client verification | Promote only after fresh-profile judge journey passes |
| Report bypass | Supervisor/Admin API gate; report includes approval and safety disclaimer | Verify official PDF cannot be produced by Investigator/Analyst direct calls |

## Data minimization and retention

The public build stores no real evidence or identity. Browser/session data should be cleared when the demonstration ends. Managed Catalyst retention, backup, deletion, legal hold, and access-review policies must be defined before persistence is enabled for anything beyond synthetic judge data.

Evidence bytes, extracted machine facts, analyst corrections, and reports should have independent retention states. Logs must contain correlation IDs and outcomes, not secrets or unnecessary evidence text.

## Human authority

- KAVACH, graphs, alerts, cohorts, scenarios, OCR, and QuickML outputs are review support.
- Similarity confidence is support for a lead, not probability of guilt.
- All roles may draft; only Supervisor/Admin may approve an official report.
- Patrol guidance remains aggregate and advisory.
- Unknown, contradictory, insufficient, jurisdictional, or unsafe questions must not fabricate an answer.

## Before any real-data pilot

Require a separate private project, documented lawful basis, data-protection impact assessment, data classification, least-privilege roles, private networking where applicable, key rotation, approved retention/deletion, audit export, incident response, backup/restore tests, bias/fairness evaluation, analyst training, and formal KSP security/legal approval.
