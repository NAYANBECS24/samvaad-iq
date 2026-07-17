import blueprint from '../../../data/evidence-intelligence.json'
import {
  buildGraph,
  cases,
  findSimilarCases,
  getStation,
  legalExplainabilityForCase,
} from './prototypeEngine.js'

const LAB_AUDIT_KEY = 'samvaad_evidence_audit'

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
      text: topCase ? `${topCase.case_summary} MO: ${topCase.mo}` : profile.sourceText,
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

function buildReport(analysis) {
  const reportId = `RPT-${Date.now().toString().slice(-6)}`
  return {
    reportId,
    title: `${analysis.profile.label} Intelligence Brief`,
    generatedAt: new Date().toISOString(),
    cases: analysis.matchedCases.map((match) => match.caseRecord),
    smartBrowz: {
      renderJobId: `SBZ-${Date.now().toString().slice(-6)}`,
      status: 'queued-for-headless-render',
      service: 'Catalyst SmartBrowz',
    },
    stratusObject: {
      bucket: 'samvaad-intelligence-briefs',
      key: `reports/${reportId}.pdf`,
      service: 'Catalyst Stratus',
    },
    mailEvent: {
      template: 'Supervisor evidence review',
      status: 'ready-to-send',
      service: 'Catalyst Mail',
    },
  }
}

function buildAuditTrail(analysis) {
  return blueprint.workflowEvents.map((event, index) => ({
    id: `AUD-EV-${String(index + 1).padStart(2, '0')}`,
    actor: event.service,
    event: event.name,
    detail: event.detail,
    target: analysis.uploaded.fileName,
    timestamp: new Date(Date.now() + index * 1100).toISOString(),
  }))
}

export function buildEvidenceAnalysis({ profileId = 'fir-pdf', file } = {}) {
  const profile = profileById(profileId)
  const matchedCases = profile.linkedCaseIds
    .map(caseById)
    .filter(Boolean)
    .map((caseRecord) => ({
      caseRecord,
      score: scoreCase(profile, caseRecord),
      station: getStation(caseRecord)?.station_name || caseRecord.station_id,
      legal: legalExplainabilityForCase(caseRecord),
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
  const uploaded = {
    fileName: file?.name || profile.sampleFileName,
    size: file?.size || 248000,
    accepted: profile.accepted,
    objectKey: `stratus://samvaad-iq/evidence/${Date.now()}-${file?.name || profile.sampleFileName}`,
    checksum: `SYN-${profile.id.toUpperCase()}-${String(Date.now()).slice(-6)}`,
  }
  const analysis = {
    profile,
    uploaded,
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
    leadSummary: `${profile.label} linked ${matchedCases.length} synthetic FIR records. Top lead: ${
      matchedCases[0]?.caseRecord.fir_id || 'NA'
    }. Supervisor review required before circulation.`,
  }

  return {
    ...analysis,
    report: buildReport(analysis),
    auditTrail: buildAuditTrail(analysis),
  }
}

export function buildEvidenceChatResponse(analysis) {
  const sources = analysis.matchedCases.map((match) => match.caseRecord.fir_id)
  return {
    conversationId: `EVLAB-${Date.now().toString().slice(-6)}`,
    role: 'Supervisor',
    query: `Analyze uploaded ${analysis.profile.kind}: ${analysis.uploaded.fileName}`,
    timestamp: new Date().toISOString(),
    intent: 'EVIDENCE_INTELLIGENCE',
    answer: `${analysis.leadSummary} Extracted ${analysis.extracted.vehicle !== 'NA' ? analysis.extracted.vehicle : analysis.extracted.phoneHash}, ${analysis.extracted.location}, and ${analysis.extracted.suspectMentions.join(', ')}. Report is staged for SmartBrowz render, Stratus storage, supervisor review, and audit logging.`,
    confidence: analysis.extracted.confidence,
    leadStrength: analysis.extracted.confidence >= 0.86 ? 'Strong evidence-linked lead' : 'Moderate evidence-linked lead',
    evidence: [
      { type: 'upload', label: analysis.uploaded.fileName, value: analysis.uploaded.objectKey },
      { type: 'vehicle', label: 'Vehicle / Object', value: analysis.extracted.vehicle },
      { type: 'phone_hash', label: 'Phone Hash', value: analysis.extracted.phoneHash },
      { type: 'location', label: 'Location', value: analysis.extracted.location },
      { type: 'suspect', label: 'Entity Mentions', value: analysis.extracted.suspectMentions.join(', ') },
    ],
    sources,
    visuals: {
      report: analysis.report,
      graph: analysis.graph,
      similar: analysis.crimeDna.matches,
      evidenceLab: analysis,
    },
    agents: [
      { agent: 'Detective Agent', note: `Opened ${analysis.profile.kind} intake and selected ${analysis.profile.extractionMode}`, status: 'complete' },
      { agent: 'Data Agent', note: `Linked ${sources.length} FIR records from extracted district, crime type, vehicle, and phone hash`, status: 'complete' },
      { agent: 'Network Agent', note: `Crime DNA checked ${analysis.crimeDna.matches.length} nearby matches and graph context`, status: 'complete' },
      { agent: 'Skeptic Agent', note: 'Kept biometric/entity outputs as masked investigative leads requiring supervisor review', status: 'complete' },
      { agent: 'Report Agent', note: `${analysis.report.smartBrowz.service} job ${analysis.report.smartBrowz.renderJobId} prepared`, status: 'complete' },
    ],
    nextSteps: [
      { id: 'STEP-1', text: 'Supervisor validates extracted vehicle, phone hash, location, and witness text before circulation' },
      { id: 'STEP-2', text: 'Open graph view for the top matched FIR and verify repeated entity trail' },
      { id: 'STEP-3', text: 'Render official PDF through SmartBrowz and store the file in Stratus' },
      { id: 'STEP-4', text: 'Write audit log and notify assigned reviewer through Catalyst Mail' },
    ],
    suggestedQuestions: [
      `Open network graph for ${sources[0] || 'SYN-2025-BLR-001'}`,
      `Find similar cases to ${sources[0] || 'SYN-2025-BLR-027'}`,
      'Generate official evidence review brief',
    ],
    riskFlags: [
      'Synthetic evidence simulation only',
      'No automated identity or guilt conclusion',
      'Supervisor review required',
      'SmartBrowz and Stratus are staged deployment services',
    ],
    sourceChunks: analysis.sourceChunks,
    quickMlRag: {
      knowledgeBase: 'FIR + BNS + SOP + evidence metadata demo KB',
      retrievalMode: 'Prototype deterministic retrieval mapped to Catalyst QuickML',
      sourceCount: analysis.sourceChunks.length,
    },
    audit: {
      policy: 'synthetic-evidence-only',
      sourceCount: sources.length,
      generatedAt: new Date().toISOString(),
      signalEvents: analysis.auditTrail.length,
    },
    disclaimer: blueprint.summary.disclaimer,
  }
}

export function readEvidenceAudit() {
  try {
    return JSON.parse(localStorage.getItem(LAB_AUDIT_KEY) || '[]')
  } catch {
    return []
  }
}

export function writeEvidenceAudit(analysis) {
  const next = [...analysis.auditTrail, ...readEvidenceAudit()].slice(0, 16)
  localStorage.setItem(LAB_AUDIT_KEY, JSON.stringify(next))
  return next
}

export const evidenceBlueprint = blueprint
