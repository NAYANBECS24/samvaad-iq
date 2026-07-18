export const ANSWER_MODES = ['investigator', 'brief', 'timeline', 'contradictions']

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function validMode(value) {
  return ANSWER_MODES.includes(value) ? value : 'investigator'
}

function buildTimeline(evidence = []) {
  return evidence
    .filter((item) => item?.fir_id && item?.date)
    .map((item) => ({
      firId: item.fir_id,
      timestamp: `${item.date}${item.time ? `T${item.time}` : ''}`,
      date: item.date,
      time: item.time || 'Time not recorded',
      district: item.district || 'District not recorded',
      stationId: item.station_id || 'Station not recorded',
      crimeType: item.crime_type || 'Category not recorded',
      status: item.status || 'Status not recorded',
      summary: item.case_summary || item.mo || 'No summary recorded',
    }))
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .slice(0, 12)
}

function sharedValues(evidence, field) {
  const groups = new Map()
  for (const item of evidence) {
    const value = item?.[field]
    if (!value || value === 'NA') continue
    const current = groups.get(value) || []
    current.push(item.fir_id)
    groups.set(value, current)
  }
  return [...groups.entries()].filter(([, firIds]) => firIds.length > 1)
}

function buildConsistencyChecks(evidence = []) {
  if (evidence.length < 2) {
    return [{ severity: 'info', title: 'Single-record result', detail: 'At least two cited records are required for cross-case consistency checks.', firIds: evidence.map((item) => item.fir_id) }]
  }

  const checks = []
  const crimeTypes = unique(evidence.map((item) => item.crime_type))
  const districts = unique(evidence.map((item) => item.district))
  const statuses = unique(evidence.map((item) => item.status))

  if (crimeTypes.length > 1) checks.push({ severity: 'review', title: 'Different recorded crime categories', detail: crimeTypes.join(' · '), firIds: evidence.map((item) => item.fir_id) })
  if (districts.length > 1) checks.push({ severity: 'info', title: 'Cross-district evidence', detail: districts.join(' · '), firIds: evidence.map((item) => item.fir_id) })
  if (statuses.length > 1) checks.push({ severity: 'review', title: 'Case statuses differ', detail: statuses.join(' · '), firIds: evidence.map((item) => item.fir_id) })

  for (const [phoneHash, firIds] of sharedValues(evidence, 'phone_hash')) {
    checks.push({ severity: 'signal', title: 'Shared hashed phone signal', detail: `${phoneHash} appears in ${firIds.length} cited records. Verify the source extraction before treating it as a link.`, firIds })
  }
  for (const [vehicle, firIds] of sharedValues(evidence, 'vehicle')) {
    checks.push({ severity: 'signal', title: 'Shared vehicle signal', detail: `${vehicle} appears in ${firIds.length} cited records. Confirm ownership and provenance separately.`, firIds })
  }

  return checks.length ? checks.slice(0, 8) : [{ severity: 'clear', title: 'No structured-field conflict detected', detail: 'The compared fields are consistent, but source narratives still require human verification.', firIds: evidence.map((item) => item.fir_id) }]
}

function buildCoverage(result) {
  const citedIds = new Set((result.citations || []).map((item) => item.firId).filter(Boolean))
  const evidenceIds = unique((result.evidence || []).map((item) => item?.fir_id))
  const answerIds = unique(String(result.answer || '').match(/SYN-[A-Z0-9-]+/gi) || []).map((item) => item.toUpperCase())
  const supportedAnswerIds = answerIds.filter((item) => citedIds.has(item))
  const unsupportedAnswerIds = answerIds.filter((item) => !citedIds.has(item))
  const citedEvidenceCount = evidenceIds.filter((item) => citedIds.has(item)).length
  const evidenceCoverage = evidenceIds.length ? Math.round((citedEvidenceCount / evidenceIds.length) * 100) : 100
  const answerIdCoverage = answerIds.length ? Math.round((supportedAnswerIds.length / answerIds.length) * 100) : 100
  return {
    evidenceCount: evidenceIds.length,
    citationCount: result.citations?.length || 0,
    citedEvidenceCount,
    evidenceCoverage,
    answerIdCoverage,
    supportedAnswerIds,
    unsupportedAnswerIds,
    status: unsupportedAnswerIds.length ? 'review' : citedEvidenceCount === evidenceIds.length ? 'grounded' : 'partial',
  }
}

function modeSummary(mode, timeline, checks, coverage) {
  if (mode === 'brief') return `Command brief: ${coverage.citedEvidenceCount} cited record${coverage.citedEvidenceCount === 1 ? '' : 's'} support this response; human verification remains mandatory.`
  if (mode === 'timeline') return timeline.length ? `Timeline prepared from ${timeline.length} cited records, ordered from ${timeline[0].date} to ${timeline.at(-1).date}.` : 'No dated evidence was available for a timeline.'
  if (mode === 'contradictions') return `${checks.filter((item) => item.severity === 'review').length} review flag(s) and ${checks.filter((item) => item.severity === 'signal').length} shared signal(s) were identified.`
  return `Investigator view preserves ${coverage.citationCount} source citation${coverage.citationCount === 1 ? '' : 's'}, confidence, limitations, and human-controlled next actions.`
}

export function enrichInvestigationResult(result, options = {}) {
  const mode = validMode(options.answerMode)
  const timeline = buildTimeline(result.evidence || [])
  const consistencyChecks = buildConsistencyChecks(result.evidence || [])
  const coverage = buildCoverage(result)
  const generated = Boolean(result.modelSignals?.generativeAnswer)
  const filters = [result.filters?.district, result.filters?.crimeType, ...(result.filters?.firIds || [])].filter(Boolean)

  return {
    ...result,
    responseMode: mode,
    investigationInsights: {
      modeSummary: modeSummary(mode, timeline, consistencyChecks, coverage),
      coverage,
      timeline,
      consistencyChecks,
      entities: {
        firIds: unique((result.evidence || []).map((item) => item?.fir_id)),
        districts: unique((result.evidence || []).map((item) => item?.district)),
        crimeTypes: unique((result.evidence || []).map((item) => item?.crime_type)),
        phoneHashes: unique((result.evidence || []).map((item) => item?.phone_hash).filter((item) => item && item !== 'NA')),
        vehicles: unique((result.evidence || []).map((item) => item?.vehicle).filter((item) => item && item !== 'NA')),
      },
    },
    pipeline: [
      { key: 'normalize', label: 'Language + context', status: 'complete', detail: options.contextUsed ? 'Follow-up context resolved against cited FIRs.' : 'English, Kannada, or Kanglish query normalized.' },
      { key: 'intent', label: 'Intent + filters', status: 'complete', detail: `${String(result.intent || 'unknown').replaceAll('_', ' ')}${filters.length ? ` · ${filters.join(' · ')}` : ''}` },
      { key: 'retrieve', label: 'Evidence retrieval', status: coverage.evidenceCount ? 'complete' : 'limited', detail: `${coverage.evidenceCount} evidence record(s), ${coverage.citationCount} citation(s).` },
      { key: 'analyze', label: 'KAVACH analysis', status: 'complete', detail: result.visualizations?.crimeDna || result.visualizations?.similar ? 'Factor-level similarity retained.' : 'Requested deterministic analysis completed.' },
      { key: 'ground', label: generated ? 'NVIDIA grounded response' : 'Deterministic response', status: 'complete', detail: generated ? `${result.modelSignals.generativeAnswer.model}; uncited FIR guard active.` : 'No external model was required or available.' },
      { key: 'govern', label: 'Skeptic + governance', status: coverage.unsupportedAnswerIds.length ? 'review' : 'complete', detail: `${consistencyChecks.length} consistency check(s); ${coverage.answerIdCoverage}% FIR-reference coverage.` },
    ],
  }
}
