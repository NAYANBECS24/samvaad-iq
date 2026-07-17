# Privacy and Threat Model

## Protected assets

- Case and evidence content.
- User identity and role.
- Uploaded file provenance.
- Query, feedback, report, and audit records.
- Catalyst project credentials and service tokens.

## Trust boundaries

The browser is untrusted. It may request an operation but cannot assign its role, approve its own privileged report, or mark a provider as available. The Advanced I/O function validates input, resolves identity, applies authorization, and records sensitive actions.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| Public PII disclosure | Synthetic-only public dataset; no real FIR import in the repository |
| Client role manipulation | Server derives roles from Catalyst Auth or signed local-only sessions |
| Cross-origin API abuse | Exact CORS allowlist, credentials policy, API Gateway throttling, rate limits |
| Malicious file | Extension, MIME, size, decode, and parser checks; 10 MB cap; no executable formats |
| Evidence substitution | SHA-256 provenance and audit reference |
| Prompt or query fabrication | Retrieval citations, insufficient-evidence response, out-of-scope refusal |
| Over-reliance on score | Factor explanations, thresholds, limitations, feedback and supervisor review |
| Audit modification | Application append-only behavior and previous-hash chaining |
| Secret leakage | Catalyst/Slate environment variables; `.env` files ignored |
| Stale or fake provider claim | Runtime capability endpoint and visible mode badge |

## Operational requirements before real data

Real police data requires a separate private environment, documented lawful basis, data classification, retention schedule, access review, incident response, approved redaction, backup/restore tests, and KSP security review. The public hackathon deployment is not approval for operational data.
