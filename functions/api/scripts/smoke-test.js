const assert = require('node:assert/strict')
const seed = require('../data/seed-data.json')

async function main() {
  const { createIntelligenceCore } = await import('../core/index.mjs')
  const core = createIntelligenceCore(seed, { total: 1000 })

  assert.equal(core.cases.length, 1000)
  assert.equal(core.dataset.label, 'SYNTHETIC DEMO DATA — NOT AN OPERATIONAL POLICE RECORD')

  const hotspot = core.answer('Mysuru alli chain snatching hotspot show maadi')
  assert.equal(hotspot.intent, 'HOTSPOT_QUERY')
  assert.ok(hotspot.citations.length > 0)

  const connection = core.answer('Are SYN-2025-BLR-001 and SYN-2025-BLR-014 connected?')
  assert.equal(connection.intent, 'CASE_LINK_QUERY')
  assert.ok(connection.answer.includes('PH-HASH-711'))

  const similar = core.similar('SYN-2025-BLR-001')
  assert.equal(similar.matches[0].fir_id, 'SYN-2025-BLR-014')
  assert.ok(similar.matches[0].factors.every((factor) => typeof factor.contribution === 'number'))

  const refusal = core.answer('What is the cricket score?')
  assert.equal(refusal.intent, 'OUT_OF_SCOPE')
  assert.equal(refusal.citations.length, 0)

  const evidence = core.analyzeEvidence({
    text: 'SYN-2025-BLR-001 contains PH-HASH-711 and BNS 303(2).',
    file: { name: 'synthetic-note.txt', type: 'text/plain', size: 58, sha256: 'a'.repeat(64) },
  })
  assert.equal(evidence.matchedCases[0].fir_id, 'SYN-2025-BLR-001')

  console.log('SAMVAAD-IQ shared-core smoke tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
