# SAMVAAD-IQ NVIDIA NIM Integration

NVIDIA NIM is an optional server-side language provider. It improves conversational phrasing; it is not the crime database, KAVACH engine, citation source, or approval authority. The browser never receives its key.

## Five answer classes

1. Database grounded
2. Approved prototype knowledge
3. General AI
4. Focused clarification
5. Safety/jurisdiction refusal

Only the first class may assert a case/database fact, and each such claim must be supported by returned citations. General answers are labeled `General AI — not a police-database result`, cannot invent FIR identifiers, and cannot imply live internet/current-official/private-data access.

## Grounded request flow

1. Detect/normalize English, Kannada, or Kanglish and resolve active conversation/investigation context.
2. Extract structured intent, entities, aliases, filters, comparisons, and requested analysis.
3. Retrieve synthetic fields/relations from Data Store or the reproducible server seed.
4. Run deterministic KAVACH/graph/hotspot/trend/scenario logic.
5. Build the answer, confidence, limitations, and claim citations.
6. Send only the minimized evidence projection to NVIDIA NIM.
7. Reject provider text that names an FIR outside the returned citation set.
8. Return deterministic cited prose on timeout, rate limit, network, provider, or output-validation failure.

The browser query window is 25 seconds. The server provider timeout defaults below that window so the deterministic fallback can still return before the client gives up.

Clarification and safety/refusal outcomes do not need the provider. Approved knowledge uses only the selected citable prototype knowledge. General AI may use NVIDIA when verified, but remains visibly separated from database results.

## Catalyst environment

Set provider configuration only in the Advanced I/O function environment. Never store a real key in Git, Slate variables, frontend code, documentation, screenshots, logs, or judge instructions.

```text
SAMVAAD_NVIDIA_LLM_ENABLED=true
NVIDIA_API_KEY=<rotated-server-secret>
NVIDIA_LLM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_LLM_MODEL=z-ai/glm-5.2
NVIDIA_LLM_TIMEOUT_MS=<approved-timeout>
NVIDIA_LLM_MAX_TOKENS=<approved-limit>
```

The credential previously exposed outside the secret store must be revoked. Keep the capability disabled until the replacement key succeeds in Development.

## Canary and release checks

1. Confirm `/api/v1/ai/status` returns JSON with `configured=true` but not `verified=true` before the first successful call.
2. Ask a grounded query and prove every case claim exists in `claimCitations`/`citations`.
3. Ask a general question and prove the label is non-database and no FIR is invented.
4. Trigger timeout/provider failure and confirm deterministic non-empty fallback.
5. Send ambiguous, unsafe, unknown-FIR, and jurisdictional queries and confirm no fabricated evidence.
6. Repeat all four response modes and verify the source set remains stable.
7. Measure deployed end-to-end p95 separately; do not reuse deterministic p95 as provider latency.

Only after the canary may `generativeAi.available`/`verified` be true.
