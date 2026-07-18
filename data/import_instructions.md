# Catalyst Data Store Activation Guide

The public judge database contains **1,000 deterministic synthetic FIR-like records**. Git deployment updates code and versioned seed artifacts; it does not silently mutate the active database.

## 1. Generate and verify release assets

Run `npm run generate:data`. The generated files under `data/generated/` are:

- `cases-1000.csv` — staged case corpus;
- `stations.csv` — staged station registry;
- `case-translations.csv` — English/Kannada case fields;
- `quickml-case-link-training.csv` — leakage-controlled KAVACH classifier input;
- `quickml-area-pattern-training.csv` — aggregate weekly area/category input;
- `evaluation-truth.csv` — restricted evaluation-only truth;
- `manifest.json` and `evaluation-metrics.json` — generated inventory and measured reference run.

The checked-in handwritten seed is an input to the deterministic generator, not the complete deployed database.

## 2. Provision the normalized schema

Create the tables and indexed fields exactly as specified in `data/catalyst-schema.md`. Do not use the obsolete `PoliceStations`, `Accused`, or `AuditLogs` prototype tables.

Minimum required live tables are:

- `Cases`, `CaseTranslations`, `Stations`;
- `Entities`, `CaseEntities`, `Relations`;
- `Investigations`, `Conversations`, `ConversationMessages`;
- `QueryRuns`, `QueryCitations`, `AnalysisRuns`;
- `EvidenceObjects`, `EvidenceFacts`, `EvidenceExtractions`;
- `Reports`, `Approvals`, `Notifications`;
- `AuditEvents`, `Feedback`, `EvaluationRuns`, `DataVersions`.

Provision `KnowledgeDocuments` and `KnowledgeChunks` when the approved SOP/knowledge workspace is enabled. Keep `EvaluationTruth` restricted to evaluation jobs and separate from runtime query permissions.

## 3. Stage, validate, and activate

1. Import the generated rows with a new inactive `data_version`.
2. Verify row counts, required fields, unique `fir_id` values, synthetic labels, case translations, and relation references.
3. Run the planted-truth evaluation against the restricted evaluation file. Evaluation labels such as `truth_group` must not be copied into public runtime rows.
4. Activate the version atomically through an authenticated migration/activation operation.
5. Confirm `/api/v1/health`, `/capabilities`, and `/data/versions` report the activated version.

The activation operation must refuse partial, duplicate, or already-active imports. The current one-time Admin seed helper is not evidence of atomic staged activation until this behavior passes deployed Data Store tests. Keep the read-only browser subset available as an explicitly labeled fallback.

## 4. QuickML

Build the KAVACH link-classifier from raw evidence features only. Exclude pair identifiers, FIR identifiers, truth labels, and the derived deterministic total score from model features. Publish an endpoint only after held-out high-confidence precision reaches at least 90%.

Build aggregate early-warning models only over area/time/category counts. Do not produce person-level risk or guilt scores.

## 5. Capability activation

Keep every provider flag false until a real Development call succeeds. Store endpoint keys, OAuth tokens, bucket identifiers, allowed origins, and API credentials only in Catalyst environment settings.

No real police FIR, personal data, or exposed model key belongs in these assets.
