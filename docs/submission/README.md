# NETRA OS Submission Bundle

This folder contains the current judge-facing material for **Datathon 2026 Challenge 1 — Intelligent Conversational AI for the KSP Crime Database**:

- `SAMVAAD-IQ_Master_Project_Document.md`
- `SAMVAAD-IQ_Technical_Appendix.md`
- `SAMVAAD-IQ_NETRA_Winner_Deck.pptx`
- `SAMVAAD-IQ_Prototype_Seed_Data.json` — supplemental historical sample only
- `SAMVAAD-IQ_Test_Query_Response_Set.json` — supplemental example responses only

The runnable source is in the repository root, with frontend code in `client/` and the Node 24 API in `functions/api/`.

The authoritative current facts are:

- `../verified-state.md` for the human-readable release snapshot;
- `../../data/generated/manifest.json` for generated data counts/status;
- `../../data/generated/evaluation-metrics.json` for measured quality/latency;
- `../capability-matrix.md` for implemented versus live-verified services;
- `../judge-demo.md` for the three-minute mission.
- `../judge-access.md` for profile, secure-access, and credential-handling instructions.

The supplemental JSON files in this folder are not the source for current corpus size, challenge numbering, metrics, provider availability, or API behavior.

Earlier prototype DOCX/PDF files are retained under `archive/` for traceability. They are obsolete for current challenge numbering, architecture, provider status, data, performance, and deployment claims.

No real FIR, environment file, credential, or secret belongs in this bundle. Judge credentials and provider keys are distributed out of band.
