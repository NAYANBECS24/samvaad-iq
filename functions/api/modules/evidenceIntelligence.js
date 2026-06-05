const blueprint = require('../../../data/evidence-intelligence.json')
const { cases, getStation } = require('./seedData')
const { findSimilarCases } = require('./crimeDNA')
const { buildGraph } = require('./graphBuilder')
const { buildReport } = require('./reportBuilder')

function profileById(profileId = 'fir-pdf') {
  return blueprint.evidenceProfiles.find((profile) => profile.id === profileId) || blueprint.evidenceProfiles[0]
}

function caseById(firId) {
  return cases.find((caseRecord) => caseRecord.fir_id === firId)
}

function scoreCase(profile, caseRecord) {
  const extracted = profile.extracted
  let score = 0.36
  if (profile.linkedCaseIds.includes(caseRecord.fir_id)) score += 0.28
  if (caseRecord.crime_type === extracted.crimeType) score += 0.14
  if (caseRecord.district === extracted.district) score += 0.1
  if (caseRecord.vehicle !== 'NA' && caseRecord.vehicle === extracted.vehicle) score += 0.06
  if (caseRecord.phone_hash !== 'NA' && caseRecord.phone_hash === extracted.phoneHash) score += 0.06
  return Number(Math.min(0.97, score).toFixed(2))
}

function buildSourceChunks(profile, matchedCases) {
  const topCase = matchedCases[0]?.caseRecord
  return [
    {
      id: 'RAG-FIR-01',
      service: 'Catalyst QuickML RAG',
      title: `${topCase?.fir_id || 'FIR'} narrative and metadata`,
      text: topCase
        ? `${topCase.case_summary} MO: ${topCase.mo}`
        : profile.sourceText,
      confidence: 0.9,
    },
    {
      id: 'RAG-EVIDENCE-02',
      service: profile.extractionMode,
      title: `${profile.kind} extracted evidence`,
      text: profile.sourceText,
      confidence: profile.extracted.confidence,
    },
    {
      id: 'RAG-SOP-03',
      service: 'Catalyst QuickML RAG',
      title: 'Human review and privacy guardrail',
      text: 'Treat this as an investigative lead. Verify source evidence, keep identifiers masked, and require supervisor approval before circulation.',
      confidence: 0.96,
    },
  ]
}

function buildEvidenceAnalysis({ profileId = 'fir-pdf', fileName = '' } = {}) {
  const profile = profileById(profileId)
  const matchedCases = profile.linkedCaseIds
    .map(caseById)
    .filter(Boolean)
    .map((caseRecord) => ({
      caseRecord,
      score: scoreCase(profile, caseRecord),
      station: getStation(caseRecord)?.station_name || caseRecord.station_id,
      reasons: [
        caseRecord.crime_type === profile.extracted.crimeType ? profile.extracted.crimeType : null,
        caseRecord.vehicle === profile.extracted.vehicle ? profile.extracted.vehicle : null,
        caseRecord.phone_hash === profile.extracted.phoneHash ? profile.extracted.phoneHash : null,
        caseRecord.district === profile.extracted.district ? profile.extracted.district : null,
      ].filter(Boolean),
    }))
    .sort((a, b) => b.score - a.score)

  const focusFirId = matchedCases[0]?.caseRecord.fir_id || profile.linkedCaseIds[0]
  const crimeDna = findSimilarCases(focusFirId)
  const report = buildReport({
    title: `${profile.label} Intelligence Brief`,
    query: `Analyze uploaded ${profile.kind} and link it to synthetic FIR evidence`,
    answer: `${profile.label} produced ${matchedCases.length} FIR links with ${Math.round(
      profile.extracted.confidence * 100,
    )}% extraction confidence.`,
    sources: matchedCases.map((match) => match.caseRecord.fir_id),
    crimeType: profile.extracted.crimeType,
    district: profile.extracted.district,
    disclaimer: blueprint.summary.disclaimer,
  })

  return {
    profile,
    uploaded: {
      fileName: fileName || profile.sampleFileName,
      accepted: profile.accepted,
      objectKey: `stratus://samvaad-iq/evidence/${Date.now()}-${fileName || profile.sampleFileName}`,
      checksum: `SYN-${profile.id.toUpperCase()}-${String(Date.now()).slice(-6)}`,
    },
    extracted: profile.extracted,
    matchedCases,
    crimeDna: {
      source: crimeDna.source,
      matches: crimeDna.matches.slice(0, 4),
    },
    sourceChunks: buildSourceChunks(profile, matchedCases),
    workflowEvents: blueprint.workflowEvents,
    cachePlan: blueprint.cachePlan,
    ragCorpus: blueprint.ragCorpus,
    graph: buildGraph(focusFirId),
    report: {
      ...report,
      smartBrowz: {
        renderJobId: `SBZ-${Date.now().toString().slice(-6)}`,
        status: 'queued-for-headless-render',
        service: 'Catalyst SmartBrowz',
      },
      stratusObject: {
        bucket: 'samvaad-intelligence-briefs',
        key: `reports/${report.reportId}.pdf`,
        service: 'Catalyst Stratus',
      },
      mailEvent: {
        template: 'Supervisor evidence review',
        status: 'ready-to-send',
        service: 'Catalyst Mail',
      },
    },
    auditTrail: blueprint.workflowEvents.map((event, index) => ({
      id: `AUD-EV-${String(index + 1).padStart(2, '0')}`,
      actor: event.service,
      event: event.name,
      detail: event.detail,
    })),
    leadSummary: `${profile.label} linked ${matchedCases.length} synthetic FIR records. Top lead: ${
      matchedCases[0]?.caseRecord.fir_id || 'NA'
    }. Supervisor review required before circulation.`,
  }
}

function getEvidenceProfiles() {
  return {
    summary: blueprint.summary,
    profiles: blueprint.evidenceProfiles,
    workflowEvents: blueprint.workflowEvents,
    cachePlan: blueprint.cachePlan,
    ragCorpus: blueprint.ragCorpus,
  }
}

function getCachePlan() {
  return {
    generatedAt: new Date().toISOString(),
    entries: blueprint.cachePlan,
    precomputeTargets: blueprint.evidenceProfiles.flatMap((profile) => profile.linkedCaseIds).slice(0, 8),
  }
}

module.exports = {
  buildEvidenceAnalysis,
  getCachePlan,
  getEvidenceProfiles,
}
