const assert = require('assert')
const { answerQuery } = require('../modules/queryEngine')
const { findSimilarCases } = require('../modules/crimeDNA')
const { buildGraph } = require('../modules/graphBuilder')
const { getHotspots } = require('../modules/hotspotEngine')
const { patrolWhatIf } = require('../modules/patrolEngine')
const { legalExplainabilityForCase } = require('../modules/legalXai')
const { buildDiffusionModel } = require('../modules/diffusionEngine')

const hotspot = answerQuery('Last 6 months alli Mysuru division chain snatching hotspots show maadi', 'Investigator')
assert.strictEqual(hotspot.intent, 'HOTSPOT_QUERY')
assert.ok(hotspot.answer.includes('Mysuru'))

const connection = answerQuery('Are FIR-2025-BLR-001 and FIR-2025-BLR-014 connected?', 'Investigator')
assert.strictEqual(connection.intent, 'CASE_LINK_QUERY')
assert.ok(connection.answer.includes('A-112'))

const similar = findSimilarCases('FIR-2025-BLR-027')
assert.strictEqual(similar.matches[0].fir_id, 'FIR-2025-BLR-033')

const graph = buildGraph('FIR-2025-BLR-001')
assert.ok(graph.nodes.length > 0)
assert.ok(graph.edges.length > 0)

const hotspots = getHotspots({ district: 'Mysuru', crimeType: 'Chain Snatching' })
assert.strictEqual(hotspots.points.length, 2)
assert.ok(hotspots.clusters.length >= 1)

const report = answerQuery('Generate PDF report for the motorcycle theft cluster', 'Supervisor')
assert.strictEqual(report.intent, 'LEGAL_REPORT')
assert.ok(report.visuals.report.html.includes('Evidence Trail'))

const simulation = patrolWhatIf({ district: 'Mysuru', crimeType: 'Motorcycle Theft', units: 3 })
assert.ok(simulation.displacementZones.length >= 1)

const legal = legalExplainabilityForCase('FIR-1003')
assert.ok(legal.privacyTag.includes('Hashed'))

const diffusion = buildDiffusionModel({ district: 'Mysuru', crimeType: 'Motorcycle Theft' })
assert.ok(diffusion.rc > 0)

console.log('SAMVAAD-IQ API smoke tests passed')
