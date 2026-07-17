const DISCLAIMER = 'Investigative lead only. Human verification and supervisory approval are required.'

const DISTRICTS = [
  { name: 'Bengaluru South', code: 'BLR', lat: 12.925, lon: 77.594 },
  { name: 'Mysuru', code: 'MYS', lat: 12.316, lon: 76.651 },
  { name: 'Hubballi-Dharwad', code: 'HBL', lat: 15.364, lon: 75.124 },
  { name: 'Mangaluru', code: 'MNG', lat: 12.914, lon: 74.856 },
  { name: 'Belagavi', code: 'BLG', lat: 15.849, lon: 74.497 },
  { name: 'Kalaburagi', code: 'KLB', lat: 17.329, lon: 76.834 },
]

const CRIME_PROFILES = [
  {
    type: 'Motorcycle Theft',
    mo: 'Two-person team targets parked motorcycles, defeats the handle lock and leaves through a connecting road.',
    summary: 'Synthetic report of a motorcycle removed from a public parking area during a low-visibility period.',
    sections: 'BNS 303(2), 317',
  },
  {
    type: 'Chain Snatching',
    mo: 'Rider and pillion approach a pedestrian from the left, snatch jewellery and leave on a scooter.',
    summary: 'Synthetic report of evening chain snatching near a commercial or transit corridor.',
    sections: 'BNS 304(2), 3(5)',
  },
  {
    type: 'UPI Fraud',
    mo: 'Caller impersonates support staff and induces the victim to approve a collect request through a mule account.',
    summary: 'Synthetic report of a social-engineering payment fraud using a disposable phone number.',
    sections: 'BNS 318(4); IT Act 66D',
  },
  {
    type: 'House Burglary',
    mo: 'Rear entry is forced while occupants are away and compact valuables are removed without disturbing larger items.',
    summary: 'Synthetic report of residential burglary during a predictable unoccupied window.',
    sections: 'BNS 305, 331(4)',
  },
  {
    type: 'Mobile Phone Theft',
    mo: 'Offender exploits a crowded queue or bus boarding point and transfers the handset to an associate.',
    summary: 'Synthetic report of a handset theft in a crowded public place.',
    sections: 'BNS 303(2), 3(5)',
  },
]

const STOP_WORDS = new Set([
  'the', 'and', 'near', 'case', 'cases', 'with', 'from', 'for', 'into', 'after', 'show', 'please', 'find',
  'last', 'months', 'report', 'synthetic', 'alli', 'maadi', 'saar', 'what', 'where', 'which', 'about',
])

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function stableId(prefix = 'REQ') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeQuery(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ಮೋಟಾರ್\s*ಸೈಕಲ್|ಬೈಕ್/g, ' motorcycle ')
    .replace(/ಕಳ್ಳತನ|ಕಳವು/g, ' theft ')
    .replace(/ಸರಗಳ್ಳತನ|ಚೈನ್\s*ಸ್ನ್ಯಾಚಿಂಗ್/g, ' chain snatching ')
    .replace(/ವಂಚನೆ|ಮೋಸ/g, ' fraud ')
    .replace(/ಪ್ರಕರಣ|ಎಫ್‌ಐಆರ್/g, ' fir ')
    .replace(/ಹೋಲುವ|ಹೋಲಿಕೆ/g, ' similar ')
    .replace(/ತೋರಿಸಿ|ತೋರಿಸು/g, ' show ')
    .replace(/ಹಾಟ್[‌್]?ಸ್ಪಾಟ್/g, ' hotspot ')
    .replace(/ಮೈಸೂರು/g, ' mysuru ')
    .replace(/ಬೆಂಗಳೂರು/g, ' bengaluru south ')
    .replace(/ಮಂಗಳೂರು/g, ' mangaluru ')
    .replace(/alli/g, ' in ')
    .replace(/maadi/g, ' please ')
    .replace(/thorsi|torisi|torsi/g, ' show ')
    .replace(/kalavu|kalla/g, ' theft ')
    .replace(/jodi/g, ' link ')
    .replace(/mysore/g, 'mysuru')
    .replace(/mangalore/g, 'mangaluru')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value = '') {
  return new Set(
    normalizeQuery(value)
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  )
}

function jaccard(leftValue, rightValue) {
  const left = tokenize(leftValue)
  const right = tokenize(rightValue)
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  return [...left].filter((token) => right.has(token)).length / union.size
}

function timeBand(time = '12:00') {
  const hour = Number(String(time).split(':')[0])
  if (hour < 5) return 'late-night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function sharedEntities(left, right) {
  const shared = []
  for (const id of left.accused_ids || []) {
    if ((right.accused_ids || []).includes(id)) shared.push({ type: 'accused', value: id })
  }
  if (left.phone_hash && left.phone_hash !== 'NA' && left.phone_hash === right.phone_hash) {
    shared.push({ type: 'phone_hash', value: left.phone_hash })
  }
  if (left.vehicle && left.vehicle !== 'NA' && left.vehicle === right.vehicle) {
    shared.push({ type: 'vehicle', value: left.vehicle })
  }
  if (left.truth_group && left.truth_group === right.truth_group) {
    shared.push({ type: 'planted_truth_group', value: left.truth_group })
  }
  return shared
}

export function crimeDna(left, right) {
  const entityMatches = sharedEntities(left, right)
  const factors = [
    { key: 'crimeType', label: 'Crime category', weight: 0.25, score: Number(left.crime_type === right.crime_type), evidence: left.crime_type },
    { key: 'modusOperandi', label: 'Modus operandi', weight: 0.2, score: jaccard(left.mo, right.mo), evidence: 'Narrative token overlap' },
    { key: 'geography', label: 'Geography', weight: 0.15, score: left.district === right.district ? 1 : 0.2, evidence: `${left.district} / ${right.district}` },
    { key: 'timePattern', label: 'Time pattern', weight: 0.1, score: Number(timeBand(left.time) === timeBand(right.time)), evidence: `${timeBand(left.time)} / ${timeBand(right.time)}` },
    { key: 'sharedEntities', label: 'Shared entities', weight: 0.2, score: Math.min(1, entityMatches.length / 2), evidence: entityMatches.map((item) => item.value).join(', ') || 'No shared hashed entity' },
    { key: 'summary', label: 'Narrative similarity', weight: 0.1, score: jaccard(left.case_summary, right.case_summary), evidence: 'Summary token overlap' },
  ].map((factor) => ({ ...factor, contribution: Number((factor.weight * factor.score).toFixed(3)) }))

  const score = Number(Math.min(0.98, factors.reduce((total, factor) => total + factor.contribution, 0)).toFixed(3))
  const band = score >= 0.72 ? 'high' : score >= 0.48 ? 'medium' : 'low'
  return {
    score,
    band,
    threshold: 0.48,
    included: score >= 0.48,
    factors,
    sharedEntities: entityMatches,
    disclaimer: DISCLAIMER,
  }
}

function seededStation(district, index) {
  return `PS-${district.code}-SYN-${String((index % 12) + 1).padStart(2, '0')}`
}

export function toSyntheticFirId(value, fallbackIndex = 0) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized.startsWith('SYN-')) return normalized
  const dated = normalized.match(/^FIR-(\d{4})-([A-Z]+)-(\d{3,4})$/)
  if (dated) return `SYN-${dated[1]}-${dated[2]}-${dated[3]}`
  const numeric = normalized.match(/^FIR-(\d+)$/)
  if (numeric) return `SYN-2026-LEG-${numeric[1].padStart(4, '0')}`
  return `SYN-2026-LEG-${String(fallbackIndex + 1).padStart(4, '0')}`
}

export function generateSyntheticDataset(baseSeed, total = 1000, seedNumber = 20260717) {
  const random = mulberry32(seedNumber)
  const baseCases = (baseSeed?.cases || []).map((item, index) => ({
    ...item,
    source_seed_id: item.fir_id,
    fir_id: toSyntheticFirId(item.fir_id, index),
    synthetic: true,
    data_label: 'SYNTHETIC DEMO DATA',
  }))
  const cases = [...baseCases]
  const plantedGroups = ['RING-METRO-LOCK', 'RING-EVENING-CHAIN', 'RING-UPI-MULE', 'RING-REAR-ENTRY', 'RING-TRANSIT-PICK', 'COLD-MO-RETURN']

  for (let index = cases.length; index < total; index += 1) {
    const district = DISTRICTS[index % DISTRICTS.length]
    const profile = CRIME_PROFILES[(index * 7) % CRIME_PROFILES.length]
    const groupIndex = index % 137 === 0 ? Math.floor(index / 137) % plantedGroups.length : -1
    const truthGroup = groupIndex >= 0 ? plantedGroups[groupIndex] : null
    const dayOffset = index % 540
    const date = new Date(Date.UTC(2024, 7, 1 + dayOffset)).toISOString().slice(0, 10)
    const hour = truthGroup ? 21 + (index % 2) : 6 + ((index * 5) % 18)
    const minute = (index * 13) % 60
    const patternSuffix = truthGroup ? ` Planted evaluation pattern ${truthGroup} with repeated operational markers.` : ''
    const accusedId = truthGroup ? `A-SYN-${groupIndex + 1}00` : `A-SYN-${String(index + 1000).padStart(4, '0')}`
    const phoneHash = truthGroup ? `PH-SYN-GROUP-${groupIndex + 1}` : `PH-SYN-${String(index + 5000).padStart(5, '0')}`
    const caseNumber = String(index + 1).padStart(4, '0')

    cases.push({
      fir_id: `SYN-2026-${district.code}-${caseNumber}`,
      district: district.name,
      station_id: seededStation(district, index),
      crime_type: profile.type,
      date,
      time: `${String(hour % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      lat: Number((district.lat + (random() - 0.5) * 0.16).toFixed(5)),
      lon: Number((district.lon + (random() - 0.5) * 0.16).toFixed(5)),
      status: ['Open', 'Under Investigation', 'Charge Sheet Filed', 'Closed'][index % 4],
      mo: `${profile.mo}${patternSuffix}`,
      case_summary: `${profile.summary}${patternSuffix}`,
      bns_sections: profile.sections,
      accused_ids: [accusedId],
      victim_id: `V-SYN-${String(index + 8000).padStart(5, '0')}`,
      vehicle: profile.type.includes('Theft') && index % 3 === 0 ? `KA-SYN-${String(index + 3000).padStart(5, '0')}` : 'NA',
      phone_hash: phoneHash,
      truth_group: truthGroup,
      synthetic: true,
      data_label: 'SYNTHETIC DEMO DATA',
    })
  }

  const stations = unique(cases.map((item) => item.station_id)).map((stationId) => {
    const caseRecord = cases.find((item) => item.station_id === stationId)
    return {
      station_id: stationId,
      station_name: stationId.includes('SYN') ? `Synthetic Station ${stationId.split('-').slice(-1)[0]}` : stationId,
      district: caseRecord?.district || 'Unknown',
      synthetic: true,
    }
  })

  return {
    version: `synthetic-${seedNumber}-${total}`,
    label: 'SYNTHETIC DEMO DATA — NOT AN OPERATIONAL POLICE RECORD',
    cases,
    stations,
    truthGroups: plantedGroups,
  }
}

function extractFirIds(query) {
  return unique(String(query).match(/(?:FIR|SYN)-\d{4}-[A-Z]+-\d{3,4}/gi) || []).map((id) => id.toUpperCase())
}

function extractDistrict(query) {
  const normalized = normalizeQuery(query)
  return DISTRICTS.find((district) => normalized.includes(normalizeQuery(district.name)))?.name || null
}

function extractCrimeType(query) {
  const normalized = normalizeQuery(query)
  if (normalized.includes('chain') || normalized.includes('snatching')) return 'Chain Snatching'
  if (normalized.includes('upi') || normalized.includes('fraud') || normalized.includes('cyber')) return 'UPI Fraud'
  if (normalized.includes('burglary') || normalized.includes('house')) return 'House Burglary'
  if (normalized.includes('mobile') || normalized.includes('phone theft')) return 'Mobile Phone Theft'
  if (normalized.includes('motorcycle') || normalized.includes('bike') || normalized.includes('theft')) return 'Motorcycle Theft'
  return null
}

function classifyIntent(query) {
  const normalized = normalizeQuery(query)
  if (!normalized || normalized.length < 4) return { intent: 'AMBIGUOUS_QUERY', reason: 'Add a case ID, place, crime category, or time range.' }
  if (/weather|cricket|stock|movie|medical|election|recipe/.test(normalized)) {
    return { intent: 'OUT_OF_SCOPE', reason: 'The workspace answers only evidence-grounded crime-database questions.' }
  }
  if (/hotspot|map|where|area pattern/.test(normalized)) return { intent: 'HOTSPOT_QUERY' }
  if (/connected|connection|link|network|graph/.test(normalized)) return { intent: 'CASE_LINK_QUERY' }
  if (/similar|match|crime dna|cold|unsolved/.test(normalized)) return { intent: 'SIMILAR_CASE_QUERY' }
  if (/patrol|what if|scenario|units/.test(normalized)) return { intent: 'SCENARIO_QUERY' }
  if (/report|pdf|brief/.test(normalized)) return { intent: 'REPORT_QUERY' }
  if (/fir|syn-|case|summary|summarize|theft|fraud|burglary|snatching|ಪ್ರಕರಣ/.test(normalized)) return { intent: 'CASE_SEARCH_QUERY' }
  return { intent: 'AMBIGUOUS_QUERY', reason: 'The requested investigative operation is unclear.' }
}

function citation(caseRecord, field = 'case_summary') {
  const value = caseRecord?.[field] || caseRecord?.case_summary || ''
  return {
    id: `CITE-${caseRecord.fir_id}-${field}`,
    firId: caseRecord.fir_id,
    field,
    excerpt: String(value).slice(0, 220),
    sourceType: 'synthetic-fir',
    dataLabel: caseRecord.data_label || 'SYNTHETIC DEMO DATA',
  }
}

function responseEnvelope({ mode, intent, filters = {}, answer, citations = [], confidence = 0, evidence = [], visualizations = {}, limitations = [], nextActions = [], auditRef = null, requestId = stableId() }) {
  const score = Number(Math.max(0, Math.min(1, confidence)).toFixed(3))
  return {
    requestId,
    mode,
    intent,
    filters,
    answer,
    citations,
    confidence: {
      score,
      band: score >= 0.8 ? 'high' : score >= 0.55 ? 'medium' : 'low',
      calibration: 'Measured against deterministic planted-truth evaluation cases; not a probability of guilt.',
    },
    evidence,
    visualizations,
    limitations: unique([...(limitations || []), DISCLAIMER]),
    nextActions,
    auditRef,
  }
}

export function createIntelligenceCore(baseSeed, options = {}) {
  const dataset = generateSyntheticDataset(baseSeed, options.total || 1000, options.seed || 20260717)
  const cases = dataset.cases
  const caseById = new Map(cases.map((item) => [item.fir_id, item]))

  function search(query, filters = {}, limit = 8) {
    const queryTokens = tokenize(query)
    const results = cases
      .filter((item) => !filters.district || item.district === filters.district)
      .filter((item) => !filters.crimeType || item.crime_type === filters.crimeType)
      .map((item) => {
        const haystack = tokenize(`${item.fir_id} ${item.crime_type} ${item.district} ${item.mo} ${item.case_summary} ${(item.accused_ids || []).join(' ')}`)
        const overlap = [...queryTokens].filter((token) => haystack.has(token)).length
        const exactFir = normalizeQuery(query).includes(normalizeQuery(item.fir_id)) ? 8 : 0
        return { case: item, score: exactFir + overlap }
      })
      .filter((entry) => entry.score > 0 || filters.district || filters.crimeType)
      .sort((left, right) => right.score - left.score || right.case.date.localeCompare(left.case.date))
      .slice(0, limit)
    return results
  }

  function similar(firId, limit = 5) {
    const source = caseById.get(firId)
    if (!source) return { source: null, matches: [] }
    const matches = cases
      .filter((item) => item.fir_id !== firId)
      .map((item) => ({ fir_id: item.fir_id, case: item, ...crimeDna(source, item) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
    return { source, matches }
  }

  function hotspots(filters = {}) {
    const filtered = cases.filter((item) => (!filters.district || item.district === filters.district) && (!filters.crimeType || item.crime_type === filters.crimeType))
    const counts = new Map()
    for (const item of filtered) {
      const key = `${item.district}|${item.station_id}`
      const current = counts.get(key) || { district: item.district, stationId: item.station_id, count: 0, lat: 0, lon: 0 }
      current.count += 1
      current.lat += item.lat
      current.lon += item.lon
      counts.set(key, current)
    }
    const clusters = [...counts.values()]
      .map((item) => ({ ...item, lat: Number((item.lat / item.count).toFixed(5)), lon: Number((item.lon / item.count).toFixed(5)), riskBand: item.count >= 20 ? 'high' : item.count >= 10 ? 'medium' : 'low' }))
      .sort((left, right) => right.count - left.count)
    return { filters, total: filtered.length, clusters, points: filtered.slice(0, 250) }
  }

  function graph(firId) {
    const source = caseById.get(firId)
    if (!source) return { nodes: [], edges: [], limitations: ['Case not found.'] }
    const result = similar(firId, 6)
    const included = result.matches.filter((item) => item.included)
    return {
      nodes: [
        { id: source.fir_id, type: 'case', label: source.fir_id, primary: true },
        ...included.map((item) => ({ id: item.fir_id, type: 'case', label: item.fir_id, score: item.score })),
      ],
      edges: included.map((item) => ({ id: `${source.fir_id}-${item.fir_id}`, source: source.fir_id, target: item.fir_id, score: item.score, reason: item.factors.filter((factor) => factor.contribution > 0).map((factor) => factor.label).join(', ') })),
      limitations: [DISCLAIMER],
    }
  }

  function scenario(input = {}) {
    const units = Math.max(0, Math.min(20, Number(input.units || 3)))
    const district = input.district || 'Bengaluru South'
    const crimeType = input.crimeType || 'Motorcycle Theft'
    const hotspotResult = hotspots({ district, crimeType })
    const baseline = Math.min(72, 28 + hotspotResult.clusters.length * 4)
    const coverageAfter = Math.min(92, baseline + units * 6)
    return {
      district,
      crimeType,
      units,
      coverageBefore: baseline,
      coverageAfter,
      recommendations: hotspotResult.clusters.slice(0, units || 1).map((cluster, index) => ({ priority: index + 1, stationId: cluster.stationId, timeBand: '18:00–23:00', rationale: `${cluster.count} synthetic incidents in the selected filter.` })),
      limitations: ['Area-level planning aid only; validate unit availability and live field conditions.', DISCLAIMER],
    }
  }

  function answer(query, context = {}) {
    const mode = context.mode || 'offline-demo'
    const requestId = context.requestId || stableId()
    const classified = classifyIntent(query)
    const filters = { district: extractDistrict(query), crimeType: extractCrimeType(query), firIds: extractFirIds(query) }
    const auditRef = context.auditRef || `AUD-${requestId.replace(/^REQ-/, '')}`

    if (classified.intent === 'OUT_OF_SCOPE' || classified.intent === 'AMBIGUOUS_QUERY') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: classified.reason, confidence: 0, limitations: [classified.reason], nextActions: ['Add a synthetic FIR ID, district, crime category, or requested analysis.'] })
    }

    if (classified.intent === 'HOTSPOT_QUERY') {
      const result = hotspots(filters)
      const selected = result.points.slice(0, 5)
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `${result.total} synthetic ${filters.crimeType || 'crime'} records match ${filters.district || 'the selected Karnataka regions'}. The map groups records by station area and time; it does not predict individual behaviour.`, confidence: result.total ? 0.88 : 0.22, citations: selected.map((item) => citation(item)), evidence: selected, visualizations: { hotspots: result }, limitations: result.total ? [] : ['No records matched the selected filters.'], nextActions: ['Inspect the highest-volume station cluster.', 'Compare time bands and verify source FIR narratives.'] })
    }

    if (classified.intent === 'CASE_LINK_QUERY') {
      const selected = filters.firIds.map((id) => caseById.get(id)).filter(Boolean)
      const searchResults = selected.length >= 2 ? selected : search(query, filters, 2).map((entry) => entry.case)
      if (searchResults.length < 2) return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: 'At least two identifiable synthetic cases are required for a connection check.', confidence: 0.1, limitations: ['Insufficient evidence for a case-link conclusion.'], nextActions: ['Provide two FIR IDs or more specific filters.'] })
      const analysis = crimeDna(searchResults[0], searchResults[1])
      const supporting = analysis.sharedEntities.map((item) => item.value)
      const contradiction = searchResults[0].crime_type !== searchResults[1].crime_type ? 'The recorded crime categories differ.' : null
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: supporting.length ? `${searchResults[0].fir_id} and ${searchResults[1].fir_id} share ${supporting.join(', ')}. KAVACH scores the lead at ${Math.round(analysis.score * 100)}%; this requires source verification.` : `No shared hashed entity was found between ${searchResults[0].fir_id} and ${searchResults[1].fir_id}. Narrative similarity alone is insufficient to claim a connection.`, confidence: supporting.length ? analysis.score : Math.min(0.4, analysis.score), citations: searchResults.map((item) => citation(item)), evidence: searchResults, visualizations: { crimeDna: analysis, graph: graph(searchResults[0].fir_id) }, limitations: contradiction ? [contradiction] : [], nextActions: ['Verify the cited entity fields.', 'Record an analyst accept/reject decision before escalation.'] })
    }

    if (classified.intent === 'SIMILAR_CASE_QUERY') {
      const requested = filters.firIds[0] || search(query, filters, 1)[0]?.case?.fir_id
      const result = similar(requested, 5)
      if (!result.source) return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: 'No matching synthetic FIR was found.', confidence: 0, limitations: ['Case identifier not found.'], nextActions: ['Open Case Workspace and select an available synthetic FIR.'] })
      const included = result.matches.filter((item) => item.included)
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: included.length ? `${included[0].fir_id} is the strongest explainable match to ${result.source.fir_id} at ${Math.round(included[0].score * 100)}%. Each factor is shown for analyst review.` : `No case crossed the ${Math.round(result.matches[0]?.threshold * 100 || 48)}% KAVACH inclusion threshold.`, confidence: included[0]?.score || 0.3, citations: [citation(result.source), ...included.slice(0, 3).map((item) => citation(item.case, 'mo'))], evidence: [result.source, ...included.slice(0, 3).map((item) => item.case)], visualizations: { similar: result.matches }, nextActions: ['Compare the top match factor-by-factor.', 'Reject weak or contradictory leads and record feedback.'] })
    }

    if (classified.intent === 'SCENARIO_QUERY') {
      const units = Number(normalizeQuery(query).match(/\b(\d+)\b/)?.[1] || 3)
      const result = scenario({ ...filters, units })
      const evidence = hotspots(filters).points.slice(0, 4)
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `Adding ${result.units} units changes modeled area coverage from ${result.coverageBefore}% to ${result.coverageAfter}%. This is a transparent planning scenario, not a forecast of individual offending.`, confidence: 0.7, citations: evidence.map((item) => citation(item)), evidence, visualizations: { scenario: result }, limitations: result.limitations, nextActions: ['Confirm unit availability with a supervisor.', 'Compare the scenario with live field conditions.'] })
    }

    const results = search(query, filters, 5)
    if (!results.length) return responseEnvelope({ mode, requestId, auditRef, intent: 'INSUFFICIENT_EVIDENCE', filters, answer: 'No synthetic record supports an answer to this query.', confidence: 0, limitations: ['No matching evidence was retrieved.'], nextActions: ['Change the district, crime category, date, or FIR ID.'] })
    const selected = results.map((entry) => entry.case)
    return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `${selected.length} synthetic records were retrieved. ${selected[0].fir_id}: ${selected[0].case_summary}`, confidence: Math.min(0.92, 0.62 + results[0].score * 0.04), citations: selected.map((item) => citation(item)), evidence: selected, visualizations: { resultCount: selected.length }, nextActions: ['Open the leading case dossier.', 'Run KAVACH similarity and verify cited fields.'] })
  }

  function analyzeEvidence(input = {}) {
    const text = String(input.text || '').slice(0, 200000)
    const firIds = extractFirIds(text)
    const directCases = firIds.map((id) => caseById.get(id)).filter(Boolean)
    const matched = directCases.length ? directCases : search(text, {}, 5).map((entry) => entry.case)
    const facts = {
      firIds,
      phoneHashes: unique(text.match(/PH-(?:HASH|SYN)[-A-Z0-9]+/gi) || []),
      vehicleIds: unique(text.match(/KA-[A-Z0-9-]{5,}/gi) || []),
      bnsReferences: unique(text.match(/BNS\s*\d+(?:\(\d+\))?/gi) || []),
    }
    return {
      analysisId: stableId('EVD'),
      mode: input.mode || 'offline-demo',
      file: input.file || {},
      facts,
      matchedCases: matched,
      citations: matched.map((item) => citation(item)),
      confidence: matched.length ? Math.min(0.9, 0.55 + matched.length * 0.06) : 0.15,
      limitations: unique([...(input.limitations || []), matched.length ? null : 'No case could be grounded in the supplied text.', DISCLAIMER]),
      nextActions: ['Verify extracted fields against the original file.', 'Request supervisor approval before attaching the analysis to a case.'],
    }
  }

  return {
    dataset,
    cases,
    caseById,
    search,
    similar,
    graph,
    hotspots,
    scenario,
    answer,
    analyzeEvidence,
  }
}

export { DISCLAIMER }
