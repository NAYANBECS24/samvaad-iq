# Catalyst Data Store Schema

Provision these tables in the existing Catalyst project before setting `SAMVAAD_DATASTORE_ENABLED=true`.

| Table | Required fields | Purpose |
| --- | --- | --- |
| `Cases` | `fir_id`, `source_seed_id`, `district`, `station_id`, `crime_type`, `date`, `time`, `lat`, `lon`, `status`, `mo`, `case_summary`, `bns_sections`, `accused_ids`, `victim_id`, `vehicle`, `phone_hash`, `truth_group`, `synthetic`, `data_label` | Synthetic FIR corpus and planted-truth evaluation labels |
| `Stations` | `station_id`, `station_name`, `district`, `synthetic` | Area and jurisdiction lookup |
| `Entities` | `entity_id`, `entity_type`, `masked_value`, `synthetic` | Masked person/device/vehicle/account entity |
| `CaseEntities` | `fir_id`, `entity_id`, `relationship`, `source_field` | Normalized case-entity link |
| `EvidenceObjects` | `evidence_id`, `file_name`, `mime_type`, `size`, `sha256`, `storage_key`, `status` | Evidence provenance |
| `EvidenceExtractions` | `evidence_id`, `extractor`, `facts_json`, `limitations_json`, `review_status` | Machine extraction separated from analyst review |
| `Relations` | `source_id`, `target_id`, `relation_type`, `evidence_ref`, `confidence` | Graph edges with evidence |
| `Conversations` | `conversation_id`, `user_id`, `language`, `created_at` | Query-session boundary |
| `QueryRuns` | `request_id`, `conversation_id`, `actor`, `intent`, `filters_json`, `mode`, `created_at` | Reproducible query execution |
| `Reports` | `report_id`, `request_id`, `approved_by`, `renderer`, `storage_key`, `created_at` | Approved report metadata |
| `AuditEvents` | `audit_id`, `actor`, `action`, `resource`, `request_id`, `details_json`, `previous_hash`, `hash`, `created_at` | Tamper-evident event chain |
| `Feedback` | `feedback_id`, `request_id`, `actor`, `decision`, `note`, `created_at` | Analyst accept/reject review |
| `EvaluationRuns` | `evaluation_id`, `data_version`, `metrics_json`, `created_at` | Measured quality evidence |

Use string/JSON columns where Catalyst column types do not support arrays. The API converts `accused_ids` JSON into an array after loading. All public rows must set `synthetic=true`.
