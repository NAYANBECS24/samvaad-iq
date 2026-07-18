# NETRA OS Synthetic Data Card

## Dataset identity

| Field | Value |
| --- | --- |
| Data version | `synthetic-20260717-1000` |
| Generator seed | `20260717` |
| Label | `SYNTHETIC DEMO DATA — NOT AN OPERATIONAL POLICE RECORD` |
| Runtime cases | 1,000 |
| Browser fallback | 250 read-only cases |
| Stations | 19 fictionalized Karnataka-style stations |
| Translation rows | 2,000 English/Kannada rows |

The machine-readable source is `data/generated/manifest.json`. All public case identifiers use `SYN-*`; every record is synthetic and must remain visibly labeled.

## Purpose

The dataset supports Challenge 1 demonstrations of multilingual conversational retrieval, structured filtering, explainable case similarity, graph exploration, aggregate area/time/category patterns, evidence matching, follow-up context, and refusal behavior without exposing police or citizen data.

It is designed for repeatable prototype evaluation, not for estimating real Karnataka crime prevalence or validating operational decisions.

## Composition

- Structured case fields include synthetic date/time, district, station, category, status, modus operandi, summary, advisory section text, masked entities, synthetic coordinates, and limited vehicle/device markers.
- `CaseTranslations` contains separate English and Kannada summary, modus-operandi, crime-label, and district-label fields.
- Temporal, categorical, and geographic variation supports filters, trends, hotspot summaries, and patrol what-if demonstrations.
- Six planted cross-case pattern families produce 58 restricted evaluation-truth rows.
- Categories include property, street, fraud, burglary, and mobile-device theft examples used by the judged workflows.

The generated narratives and distributions are fictional. A field that resembles a station, legal section, vehicle, phone, person, or account is synthetic or masked and must not be joined to a real identity.

## Runtime/evaluation separation

Runtime cases, translations, stations, entities, and relations are separate from `evaluation-truth.csv`.

Forbidden in runtime/API/browser projections:

- `truth_group` or planted-pattern labels;
- train/validation/test membership;
- evaluation-only pair labels;
- identifiers used only to reconstruct generator provenance;
- hidden model targets.

Evaluation jobs may read the restricted truth asset. Chat, search, citations, case screens, reports, and provider prompts may not.

## QuickML artifacts

| Artifact | Rows | Target | Status |
| --- | ---: | --- | --- |
| `quickml-case-link-training.csv` | 1,452 | `linked` | Training artifact only |
| Positive case-link rows | 252 | `linked=1` | Evaluation/training label |
| `quickml-area-pattern-training.csv` | 6,935 | `target_next_week_count` | Training artifact only |

Case-link model features exclude FIR IDs, truth-group labels, and the deterministic final KAVACH score. The aggregate area-pattern data excludes person fields. Publishing a QuickML model requires a separate held-out evaluation and successful live endpoint canary.

## Intended uses

- Hackathon demonstration and automated testing.
- Evaluation of query intent, citations, refusal behavior, KAVACH similarity, and deterministic latency.
- UI and API contract testing across English, Kannada, and Kanglish judged workflows.
- Preparing—not claiming—the two QuickML pipelines.

## Prohibited uses

- Operational policing, enforcement, or patrol deployment.
- Identifying, ranking, profiling, or predicting a real person or demographic group.
- Estimating real crime incidence, guilt, threat, or recidivism.
- Training or validating an operational model without approved KSP governance and a representative private dataset.
- Mixing real FIRs, evidence, identities, or credentials into this public version.

## Known limitations

- Synthetic distributions do not represent KSP workloads, geography, language mix, reporting practices, or outcomes.
- Kannada and Kanglish support is focused on judged intents rather than unrestricted translation.
- Coordinates approximate broad fictionalized regions and are not operational locations.
- Planted patterns simplify measurement and do not represent the uncertainty, drift, imbalance, or missingness of real investigations.
- The public set cannot establish fairness, social impact, or analyst-time savings.
- Legal text is advisory prototype metadata and requires human validation.

## Reproducibility and quality

Run:

```bash
npm run generate:data
npm run evaluate
```

The current evaluation covers 30 queries and reports 100% intent accuracy, 100% supported-query citation coverage, zero refusal fabrication failures, 95.5% high-confidence planted-link precision, 100% planted-link recall, and 118.03 ms deterministic p95. These values come from `data/generated/evaluation-metrics.json` and must be regenerated when the corpus or engine changes.

## Activation contract

1. Create a `DataVersions` row with `staging` status.
2. Load cases, translations, stations, entities, relations, and approved knowledge with the same `data_version`.
3. Validate counts, labels, bilingual fields, referential integrity, forbidden evaluation columns, and checksums.
4. Atomically retire the previous version and activate the validated version.
5. Make every query, citation, analysis, report, and audit event record that version.
6. Leave any partial import in `staging`; never expose it to users.
