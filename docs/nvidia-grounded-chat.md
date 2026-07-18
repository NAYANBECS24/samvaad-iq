# NVIDIA-Grounded SAMVAAD Chat

SAMVAAD-IQ uses the NVIDIA NIM OpenAI-compatible Chat Completions endpoint only from the Catalyst Advanced I/O function. The browser never receives the API key.

## Request flow

1. The shared intelligence core classifies the English, Kannada, or Kanglish query.
2. It retrieves matching synthetic FIRs from Catalyst Data Store, or the reproducible server seed while Data Store is unavailable.
3. KAVACH builds the deterministic answer, evidence objects, confidence, limitations, and citations.
4. For supported, cited queries only, the server sends a minimized evidence projection to NVIDIA NIM.
5. The generated response is rejected if it mentions a synthetic FIR outside the server citation set.
6. On timeout, rate limit, invalid output, or provider failure, the deterministic cited answer is returned.

Out-of-scope, ambiguous, and insufficient-evidence requests do not call the language model.

## Catalyst environment variables

Set these in the `api` function environment. Never put the real key in Git, Slate build variables, frontend code, screenshots, judging documents, or chat messages.

```text
SAMVAAD_NVIDIA_LLM_ENABLED=true
NVIDIA_API_KEY=<newly-created-secret-key>
NVIDIA_LLM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_LLM_MODEL=z-ai/glm-5.2
NVIDIA_LLM_TIMEOUT_MS=15000
NVIDIA_LLM_MAX_TOKENS=900
```

Keep `SAMVAAD_NVIDIA_LLM_ENABLED=false` until a Development request succeeds. Revoke any key that has been pasted into a chat or committed anywhere, then configure a replacement only in Catalyst.

## Verification

1. Call `GET /api/v1/capabilities` and confirm `generativeAi.available` is `true`.
2. Ask a supported query such as `Summarize SYN-2025-BLR-014 with cited evidence`.
3. Confirm `modelSignals.generativeAnswer.provider` is `NVIDIA NIM`.
4. Confirm every FIR named in the prose is also present in `citations`.
5. Ask an out-of-scope question and confirm the grounded refusal is returned without a model signal.

The language model improves conversational phrasing; it does not replace database retrieval, KAVACH scoring, citations, audit logging, or supervisor review.
