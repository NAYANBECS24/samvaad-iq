const assert = require('node:assert/strict')
const { performance } = require('node:perf_hooks')
const seed = require('../data/seed-data.json')

const scenarios = [
  ['Mysuru motorcycle theft hotspot show maadi', 'HOTSPOT_QUERY', true],
  ['ಮೈಸೂರು ಬೈಕ್ ಕಳ್ಳತನ ಹಾಟ್‌ಸ್ಪಾಟ್ ತೋರಿಸಿ', 'HOTSPOT_QUERY', true],
  ['Show chain snatching hotspots in Mysuru', 'HOTSPOT_QUERY', true],
  ['Where are UPI fraud patterns in Mangaluru?', 'HOTSPOT_QUERY', true],
  ['Map motorcycle theft in Bengaluru South', 'HOTSPOT_QUERY', true],
  ['Are SYN-2025-BLR-001 and SYN-2025-BLR-014 connected?', 'CASE_LINK_QUERY', true],
  ['Link SYN-2025-MYS-006 with SYN-2025-MYS-011', 'CASE_LINK_QUERY', true],
  ['Show network link between two motorcycle theft cases', 'CASE_LINK_QUERY', true],
  ['Find similar cases to SYN-2025-BLR-001', 'SIMILAR_CASE_QUERY', true],
  ['Match SYN-2025-BLR-027 using Crime DNA', 'SIMILAR_CASE_QUERY', true],
  ['Find cold unsolved burglary matches', 'SIMILAR_CASE_QUERY', true],
  ['ಕಳ್ಳತನ ಪ್ರಕರಣಗಳಿಗೆ ಹೋಲುವ ಪ್ರಕರಣ ತೋರಿಸಿ', 'SIMILAR_CASE_QUERY', true],
  ['What if 3 patrol units are added in Mysuru?', 'SCENARIO_QUERY', true],
  ['Model 5 units for motorcycle theft in Bengaluru South', 'SCENARIO_QUERY', true],
  ['Patrol scenario for chain snatching in Mysuru', 'SCENARIO_QUERY', true],
  ['Generate PDF report for SYN-2025-BLR-001', 'REPORT_QUERY', true],
  ['Prepare a case brief for motorcycle theft', 'REPORT_QUERY', true],
  ['Summarize SYN-2025-BLR-001', 'CASE_SEARCH_QUERY', true],
  ['Show motorcycle theft cases', 'CASE_SEARCH_QUERY', true],
  ['Find UPI fraud FIRs in Mangaluru', 'CASE_SEARCH_QUERY', true],
  ['Bengaluru burglary cases', 'CASE_SEARCH_QUERY', true],
  ['ತೋರಿಸಿ', 'AMBIGUOUS_QUERY', false],
  ['hello', 'CONVERSATIONAL_QUERY', false],
  ['Explain quantum physics', 'AMBIGUOUS_QUERY', false],
  ['What is the cricket score?', 'OUT_OF_SCOPE', false],
  ['Give medical advice', 'OUT_OF_SCOPE', false],
  ['Show stock prices', 'OUT_OF_SCOPE', false],
  ['Weather in Mysuru', 'OUT_OF_SCOPE', false],
  ['Election result', 'OUT_OF_SCOPE', false],
  ['Movie recommendation', 'OUT_OF_SCOPE', false],
]

async function main() {
  const { createIntelligenceCore, crimeDna } = await import('../core/index.mjs')
  const core = createIntelligenceCore(seed, { total: 1000 })
  let correct = 0
  let grounded = 0
  let expectedGrounded = 0
  let refusalFailures = 0
  const latencies = []
  const failures = []

  for (const [query, expectedIntent, shouldCite] of scenarios) {
    const started = performance.now()
    const response = core.answer(query)
    latencies.push(performance.now() - started)
    if (response.intent === expectedIntent) correct += 1
    else failures.push({ query, expectedIntent, actualIntent: response.intent })
    if (shouldCite) {
      expectedGrounded += 1
      if (response.citations.length > 0) grounded += 1
      else failures.push({ query, expectedIntent, issue: 'missing-citation' })
    } else if (response.citations.length > 0) {
      refusalFailures += 1
    }
  }

  const sorted = [...latencies].sort((a, b) => a - b)
  const intentAccuracy = correct / scenarios.length
  const citationCoverage = grounded / expectedGrounded
  const p95Ms = sorted[Math.ceil(sorted.length * 0.95) - 1]
  let highConfidenceTruePositives = 0
  let highConfidenceFalsePositives = 0
  let plantedPositivePairs = 0
  let detectedPlantedPairs = 0
  for (let leftIndex = 0; leftIndex < core.cases.length; leftIndex += 1) {
    const left = core.cases[leftIndex]
    for (let rightIndex = leftIndex + 1; rightIndex < core.cases.length; rightIndex += 1) {
      const right = core.cases[rightIndex]
      const isPlantedLink = Boolean(left.truth_group && left.truth_group === right.truth_group)
      if (!isPlantedLink && (leftIndex * 37 + rightIndex * 17) % 401 !== 0) continue
      const isHighConfidence = crimeDna(left, right).score >= 0.72
      if (isPlantedLink) {
        plantedPositivePairs += 1
        if (isHighConfidence) {
          detectedPlantedPairs += 1
          highConfidenceTruePositives += 1
        }
      } else if (isHighConfidence) {
        highConfidenceFalsePositives += 1
      }
    }
  }
  const linkPrecision = highConfidenceTruePositives / Math.max(1, highConfidenceTruePositives + highConfidenceFalsePositives)
  const plantedRecall = detectedPlantedPairs / Math.max(1, plantedPositivePairs)
  const metrics = {
    datasetCases: core.cases.length,
    evaluationQueries: scenarios.length,
    intentAccuracy: Number(intentAccuracy.toFixed(3)),
    citationCoverage: Number(citationCoverage.toFixed(3)),
    refusalFabricationFailures: refusalFailures,
    deterministicP95Ms: Number(p95Ms.toFixed(2)),
    highConfidenceLinkPrecision: Number(linkPrecision.toFixed(3)),
    plantedLinkRecall: Number(plantedRecall.toFixed(3)),
    evaluatedPlantedPairs: plantedPositivePairs,
    failures,
  }

  console.log(JSON.stringify(metrics, null, 2))
  assert.ok(intentAccuracy >= 0.9, `intent accuracy ${intentAccuracy}`)
  assert.equal(citationCoverage, 1)
  assert.equal(refusalFailures, 0)
  assert.ok(p95Ms < 2000)
  assert.ok(linkPrecision >= 0.9, `high-confidence link precision ${linkPrecision}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
