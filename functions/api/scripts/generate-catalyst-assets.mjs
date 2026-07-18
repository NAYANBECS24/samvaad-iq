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

function evaluationFamily(caseRecord) {
  const opaquePhone = String(caseRecord?.phone_hash || '')
  return /^PH-SYN-[A-F0-9]{8}$/.test(opaquePhone) ? opaquePhone : null
}

function csvCell(value) {
  const normalized = Array.isArray(value) ? JSON.stringify(value) : value == null ? '' : String(value)
  return /[",\r\n]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized
}

function toCsv(rows, columns) {
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\n')}\n`
}

const caseColumns = [
  'fir_id', 'district', 'station_id', 'crime_type', 'date', 'time', 'lat', 'lon', 'status', 'mo',
  'case_summary', 'bns_sections', 'accused_ids', 'victim_id', 'vehicle', 'phone_hash', 'synthetic', 'data_label',
]
const stationColumns = ['station_id', 'station_name', 'station_name_kn', 'district', 'district_kn', 'synthetic']

const districtKannada = {
  'Bengaluru South': 'ಬೆಂಗಳೂರು ದಕ್ಷಿಣ',
  Mysuru: 'ಮೈಸೂರು',
  'Hubballi-Dharwad': 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ',
  Mangaluru: 'ಮಂಗಳೂರು',
  Belagavi: 'ಬೆಳಗಾವಿ',
  Kalaburagi: 'ಕಲಬುರಗಿ',
}
const crimeKannada = {
  'Motorcycle Theft': 'ದ್ವಿಚಕ್ರ ವಾಹನ ಕಳವು',
  'Chain Snatching': 'ಸರ ಕಳವು',
  'UPI Fraud': 'ಯುಪಿಐ ವಂಚನೆ',
  'House Burglary': 'ಮನೆ ಕಳ್ಳತನ',
}
const stationKannada = {
  'PS-BLR-JYN': 'ಜಯನಗರ ಪೊಲೀಸ್ ಠಾಣೆ',
  'PS-BLR-BSK': 'ಬನಶಂಕರಿ ಪೊಲೀಸ್ ಠಾಣೆ',
  'PS-MYS-LKR': 'ಲಷ್ಕರ್ ಪೊಲೀಸ್ ಠಾಣೆ',
  'PS-MYS-VVP': 'ವಿ.ವಿ. ಪುರಂ ಪೊಲೀಸ್ ಠಾಣೆ',
  'PS-HUB-KES': 'ಕೇಶ್ವಾಪುರ ಪೊಲೀಸ್ ಠಾಣೆ',
  'PS-MNG-PAN': 'ಪಣಂಬೂರು ಪೊಲೀಸ್ ಠಾಣೆ',
  'PS-MYS-DVR': 'ದೇವರಾಜ ಪೊಲೀಸ್ ಠಾಣೆ',
}

const positives = []
const negatives = []
for (let leftIndex = 0; leftIndex < dataset.cases.length; leftIndex += 1) {
  const left = dataset.cases[leftIndex]
  for (let rightIndex = leftIndex + 1; rightIndex < dataset.cases.length; rightIndex += 1) {
    const right = dataset.cases[rightIndex]
    const leftFamily = evaluationFamily(left)
    const isLinked = Boolean(leftFamily && leftFamily === evaluationFamily(right))
    if (!isLinked && (leftIndex * 37 + rightIndex * 17) % 401 !== 0) continue
    const analysis = crimeDna(left, right)
    const factors = Object.fromEntries(analysis.factors.map((factor) => [factor.key, factor.score]))
    const splitBucket = (leftIndex * 31 + rightIndex * 17) % 10
    const row = {
      crime_type_match: factors.crimeType,
      mo_similarity: factors.modusOperandi,
      geography_match: factors.geography,
      time_pattern_match: factors.timePattern,
      shared_entity_score: factors.sharedEntities,
      narrative_similarity: factors.summary,
      linked: isLinked ? 1 : 0,
      split: splitBucket < 7 ? 'train' : splitBucket < 9 ? 'validation' : 'test',
    }
    if (isLinked) positives.push(row)
    else negatives.push(row)
  }
}

const trainingRows = [...positives, ...negatives.slice(0, Math.max(positives.length * 3, 1200))]
  .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
const trainingColumns = [
  'crime_type_match', 'mo_similarity', 'geography_match', 'time_pattern_match', 'shared_entity_score',
  'narrative_similarity', 'linked', 'split',
]

const DAY_MS = 24 * 60 * 60 * 1000
const crimeTypes = [...new Set(dataset.cases.map((item) => item.crime_type))].sort()

function weekStart(value) {
  const date = new Date(`${value}T00:00:00Z`)
  const mondayOffset = (date.getUTCDay() + 6) % 7
  return new Date(date.getTime() - mondayOffset * DAY_MS).toISOString().slice(0, 10)
}

function weekOfYear(value) {
  const date = new Date(`${value}T00:00:00Z`)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date - yearStart) / DAY_MS + yearStart.getUTCDay() + 1) / 7)
}

function incidentBand(time) {
  const hour = Number(String(time).split(':')[0])
  return hour >= 20 || hour < 5 ? 'night' : 'day'
}

const firstWeek = weekStart(dataset.cases.reduce((earliest, item) => item.date < earliest ? item.date : earliest, dataset.cases[0].date))
const lastWeek = weekStart(dataset.cases.reduce((latest, item) => item.date > latest ? item.date : latest, dataset.cases[0].date))
const weeks = []
for (let cursor = new Date(`${firstWeek}T00:00:00Z`); cursor <= new Date(`${lastWeek}T00:00:00Z`); cursor = new Date(cursor.getTime() + 7 * DAY_MS)) {
  weeks.push(cursor.toISOString().slice(0, 10))
}

const weeklyCounts = new Map()
for (const caseRecord of dataset.cases) {
  const key = `${caseRecord.station_id}|${caseRecord.crime_type}|${weekStart(caseRecord.date)}`
  const current = weeklyCounts.get(key) || { total: 0, night: 0 }
  current.total += 1
  if (incidentBand(caseRecord.time) === 'night') current.night += 1
  weeklyCounts.set(key, current)
}

const aggregateRows = []
for (const station of dataset.stations) {
  for (const crimeType of crimeTypes) {
    for (let index = 4; index < weeks.length - 1; index += 1) {
      const history = weeks.slice(index - 4, index).map((week) => weeklyCounts.get(`${station.station_id}|${crimeType}|${week}`) || { total: 0, night: 0 })
      const previous = history.at(-1).total
      const mean = history.reduce((sum, item) => sum + item.total, 0) / history.length
      const variance = history.reduce((sum, item) => sum + (item.total - mean) ** 2, 0) / history.length
      const totalHistory = history.reduce((sum, item) => sum + item.total, 0)
      const nightHistory = history.reduce((sum, item) => sum + item.night, 0)
      const currentWeek = weeks[index]
      const next = weeklyCounts.get(`${station.station_id}|${crimeType}|${weeks[index + 1]}`)?.total || 0
      const weekNumber = weekOfYear(currentWeek)
      const split = index < Math.floor(weeks.length * 0.7) ? 'train' : index < Math.floor(weeks.length * 0.85) ? 'validation' : 'test'
      aggregateRows.push({
        district: station.district,
        station_id: station.station_id,
        crime_type: crimeType,
        week_start: currentWeek,
        week_of_year: weekNumber,
        month: Number(currentWeek.slice(5, 7)),
        previous_week_count: previous,
        rolling_4w_mean: Number(mean.toFixed(4)),
        rolling_4w_std: Number(Math.sqrt(variance).toFixed(4)),
        trend_4w: history.at(-1).total - history[0].total,
        night_share_4w: Number((nightHistory / Math.max(1, totalHistory)).toFixed(4)),
        seasonality_sin: Number(Math.sin((2 * Math.PI * weekNumber) / 52).toFixed(6)),
        seasonality_cos: Number(Math.cos((2 * Math.PI * weekNumber) / 52).toFixed(6)),
        target_next_week_count: next,
        split,
      })
    }
  }
}
const aggregateColumns = [
  'district', 'station_id', 'crime_type', 'week_start', 'week_of_year', 'month', 'previous_week_count',
  'rolling_4w_mean', 'rolling_4w_std', 'trend_4w', 'night_share_4w', 'seasonality_sin', 'seasonality_cos',
  'target_next_week_count', 'split',
]
const publicCases = dataset.cases.map((caseRecord) => ({ ...caseRecord }))
const publicStations = dataset.stations.map((station, index) => ({
  ...station,
  station_name_kn: stationKannada[station.station_id] || `ಕೃತಕ ಪೊಲೀಸ್ ಠಾಣೆ ${String(index + 1).padStart(2, '0')}`,
  district_kn: districtKannada[station.district] || station.district,
}))
const caseTranslations = publicCases.flatMap((caseRecord) => {
  const districtKn = districtKannada[caseRecord.district] || caseRecord.district
  const crimeKn = crimeKannada[caseRecord.crime_type] || caseRecord.crime_type
  return [
    {
      fir_id: caseRecord.fir_id,
      data_version: dataset.version,
      language: 'en',
      case_summary: caseRecord.case_summary,
      mo: caseRecord.mo,
      crime_type_label: caseRecord.crime_type,
      district_label: caseRecord.district,
    },
    {
      fir_id: caseRecord.fir_id,
      data_version: dataset.version,
      language: 'kn',
      case_summary: `ಕೃತಕ ಪ್ರಕರಣ ದಾಖಲೆ: ${districtKn} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${crimeKn}. ಪರಿಶೀಲನೆಗಾಗಿ ${caseRecord.fir_id} ಮೂಲ ದಾಖಲೆಯನ್ನು ನೋಡಿ.`,
      mo: `ಕಾರ್ಯವಿಧಾನದ ಸಂಪೂರ್ಣ ವಿವರವನ್ನು ${caseRecord.fir_id} ಇಂಗ್ಲಿಷ್ ಮೂಲ ದಾಖಲೆಯೊಂದಿಗೆ ಮಾನವ ಪರಿಶೀಲನೆ ಮಾಡಬೇಕು.`,
      crime_type_label: crimeKn,
      district_label: districtKn,
    },
  ]
})
const evaluationTruth = dataset.cases
  .filter((item) => evaluationFamily(item))
  .map((item, index) => ({
    fir_id: item.fir_id,
    truth_group: evaluationFamily(item),
    split: index % 10 < 7 ? 'train' : index % 10 < 9 ? 'validation' : 'test',
    seed: 20260717,
  }))

await mkdir(outputDir, { recursive: true })
await writeFile(resolve(outputDir, 'cases-1000.csv'), toCsv(publicCases, caseColumns))
await writeFile(resolve(outputDir, 'case-translations.csv'), toCsv(caseTranslations, ['fir_id', 'data_version', 'language', 'case_summary', 'mo', 'crime_type_label', 'district_label']))
await writeFile(resolve(outputDir, 'stations.csv'), toCsv(publicStations, stationColumns))
await writeFile(resolve(outputDir, 'quickml-case-link-training.csv'), toCsv(trainingRows, trainingColumns))
await writeFile(resolve(outputDir, 'quickml-area-pattern-training.csv'), toCsv(aggregateRows, aggregateColumns))
await writeFile(resolve(outputDir, 'evaluation-truth.csv'), toCsv(evaluationTruth, ['fir_id', 'truth_group', 'split', 'seed']))
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify({
  generatedForRelease: '2026-07-17',
  seed: 20260717,
  label: dataset.label,
  dataVersion: dataset.version,
  cases: dataset.cases.length,
  stations: dataset.stations.length,
  caseTranslationRows: caseTranslations.length,
  plantedPatternFamilies: dataset.plantedPatternFamilies,
  plantedCases: evaluationTruth.length,
  quickMlCaseLinkRows: trainingRows.length,
  quickMlCaseLinkPositiveRows: positives.length,
  quickMlCaseLinkTarget: 'linked',
  quickMlAreaPatternRows: aggregateRows.length,
  quickMlAreaPatternTarget: 'target_next_week_count',
  evaluationTruthRows: evaluationTruth.length,
  modelStatus: 'training-artifacts-only-not-live',
  leakageControls: ['no FIR IDs in case-link features', 'no truth_group in runtime cases', 'no deterministic final score as a model feature', 'no person fields in area-pattern features'],
}, null, 2)}\n`)

console.log(`Generated ${dataset.cases.length} public cases, ${trainingRows.length} case-link rows, and ${aggregateRows.length} aggregate pattern rows in ${outputDir}`)
