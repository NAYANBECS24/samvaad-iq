# SAMVAAD-IQ Technical Appendix

## Public API

All new endpoints use `/api/v1`. Query responses use a stable evidence envelope and errors use `requestId`, `code`, `message`, `retryable`, and `mode`.

## KAVACH factor model

| Factor | Weight |
| --- | ---: |
| Crime category | 25% |
| Modus operandi | 20% |
| Shared hashed entities | 20% |
| Geography | 15% |
| Time pattern | 10% |
| Narrative similarity | 10% |

Each factor returns its raw score, weighted contribution, evidence description, inclusion threshold, and limitation. Weights are transparent prototype defaults and must be revalidated with an approved operational dataset.

## File support

Evidence Lab accepts PDF, DOCX, XLSX, CSV, JSON, PNG, and JPEG up to 10 MB. It calculates SHA-256 from file bytes. PDF/DOCX/XLSX/CSV/JSON text is parsed; image dimensions are verified without claiming OCR when the OCR provider is unavailable.

## Security controls

- Catalyst or signed local-only session resolution.
- Server-derived role and privileged-route authorization.
- Zod request validation and one-megabyte JSON API body limit.
- Exact CORS origin allowlist.
- Per-source in-memory rate window, with API Gateway throttling required in production.
- No-store API caching, CSP, `nosniff`, frame denial, and request IDs.
- Hash-chained application audit events.

## Testing

Node tests cover dataset reproducibility, KAVACH factors, Kannada/Kanglish parsing, refusal behavior, insufficient evidence, file fact extraction, API envelopes, validation, authorization, and CORS. The evaluation suite covers 30 guided queries and enforces at least 90% intent accuracy, complete citation coverage for supported queries, zero refusal fabrication, and p95 below two seconds.

## Known prototype limits

- Data Store tables and invited Auth users require one-time Catalyst console provisioning.
- Provider flags remain false until live service calls are verified.
- The offline fallback is read-only and has no persisted audit.
- Kannada parsing covers the judged workflows rather than unrestricted language understanding.
- Image OCR depends on an enabled Zia capability.
