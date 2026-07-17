# SAMVAAD-IQ Synthetic Data Card

## Purpose

The dataset demonstrates conversational retrieval, explainable similarity, network analysis, area-level hotspots, evidence matching, and refusal behavior without exposing police or citizen data.

## Composition

- 1,000 deterministic synthetic FIR-like records in the API dataset.
- 250 records in the browser fallback.
- Fictionalized station identifiers and synthetic entity identifiers.
- English narrative fields with Kannada/Kanglish query aliases.
- Six planted pattern families for repeatable evaluation.
- Crime categories include motorcycle theft, chain snatching, UPI fraud, house burglary, and mobile-phone theft.

Every generated record carries `synthetic: true` and the label `SYNTHETIC DEMO DATA`.

## Intended uses

- Hackathon demonstration and testing.
- API, UI, retrieval, similarity, and safety evaluation.
- Training users on the evidence-grounded workflow.

## Prohibited uses

- Operational policing or deployment decisions.
- Identifying, ranking, or profiling real individuals.
- Estimating real crime prevalence.
- Training a production model without an approved data-governance process.

## Known limitations

- Narratives and distributions are generated and do not represent KSP statistics.
- Kannada support focuses on common demonstration intents, not unrestricted translation.
- Geographic points are synthetic approximations around broad Karnataka regions.
- Planted patterns simplify ground-truth evaluation and are not a substitute for real validation.

## Reproducibility

The shared core uses seed `20260717`. Run `npm run evaluate` to reproduce the published evaluation results.
