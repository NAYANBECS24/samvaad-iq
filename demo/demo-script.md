# NETRA OS — Presenter Script

Challenge: **Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**. Data: synthetic only.

## 0:00–0:25 — System and trust

1. Enter with the Investigator Judge Demo profile.
2. Show runtime, data version, active investigation, language, review inbox, and `Ctrl+K`.
3. Say: “NETRA OS organizes the investigation, SAMVAAD-IQ handles text and voice, and KAVACH explains the intelligence.”

## 0:25–1:05 — Multilingual grounded query

1. Ask: `Mysuru alli motorcycle theft hotspot show maadi`.
2. Show the explicit answer class, synthetic citations, confidence, limitations, data version, and next action.
3. Open one source citation.
4. Ask: `Compare the first two and explain the strongest shared evidence.`
5. Pin the leading case and show that the investigation context follows the handoff.

## 1:05–1:40 — Explainable KAVACH

1. Compare `SYN-2026-BLR-0103` with `SYN-2026-BLR-0205`.
2. Show source fields, factor weights/contributions, threshold, contradictions, and exclusion reasoning.
3. Open the source-backed graph or aggregate area/time pattern.
4. Say: “This is an investigative lead, not proof or a person-risk score.”

## 1:40–2:15 — Real-byte evidence provenance

1. Select a synthetic PDF, DOCX, XLSX, CSV, JSON, PNG, or JPEG under 10 MB.
2. Show file validation, actual SHA-256, supported extraction or image dimensions, matches, and limitations.
3. State unavailable services honestly. Local parsing is not server storage; image metadata is not OCR.

## 2:15–2:45 — Review and report

1. Request Supervisor review.
2. Show that the Investigator can draft but cannot approve the official report.
3. Switch to Supervisor, decide the task, and open the complete-conversation brief.
4. Show query IDs, filters, citations, provider/model where present, data version, analyst, approval, audit reference, and disclaimer.

## 2:45–3:00 — Close

“NETRA OS makes conversational crime-data access defensible: every supported claim is traceable, every connection is explainable, and every actionable output remains under human authority.”

## Presenter rules

- Never call a provider live without a successful canary.
- Never claim a configured flag, training CSV, local parser, or HTML fallback is a live Catalyst service.
- Never display a secret, judge credential, real FIR, or real personal data.
- If the API fails, label the session `Offline Demo` and show only read-only deterministic capabilities.
