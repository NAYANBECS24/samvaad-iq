const test = require('node:test')
const assert = require('node:assert/strict')

test('investigation insights expose timeline, contradictions, entities, coverage, and pipeline', async () => {
  const { enrichInvestigationResult } = await import('../core/insights.mjs')
  const result = enrichInvestigationResult({
    intent: 'CASE_LINK_QUERY',
    filters: { firIds: ['SYN-2025-BLR-001', 'SYN-2025-BLR-014'] },
    answer: 'The cited records share a hashed phone [SYN-2025-BLR-001] [SYN-2025-BLR-014].',
    citations: [
      { firId: 'SYN-2025-BLR-001' },
      { firId: 'SYN-2025-BLR-014' },
    ],
    evidence: [
      { fir_id: 'SYN-2025-BLR-001', date: '2025-02-10', time: '20:10', district: 'Bengaluru South', station_id: 'PS-1', crime_type: 'Motorcycle Theft', status: 'Open', phone_hash: 'PH-HASH-711', vehicle: 'NA', case_summary: 'First synthetic record.' },
      { fir_id: 'SYN-2025-BLR-014', date: '2025-01-04', time: '18:45', district: 'Mysuru', station_id: 'PS-2', crime_type: 'Chain Snatching', status: 'Chargesheeted', phone_hash: 'PH-HASH-711', vehicle: 'NA', case_summary: 'Second synthetic record.' },
    ],
    confidence: { score: 0.8, band: 'high' },
    limitations: [],
    nextActions: [],
    visualizations: { crimeDna: { factors: [] } },
    modelSignals: { generativeAnswer: { model: 'z-ai/glm-5.2' } },
  }, { answerMode: 'contradictions', contextUsed: true })

  assert.equal(result.responseMode, 'contradictions')
  assert.equal(result.investigationInsights.timeline[0].firId, 'SYN-2025-BLR-014')
  assert.equal(result.investigationInsights.coverage.evidenceCoverage, 100)
  assert.equal(result.investigationInsights.coverage.answerIdCoverage, 100)
  assert.ok(result.investigationInsights.consistencyChecks.some((item) => item.title === 'Shared hashed phone signal'))
  assert.deepEqual(result.investigationInsights.entities.districts.sort(), ['Bengaluru South', 'Mysuru'])
  assert.equal(result.pipeline.length, 6)
  assert.match(result.pipeline[0].detail, /Follow-up context/)
  assert.equal(result.pipeline[4].label, 'NVIDIA grounded response')
})

test('investigation insights flag an answer FIR that is not in the citation set', async () => {
  const { enrichInvestigationResult } = await import('../core/insights.mjs')
  const result = enrichInvestigationResult({
    intent: 'CASE_SEARCH_QUERY',
    filters: {},
    answer: 'Review SYN-2025-BLR-999.',
    citations: [{ firId: 'SYN-2025-BLR-001' }],
    evidence: [{ fir_id: 'SYN-2025-BLR-001', date: '2025-01-01' }],
    confidence: { score: 0.4, band: 'low' },
    limitations: [],
    nextActions: [],
    visualizations: {},
  })

  assert.equal(result.investigationInsights.coverage.status, 'review')
  assert.deepEqual(result.investigationInsights.coverage.unsupportedAnswerIds, ['SYN-2025-BLR-999'])
  assert.equal(result.pipeline.at(-1).status, 'review')
})
