const crypto = require('crypto')

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
  const rows = await loadRows(req, 'Cases')
  if (!Array.isArray(rows) || !rows.length) return null
  return rows.map((row) => ({
    ...row,
    accused_ids: Array.isArray(row.accused_ids) ? row.accused_ids : (() => {
      try { return JSON.parse(row.accused_ids || '[]') } catch { return [] }
    })(),
    synthetic: true,
    data_label: 'SYNTHETIC DEMO DATA',
  }))
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

async function quickMlPredict(req, input) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_QUICKML_ENABLED') || !process.env.QUICKML_ENDPOINT_KEY) return null
  return app.quickML().predict(process.env.QUICKML_ENDPOINT_KEY, input)
}

async function renderPdf(req, html) {
  const app = initialize(req)
  if (!app || !envEnabled('CATALYST_SMARTBROWZ_ENABLED')) return null
  const output = await app.smartbrowz().convertToPdf(html, {
    page_size: 'A4',
    print_background: true,
    margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
  })
  const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output)
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
  initialize,
  insertRows,
  loadCases,
  loadRows,
  quickMlPredict,
  renderPdf,
  signLocalToken,
  verifyLocalToken,
}
