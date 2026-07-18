# Catalyst Data Store Schema

Provision these normalized tables in the existing Catalyst project before enabling Data Store. Array-shaped values are stored as JSON strings where Catalyst column types require it. Every public case and evidence record must set `synthetic=true`.

## Active operational data

| Table | Required fields | Purpose / indexes |
| --- | --- | --- |
| `DataVersions` | `data_version`, `label`, `seed`, `case_count`, `status`, `checksum`, `created_at`, `activated_at` | Staging and atomic activation. Unique `data_version`; index `status`. |
| `Cases` | `fir_id`, `data_version`, `district`, `station_id`, `crime_type`, `date`, `time`, `lat`, `lon`, `status`, `mo`, `case_summary`, `bns_sections`, `victim_id`, `vehicle`, `phone_hash`, `synthetic`, `data_label` | Runtime FIR corpus. Unique `(data_version, fir_id)`; indexes on district, station, crime, status, and date. Evaluation labels and legacy source identifiers are forbidden here. |
| `CaseTranslations` | `fir_id`, `data_version`, `language`, `case_summary`, `mo`, `crime_type_label`, `district_label` | English/Kannada display fields. Unique `(data_version, fir_id, language)`. |
| `Stations` | `station_id`, `data_version`, `station_name`, `station_name_kn`, `district`, `district_kn`, `lat`, `lon`, `synthetic` | Area and jurisdiction lookup. |
| `Entities` | `entity_id`, `data_version`, `entity_type`, `masked_value`, `synthetic` | Masked person/device/vehicle/account entity. No public raw PII. |
| `CaseEntities` | `fir_id`, `data_version`, `entity_id`, `relationship`, `source_field` | Normalized case-to-entity link. Index both IDs. |
| `Relations` | `relation_id`, `data_version`, `source_id`, `target_id`, `relation_type`, `evidence_ref`, `confidence` | Source-backed graph edge. Confidence describes link support, never guilt. |

## Evidence and knowledge

| Table | Required fields | Purpose / indexes |
| --- | --- | --- |
| `EvidenceObjects` | `evidence_id`, `data_version`, `file_name`, `mime_type`, `size`, `sha256`, `storage_key`, `status`, `synthetic`, `created_by`, `created_at` | Immutable provenance metadata; unique SHA-256 per version. |
| `EvidenceFacts` | `fact_id`, `evidence_id`, `field`, `value_masked`, `source_offset`, `extractor`, `confidence`, `created_at` | Machine-extracted facts kept separate from analyst edits. |
| `EvidenceExtractions` | `extraction_id`, `evidence_id`, `extractor`, `facts_json`, `limitations_json`, `review_status`, `reviewed_by`, `created_at` | Parser/model run and human review state. |
| `KnowledgeDocuments` | `document_id`, `title`, `language`, `version`, `status`, `source_ref`, `synthetic`, `created_at` | Approved SOP/legal-support corpus metadata. |
| `KnowledgeChunks` | `chunk_id`, `document_id`, `sequence`, `text`, `citation_label` | Citable approved knowledge excerpts. |

## Investigations, queries, and decisions

| Table | Required fields | Purpose / indexes |
| --- | --- | --- |
| `Investigations` | `investigation_id`, `owner_id`, `title`, `status`, `data_version`, `context_json`, `created_at`, `updated_at` | Shared workspace context and pinned cases. |
| `Conversations` | `conversation_id`, `investigation_id`, `user_id`, `language`, `created_at`, `updated_at` | Query-session boundary. |
| `ConversationMessages` | `message_id`, `conversation_id`, `role`, `content`, `request_id`, `created_at` | Ordered complete transcript used by reports. |
| `QueryRuns` | `request_id`, `conversation_id`, `investigation_id`, `actor`, `intent`, `query_plan_json`, `filters_json`, `mode`, `provider`, `latency_ms`, `data_version`, `created_at` | Reproducible query execution. |
| `QueryCitations` | `citation_id`, `request_id`, `fir_id`, `field`, `excerpt`, `data_version` | Claim-to-source traceability. Unique `(request_id, citation_id)`. |
| `AnalysisRuns` | `analysis_id`, `investigation_id`, `analysis_type`, `input_refs_json`, `result_json`, `provider`, `data_version`, `created_at` | Similarity, graph, hotspot, trend, and scenario runs. |
| `Reports` | `report_id`, `investigation_id`, `request_id`, `conversation_id`, `data_version`, `approval_state`, `approved_by`, `renderer`, `storage_key`, `created_at` | Draft and official report metadata. |
| `Approvals` | `approval_id`, `resource_type`, `resource_id`, `requested_by`, `assigned_to`, `state`, `note`, `decided_at`, `created_at` | Supervisor/Admin decision gate. |
| `Notifications` | `notification_id`, `user_id`, `type`, `resource_ref`, `read_at`, `created_at` | Review inbox and escalation notices. |
| `Feedback` | `feedback_id`, `request_id`, `actor`, `decision`, `note`, `created_at` | Analyst accept/reject review. |
| `AuditEvents` | `audit_id`, `sequence`, `actor`, `action`, `resource`, `request_id`, `details_json`, `previous_hash`, `hash`, `created_at` | Append-only, concurrency-safe tamper-evident chain. Unique sequence/hash. |

## Evaluation-only data

| Table | Required fields | Boundary |
| --- | --- | --- |
| `EvaluationRuns` | `evaluation_id`, `data_version`, `metrics_json`, `created_at` | Measured aggregate quality evidence exposed only through approved metric projections. |
| `EvaluationTruth` | `truth_id`, `data_version`, `fir_id`, `truth_group`, `split`, `seed` | Restricted to evaluation jobs. Never join into runtime case/search/query responses and never ship in the browser bundle. |

## Seed activation contract

1. Insert a new `DataVersions` row with `status=staging`.
2. Load all versioned rows and validate counts, required bilingual fields, synthetic labels, referential integrity, and checksums.
3. In one authenticated activation operation, mark the former version `retired` and the validated version `active`.
4. Query APIs read only the active version and include its `data_version` in every response, citation, analysis, audit event, and report.
5. A failed or partial load remains `staging` and is never visible to users.
