'use strict'

const RUNTIME_FORBIDDEN_FIELDS = new Set([
  'truth_group',
  'truthGroup',
  'evaluation_label',
  'evaluationLabel',
])

function publicCase(item) {
  if (!item) return item
  const safe = { ...item }
  for (const field of RUNTIME_FORBIDDEN_FIELDS) delete safe[field]
  return safe
}

function caseToDataStoreRow(item) {
  return {
    fir_id: item.fir_id,
    data_version: item.data_version || '',
    district: item.district,
    station_id: item.station_id,
    crime_type: item.crime_type,
    date: item.date,
    time: item.time,
    lat: item.lat,
    lon: item.lon,
    status: item.status,
    mo: item.mo,
    case_summary: item.case_summary,
    bns_sections: item.bns_sections,
    accused_ids: JSON.stringify(item.accused_ids || []),
    victim_id: item.victim_id || '',
    vehicle: item.vehicle || 'NA',
    phone_hash: item.phone_hash || 'NA',
    synthetic: true,
    data_label: 'SYNTHETIC DEMO DATA',
  }
}

function quickMlFeatures(analysis) {
  if (!analysis?.factors?.length) return null
  const factors = Object.fromEntries(analysis.factors.map((factor) => [factor.key, factor.score]))
  return {
    crime_type_match: factors.crimeType || 0,
    mo_similarity: factors.modusOperandi || 0,
    geography_match: factors.geography || 0,
    time_pattern_match: factors.timePattern || 0,
    shared_entity_score: factors.sharedEntities || 0,
    narrative_similarity: factors.summary || 0,
  }
}

module.exports = { caseToDataStoreRow, publicCase, quickMlFeatures, RUNTIME_FORBIDDEN_FIELDS }
