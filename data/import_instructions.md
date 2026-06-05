# Catalyst Data Store Import Notes

Use `data/seed-data.json` as the source of truth for the prototype.

Create these Catalyst Data Store tables first:

- `Users`: `email`, `password_demo`, `role`, `access_note`
- `PoliceStations`: `station_id`, `station_name`, `district`, `lat`, `lon`
- `Cases`: `fir_id`, `district`, `station_id`, `crime_type`, `date`, `time`, `lat`, `lon`, `status`, `mo`, `case_summary`, `bns_sections`, `accused_ids`, `victim_id`, `vehicle`, `phone_hash`
- `Accused`: `accused_id`, `display_name`, `age_group`, `known_mo`, `prior_case_count`, `risk_note`
- `Relations`: `source`, `target`, `type`, `weight`
- `AuditLogs`: `user_email`, `role`, `query`, `intent`, `timestamp`, `result_count`, `confidence`
- `Reports`: `report_id`, `title`, `user_email`, `generated_at`, `source_firs`, `file_id`, `status`

For the first demo build, keep the local JSON fallback active so the prototype does not depend on manual import timing.
