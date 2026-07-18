import blueprint from '../../../data/evidence-intelligence.json'
import { DATA_VERSION, cases, getStation, legalExplainabilityForCase } from './intelligenceRepository.js'

const LAB_AUDIT_KEY = 'samvaad_evidence_audit'

function profileById(profileId = 'document') {
  return blueprint.evidenceProfiles.find((profile) => profile.id === profileId) || blueprint.evidenceProfiles[0]
}

function terms(value = '') {
  return new Set(String(value).toLowerCase().match(/[a-z0-9-]{3,}/g) || [])
}

function groundedMatches(text) {
  const queryTerms = terms(text)
  if (!queryTerms.size) return []
  return cases
    .map((caseRecord) => {
      const searchable = [
        caseRecord.fir_id,
        caseRecord.crime_type,
        caseRecord.district,
        caseRecord.station_id,
        caseRecord.case_summary,
        caseRecord.mo,
        caseRecord.vehicle,
        caseRecord.phone_hash,
        ...caseRecord.accused_ids,
      ].join(' ')
      const sourceTerms = terms(searchable)
      const matchedTerms = [...queryTerms].filter((term) => sourceTerms.has(term))
      return {
        caseRecord,
        matchedTerms,
        score: Number(Math.min(0.92, matchedTerms.length / Math.max(4, queryTerms.size)).toFixed(2)),
      }
    })
    .filter((match) => match.matchedTerms.length >= 2)
    .sort((a, b) => b.score - a.score || b.matchedTerms.length - a.matchedTerms.length)
    .slice(0, 6)
}

function localAudit(uploaded, matchCount) {
  const generatedAt = new Date().toISOString()
  return [
    {
      id: `LOCAL-EV-${uploaded.sha256?.slice(0, 10) || Date.now()}`,
      actor: 'Browser evidence parser',
      event: 'Local provenance analyzed',
      detail: `${matchCount} source-backed synthetic case candidates returned; no server persistence occurred.`,
      target: uploaded.name,
      timestamp: generatedAt,
    },
  ]
}

export function buildEvidenceAnalysis({ profileId = 'document', prepared } = {}) {
  const profile = profileById(profileId)
  const uploaded = prepared?.file || {
    name: 'No file selected',
    size: 0,
    sha256: null,
    type: 'unknown',
  }
  const matchedCases = prepared ? groundedMatches(`${uploaded.name}\n${prepared.text || ''}`) : []
  const sourceChunks = matchedCases.map((match, index) => ({
    id: `SRC-EVIDENCE-${String(index + 1).padStart(2, '0')}`,
    service: 'Shared synthetic repository',
    title: `${match.caseRecord.fir_id} matched source fields`,
    text: match.caseRecord.case_summary,
    confidence: match.score,
    matchedTerms: match.matchedTerms,
  }))
  const limitations = [
    ...(prepared?.limitations || []),
    'Analysis ran in the browser and was not persisted to Catalyst.',
    'A lexical match is an investigative lead, not proof that evidence belongs to a case.',
  ]
  const auditTrail = localAudit(uploaded, matchedCases.length)

  return {
    profile,
    uploaded: {
      ...uploaded,
      objectKey: null,
      persistence: 'browser-local-metadata',
    },
    dataVersion: DATA_VERSION,
    extracted: {
      parser: prepared?.parser || 'none',
      characters: prepared?.text?.length || 0,
      facts: [],
    },
    matchedCases: matchedCases.map((match) => ({
      ...match,
      station: getStation(match.caseRecord)?.station_name || match.caseRecord.station_id,
      legal: legalExplainabilityForCase(match.caseRecord),
      reasons: match.matchedTerms,
    })),
    sourceChunks,
    limitations,
    workflowEvents: blueprint.workflowEvents,
    auditTrail,
    report: {
      status: 'local-draft-only',
      renderer: 'browser-print',
      storageKey: null,
      approvalRequired: true,
    },
    leadSummary: matchedCases.length
      ? `${matchedCases.length} synthetic FIR candidates share terms with the actual parser output. Verify every source field before linking the evidence.`
      : 'No source-backed synthetic case match was found; the system did not invent a link.',
  }
}

export function buildEvidenceChatResponse(analysis) {
  const sources = analysis.matchedCases.map((match) => match.caseRecord.fir_id)
  return {
    conversationId: `EVLAB-${Date.now().toString().slice(-6)}`,
    role: 'Investigator',
    query: `Analyze prepared evidence: ${analysis.uploaded.name}`,
    timestamp: new Date().toISOString(),
    intent: 'EVIDENCE_INTELLIGENCE',
    answer: analysis.leadSummary,
    confidence: sources.length ? Math.max(...analysis.matchedCases.map((match) => match.score)) : 0,
    evidence: analysis.sourceChunks,
    sources,
    visuals: { evidenceLab: analysis },
    agents: [
      { agent: 'Evidence Parser', note: `Used ${analysis.extracted.parser} on the selected file`, status: 'complete' },
      { agent: 'Case Retriever', note: `Returned ${sources.length} source-backed candidates from data version ${analysis.dataVersion}`, status: 'complete' },
      { agent: 'Skeptic Review', note: 'Kept all matches as unverified investigative leads', status: 'complete' },
    ],
    nextSteps: [
      { id: 'STEP-1', text: 'Verify the selected file hash and parser limitations.' },
      { id: 'STEP-2', text: 'Open each cited synthetic FIR and compare the matched source fields.' },
      { id: 'STEP-3', text: 'Request supervisor review before including a link in a report.' },
    ],
    riskFlags: ['Synthetic data only', 'No automated identity or guilt conclusion', 'No server persistence in offline mode'],
    sourceChunks: analysis.sourceChunks,
    retrieval: {
      provider: 'Shared synthetic repository',
      mode: 'deterministic lexical field match',
      sourceCount: analysis.sourceChunks.length,
    },
    audit: {
      policy: 'local-metadata-only',
      sourceCount: sources.length,
      generatedAt: new Date().toISOString(),
      persisted: false,
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
