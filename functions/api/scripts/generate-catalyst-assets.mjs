import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crimeDna, generateSyntheticDataset } from '../core/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const apiRoot = resolve(here, '..')
const repoRoot = resolve(apiRoot, '..', '..')
const outputDir = resolve(repoRoot, 'data', 'generated')
const seed = JSON.parse(await readFile(resolve(apiRoot, 'data', 'seed-data.json'), 'utf8'))
const dataset = generateSyntheticDataset(seed, 1000, 20260717)

function csvCell(value) {
  const normalized = Array.isArray(value) ? JSON.stringify(value) : value == null ? '' : String(value)
  return /[",\r\n]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized
}

function toCsv(rows, columns) {
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\n')}\n`
}

const caseColumns = [
  'fir_id', 'source_seed_id', 'district', 'station_id', 'crime_type', 'date', 'time', 'lat', 'lon', 'status', 'mo',
  'case_summary', 'bns_sections', 'accused_ids', 'victim_id', 'vehicle', 'phone_hash', 'truth_group', 'synthetic', 'data_label',
]
const stationColumns = ['station_id', 'station_name', 'district', 'synthetic']

const positives = []
const negatives = []
for (let leftIndex = 0; leftIndex < dataset.cases.length; leftIndex += 1) {
  const left = dataset.cases[leftIndex]
  for (let rightIndex = leftIndex + 1; rightIndex < dataset.cases.length; rightIndex += 1) {
    const right = dataset.cases[rightIndex]
    const isLinked = Boolean(left.truth_group && left.truth_group === right.truth_group)
    if (!isLinked && (leftIndex * 37 + rightIndex * 17) % 401 !== 0) continue
    const analysis = crimeDna(left, right)
    const factors = Object.fromEntries(analysis.factors.map((factor) => [factor.key, factor.score]))
    const row = {
      pair_id: `${left.fir_id}|${right.fir_id}`,
      left_fir_id: left.fir_id,
      right_fir_id: right.fir_id,
      crime_type_match: factors.crimeType,
      mo_similarity: factors.modusOperandi,
      geography_match: factors.geography,
      time_pattern_match: factors.timePattern,
      shared_entity_score: factors.sharedEntities,
      narrative_similarity: factors.summary,
      deterministic_score: analysis.score,
      linked: isLinked ? 1 : 0,
      truth_group: isLinked ? left.truth_group : '',
    }
    if (isLinked) positives.push(row)
    else negatives.push(row)
  }
}

const trainingRows = [...positives, ...negatives.slice(0, Math.max(positives.length * 3, 1200))]
  .sort((left, right) => left.pair_id.localeCompare(right.pair_id))
const trainingColumns = [
  'pair_id', 'left_fir_id', 'right_fir_id', 'crime_type_match', 'mo_similarity', 'geography_match', 'time_pattern_match',
  'shared_entity_score', 'narrative_similarity', 'deterministic_score', 'linked', 'truth_group',
]

await mkdir(outputDir, { recursive: true })
await writeFile(resolve(outputDir, 'cases-1000.csv'), toCsv(dataset.cases, caseColumns))
await writeFile(resolve(outputDir, 'stations.csv'), toCsv(dataset.stations, stationColumns))
await writeFile(resolve(outputDir, 'quickml-case-link-training.csv'), toCsv(trainingRows, trainingColumns))
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify({
  generatedForRelease: '2026-07-17',
  seed: 20260717,
  label: dataset.label,
  dataVersion: dataset.version,
  cases: dataset.cases.length,
  stations: dataset.stations.length,
  plantedPatterns: dataset.truthGroups,
  plantedCases: dataset.cases.filter((item) => item.truth_group).length,
  quickMlRows: trainingRows.length,
  quickMlPositiveRows: positives.length,
  quickMlTarget: 'linked',
}, null, 2)}\n`)

console.log(`Generated ${dataset.cases.length} cases and ${trainingRows.length} QuickML training rows in ${outputDir}`)
