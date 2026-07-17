# Catalyst Data Store Import Notes

## Generated Catalyst and QuickML assets

Run `npm run generate:data`. The deterministic release assets are written to `data/generated/`:

- `cases-1000.csv` for the Catalyst `Cases` table;
- `stations.csv` for the Catalyst `Stations` table;
- `quickml-case-link-training.csv` for the KAVACH QuickML classifier;
- `manifest.json` for seed, scale, planted-pattern, and class-count verification.

An authenticated Catalyst Administrator can also use Admin Data → **Seed 1,000 Cases** after the schema exists. The endpoint refuses to insert when `Cases` is non-empty.

Use `data/seed-data.json` as the source of truth for the prototype.

Create these Catalyst Data Store tables first:

- `Users`: `email`, `role`, `access_note` (credentials are provisioned only in Catalyst Auth)
- `PoliceStations`: `station_id`, `station_name`, `district`, `lat`, `lon`
- `Cases`: `fir_id`, `district`, `station_id`, `crime_type`, `date`, `time`, `lat`, `lon`, `status`, `mo`, `case_summary`, `bns_sections`, `accused_ids`, `victim_id`, `vehicle`, `phone_hash`
- `Accused`: `accused_id`, `display_name`, `age_group`, `known_mo`, `prior_case_count`, `risk_note`
- `Relations`: `source`, `target`, `type`, `weight`
- `AuditLogs`: `user_email`, `role`, `query`, `intent`, `timestamp`, `result_count`, `confidence`
- `Reports`: `report_id`, `title`, `user_email`, `generated_at`, `source_firs`, `file_id`, `status`
- `EvidenceObjects`: `object_key`, `file_name`, `evidence_type`, `checksum`, `extraction_mode`, `linked_firs`, `review_status`
- `EvidenceExtractions`: `object_key`, `crime_type`, `district`, `location`, `time_window`, `vehicle`, `phone_hash`, `suspect_mentions`, `legal_hints`, `confidence`

For the first demo build, keep the local JSON fallback active so the prototype does not depend on manual import timing.
