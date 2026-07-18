const { readFile } = require('node:fs/promises')
const { resolve } = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { caseToDataStoreRow, publicCase, quickMlFeatures } = require('../core/runtimeProjection.cjs')

const generated = resolve(__dirname, '..', '..', '..', 'data', 'generated')

async function header(name) {
  const content = await readFile(resolve(generated, name), 'utf8')
  return content.split(/\r?\n/, 1)[0].split(',')
}

test('runtime case artifact excludes planted evaluation labels', async () => {
  const columns = await header('cases-1000.csv')
  const content = await readFile(resolve(generated, 'cases-1000.csv'), 'utf8')
  assert.equal(columns.includes('truth_group'), false)
  assert.equal(columns.includes('evaluation_label'), false)
  assert.equal(columns.includes('synthetic'), true)
  assert.equal(columns.includes('data_label'), true)
  assert.doesNotMatch(content, /Planted evaluation pattern|RING-[A-Z-]+|COLD-MO-RETURN/)
  assert.doesNotMatch(content, /PH-SYN-GROUP|A-SYN-[1-6]00/)
  assert.match(content, /PH-SYN-[A-F0-9]{8}/)
})

test('runtime and Catalyst projections strip restricted evaluation fields', () => {
  const source = {
    fir_id: 'SYN-TEST-0001',
    district: 'Synthetic District',
    station_id: 'SYN-STATION',
    crime_type: 'Synthetic Test',
    date: '2026-01-01',
    time: '10:00',
    lat: 12.3,
    lon: 76.6,
    status: 'Open',
    mo: 'Synthetic modus operandi.',
    case_summary: 'Synthetic case.',
    bns_sections: 'NA',
    accused_ids: [],
    truth_group: 'RESTRICTED-GROUP',
    truthGroup: 'RESTRICTED-CAMEL',
    evaluation_label: 'positive',
  }

  const runtime = publicCase(source)
  const dataStore = caseToDataStoreRow(source)
  for (const projection of [runtime, dataStore]) {
    assert.equal(Object.hasOwn(projection, 'truth_group'), false)
    assert.equal(Object.hasOwn(projection, 'truthGroup'), false)
    assert.equal(Object.hasOwn(projection, 'evaluation_label'), false)
    assert.equal(JSON.stringify(projection).includes('RESTRICTED-GROUP'), false)
  }
  assert.equal(Object.hasOwn(runtime, 'source_seed_id'), false)
  assert.equal(Object.hasOwn(dataStore, 'source_seed_id'), false)
  assert.equal(dataStore.synthetic, true)
})

test('runtime QuickML features exclude IDs, truth labels, and deterministic final scores', () => {
  const features = quickMlFeatures({
    score: 0.99,
    fir_id: 'SYN-SECRET-0001',
    truth_group: 'RESTRICTED-GROUP',
    factors: [
      { key: 'crimeType', score: 1 },
      { key: 'modusOperandi', score: 0.8 },
      { key: 'sharedEntities', score: 0.5 },
    ],
  })
  for (const field of ['fir_id', 'truth_group', 'deterministic_score', 'score']) assert.equal(Object.hasOwn(features, field), false)
  assert.equal(features.crime_type_match, 1)
  assert.equal(features.mo_similarity, 0.8)
})

test('case-link features prevent identifier and score leakage', async () => {
  const columns = await header('quickml-case-link-training.csv')
  for (const forbidden of ['pair_id', 'left_fir_id', 'right_fir_id', 'truth_group', 'deterministic_score']) {
    assert.equal(columns.includes(forbidden), false, `${forbidden} must not be a model feature`)
  }
  assert.equal(columns.includes('linked'), true)
  assert.equal(columns.includes('split'), true)
})

test('aggregate pattern training is area/time/category only', async () => {
  const columns = await header('quickml-area-pattern-training.csv')
  for (const forbidden of ['fir_id', 'accused_id', 'victim_id', 'phone_hash', 'vehicle', 'person_risk']) {
    assert.equal(columns.includes(forbidden), false, `${forbidden} must not enter aggregate pattern training`)
  }
  for (const required of ['district', 'station_id', 'crime_type', 'week_start', 'rolling_4w_mean', 'target_next_week_count', 'split']) {
    assert.equal(columns.includes(required), true, `${required} is required`)
  }
})

test('bilingual projection and artifact manifest are reproducible', async () => {
  const translations = await readFile(resolve(generated, 'case-translations.csv'), 'utf8')
  const manifest = JSON.parse(await readFile(resolve(generated, 'manifest.json'), 'utf8'))
  assert.equal(manifest.caseTranslationRows, 2000)
  assert.equal(manifest.quickMlAreaPatternRows, 6935)
  assert.equal(manifest.modelStatus, 'training-artifacts-only-not-live')
  assert.match(translations, /,en,/)
  assert.match(translations, /,kn,/)
  assert.match(translations, /ಕೃತಕ ಪ್ರಕರಣ ದಾಖಲೆ/)
})
