# KAVACH QuickML Pipeline

This pipeline is a secondary case-link classifier. It never replaces the deterministic KAVACH score, evidence citations, or supervisor review.

## Prepared assets

- `data/generated/quickml-case-link-training.csv`: reproducible labeled pair features.
- Target column: `linked` (`1` only when the pair shares a planted truth group).
- Identifier-only columns: `pair_id`, `left_fir_id`, `right_fir_id`, `truth_group`. Exclude these from model features to prevent label leakage.
- Model features: `crime_type_match`, `mo_similarity`, `geography_match`, `time_pattern_match`, `shared_entity_score`, `narrative_similarity`, and `deterministic_score`.

Regenerate all assets with `npm run generate:data`. The manifest records the seed, corpus size, pattern count, class count, and target.

## Build in Catalyst QuickML Development

1. Open QuickML in the same Catalyst project and import `quickml-case-link-training.csv` as a dataset.
2. Create a Data Pipeline. Set `linked` as a categorical target, exclude the four identifier columns, validate numeric types, and split the data using a fixed seed.
3. Create an ML Pipeline for binary classification. Start with AutoML or a tree-based classifier and retain class weighting if the UI reports class imbalance.
4. Evaluate precision, recall, F1, confusion matrix, and false positives on the held-out split. The release gate is at least 90% precision for the positive/high-confidence class; do not publish an unmeasured claim.
5. Publish the accepted model as an internal endpoint. Copy only its endpoint key into the function environment variable `QUICKML_ENDPOINT_KEY` and set `SAMVAAD_QUICKML_ENABLED=true`.
6. Set `QUICKML_MODEL_NAME` to the published model/version label. Never commit the endpoint key or OAuth token.
7. Call `/api/v1/capabilities` and a similarity query. The response must identify Catalyst QuickML and include `modelSignal`; if the call fails, the UI keeps the deterministic cited result and reports the limitation.

## Safety and retraining

- Training data is synthetic and labeled; no operational FIR or personal information belongs in this public project.
- Do not use analyst accept/reject feedback as a training label until it has been reviewed for bias and leakage.
- Version the dataset, pipeline, model, endpoint, and evaluation run together.
- QuickML predictions are investigative prioritization signals, never proof of a connection or individual risk.
