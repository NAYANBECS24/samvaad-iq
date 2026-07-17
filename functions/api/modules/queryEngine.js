const { cases, getStation } = require('./seedData')
const { findSimilarCases, sharedEntities } = require('./crimeDNA')
const { buildGraph } = require('./graphBuilder')
const { getHotspots } = require('./hotspotEngine')
const { patrolWhatIf } = require('./patrolEngine')
const { buildReport } = require('./reportBuilder')
const { buildAgentRoom } = require('./agentRoom')
const { legalExplainabilityForCase } = require('./legalXai')

const DISCLAIMER = 'Investigative lead only. Requires human verification.'

function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/alli/g, ' in ')
    .replace(/maadi/g, ' please ')
    .replace(/thorsi|torisi|torsi/g, ' show ')
    .replace(/kalavu|kalla/g, ' theft ')
    .replace(/jodi/g, ' link ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFirIds(query) {
  return Array.from(new Set((query.match(/FIR-\d{4}-[A-Z]+-\d{3}/gi) || []).map((id) => id.toUpperCase())))
}

function extractCrimeType(query) {
  const q = normalizeQuery(query)
  if (q.includes('chain') || q.includes('sara')) return 'Chain Snatching'
  if (q.includes('upi') || q.includes('fraud') || q.includes('cyber') || q.includes('financial')) return 'UPI Fraud'
  if (q.includes('burglary') || q.includes('house')) return 'House Burglary'
  return 'Motorcycle Theft'
}

function extractDistrict(query) {
  const q = normalizeQuery(query)
  if (q.includes('mysuru') || q.includes('mysore')) return 'Mysuru'
  if (q.includes('hubballi') || q.includes('dharwad')) return 'Hubballi-Dharwad'
  if (q.includes('mangaluru') || q.includes('mangalore')) return 'Mangaluru'
  return 'Bengaluru South'
}

function agentSteps(summary) {
  return buildAgentRoom(summary)
}

function evidenceFromCases(selected) {
  return selected.map((caseRecord) => ({
    fir_id: caseRecord.fir_id,
    station: getStation(caseRecord)?.station_name || caseRecord.station_id,
    summary: caseRecord.case_summary,
  }))
}

function buildSourceChunks(payload) {
  const selected = cases.filter((caseRecord) => (payload.sources || []).includes(caseRecord.fir_id)).slice(0, 3)
  const chunks = selected.map((caseRecord, index) => ({
    id: `RAG-FIR-${String(index + 1).padStart(2, '0')}`,
    service: 'Catalyst QuickML RAG',
    title: `${caseRecord.fir_id} narrative and MO`,
    text: `${caseRecord.case_summary} MO: ${caseRecord.mo}`,
    confidence: Math.max(0.72, Number(((payload.confidence || 0.78) - index * 0.04).toFixed(2))),
  }))

  if (selected[0]) {
    const legal = legalExplainabilityForCase(selected[0].fir_id)
    chunks.push({
      id: 'RAG-LEGAL-01',
      service: 'Catalyst QuickML RAG',
      title: `BNS / IPC support for ${legal.crimeType}`,
      text: `BNS ${legal.bns}; ${legal.legalNote} ${legal.humanActionNote}`,
      confidence: 0.86,
    })
  }

  chunks.push({
    id: 'RAG-SOP-01',
    service: 'Catalyst QuickML RAG',
    title: 'Investigation SOP guardrail',
    text: 'Use source FIRs, masked identifiers, supervisor review, and human verification before operational action.',
    confidence: 0.94,
  })

  return chunks.slice(0, 5)
}

function decorate(payload) {
  const confidence = payload.confidence || 0.7
  const sourceChunks = buildSourceChunks(payload)
  const nextSteps = {
    HOTSPOT_QUERY: ['Review mapped station beat timing', 'Compare CCTV or patrol logs for repeated windows'],
    CASE_LINK_QUERY: ['Open graph view and verify shared entities', 'Escalate only after human review of hashes'],
    SIMILAR_CASE_QUERY: ['Compare MO factors in top Crime DNA match', 'Check missing FIR narrative fields'],
    PATROL_WHAT_IF: ['Validate unit availability with supervisor', 'Use live field context before deployment'],
    LEGAL_REPORT: ['Attach approved case notes', 'Confirm BNS/IPC mapping with legal reviewer'],
  }

  return {
    ...payload,
    leadStrength:
      confidence >= 0.82 ? 'Strong investigative lead' : confidence >= 0.65 ? 'Moderate lead' : 'Weak lead',
    nextSteps: nextSteps[payload.intent] || ['Verify source FIR details', 'Treat output as decision support only'],
    riskFlags: ['Synthetic dataset only', 'Not an automated guilt prediction'],
    sourceChunks,
    quickMlRag: {
      knowledgeBase: 'FIR + BNS + SOP + evidence metadata demo KB',
      retrievalMode: 'Prototype deterministic retrieval mapped to Catalyst QuickML',
      sourceCount: sourceChunks.length,
    },
    audit: {
      policy: 'synthetic-data-only',
      generatedAt: new Date().toISOString(),
    },
  }
}

function answerQuery(query, role = 'Investigator') {
  const q = normalizeQuery(query)
  const crimeType = extractCrimeType(query)
  const district = extractDistrict(query)

  if (q.includes('cold') || q.includes('unsolved') || q.includes('resurrect')) {
    const result = findSimilarCases('SYN-2025-BLR-027')
    const top = result.matches[0]
    const topFirId = top?.case?.fir_id || top?.fir_id || 'NA'
    return decorate({
      intent: 'COLD_CASE_QUERY',
      answer: `Cold case-style match found: synthetic old burglary pattern aligns with ${topFirId}. Similarity score: ${top?.score || 0.4}. This is an investigative lead, not a confirmed conclusion.`,
      confidence: top?.score || 0.4,
      evidence: [`Synthetic cold case`, topFirId],
      sources: [topFirId],
      visuals: { similar: result.matches, graph: buildGraph(topFirId) },
      agents: agentSteps({
        detective: 'Analyzed unsolved case pattern',
        network: `Linked cold pattern with ${topFirId}`,
      }),
      disclaimer: DISCLAIMER,
      role,
    })
  }

  if (
    q.includes('hotspot') ||
    q.includes('map') ||
    q.includes('where') ||
    ((q.includes('show') || q.includes('pattern')) &&
      !q.includes('connected') &&
      !q.includes('link') &&
      !(q.includes('financial') && q.includes('district')))
  ) {
    const hotspots = getHotspots({ district, crimeType })
    return decorate({
      intent: 'HOTSPOT_QUERY',
      answer: `${hotspots.points.length} synthetic ${crimeType.toLowerCase()} cases appear in ${district}. Confidence: 0.86.`,
      confidence: 0.86,
      evidence: evidenceFromCases(hotspots.points),
      sources: hotspots.points.map((caseRecord) => caseRecord.fir_id),
      visuals: { mapPoints: hotspots.points, stationCounts: hotspots.stationCounts },
      agents: agentSteps({ detective: `Parsed district=${district}, crime_type=${crimeType}` }),
      disclaimer: DISCLAIMER,
      role,
    })
  }

  if (q.includes('connected') || q.includes('link') || (q.includes('financial') && q.includes('district'))) {
    const [firstId, secondId] = extractFirIds(query)
    const inferred = cases.filter((caseRecord) => caseRecord.crime_type === crimeType)
    const first = cases.find((caseRecord) => caseRecord.fir_id === firstId) || inferred[0] || cases[0]
    const second = cases.find((caseRecord) => caseRecord.fir_id === secondId) || inferred[1] || cases[1]
    const shared = sharedEntities(first, second)
    return decorate({
      intent: 'CASE_LINK_QUERY',
      answer: `Yes. ${first.fir_id} and ${second.fir_id} share ${shared.join(', ')}. Treat this as an investigative lead, not final proof.`,
      confidence: 0.87,
      evidence: evidenceFromCases([first, second]),
      sources: [first.fir_id, second.fir_id],
      visuals: { graph: buildGraph(first.fir_id) },
      agents: agentSteps({ network: `Found ${shared.join(', ')}` }),
      disclaimer: DISCLAIMER,
      role,
    })
  }

  if (q.includes('similar') || q.includes('match')) {
    const [firId] = extractFirIds(query)
    const result = findSimilarCases(firId || 'SYN-2025-BLR-027')
    const top = result.matches[0]
    return decorate({
      intent: 'SIMILAR_CASE_QUERY',
      answer: top ? `${top.fir_id} is the closest match. Similarity score: ${top.score}.` : 'No similar case found.',
      confidence: top?.score || 0.4,
      evidence: result.source ? evidenceFromCases([result.source, ...result.matches.slice(0, 2).map((item) => item.case)]) : [],
      sources: result.source ? [result.source.fir_id, ...result.matches.slice(0, 3).map((item) => item.fir_id)] : [],
      visuals: { similar: result.matches },
      agents: agentSteps({ detective: `Built Crime DNA fingerprint for ${firId || 'SYN-2025-BLR-027'}` }),
      disclaimer: DISCLAIMER,
      role,
    })
  }

  if (q.includes('patrol') || q.includes('what if')) {
    const units = Number(query.match(/\b(\d+)\s+patrol/i)?.[1] || 3)
    const simulation = patrolWhatIf({ district, crimeType, units })
    const selected = cases.filter((caseRecord) => caseRecord.district === district && caseRecord.crime_type === crimeType)
    return decorate({
      intent: 'PATROL_WHAT_IF',
      answer: `Coverage improves from ${simulation.coverageBefore}% to ${simulation.coverageAfter}% in prototype simulation.`,
      confidence: 0.74,
      evidence: simulation.recommendations,
      sources: selected.map((caseRecord) => caseRecord.fir_id),
      visuals: { patrol: simulation },
      agents: agentSteps({ detective: `Modeled ${units} patrol units` }),
      disclaimer: DISCLAIMER,
      role,
    })
  }

  if (q.includes('report') || q.includes('pdf') || q.includes('brief')) {
    const report = buildReport({ crimeType, district })
    return decorate({
      intent: 'LEGAL_REPORT',
      answer: 'Report generated with source FIRs, BNS mapping, confidence notes, and human-review disclaimer.',
      confidence: 0.82,
      evidence: report.source_firs,
      sources: report.source_firs,
      visuals: { report },
      agents: agentSteps({ detective: `Prepared ${report.title}` }),
      disclaimer: DISCLAIMER,
      role,
    })
  }

  return decorate({
    intent: 'CASE_SUMMARY_QUERY',
    answer: `${cases[0].fir_id}: ${cases[0].case_summary}`,
    confidence: 0.78,
    evidence: evidenceFromCases([cases[0]]),
    sources: [cases[0].fir_id],
    visuals: { graph: buildGraph(cases[0].fir_id) },
    agents: agentSteps({}),
    disclaimer: DISCLAIMER,
    role,
  })
}

module.exports = {
  answerQuery,
  extractFirIds,
  normalizeQuery,
}
