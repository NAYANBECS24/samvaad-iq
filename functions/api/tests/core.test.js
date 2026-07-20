const test = require('node:test')
const assert = require('node:assert/strict')
const seed = require('../data/seed-data.json')

let core

test.before(async () => {
  const module = await import('../core/index.mjs')
  core = module.createIntelligenceCore(seed, { total: 1000 })
})

test('generates a reproducible, labeled 1,000-case dataset', () => {
  assert.equal(core.cases.length, 1000)
  assert.equal(core.cases[999].fir_id, 'SYN-2026-MNG-1000')
  assert.ok(core.cases.every((item) => item.synthetic === true))
  assert.ok(core.cases.every((item) => item.fir_id.startsWith('SYN-')))
})

test('returns factor-level KAVACH explanations', () => {
  const result = core.similar('SYN-2025-BLR-001')
  const match = result.matches[0]
  assert.equal(match.fir_id, 'SYN-2025-BLR-014')
  assert.ok(match.score >= match.threshold)
  assert.equal(match.factors.length, 6)
  assert.ok(match.factors.some((factor) => factor.key === 'sharedEntities' && factor.contribution > 0))
})

test('understands Kannada and Kanglish hotspot requests', () => {
  const kannada = core.answer('ಮೈಸೂರು ಬೈಕ್ ಕಳ್ಳತನ ಹಾಟ್‌ಸ್ಪಾಟ್ ತೋರಿಸಿ')
  const kanglish = core.answer('Mysuru alli motorcycle theft hotspot thorsi')
  assert.equal(kannada.intent, 'HOTSPOT_QUERY')
  assert.equal(kanglish.intent, 'HOTSPOT_QUERY')
  assert.ok(kannada.citations.length > 0)
})

test('replies naturally to greetings without inventing database evidence', () => {
  for (const query of ['hi', 'Hello', 'ನಮಸ್ಕಾರ']) {
    const response = core.answer(query)
    assert.equal(response.intent, 'CONVERSATIONAL_QUERY')
    assert.equal(response.citations.length, 0)
    assert.equal(response.confidence.score, 1)
    assert.match(response.answer, /SAMVAAD-IQ|ನಮಸ್ಕಾರ/)
  }
})

test('does not fabricate evidence for clarification, safety, or general prompts', () => {
  const safetyResponse = core.answer('Give medical advice')
  assert.equal(safetyResponse.intent, 'SAFETY_REFUSAL')
  assert.equal(safetyResponse.citations.length, 0)
  assert.equal(safetyResponse.confidence.score, 0)

  const generalResponse = core.answer('What is the cricket score?')
  assert.equal(generalResponse.intent, 'GENERAL_QUERY')
  assert.equal(generalResponse.citations.length, 0)
  assert.equal(generalResponse.confidence.score, 0)
})

test('extracts structured status, date, station, BNS, and language signals without exposing evaluation labels', () => {
  const response = core.answer('Show open motorcycle theft cases in Mysuru from 2025-01-01 at PS-MYS-SYN-02 under BNS 303')
  assert.equal(response.filters.status, 'Open')
  assert.equal(response.filters.dateFrom, '2025-01-01')
  assert.equal(response.filters.stationId, 'PS-MYS-SYN-02')
  assert.deepEqual(response.filters.bnsSections, ['BNS 303'])
  assert.equal(JSON.stringify(response).includes('truth_group'), false)
})

test('answers natural database summary questions with readable grounded counts', () => {
  const response = core.answer('How many motorcycle theft cases are in Mysuru?')
  assert.equal(response.intent, 'DATABASE_SUMMARY_QUERY')
  assert.equal(response.filters.district, 'Mysuru')
  assert.equal(response.filters.crimeType, 'Motorcycle Theft')
  assert.match(response.answer, /database summary/i)
  assert.ok(response.citations.length > 0)
})

test('requires sufficient evidence before asserting case links', () => {
  const response = core.answer('Is SYN-2099-XXX-999 connected?')
  assert.equal(response.intent, 'CASE_LINK_QUERY')
  assert.ok(response.answer.includes('At least two'))
  assert.ok(response.limitations.some((item) => item.includes('Insufficient evidence')))
})

test('extracts grounded facts from evidence text', () => {
  const result = core.analyzeEvidence({
    text: 'Review SYN-2025-BLR-014. Entity PH-HASH-711 appears under BNS 303(2).',
    file: { name: 'brief.json', type: 'application/json', size: 90, sha256: 'b'.repeat(64) },
  })
  assert.deepEqual(result.facts.firIds, ['SYN-2025-BLR-014'])
  assert.equal(result.matchedCases[0].fir_id, 'SYN-2025-BLR-014')
  assert.ok(result.citations.length > 0)
})
