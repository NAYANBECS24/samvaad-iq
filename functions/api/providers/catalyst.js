const crypto = require('crypto')
const fs = require('fs')
const { mkdtemp, rm, writeFile } = require('fs/promises')
const os = require('os')
const path = require('path')

let catalystSdk = null

function envEnabled(name) {
  const fallbackName = name.replace(/^CATALYST_/, 'SAMVAAD_')
  return String(process.env[name] || process.env[fallbackName] || '').toLowerCase() === 'true'
}

function getSdk() {
  if (catalystSdk) return catalystSdk
  try {
    catalystSdk = require('zcatalyst-sdk-node')
    return catalystSdk
  } catch {
    return null
  }
}

function initialize(req) {
  const sdk = getSdk()
  if (!sdk) return null
  try {
    return sdk.initialize(req)
  } catch {
    return null
  }
}

function capabilitySnapshot(req) {
  const app = initialize(req)
  const catalystRuntime = Boolean(app)
  const quickMlAvailable = catalystRuntime && envEnabled('CATALYST_QUICKML_ENABLED') && Boolean(process.env.QUICKML_ENDPOINT_KEY)
  return {
    runtime: {
      available: catalystRuntime,
      provider: catalystRuntime ? 'Zoho Catalyst' : 'Deterministic offline demo',
    },
    auth: {
      available: catalystRuntime && envEnabled('CATALYST_AUTH_ENABLED'),
      provider: 'Catalyst Auth',
    },
    datastore: {
      available: catalystRuntime && envEnabled('CATALYST_DATASTORE_ENABLED'),
      provider: 'Catalyst Data Store',
    },
    storage: {
      available: catalystRuntime && (envEnabled('CATALYST_STRATUS_ENABLED') || envEnabled('CATALYST_FILESTORE_ENABLED')),
      provider: envEnabled('CATALYST_STRATUS_ENABLED') ? 'Catalyst Stratus' : 'Catalyst File Store',
    },
    reports: {
      available: catalystRuntime && envEnabled('CATALYST_SMARTBROWZ_ENABLED'),
      provider: 'Catalyst SmartBrowz',
    },
    ocr: {
      available: catalystRuntime && envEnabled('CATALYST_ZIA_ENABLED'),
      provider: 'Catalyst Zia OCR',
    },
    orchestration: {
      available: catalystRuntime && envEnabled('CATALYST_CIRCUITS_ENABLED'),
      provider: 'Catalyst Circuits',
    },
    intelligence: {
      available: quickMlAvailable || (catalystRuntime && envEnabled('CATALYST_ZIA_ENABLED')),
      provider: quickMlAvailable ? 'Catalyst QuickML' : envEnabled('CATALYST_ZIA_ENABLED') ? 'Zia' : 'Explainable deterministic core',
      model: quickMlAvailable ? process.env.QUICKML_MODEL_NAME || 'KAVACH Link Classifier' : null,
    },
  }
}

async function currentUser(req) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_AUTH_ENABLED')) return null
  try {
    const user = await app.userManagement().getCurrentUser()
    const userId = user?.user_id || user?.zaaid || user?.zuid
    const email = user?.email_id || user?.email
    if (!userId || !email) return null
    const roleName = user?.role_details?.role_name || user?.role_name || user?.role || 'Investigator'
    return {
      id: userId,
      email,
      role: ['Admin', 'Investigator', 'Analyst', 'Supervisor'].includes(roleName) ? roleName : 'Investigator',
      provider: 'catalyst-auth',
    }
  } catch {
    return null
  }
}

async function loadRows(req, tableName, maxRows = 5000) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_DATASTORE_ENABLED')) return null
  const table = app.datastore().table(tableName)
  const rows = []
  let nextToken
  let moreRecords = true
  while (moreRecords && rows.length < maxRows) {
    const response = await table.getPagedRows({ nextToken, maxRows: Math.min(200, maxRows - rows.length) })
    rows.push(...(response?.data || []))
    nextToken = response?.next_token
    moreRecords = Boolean(response?.more_records && nextToken)
  }
  return rows
}

async function loadCases(req) {
  const versions = await loadRows(req, 'DataVersions', 200)
  const activeVersion = (versions || [])
    .filter((row) => row.status === 'active')
    .sort((left, right) => String(right.activated_at || right.MODIFIEDTIME || '').localeCompare(String(left.activated_at || left.MODIFIEDTIME || '')))[0]
  if (!activeVersion?.data_version) return null
  const rows = (await loadRows(req, 'Cases') || []).filter((row) => row.data_version === activeVersion.data_version)
  if (!Array.isArray(rows) || !rows.length) return null
  const cases = rows.map((row) => ({
    ...row,
    accused_ids: Array.isArray(row.accused_ids) ? row.accused_ids : (() => {
      try { return JSON.parse(row.accused_ids || '[]') } catch { return [] }
    })(),
    synthetic: true,
    data_label: 'SYNTHETIC DEMO DATA',
  }))
  Object.defineProperty(cases, 'dataVersion', { value: activeVersion.data_version, enumerable: false })
  return cases
}

async function appendRow(req, tableName, payload) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_DATASTORE_ENABLED')) return null
  return app.datastore().table(tableName).insertRow(payload)
}

async function insertRows(req, tableName, payloads, batchSize = 100) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_DATASTORE_ENABLED')) return null
  const table = app.datastore().table(tableName)
  const inserted = []
  for (let index = 0; index < payloads.length; index += batchSize) {
    const batch = payloads.slice(index, index + batchSize)
    inserted.push(...await table.insertRows(batch))
  }
  return inserted
}

async function updateRow(req, tableName, payload) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_DATASTORE_ENABLED')) return null
  return app.datastore().table(tableName).updateRow(payload)
}

async function updateRows(req, tableName, payloads) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_DATASTORE_ENABLED')) return null
  if (!payloads.length) return []
  return app.datastore().table(tableName).updateRows(payloads)
}

async function quickMlPredict(req, input) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_QUICKML_ENABLED') || !process.env.QUICKML_ENDPOINT_KEY) return null
  return app.quickML().predict(process.env.QUICKML_ENDPOINT_KEY, input)
}

function safeObjectName(value = 'evidence.bin') {
  const normalized = path.basename(String(value)).normalize('NFKC')
  const cleaned = normalized.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned.slice(0, 120) || 'evidence.bin'
}

async function storeEvidence(req, { evidenceId, fileName, contentType, buffer, sha256 }) {
  const app = initialize(req)
  if (!app) return null
  const safeName = safeObjectName(fileName)

  if (envEnabled('CATALYST_STRATUS_ENABLED')) {
    const bucketName = String(process.env.STRATUS_BUCKET_NAME || '').trim()
    if (!bucketName) throw Object.assign(new Error('STRATUS_BUCKET_NAME is not configured.'), { code: 'STORAGE_UNCONFIGURED' })
    const objectKey = `evidence/${sha256.slice(0, 16)}/${safeName}`
    const stored = await app.stratus().bucket(bucketName).putObject(objectKey, buffer, {
      overwrite: false,
      contentType,
      metaData: { evidenceId, sha256 },
    })
    if (!stored) throw Object.assign(new Error('Catalyst Stratus did not confirm the upload.'), { code: 'STORAGE_WRITE_FAILED' })
    return { provider: 'Catalyst Stratus', reference: objectKey }
  }

  if (envEnabled('CATALYST_FILESTORE_ENABLED')) {
    const folderId = String(process.env.FILESTORE_FOLDER_ID || '').trim()
    if (!folderId) throw Object.assign(new Error('FILESTORE_FOLDER_ID is not configured.'), { code: 'STORAGE_UNCONFIGURED' })
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'netra-evidence-'))
    const tempPath = path.join(tempDirectory, safeName)
    try {
      await writeFile(tempPath, buffer, { flag: 'wx' })
      const stored = await app.filestore().folder(folderId).uploadFile({ code: fs.createReadStream(tempPath), name: safeName })
      if (!stored?.id) throw Object.assign(new Error('Catalyst File Store returned no file identifier.'), { code: 'STORAGE_WRITE_FAILED' })
      return { provider: 'Catalyst File Store', reference: String(stored.id) }
    } finally {
      await rm(tempDirectory, { recursive: true, force: true }).catch(() => null)
    }
  }

  return null
}

async function extractOcr(req, { fileName, buffer, language = 'eng' }) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_ZIA_ENABLED')) return null
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'netra-ocr-'))
  const tempPath = path.join(tempDirectory, safeObjectName(fileName))
  try {
    await writeFile(tempPath, buffer, { flag: 'wx' })
    return await app.zia().extractOpticalCharacters(fs.createReadStream(tempPath), { language })
  } finally {
    await rm(tempDirectory, { recursive: true, force: true }).catch(() => null)
  }
}

async function startCircuit(req, { name, input }) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_CIRCUITS_ENABLED')) return null
  const circuitId = String(process.env.CIRCUIT_ID || '').trim()
  if (!circuitId) throw Object.assign(new Error('CIRCUIT_ID is not configured.'), { code: 'CIRCUIT_UNCONFIGURED' })
  const executionName = String(name || `netra-${Date.now()}`).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80)
  const stringInput = Object.fromEntries(Object.entries(input || {}).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]))
  const result = await app.circuit().execute(circuitId, executionName, stringInput)
  const executionId = result?.execution_id || result?.executionId || result?.id
  if (!executionId) throw Object.assign(new Error('Catalyst Circuits returned no execution identifier.'), { code: 'CIRCUIT_EMPTY_RESPONSE' })
  return { provider: 'Catalyst Circuits', circuitId, executionId: String(executionId), state: result.status || result.state || 'submitted' }
}

async function streamToBuffer(stream) {
  if (Buffer.isBuffer(stream)) return stream
  const chunks = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function renderPdf(req, html) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_SMARTBROWZ_ENABLED')) return null
  const output = await app.smartbrowz().convertToPdf(html, {
    pdf_options: {
      format: 'A4',
      print_background: true,
      margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
    },
    navigation_options: { timeout: 25_000, wait_until: 'domcontentloaded' },
  })
  const buffer = await streamToBuffer(output)
  if (!buffer.length) throw Object.assign(new Error('SmartBrowz returned an empty PDF.'), { code: 'SMARTBROWZ_EMPTY_OUTPUT' })
  return { contentType: 'application/pdf', base64: buffer.toString('base64') }
}

function signLocalToken(identity) {
  if (!envEnabled('ALLOW_DEMO_AUTH')) return null
  const secret = process.env.DEMO_AUTH_SECRET
  if (!secret) return null
  const encoded = Buffer.from(JSON.stringify({ ...identity, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function verifyLocalToken(token) {
  if (!envEnabled('ALLOW_DEMO_AUTH') || !token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const secret = process.env.DEMO_AUTH_SECRET
  if (!secret) return null
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    return payload.exp > Date.now() ? payload : null
  } catch {
    return null
  }
}

module.exports = {
  appendRow,
  capabilitySnapshot,
  currentUser,
  extractOcr,
  initialize,
  insertRows,
  loadCases,
  loadRows,
  quickMlPredict,
  renderPdf,
  startCircuit,
  storeEvidence,
  signLocalToken,
  updateRow,
  updateRows,
  verifyLocalToken,
}
