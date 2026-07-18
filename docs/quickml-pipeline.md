# NETRA OS QuickML Pipelines

The repository prepares two synthetic training artifacts. Neither artifact is a live or published model. QuickML becomes available only after a published endpoint passes a real canary and its own held-out evaluation is recorded.

## Pipeline A — Case-link classification

### Prepared artifact

- File: `data/generated/quickml-case-link-training.csv`
- Rows: 1,452
- Positive rows: 252
- Target: `linked`
- Split column: `split`
- Features: `crime_type_match`, `mo_similarity`, `geography_match`, `time_pattern_match`, `shared_entity_score`, `narrative_similarity`

FIR IDs, truth-group labels, source-seed identifiers, and the deterministic final KAVACH score are excluded. This prevents the classifier from memorizing identities, hidden evaluation groups, or the answer produced by the deterministic engine.

### QuickML Development procedure

1. Import the CSV in the intended Catalyst Development project.
2. Declare `linked` as the binary target and preserve the fixed split boundary.
3. Verify numeric feature types and class balance; do not reintroduce excluded columns.
4. Train and compare suitable classification candidates.
5. Record held-out precision, recall, F1, confusion matrix, threshold, false positives, dataset checksum, pipeline version, model version, and evaluation run.
6. Require at least 90% precision for the positive/high-confidence class before publishing.
7. Publish internally and configure only the endpoint secret/name in the Advanced I/O environment.
8. Run a live similarity canary. QuickML must appear as a secondary `modelSignal`; deterministic KAVACH evidence and citations remain authoritative.

The verified 95.5% high-confidence planted-link precision in `evaluation-metrics.json` is the deterministic KAVACH reference evaluation, not a QuickML result.

## Pipeline B — Aggregate area/time/category early warning

### Prepared artifact

- File: `data/generated/quickml-area-pattern-training.csv`
- Rows: 6,935
- Target: `target_next_week_count`
- Dimensions: synthetic district, station, crime category, and week
- Historical features: week/month, prior-week count, rolling four-week mean/std/trend, rolling night share, and seasonality encodings
- Split column: `split`

The artifact contains no person, victim, accused, phone, vehicle, account, or demographic feature.

### QuickML Development procedure

1. Import and validate weekly ordering so future weeks never leak into earlier training rows.
2. Preserve the provided temporal split.
3. Train count/regression candidates and compare them with a simple rolling baseline.
4. Record MAE/RMSE or the platform-equivalent error, calibration/interval coverage where supported, station/category slices, and failure examples.
5. Publish only when backtesting, uncertainty, and feature explanations can be displayed honestly.
6. Run a live endpoint canary before setting `quickMl.available=true`.

Outputs are aggregate planning signals, not predictions about a person, guilt, or enforcement need. Deterministic descriptive trends and synthetic anomaly flags remain available when the model is absent.

## Governance

- Version data, checksum, split, pipeline, model, endpoint, threshold, and evaluation together.
- Never train on unreviewed analyst accept/reject feedback.
- Never expose restricted evaluation truth in runtime queries or provider prompts.
- Record drift and retraining decisions; a new model version requires a new canary and held-out evaluation.
- Human review remains mandatory for every case-link or area-planning output.
