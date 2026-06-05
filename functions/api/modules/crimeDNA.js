const { cases } = require('./seedData')

const stopWords = new Set(['the', 'and', 'near', 'case', 'cases', 'with', 'from', 'for', 'into', 'after'])

function tokens(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  )
}

function sharedEntities(a, b) {
  const shared = []
  a.accused_ids.forEach((id) => {
    if (b.accused_ids.includes(id)) shared.push(id)
  })
  if (a.phone_hash && a.phone_hash !== 'NA' && a.phone_hash === b.phone_hash) shared.push(a.phone_hash)
  if (a.vehicle && a.vehicle !== 'NA' && a.vehicle === b.vehicle) shared.push(a.vehicle)
  return shared
}

function moSimilarity(a, b) {
  const left = tokens(a.mo)
  const right = tokens(b.mo)
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  return [...left].filter((token) => right.has(token)).length / union.size
}

function summarySimilarity(a, b) {
  const left = tokens(a.case_summary || '')
  const right = tokens(b.case_summary || '')
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  return [...left].filter((token) => right.has(token)).length / union.size
}

function timeBand(time) {
  const hour = Number(time.split(':')[0])
  if (hour >= 0 && hour < 5) return 'late-night'
  if (hour >= 17 && hour < 21) return 'evening'
  if (hour >= 21) return 'night'
  return 'day'
}

function crimeDNAScore(a, b) {
  const score =
    0.3 * Number(a.crime_type === b.crime_type) +
    0.2 * moSimilarity(a, b) +
    0.15 * (a.district === b.district ? 0.78 : 0.25) +
    0.15 * Number(timeBand(a.time) === timeBand(b.time)) +
    0.1 * Math.min(1, sharedEntities(a, b).length / 2) +
    0.1 * summarySimilarity(a, b)

  return Number(Math.min(0.96, score).toFixed(2))
}

function explainMatch(a, b) {
  const reasons = []
  if (a.crime_type === b.crime_type) reasons.push(`same crime type: ${a.crime_type}`)
  if (timeBand(a.time) === timeBand(b.time)) reasons.push(`${timeBand(a.time)} time pattern`)
  if (a.district === b.district) reasons.push(`${a.district} geography`)
  reasons.push(...sharedEntities(a, b))
  if (moSimilarity(a, b) > 0.2) reasons.push('similar MO wording')
  return reasons
}

function findSimilarCases(firId) {
  const source = cases.find((caseRecord) => caseRecord.fir_id === firId)
  if (!source) return { source: null, matches: [] }

  const matches = cases
    .filter((caseRecord) => caseRecord.fir_id !== firId)
    .map((caseRecord) => ({
      fir_id: caseRecord.fir_id,
      score: crimeDNAScore(source, caseRecord),
      reason: explainMatch(source, caseRecord).join(', '),
      case: caseRecord,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return { source, matches }
}

module.exports = {
  crimeDNAScore,
  explainMatch,
  findSimilarCases,
  sharedEntities,
  summarySimilarity,
}
