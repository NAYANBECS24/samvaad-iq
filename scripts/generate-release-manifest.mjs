import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const readJson = async (relativePath) => JSON.parse(await readFile(resolve(root, relativePath), 'utf8'))

const [workspace, data, evaluation] = await Promise.all([
  readJson('package.json'),
  readJson('data/generated/manifest.json'),
  readJson('data/generated/evaluation-metrics.json'),
])

const manifest = {
  schemaVersion: 1,
  release: {
    product: 'NETRA OS',
    copilot: 'SAMVAAD-IQ',
    kernel: 'KAVACH',
    challenge: 'KSP Datathon 2026 Challenge 1',
    version: workspace.version,
    baselineTag: 'pre-netra-os-edef150',
  },
  data: {
    version: data.dataVersion,
    label: data.label,
    seed: data.seed,
    cases: data.cases,
    browserFallbackCases: 250,
    stations: data.stations,
    translationRows: data.caseTranslationRows,
    plantedPatternFamilies: data.plantedPatternFamilies,
    restrictedEvaluationRows: data.evaluationTruthRows,
  },
  metrics: {
    source: 'data/generated/evaluation-metrics.json',
    evaluationQueries: evaluation.evaluationQueries,
    intentAccuracy: evaluation.intentAccuracy,
    citationCoverage: evaluation.citationCoverage,
    refusalFabricationFailures: evaluation.refusalFabricationFailures,
    deterministicP95Ms: evaluation.deterministicP95Ms,
    highConfidenceLinkPrecision: evaluation.highConfidenceLinkPrecision,
    plantedLinkRecall: evaluation.plantedLinkRecall,
    evaluatedPlantedPairs: evaluation.evaluatedPlantedPairs,
  },
  capabilities: {
    netraOs: { implementation: 'implemented', liveVerification: 'local-build-and-tests' },
    advancedIo: { implementation: 'implemented', liveVerification: 'required' },
    catalystAuth: { implementation: 'adapter-and-branded-redirect', liveVerification: 'required' },
    catalystDataStore: { implementation: 'schema-and-adapter', liveVerification: 'required' },
    apiGateway: { implementation: 'routing-and-security-contract', liveVerification: 'required' },
    nvidiaNim: { implementation: 'server-only-adapter', liveVerification: 'required-after-secret-rotation' },
    quickMlCaseLink: { implementation: 'training-artifact-only', liveVerification: 'not-published' },
    quickMlAggregatePattern: { implementation: 'training-artifact-only', liveVerification: 'not-published' },
    evidenceStorage: { implementation: 'binary-upload-and-storage-adapters', liveVerification: 'required' },
    ziaOcr: { implementation: 'capability-gated-adapter', liveVerification: 'required' },
    smartBrowz: { implementation: 'server-pdf-adapter-with-browser-fallback', liveVerification: 'required' },
    circuits: { implementation: 'capability-gated-adapter', liveVerification: 'required' },
    audit: { implementation: 'serialized-hash-chain-with-unique-sequence-optimistic-retry', liveVerification: 'multi-instance-canary-required' },
  },
  safety: {
    syntheticOnly: true,
    humanReviewRequired: true,
    noPersonRiskScoring: true,
    noGuiltInference: true,
    publicRegistration: false,
    exposedNvidiaCredentialMustBeRevoked: true,
  },
  deployment: {
    catalystCanonical: 'pending-authenticated-deployment',
    slateMirror: 'legacy-until-catalyst-acceptance',
    liveCapabilitiesRequireCanary: true,
  },
}

await writeFile(resolve(root, 'data/generated/release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
console.log('Updated data/generated/release-manifest.json')
