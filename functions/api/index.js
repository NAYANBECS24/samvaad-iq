const http = require('http')
const crypto = require('crypto')
const { URL } = require('url')
const { z } = require('zod')
const seed = require('./data/seed-data.json')
const catalyst = require('./providers/catalyst')
const nvidia = require('./providers/nvidia')
const { caseToDataStoreRow, publicCase, quickMlFeatures } = require('./core/runtimeProjection.cjs')

const corePromise = import('./core/index.mjs')
const insightsPromise = import('./core/insights.mjs')
let memoryCorePromise = null
let catalystCoreCache = null
let catalystCoreCacheExpiresAt = 0
const auditEvents = []
const feedbackEvents = []
const rateWindows = new Map()
const knownConversations = new Set()
const conversations = new Map()
const investigations = new Map()
const tasks = new Map()
const approvals = new Map()
const reports = new Map()
let auditAppendQueue = Promise.resolve()
const evidenceObjects = new Map()
const capabilityCanaries = {
  authentication: false,
  authenticationProvider: null,
  nvidia: false,
  quickMl: false,
  smartBrowz: false,
  storage: false,
  ocr: false,
  orchestration: false,
}

const approvedKnowledge = [
  {
    id: 'KB-EVIDENCE-001',
    title: 'Synthetic evidence handling and provenance',
    text: 'Preserve the original, restrict access, record collection and every hand-off, calculate SHA-256, and keep extracted facts separate from analyst edits.',
    scope: 'Approved prototype guidance; verify the applicable KSP SOP before operational use.',
  },
  {
    id: 'KB-REVIEW-001',
    title: 'Human review of analytical leads',
    text: 'Crime DNA, graph, hotspot, and model results are investigative leads. Verify source records and obtain supervisor approval before an actionable report.',
    scope: 'Human-in-the-loop governance',
  },
]

const demoUsers = seed.users
const roleLanding = { Admin: '/dashboard', Investigator: '/chat', Analyst: '/dashboard', Supervisor: '/analytics' }
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)

function requestId(req) {
  return req.headers?.['x-request-id'] || `REQ-${crypto.randomUUID()}`
}

function getOrigin(req) {
  const origin = req.headers?.origin
  return origin && allowedOrigins.has(origin) ? origin : null
}

function securityHeaders(req, id) {
  const origin = getOrigin(req)
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    'x-request-id': id,
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-request-id',
  }
}

function sendJson(req, res, status, payload, id = requestId(req)) {
  res.writeHead(status, securityHeaders(req, id))
  res.end(status === 204 ? '' : JSON.stringify(payload))
}

function errorPayload(id, code, message, retryable = false, mode = 'offline-demo') {
  return { requestId: id, code, message, retryable, mode }
}

function runtimeTruth(capabilities, { dataSource = 'server-seed', persistence = false } = {}) {
  const quickMlConfigured = capabilities.intelligence?.provider === 'Catalyst QuickML'
  return {
    apiReachable: true,
    authentication: {
      available: capabilityCanaries.authentication,
      configured: Boolean(capabilities.auth?.available || String(process.env.ALLOW_DEMO_AUTH || '').toLowerCase() === 'true'),
      provider: capabilityCanaries.authenticationProvider || capabilities.auth?.provider || 'Session unavailable',
      verified: capabilityCanaries.authentication,
    },
    dataSource: {
      available: true,
      provider: dataSource === 'catalyst-datastore' ? 'Catalyst Data Store' : 'Reproducible synthetic server seed',
      kind: dataSource,
    },
    persistence: {
      available: Boolean(persistence),
      provider: persistence ? 'Catalyst Data Store' : 'Process memory / browser session only',
    },
    generativeAi: {
      available: capabilityCanaries.nvidia,
      configured: Boolean(capabilities.generativeAi?.available),
      provider: capabilities.generativeAi?.provider || 'NVIDIA NIM',
      model: capabilities.generativeAi?.model || null,
      verified: capabilityCanaries.nvidia,
    },
    quickMl: {
      available: capabilityCanaries.quickMl,
      configured: quickMlConfigured,
      provider: 'Catalyst QuickML',
      verified: capabilityCanaries.quickMl,
    },
    ocr: {
      available: capabilityCanaries.ocr,
      configured: Boolean(capabilities.ocr?.available),
      provider: capabilities.ocr?.provider || 'Catalyst Zia OCR',
      verified: capabilityCanaries.ocr,
    },
    storage: {
      available: capabilityCanaries.storage,
      configured: Boolean(capabilities.storage?.available),
      provider: capabilities.storage?.provider || 'Catalyst Stratus / File Store',
      verified: capabilityCanaries.storage,
    },
    reports: {
      available: capabilityCanaries.smartBrowz,
      configured: Boolean(capabilities.reports?.available),
      provider: capabilities.reports?.provider || 'Catalyst SmartBrowz',
      verified: capabilityCanaries.smartBrowz,
    },
    orchestration: {
      available: capabilityCanaries.orchestration,
      configured: Boolean(capabilities.orchestration?.available),
      provider: capabilities.orchestration?.provider || 'Catalyst Circuits',
      verified: capabilityCanaries.orchestration,
    },
  }
}

function activeWithTruth(value, options) {
  return { ...value, runtimeTruth: runtimeTruth(value.capabilities, options) }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function secureEqual(left, right) {
  const first = Buffer.from(String(left || ''))
  const second = Buffer.from(String(right || ''))
  return first.length === second.length && first.length > 0 && crypto.timingSafeEqual(first, second)
}

function readJson(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = ''
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(Object.assign(new Error('Request body exceeds 1 MB.'), { status: 413, code: 'BODY_TOO_LARGE' }))
        req.destroy()
        return
      }
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400, code: 'INVALID_JSON' }))
      }
    })
    req.on('error', reject)
  })
}

function rateLimited(req) {
  const key = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  const now = Date.now()
  const current = rateWindows.get(key)
  if (!current || now - current.startedAt > 60_000) {
    rateWindows.set(key, { startedAt: now, count: 1 })
    return false
  }
  current.count += 1
  return current.count > Number(process.env.API_RATE_LIMIT || 120)
}

async function baseCore() {
  if (!memoryCorePromise) {
    memoryCorePromise = corePromise.then(({ createIntelligenceCore }) => createIntelligenceCore(seed, { total: 1000 }))
  }
  return memoryCorePromise
}

function seedTranslationRows(cases, dataVersion) {
  return cases.flatMap((item) => ([
    {
      fir_id: item.fir_id,
      data_version: dataVersion,
      language: 'en',
      case_summary: item.case_summary,
      mo: item.mo,
      crime_type_label: item.crime_type,
      district_label: item.district,
    },
    {
      fir_id: item.fir_id,
      data_version: dataVersion,
      language: 'kn',
      case_summary: `ಕೃತಕ ಪ್ರಕರಣ ದಾಖಲೆ ${item.fir_id}. ಮೂಲ ಇಂಗ್ಲಿಷ್ ದಾಖಲೆಯೊಂದಿಗೆ ಮಾನವ ಪರಿಶೀಲನೆ ಅಗತ್ಯ.`,
      mo: `ಈ ಕೃತಕ ಘಟನೆಯ ಕಾರ್ಯವಿಧಾನವನ್ನು ${item.fir_id} ಮೂಲ ದಾಖಲೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಬೇಕು.`,
      crime_type_label: item.crime_type,
      district_label: item.district,
    },
  ]))
}

function seedChecksum(cases, dataVersion) {
  const projection = cases.map((item) => ({
    firId: item.fir_id,
    district: item.district,
    station: item.station_id,
    category: item.crime_type,
    date: item.date,
    time: item.time,
    summary: item.case_summary,
    modusOperandi: item.mo,
  }))
  return crypto.createHash('sha256').update(JSON.stringify({ dataVersion, projection })).digest('hex')
}

function validateSeed(cases, translations) {
  if (cases.length !== 1000) throw Object.assign(new Error(`Expected 1,000 cases, received ${cases.length}.`), { status: 422, code: 'SEED_VALIDATION_FAILED' })
  const identifiers = new Set(cases.map((item) => item.fir_id))
  if (identifiers.size !== cases.length || cases.some((item) => !/^SYN-[A-Z0-9-]+$/.test(item.fir_id) || !item.synthetic || !item.case_summary || !item.mo)) {
    throw Object.assign(new Error('Synthetic identifiers, labels, summaries, or modus-operandi fields failed validation.'), { status: 422, code: 'SEED_VALIDATION_FAILED' })
  }
  if (translations.length !== cases.length * 2 || translations.some((item) => !identifiers.has(item.fir_id) || !['en', 'kn'].includes(item.language))) {
    throw Object.assign(new Error('The bilingual translation projection failed referential-integrity validation.'), { status: 422, code: 'SEED_VALIDATION_FAILED' })
  }
}

async function runtime(req) {
  const capabilities = catalyst.capabilitySnapshot(req)
  const languageModel = nvidia.configuration()
  capabilities.generativeAi = {
    available: languageModel.available,
    provider: languageModel.provider,
    model: languageModel.model,
    grounding: 'Server-retrieved cited evidence only',
  }
  const serverGroundedMode = capabilities.runtime.available && capabilities.auth.available && capabilities.generativeAi.available
    ? 'catalyst-live'
    : 'offline-demo'
  if (capabilities.datastore.available) {
    try {
      if (catalystCoreCache && catalystCoreCacheExpiresAt > Date.now()) {
        return activeWithTruth({ core: catalystCoreCache.core, mode: 'catalyst-live', capabilities, limitations: [] }, { dataSource: 'catalyst-datastore', persistence: true })
      }
      const rows = await catalyst.loadCases(req)
      if (rows?.length) {
        const dataVersion = rows.dataVersion || `${rows.length}-${rows[0]?.MODIFIEDTIME || ''}`
        if (!catalystCoreCache || catalystCoreCache.version !== dataVersion) {
          const { createIntelligenceCore } = await corePromise
          const dataStoreCore = createIntelligenceCore({ ...seed, cases: rows.map(publicCase) }, { total: rows.length })
          dataStoreCore.dataset.version = dataVersion
          catalystCoreCache = { version: dataVersion, core: dataStoreCore }
        }
        catalystCoreCacheExpiresAt = Date.now() + Number(process.env.DATASTORE_CACHE_MS || 60_000)
        return activeWithTruth({ core: catalystCoreCache.core, mode: 'catalyst-live', capabilities, limitations: [] }, { dataSource: 'catalyst-datastore', persistence: true })
      }
      return activeWithTruth({ core: await baseCore(), mode: serverGroundedMode, capabilities, limitations: ['Catalyst Data Store is enabled but contains no Cases rows; using the labeled server seed without persistence.'] }, { dataSource: 'server-seed', persistence: false })
    } catch (error) {
      return activeWithTruth({ core: await baseCore(), mode: serverGroundedMode, capabilities, limitations: [`Catalyst Data Store was unavailable: ${error.message}. The labeled server seed is being used without persistence.`] }, { dataSource: 'server-seed', persistence: false })
    }
  }
  return activeWithTruth({ core: await baseCore(), mode: serverGroundedMode, capabilities, limitations: [serverGroundedMode === 'catalyst-live'
    ? 'Catalyst Auth, Advanced I/O, and NVIDIA NIM are live; Data Store is not enabled, so the labeled server seed is used without persistence.'
    : 'Catalyst Data Store is not enabled; using the labeled deterministic demo dataset.'] }, { dataSource: 'server-seed', persistence: false })
}

function appendAudit(req, { actor, action, resource, requestId: id, mode, details = {} }) {
  const operation = async () => {
    const datastoreAvailable = catalyst.capabilitySnapshot(req).datastore.available
    const attempts = datastoreAvailable ? 8 : 1
    let lastError = null
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      let previous = auditEvents.at(-1)
      if (datastoreAvailable) {
        const persisted = await catalyst.loadRows(req, 'AuditEvents').catch((error) => { throw Object.assign(error, { code: 'AUDIT_READ_FAILED' }) })
        previous = (persisted || []).sort((left, right) => {
          const sequenceDifference = Number(left.sequence || 0) - Number(right.sequence || 0)
          return sequenceDifference || String(left.created_at).localeCompare(String(right.created_at))
        }).at(-1)
      }
      const sequence = Number(previous?.sequence || 0) + 1
      const event = {
        id: `AUD-${crypto.randomUUID()}`,
        sequence,
        timestamp: new Date().toISOString(),
        actor,
        action,
        resource,
        requestId: id,
        mode,
        details: { ...details, runtimeMode: mode },
        previousHash: previous?.hash || 'GENESIS',
      }
      event.hash = crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex')
      if (datastoreAvailable) {
        try {
          await catalyst.appendRow(req, 'AuditEvents', {
            audit_id: event.id,
            sequence: event.sequence,
            actor: event.actor,
            action: event.action,
            resource: event.resource,
            request_id: event.requestId,
            details_json: JSON.stringify(event.details),
            previous_hash: event.previousHash,
            hash: event.hash,
            created_at: event.timestamp,
          })
        } catch (error) {
          lastError = error
          await new Promise((resolve) => setTimeout(resolve, 5 * (attempt + 1)))
          continue
        }
      }
      auditEvents.push(event)
      return event
    }
    throw Object.assign(new Error(`Audit event could not obtain a unique persisted sequence after ${attempts} attempts${lastError?.message ? `: ${lastError.message}` : '.'}`), { code: 'AUDIT_SEQUENCE_CONFLICT', status: 503, retryable: true })
  }
  const result = auditAppendQueue.then(operation, operation)
  auditAppendQueue = result.then(() => undefined, () => undefined)
  return result
}

function normalizedAuditEvent(row) {
  if (row?.id && row?.previousHash) return row
  let details = {}
  try { details = typeof row?.details_json === 'string' ? JSON.parse(row.details_json) : row?.details || {} } catch { details = { parseError: true } }
  return {
    id: row?.audit_id,
    sequence: Number(row?.sequence || 0),
    timestamp: row?.created_at,
    actor: row?.actor,
    action: row?.action,
    resource: row?.resource,
    requestId: row?.request_id,
    mode: details.runtimeMode || row?.mode || 'unknown',
    details,
    previousHash: row?.previous_hash || 'GENESIS',
    hash: row?.hash,
  }
}

async function attachQuickMlSignal(req, active, result) {
  const features = quickMlFeatures(result?.visualizations?.crimeDna)
  if (!features || !active.capabilities.intelligence.available || active.capabilities.intelligence.provider !== 'Catalyst QuickML') return result
  try {
    const prediction = await catalyst.quickMlPredict(req, features)
    if (!prediction) throw Object.assign(new Error('QuickML returned no prediction.'), { code: 'QUICKML_EMPTY_RESPONSE' })
    capabilityCanaries.quickMl = true
    result.modelSignals = {
      provider: 'Catalyst QuickML',
      model: active.capabilities.intelligence.model,
      purpose: 'Secondary case-link classification; deterministic cited evidence remains authoritative.',
      features,
      prediction,
    }
  } catch (error) {
    result.limitations.push(`QuickML enrichment was unavailable (${error.message}); the cited deterministic analysis remains valid.`)
  }
  return result
}

function retrievalQuery(query, context = {}) {
  const previousFirIds = [
    ...(Array.isArray(context.previousFirIds) ? context.previousFirIds : []),
    ...(Array.isArray(context.contextRefs) ? context.contextRefs : []),
  ].filter((item) => /^SYN-[A-Z0-9-]+$/i.test(String(item))).map((item) => String(item).toUpperCase())
  const uniqueIds = [...new Set(previousFirIds)].slice(0, 5)
  const looksLikeFollowUp = /\b(it|that|those|this|them|first|second|same|previous|former|latter|what about|compare|summari[sz]e|show that station)\b|ಅದು|ಇದು|ಮೊದಲ|ಎರಡನೇ|ಹಿಂದಿನ/i.test(query)
  if (!looksLikeFollowUp || !uniqueIds.length) return query
  if (/\bfirst|former\b|ಮೊದಲ/i.test(query)) return `${query} Context FIR: ${uniqueIds[0]}`
  if (/\bsecond|latter\b|ಎರಡನೇ/i.test(query) && uniqueIds[1]) return `${query} Context FIR: ${uniqueIds[1]}`
  return `${query} Context FIRs: ${uniqueIds.slice(0, 3).join(' ')}`
}

async function attachGenerativeAnswer(active, query, context, result) {
  if (!active.capabilities.generativeAi.available) return result
  try {
    const general = result.intent === 'GENERAL_QUERY'
    const generated = general
      ? await nvidia.generateGeneralAnswer({ query, context })
      : await nvidia.generateGroundedAnswer({ query, result, context })
    if (!generated) return result
    capabilityCanaries.nvidia = true
    result.deterministicAnswer = result.answer
    result.answer = generated.answer
    result.provider = { name: generated.provider, model: generated.model, kind: general ? 'general-ai' : 'grounded-phrasing' }
    result.modelSignals = {
      ...(result.modelSignals || {}),
      generativeAnswer: {
        provider: generated.provider,
        model: generated.model,
        grounded: !general,
        citedEvidenceCount: result.citations.length,
      },
    }
    if (general) {
      result.answerClass = 'GENERAL_AI'
      result.confidence = { score: 0.8, band: 'general', calibration: 'General AI response quality; not an evidence or guilt confidence score.' }
      result.limitations = ['General AI response — not a police-database result. It has no live internet or operational KSP access.']
      result.nextActions = []
      result.approvalState = 'not-required'
    } else {
      result.limitations.push('The language model only phrased the retrieved result; cited records and KAVACH calculations remain authoritative.')
    }
  } catch (error) {
    capabilityCanaries.nvidia = false
    result.limitations.push(result.intent === 'GENERAL_QUERY'
      ? `General AI was unavailable (${error.code || 'NVIDIA_LLM_UNAVAILABLE'}); no database claim was substituted.`
      : `Generative phrasing was unavailable (${error.code || 'NVIDIA_LLM_UNAVAILABLE'}); the deterministic cited answer is shown.`)
  }
  return result
}

function buildQueryPlan(query, groundedQuery, result, context = {}) {
  return {
    language: context.language || context.interfaceLanguage || (/\p{Script=Kannada}/u.test(query) ? 'kn' : 'en'),
    normalized: String(query).normalize('NFKC').trim().slice(0, 4000),
    intent: result.intent,
    filters: result.filters,
    contextResolution: groundedQuery === query ? 'standalone' : 'resolved-from-conversation',
    retrieval: result.answerClass === 'DATABASE_GROUNDED' ? 'structured + lexical synthetic FIR retrieval' : result.answerClass === 'APPROVED_KNOWLEDGE' ? 'approved local knowledge' : 'no FIR retrieval',
    analysis: result.intent.replaceAll('_', ' ').toLowerCase(),
    groundingRequired: result.answerClass === 'DATABASE_GROUNDED',
  }
}

async function identity(req) {
  const catalystUser = await catalyst.currentUser(req)
  if (catalystUser) {
    capabilityCanaries.authentication = true
    capabilityCanaries.authenticationProvider = 'Catalyst Auth'
    return catalystUser
  }
  const bearer = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '')
  const localUser = catalyst.verifyLocalToken(bearer)
  if (localUser) {
    capabilityCanaries.authentication = true
    capabilityCanaries.authenticationProvider = localUser.provider === 'server-demo' || localUser.provider === 'local-demo' ? 'Server demo session' : 'Signed session'
  }
  return localUser
}

async function requireIdentity(req, roles = []) {
  const user = await identity(req)
  if (!user) return { error: { status: 401, code: 'AUTH_REQUIRED', message: 'A Catalyst or explicitly enabled local demo session is required.' } }
  if (roles.length && !roles.includes(user.role)) return { error: { status: 403, code: 'FORBIDDEN', message: `The ${user.role} role cannot perform this action.` } }
  return { user }
}

function reportHtml(payload, user, auditRef) {
  const citations = (payload.citations || []).map((item) => `<li><strong>${escapeHtml(item.firId)}</strong>${item.field ? ` · ${escapeHtml(item.field)}` : ''}<p>${escapeHtml(item.excerpt)}</p></li>`).join('')
  const transcript = (payload.conversationHistory || []).map((turn, index) => `<article class="turn"><h3>Turn ${index + 1}</h3><p><strong>Question:</strong> ${escapeHtml(turn.query || turn.content || '')}</p><p><strong>Answer:</strong> ${escapeHtml(turn.answer || '')}</p><small>${escapeHtml(turn.requestId || turn.messageId || 'no message identifier')} · ${escapeHtml(turn.intent || 'conversation')} · ${escapeHtml(turn.timestamp || 'time not supplied')}</small></article>`).join('')
  const limitations = (payload.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const filters = escapeHtml(JSON.stringify(payload.filters || {}))
  const confidence = payload.confidence || {}
  const provider = payload.provider || {}
  const safetyDisclaimer = 'Investigative lead only. Synthetic demonstration data. Human verification and supervisory approval are required before any operational, legal, patrol, evidence, or case-link decision.'
  return `<!doctype html><html><head><meta charset="utf-8"><title>SAMVAAD-IQ Evidence Brief</title><style>@page{size:A4;margin:18mm 14mm}body{font:14px Arial;color:#132238;line-height:1.5;margin:0}h1{color:#073b5c}h2{font-size:18px}h3{font-size:15px;margin-bottom:4px}section{border-top:1px solid #ccd6df;padding-top:12px;margin-top:16px}.label{color:#a33;font-weight:bold}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.meta div,.turn{border:1px solid #d7e0e8;border-radius:8px;padding:10px}.turn{break-inside:avoid;margin:8px 0}.warning{background:#fff4e5;border:1px solid #d97706;padding:12px}small{color:#526171}</style></head><body><p class="label">SYNTHETIC DEMO DATA — NOT AN OPERATIONAL POLICE RECORD</p><h1>SAMVAAD-IQ Evidence Brief</h1><p>NETRA OS intelligence workspace · KAVACH explainable analysis</p><section class="meta"><div><strong>Conversation</strong><br>${escapeHtml(payload.conversationId || 'not supplied')}</div><div><strong>Query</strong><br>${escapeHtml(payload.queryId || 'not supplied')}</div><div><strong>Data version</strong><br>${escapeHtml(payload.dataVersion || 'not supplied')}</div><div><strong>Answer class</strong><br>${escapeHtml(payload.answerClass || 'not supplied')}</div><div><strong>Confidence</strong><br>${escapeHtml(String(confidence.score ?? 'not supplied'))} ${escapeHtml(confidence.band || '')}</div><div><strong>Provider</strong><br>${escapeHtml(provider.name || 'KAVACH deterministic core')} ${escapeHtml(provider.model || '')}</div><div><strong>Filters</strong><br>${filters}</div><div><strong>Prepared for</strong><br>${escapeHtml(user.email)} (${escapeHtml(user.role)})</div></section><section><h2>Approved summary</h2><p>${escapeHtml(payload.answer || 'No summary supplied.')}</p></section>${transcript ? `<section><h2>Complete conversation history</h2>${transcript}</section>` : ''}<section><h2>Evidence citations</h2><ol>${citations || '<li>No cited evidence supplied.</li>'}</ol></section>${limitations ? `<section><h2>Limitations</h2><ul>${limitations}</ul></section>` : ''}<section><h2>Governance</h2><p>Approval: Supervisor/Admin approved. Audit reference: ${escapeHtml(auditRef)}.</p><p class="warning">${escapeHtml(safetyDisclaimer)}</p></section></body></html>`
}

const QueryContextSchema = z.object({
  conversationId: z.string().trim().min(4).max(100).optional(),
  newConversation: z.boolean().optional(),
  answerMode: z.enum(['investigator', 'brief', 'timeline', 'contradictions']).default('investigator'),
  interfaceLanguage: z.enum(['en', 'kn']).optional(),
  previousRequestId: z.string().max(120).nullable().optional(),
  previousIntent: z.string().max(100).nullable().optional(),
  previousQuery: z.string().max(600).nullable().optional(),
  previousFirIds: z.array(z.string().regex(/^SYN-[A-Z0-9-]+$/i)).max(5).optional(),
  contextRefs: z.array(z.string().regex(/^SYN-[A-Z0-9-]+$/i)).max(10).optional(),
  investigationId: z.string().trim().min(4).max(100).optional(),
  dataVersion: z.string().trim().max(100).optional(),
  history: z.array(z.object({
    query: z.string().max(400),
    intent: z.string().max(100),
    firIds: z.array(z.string().regex(/^SYN-[A-Z0-9-]+$/i)).max(5),
  })).max(4).optional(),
}).passthrough()
const QuerySchema = z.object({
  query: z.string().trim().min(1).max(4000).optional(),
  message: z.string().trim().min(1).max(4000).optional(),
  conversationId: z.string().trim().min(4).max(100).optional(),
  investigationId: z.string().trim().min(4).max(100).optional(),
  answerMode: z.enum(['investigator', 'brief', 'timeline', 'contradictions']).optional(),
  language: z.enum(['en', 'kn', 'kanglish']).optional(),
  contextRefs: z.array(z.string().regex(/^SYN-[A-Z0-9-]+$/i)).max(10).optional(),
  dataVersion: z.string().trim().max(100).optional(),
  context: QueryContextSchema.optional().default({ answerMode: 'investigator' }),
}).refine((value) => Boolean(value.query || value.message), { message: 'query or message is required' }).transform((value) => ({
  query: value.message || value.query,
  context: {
    ...value.context,
    conversationId: value.conversationId || value.context.conversationId,
    investigationId: value.investigationId || value.context.investigationId,
    answerMode: value.answerMode || value.context.answerMode || 'investigator',
    interfaceLanguage: value.language === 'kanglish' ? 'en' : value.language || value.context.interfaceLanguage,
    language: value.language || value.context.language,
    contextRefs: value.contextRefs || value.context.contextRefs,
    dataVersion: value.dataVersion || value.context.dataVersion,
  },
}))
const SimilarSchema = z.object({ firId: z.string().min(5).max(64) })
const HotspotSchema = z.object({ district: z.string().max(80).nullable().optional(), crimeType: z.string().max(80).nullable().optional() })
const ScenarioSchema = HotspotSchema.extend({ units: z.coerce.number().int().min(0).max(20).default(3) })
const EvidenceSchema = z.object({ text: z.string().max(200000).default(''), file: z.object({ name: z.string().max(255), type: z.string().max(120), size: z.number().int().min(0).max(10 * 1024 * 1024), sha256: z.string().regex(/^[a-f0-9]{64}$/i) }).passthrough(), limitations: z.array(z.string()).optional() })
const EvidenceUploadSchema = z.object({
  file: z.object({
    name: z.string().trim().min(1).max(255),
    type: z.string().trim().max(120),
    size: z.number().int().min(1).max(10 * 1024 * 1024),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }).passthrough(),
  contentBase64: z.string().min(4).max(14 * 1024 * 1024),
  collectedAt: z.string().datetime().optional(),
})
const FeedbackSchema = z.object({ requestId: z.string().max(100), decision: z.enum(['accept', 'reject', 'needs-review']), note: z.string().max(1000).optional() })

const evidenceMimeByExtension = {
  pdf: new Set(['application/pdf']),
  docx: new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream']),
  xlsx: new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/octet-stream']),
  csv: new Set(['text/csv', 'application/csv', 'text/plain', 'application/octet-stream']),
  json: new Set(['application/json', 'text/json', 'text/plain', 'application/octet-stream']),
  png: new Set(['image/png', 'application/png', 'application/octet-stream']),
  jpg: new Set(['image/jpeg', 'image/jpg', 'application/jpg', 'application/octet-stream']),
  jpeg: new Set(['image/jpeg', 'image/jpg', 'application/jpeg', 'application/octet-stream']),
}

function validatedEvidenceUpload(input) {
  const body = EvidenceUploadSchema.parse(input)
  const extension = String(body.file.name).split('.').pop()?.toLowerCase()
  const allowedMime = evidenceMimeByExtension[extension]
  if (!allowedMime) throw Object.assign(new Error('Supported evidence formats are PDF, DOCX, XLSX, CSV, JSON, PNG, and JPEG.'), { status: 415, code: 'UNSUPPORTED_EVIDENCE_TYPE' })
  const contentType = String(body.file.type || 'application/octet-stream').toLowerCase().split(';')[0].trim() || 'application/octet-stream'
  if (!allowedMime.has(contentType)) throw Object.assign(new Error(`The declared MIME type ${contentType} does not match .${extension}.`), { status: 415, code: 'EVIDENCE_TYPE_MISMATCH' })
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(body.contentBase64) || body.contentBase64.length % 4 !== 0) throw Object.assign(new Error('Evidence bytes must use canonical base64 encoding.'), { status: 400, code: 'INVALID_EVIDENCE_ENCODING' })
  const buffer = Buffer.from(body.contentBase64, 'base64')
  if (buffer.toString('base64') !== body.contentBase64) throw Object.assign(new Error('Evidence bytes must use canonical base64 encoding.'), { status: 400, code: 'INVALID_EVIDENCE_ENCODING' })
  if (!buffer.length || buffer.length !== body.file.size) throw Object.assign(new Error('The decoded evidence size does not match the declared file size.'), { status: 400, code: 'EVIDENCE_SIZE_MISMATCH' })
  const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  if (!secureEqual(actualSha256, body.file.sha256.toLowerCase())) throw Object.assign(new Error('Server SHA-256 verification did not match the client provenance hash.'), { status: 400, code: 'EVIDENCE_HASH_MISMATCH' })
  if (extension === 'pdf' && buffer.subarray(0, 5).toString('ascii') !== '%PDF-') throw Object.assign(new Error('The uploaded bytes are not a valid PDF signature.'), { status: 415, code: 'EVIDENCE_SIGNATURE_MISMATCH' })
  if (extension === 'png' && buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Object.assign(new Error('The uploaded bytes are not a valid PNG signature.'), { status: 415, code: 'EVIDENCE_SIGNATURE_MISMATCH' })
  if (['jpg', 'jpeg'].includes(extension) && buffer.subarray(0, 3).toString('hex') !== 'ffd8ff') throw Object.assign(new Error('The uploaded bytes are not a valid JPEG signature.'), { status: 415, code: 'EVIDENCE_SIGNATURE_MISMATCH' })
  if (['docx', 'xlsx'].includes(extension) && buffer.subarray(0, 2).toString('ascii') !== 'PK') throw Object.assign(new Error('The uploaded Office document is not a ZIP-based OOXML file.'), { status: 415, code: 'EVIDENCE_SIGNATURE_MISMATCH' })
  if (extension === 'json') {
    try { JSON.parse(buffer.toString('utf8')) } catch { throw Object.assign(new Error('The uploaded JSON file is malformed.'), { status: 415, code: 'EVIDENCE_CONTENT_INVALID' }) }
  }
  return { ...body, extension, contentType, buffer, actualSha256 }
}

function conversationOwner(session) {
  return session?.id || session?.email || 'anonymous-demo'
}

function ensureConversation(id, session, context = {}) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      id,
      userId: conversationOwner(session),
      investigationId: context.investigationId || null,
      language: context.language || context.interfaceLanguage || 'en',
      title: 'New investigation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      persisted: false,
    })
  }
  return conversations.get(id)
}

function storeConversationTurn(conversation, query, result, messageId) {
  const now = new Date().toISOString()
  if (conversation.messages.length === 0) conversation.title = query.slice(0, 80)
  conversation.messages.push(
    { id: `MSG-${crypto.randomUUID()}`, role: 'user', content: query, createdAt: now },
    {
      id: messageId,
      role: 'assistant',
      content: result.answer,
      answerClass: result.answerClass,
      intent: result.intent,
      filters: result.filters || {},
      confidence: result.confidence || null,
      requestId: result.requestId,
      citations: result.citations || [],
      provider: result.provider || null,
      limitations: result.limitations || [],
      dataVersion: result.dataVersion,
      createdAt: new Date().toISOString(),
    },
  )
  conversation.updatedAt = new Date().toISOString()
  return conversation
}

function completeConversationTurns(conversation) {
  if (!conversation?.messages?.length) return []
  const turns = []
  let pendingQuestion = null
  for (const message of conversation.messages) {
    if (message.role === 'user') {
      if (pendingQuestion) turns.push({ query: pendingQuestion.content, messageId: pendingQuestion.id, timestamp: pendingQuestion.createdAt, answer: '' })
      pendingQuestion = message
      continue
    }
    if (message.role !== 'assistant') continue
    turns.push({
      query: pendingQuestion?.content || '',
      answer: message.content || '',
      messageId: message.id,
      requestId: message.requestId,
      intent: message.intent,
      citations: message.citations || [],
      confidence: message.confidence,
      provider: message.provider,
      dataVersion: message.dataVersion,
      timestamp: message.createdAt,
    })
    pendingQuestion = null
  }
  if (pendingQuestion) turns.push({ query: pendingQuestion.content, messageId: pendingQuestion.id, timestamp: pendingQuestion.createdAt, answer: '' })
  return turns
}

function trendAnalysis(core, input = {}) {
  const filtered = core.cases.filter((item) => (!input.district || item.district === input.district) && (!input.crimeType || item.crime_type === input.crimeType))
  const buckets = new Map()
  for (const item of filtered) {
    const month = String(item.date).slice(0, 7)
    buckets.set(month, (buckets.get(month) || 0) + 1)
  }
  const series = [...buckets.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([period, count]) => ({ period, count }))
  const recent = series.slice(-3)
  const prior = series.slice(-6, -3)
  const recentAverage = recent.length ? recent.reduce((sum, item) => sum + item.count, 0) / recent.length : 0
  const priorAverage = prior.length ? prior.reduce((sum, item) => sum + item.count, 0) / prior.length : 0
  return {
    filters: input,
    total: filtered.length,
    series,
    direction: recentAverage > priorAverage ? 'up' : recentAverage < priorAverage ? 'down' : 'stable',
    changePercent: priorAverage ? Math.round(((recentAverage - priorAverage) / priorAverage) * 100) : 0,
    measured: true,
    limitations: ['Descriptive aggregate over synthetic records; not a forecast about any person.'],
  }
}

function cohortAnalysis(core, input = {}) {
  const dimension = ['district', 'crime_type', 'status'].includes(input.dimension) ? input.dimension : 'district'
  const counts = new Map()
  for (const item of core.cases) counts.set(item[dimension], (counts.get(item[dimension]) || 0) + 1)
  return {
    dimension,
    minimumGroupSize: 10,
    cohorts: [...counts.entries()].filter(([, count]) => count >= 10).map(([name, count]) => ({ name, count })).sort((left, right) => right.count - left.count),
    suppressedGroups: [...counts.values()].filter((count) => count < 10).length,
    limitations: ['Synthetic aggregate cohorts only; no person-level or demographic risk inference.'],
  }
}

async function handleRequest(req, res) {
  const id = requestId(req)
  if (req.method === 'OPTIONS') return sendJson(req, res, 204, {}, id)
  if (rateLimited(req)) return sendJson(req, res, 429, errorPayload(id, 'RATE_LIMITED', 'Too many requests. Retry after one minute.', true), id)

  const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`)
  let path = url.pathname.replace(/\/$/, '') || '/'
  if (path.startsWith('/server/api/')) path = path.replace('/server/api', '')
  if (path.startsWith('/api/') && !path.startsWith('/api/v1/')) path = path.replace('/api/', '/api/v1/')

  try {
    const active = await runtime(req)

    if (req.method === 'GET' && path === '/api/v1/health') {
      return sendJson(req, res, 200, { requestId: id, status: 'ok', name: 'SAMVAAD-IQ API', version: '2.0.0', product: 'NETRA OS', challenge: 'KSP Datathon 2026 Challenge 1', mode: active.mode, dataVersion: active.core.dataset.version, runtime: active.runtimeTruth, timestamp: new Date().toISOString() }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/capabilities') {
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataLabel: active.core.dataset.label, capabilities: active.capabilities, runtime: active.runtimeTruth, limitations: active.limitations }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/ai/status') {
      return sendJson(req, res, 200, {
        requestId: id,
        mode: active.mode,
        configured: active.runtimeTruth.generativeAi.configured,
        verified: active.runtimeTruth.generativeAi.verified,
        provider: active.capabilities.generativeAi.provider,
        model: active.capabilities.generativeAi.model,
        dataSource: active.capabilities.datastore.available ? 'Catalyst Data Store' : 'Reproducible synthetic server seed',
        safeguards: ['Server-side key isolation', 'Cited-evidence prompt boundary', 'Uncited FIR rejection', 'Deterministic fallback', 'Human review required'],
      }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/auth/demo-session') {
      if (String(process.env.ALLOW_DEMO_AUTH || '').toLowerCase() !== 'true') return sendJson(req, res, 403, errorPayload(id, 'DEMO_AUTH_DISABLED', 'Server demo sessions are disabled for this deployment.', false, active.mode), id)
      if (!process.env.DEMO_AUTH_SECRET) return sendJson(req, res, 503, errorPayload(id, 'DEMO_AUTH_UNCONFIGURED', 'The environment-only demo session secret is not configured.', false, active.mode), id)
      const body = z.object({ email: z.string().email().optional(), role: z.enum(['Admin', 'Investigator', 'Analyst', 'Supervisor']).optional() }).refine((value) => value.email || value.role, { message: 'email or role is required' }).parse(await readJson(req))
      const candidate = demoUsers.find((item) => body.email ? item.email.toLowerCase() === body.email.toLowerCase() : item.role === body.role)
      if (!candidate) return sendJson(req, res, 404, errorPayload(id, 'DEMO_PROFILE_NOT_FOUND', 'That fixed synthetic demo profile is unavailable.', false, active.mode), id)
      const token = catalyst.signLocalToken({ id: candidate.email, email: candidate.email, role: candidate.role, provider: 'server-demo' })
      if (!token) return sendJson(req, res, 503, errorPayload(id, 'DEMO_AUTH_UNCONFIGURED', 'The server could not create a demo session.', false, active.mode), id)
      capabilityCanaries.authentication = true
      capabilityCanaries.authenticationProvider = 'Server demo session'
      return sendJson(req, res, 201, { requestId: id, mode: active.mode, token, expiresInSeconds: 28800, user: { ...candidate, landing: roleLanding[candidate.role] } }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/auth/secure-url') {
      const secureUrl = String(process.env.CATALYST_AUTH_URL || '').trim()
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, available: Boolean(secureUrl && active.capabilities.auth.available), url: secureUrl && active.capabilities.auth.available ? secureUrl : null, provider: 'Catalyst Auth', limitations: secureUrl && active.capabilities.auth.available ? [] : ['Invitation-only Catalyst Auth is not configured in this environment.'] }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/auth/logout') {
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, loggedOut: true }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/auth/login') {
      if (String(process.env.ALLOW_DEMO_AUTH || '').toLowerCase() !== 'true') return sendJson(req, res, 403, errorPayload(id, 'DEMO_AUTH_DISABLED', 'Use Catalyst Auth for this deployment.', false, active.mode), id)
      if (!process.env.DEMO_PASSWORD || !process.env.DEMO_AUTH_SECRET) return sendJson(req, res, 503, errorPayload(id, 'DEMO_AUTH_UNCONFIGURED', 'Local demo authentication is missing its environment-only credentials.', false, active.mode), id)
      const body = await readJson(req)
      const login = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).parse(body)
      const candidate = demoUsers.find((item) => item.email.toLowerCase() === login.email.toLowerCase())
      if (!secureEqual(login.password, process.env.DEMO_PASSWORD)) return sendJson(req, res, 401, errorPayload(id, 'INVALID_CREDENTIALS', 'Invalid local demo credentials.', false, active.mode), id)
      if (!candidate) return sendJson(req, res, 401, errorPayload(id, 'INVALID_CREDENTIALS', 'Invalid local demo credentials.', false, active.mode), id)
      const token = catalyst.signLocalToken({ id: candidate.email, email: candidate.email, role: candidate.role, provider: 'local-demo' })
      capabilityCanaries.authentication = true
      capabilityCanaries.authenticationProvider = 'Server demo session'
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, token, user: { ...candidate, landing: roleLanding[candidate.role] } }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/auth/me') {
      const access = await requireIdentity(req)
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, user: { ...access.user, landing: roleLanding[access.user.role] || '/chat' } }, id)
    }

    const authenticatedAccess = await requireIdentity(req)
    if (authenticatedAccess.error) return sendJson(req, res, authenticatedAccess.error.status, errorPayload(id, authenticatedAccess.error.code, authenticatedAccess.error.message, false, active.mode), id)
    const authenticatedUser = authenticatedAccess.user

    if (req.method === 'POST' && path === '/api/v1/admin/seed') {
      const access = await requireIdentity(req, ['Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      if (!active.capabilities.datastore.available) return sendJson(req, res, 503, errorPayload(id, 'DATASTORE_UNAVAILABLE', 'Create the Catalyst Data Store tables and enable the Data Store capability before seeding.', false, active.mode), id)
      const generated = await baseCore()
      const dataVersion = generated.dataset.version
      const versions = await catalyst.loadRows(req, 'DataVersions', 200) || []
      if (versions.some((item) => item.data_version === dataVersion)) return sendJson(req, res, 409, errorPayload(id, 'DATASET_VERSION_EXISTS', `${dataVersion} already exists. A partial staging version must be reviewed before retrying.`, false, active.mode), id)
      const caseRows = generated.cases.map((item) => caseToDataStoreRow({ ...item, data_version: dataVersion }))
      const stationRows = generated.dataset.stations.map((item) => ({ ...item, data_version: dataVersion, synthetic: true }))
      const translationRows = seedTranslationRows(generated.cases, dataVersion)
      validateSeed(generated.cases, translationRows)
      const checksum = seedChecksum(generated.cases, dataVersion)
      const stagedAt = new Date().toISOString()
      const versionRow = await catalyst.appendRow(req, 'DataVersions', {
        data_version: dataVersion,
        label: generated.dataset.label,
        seed: 20260717,
        case_count: caseRows.length,
        translation_count: translationRows.length,
        status: 'staging',
        checksum,
        created_at: stagedAt,
        activated_at: '',
      })
      if (!versionRow?.ROWID) throw Object.assign(new Error('Catalyst did not return the staging DataVersions ROWID.'), { status: 503, code: 'SEED_STAGING_FAILED' })
      const insertedStations = await catalyst.insertRows(req, 'Stations', stationRows)
      const insertedCases = await catalyst.insertRows(req, 'Cases', caseRows)
      const insertedTranslations = await catalyst.insertRows(req, 'CaseTranslations', translationRows)
      if (insertedStations.length !== stationRows.length || insertedCases.length !== caseRows.length || insertedTranslations.length !== translationRows.length) {
        throw Object.assign(new Error('Catalyst row counts did not match the validated staging manifest; the version remains inactive.'), { status: 503, code: 'SEED_STAGING_INCOMPLETE' })
      }
      const activatedAt = new Date().toISOString()
      await catalyst.updateRow(req, 'DataVersions', { ROWID: versionRow.ROWID, status: 'active', activated_at: activatedAt })
      const retiredVersions = versions.filter((item) => item.status === 'active' && item.ROWID).map((item) => ({ ROWID: item.ROWID, status: 'retired' }))
      const retirementWarning = retiredVersions.length
        ? await catalyst.updateRows(req, 'DataVersions', retiredVersions).then(() => null).catch((error) => `The new version is active, but an older version could not be retired: ${error.message}`)
        : null
      catalystCoreCache = null
      catalystCoreCacheExpiresAt = 0
      const audit = await appendAudit(req, { actor: access.user.email, action: 'ACTIVATE_SYNTHETIC_DATA_VERSION', resource: dataVersion, requestId: id, mode: 'catalyst-live', details: { cases: caseRows.length, stations: stationRows.length, translations: translationRows.length, seed: 20260717, checksum, activatedAt } })
      return sendJson(req, res, 201, { requestId: id, mode: 'catalyst-live', staged: true, validated: true, activated: true, inserted: { cases: caseRows.length, stations: stationRows.length, translations: translationRows.length }, dataVersion, checksum, auditRef: audit.id, label: generated.dataset.label, limitations: retirementWarning ? [retirementWarning] : [] }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/data/versions') {
      const persistedVersions = active.capabilities.datastore.available
        ? await catalyst.loadRows(req, 'DataVersions', 200).catch(() => [])
        : []
      const versions = persistedVersions?.length
        ? persistedVersions.map((item) => ({
          id: item.data_version,
          label: item.label,
          caseCount: Number(item.case_count || 0),
          translationCount: Number(item.translation_count || 0),
          status: item.status,
          active: item.status === 'active',
          checksum: item.checksum,
          createdAt: item.created_at,
          activatedAt: item.activated_at || null,
          source: 'Catalyst Data Store',
          persisted: true,
        })).sort((left, right) => String(right.activatedAt || right.createdAt || '').localeCompare(String(left.activatedAt || left.createdAt || '')))
        : [{
          id: active.core.dataset.version,
          label: active.core.dataset.label,
          caseCount: active.core.cases.length,
          status: 'server-seed',
          active: true,
          source: active.runtimeTruth.dataSource.provider,
          persisted: active.runtimeTruth.persistence.available,
        }]
      return sendJson(req, res, 200, {
        requestId: id,
        mode: active.mode,
        activeVersion: active.core.dataset.version,
        versions,
        limitations: active.limitations,
      }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/search') {
      const query = String(url.searchParams.get('q') || '').trim()
      if (!query) return sendJson(req, res, 400, errorPayload(id, 'VALIDATION_ERROR', 'q: A search query is required.', false, active.mode), id)
      const limit = Math.min(25, Math.max(1, Number(url.searchParams.get('limit') || 10)))
      const results = active.core.search(query, {}, limit).map((entry) => ({ type: 'case', score: entry.score, case: publicCase(entry.case) }))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, query, results, limitations: active.limitations }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/knowledge/search') {
      const query = String(url.searchParams.get('q') || '').trim().toLowerCase()
      const results = approvedKnowledge.filter((item) => !query || `${item.title} ${item.text}`.toLowerCase().includes(query)).map((item) => ({ ...item, sourceType: 'approved-prototype-knowledge' }))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, query, results, limitations: ['Prototype guidance must be checked against the applicable KSP SOP.'] }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/conversations') {
      const access = await requireIdentity(req)
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const owner = conversationOwner(access.user)
      const items = [...conversations.values()].filter((item) => item.userId === owner).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 50).map(({ messages, ...item }) => ({ ...item, messageCount: messages.length }))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, conversations: items, persisted: active.runtimeTruth.persistence.available }, id)
    }

    if (req.method === 'GET' && /^\/api\/v1\/conversations\/[^/]+\/messages$/.test(path)) {
      const conversationId = decodeURIComponent(path.split('/').at(-2))
      const conversation = conversations.get(conversationId)
      if (!conversation) return sendJson(req, res, 404, errorPayload(id, 'CONVERSATION_NOT_FOUND', 'Conversation history is unavailable in this runtime.', false, active.mode), id)
      const session = await identity(req)
      if (conversation.userId !== 'anonymous-demo' && conversation.userId !== conversationOwner(session)) return sendJson(req, res, 403, errorPayload(id, 'FORBIDDEN', 'This conversation belongs to another session.', false, active.mode), id)
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, conversationId, messages: conversation.messages, persisted: conversation.persisted }, id)
    }

    if (path === '/api/v1/investigations' && req.method === 'GET') {
      const access = await requireIdentity(req)
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const owner = conversationOwner(access.user)
      const items = [...investigations.values()].filter((item) => item.owner === owner || ['Supervisor', 'Admin'].includes(access.user.role))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, investigations: items, persisted: false, limitations: active.runtimeTruth.persistence.available ? [] : ['Investigation metadata is process-local until Catalyst Data Store is enabled.'] }, id)
    }

    if (path === '/api/v1/investigations' && req.method === 'POST') {
      const access = await requireIdentity(req, ['Investigator', 'Analyst', 'Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = z.object({ title: z.string().trim().min(2).max(120), description: z.string().max(1000).optional(), pinnedCaseIds: z.array(z.string().regex(/^SYN-[A-Z0-9-]+$/i)).max(20).optional() }).parse(await readJson(req))
      const investigation = { id: `INV-${crypto.randomUUID()}`, ...body, pinnedCaseIds: body.pinnedCaseIds || [], owner: conversationOwner(access.user), status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), persisted: false }
      investigations.set(investigation.id, investigation)
      return sendJson(req, res, 201, { requestId: id, mode: active.mode, investigation }, id)
    }

    if (req.method === 'PATCH' && path.startsWith('/api/v1/investigations/')) {
      const access = await requireIdentity(req, ['Investigator', 'Analyst', 'Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const investigationId = decodeURIComponent(path.split('/').pop())
      const investigation = investigations.get(investigationId)
      if (!investigation) return sendJson(req, res, 404, errorPayload(id, 'INVESTIGATION_NOT_FOUND', 'Investigation not found.', false, active.mode), id)
      if (investigation.owner !== conversationOwner(access.user) && !['Supervisor', 'Admin'].includes(access.user.role)) return sendJson(req, res, 403, errorPayload(id, 'FORBIDDEN', 'This investigation belongs to another user.', false, active.mode), id)
      const body = z.object({ title: z.string().trim().min(2).max(120).optional(), description: z.string().max(1000).optional(), status: z.enum(['active', 'review', 'closed']).optional(), pinnedCaseIds: z.array(z.string().regex(/^SYN-[A-Z0-9-]+$/i)).max(20).optional() }).parse(await readJson(req))
      Object.assign(investigation, body, { updatedAt: new Date().toISOString() })
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, investigation }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/tasks') {
      const access = await requireIdentity(req)
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const items = [...tasks.values()].filter((item) => item.assignee === access.user.email || ['Supervisor', 'Admin'].includes(access.user.role))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, tasks: items, persisted: false }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/approvals') {
      const access = await requireIdentity(req, ['Investigator', 'Analyst', 'Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = z.object({ resourceType: z.enum(['report', 'case-link', 'evidence', 'scenario']), resourceId: z.string().min(3).max(120), note: z.string().max(1000).optional() }).parse(await readJson(req))
      const approval = { id: `APR-${crypto.randomUUID()}`, ...body, requestedBy: access.user.email, state: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), persisted: false }
      approvals.set(approval.id, approval)
      const task = { id: `TSK-${crypto.randomUUID()}`, approvalId: approval.id, type: 'approval-review', assignee: 'supervisor@ksp.demo', state: 'open', createdAt: approval.createdAt }
      tasks.set(task.id, task)
      return sendJson(req, res, 201, { requestId: id, mode: active.mode, approval, task }, id)
    }

    if (req.method === 'PATCH' && path.startsWith('/api/v1/approvals/')) {
      const access = await requireIdentity(req, ['Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const approvalId = decodeURIComponent(path.split('/').pop())
      const approval = approvals.get(approvalId)
      if (!approval) return sendJson(req, res, 404, errorPayload(id, 'APPROVAL_NOT_FOUND', 'Approval request not found.', false, active.mode), id)
      const body = z.object({ state: z.enum(['approved', 'rejected', 'needs-review']), note: z.string().max(1000).optional() }).parse(await readJson(req))
      Object.assign(approval, body, { reviewedBy: access.user.email, updatedAt: new Date().toISOString() })
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, approval }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/trends') {
      const body = HotspotSchema.parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, trend: trendAnalysis(active.core, body) }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/alerts') {
      const body = HotspotSchema.parse(await readJson(req))
      const trend = trendAnalysis(active.core, body)
      const alerts = trend.series.slice(-6).map((point, index, series) => {
        const baseline = index ? series.slice(0, index).reduce((sum, item) => sum + item.count, 0) / index : point.count
        return point.count > baseline * 1.5 && point.count - baseline >= 3 ? { id: `ALT-${point.period}`, period: point.period, count: point.count, baseline: Number(baseline.toFixed(1)), severity: 'review', explanation: 'Synthetic monthly count is more than 50% above the preceding displayed average.' } : null
      }).filter(Boolean)
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, alerts, measured: true, limitations: ['Descriptive synthetic anomaly flag; not a prediction or operational alert.'] }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/cohorts') {
      const body = z.object({ dimension: z.enum(['district', 'crime_type', 'status']).optional() }).parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, analysis: cohortAnalysis(active.core, body) }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/cases') {
      const filters = { district: url.searchParams.get('district'), crimeType: url.searchParams.get('crimeType'), status: url.searchParams.get('status'), stationId: url.searchParams.get('stationId') }
      const query = url.searchParams.get('q') || `${filters.district || ''} ${filters.crimeType || ''}`
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
      const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
      const matched = query.trim() || Object.values(filters).some(Boolean) ? active.core.search(query, filters, active.core.cases.length).map((item) => item.case) : active.core.cases
      const cases = matched.slice(offset, offset + limit).map(publicCase)
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, cases, offset, limit, nextOffset: offset + cases.length < matched.length ? offset + cases.length : null, total: matched.length, totalAvailable: active.core.cases.length, limitations: active.limitations }, id)
    }

    if (req.method === 'GET' && path.startsWith('/api/v1/cases/')) {
      const firId = decodeURIComponent(path.split('/').pop())
      const caseRecord = active.core.caseById.get(firId)
      return caseRecord ? sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, case: publicCase(caseRecord) }, id) : sendJson(req, res, 404, errorPayload(id, 'CASE_NOT_FOUND', 'Synthetic case not found.', false, active.mode), id)
    }

    if (req.method === 'POST' && path === '/api/v1/query') {
      const startedAt = Date.now()
      const body = QuerySchema.parse(await readJson(req))
      const session = authenticatedUser
      const conversationId = body.context.conversationId || `CONV-${crypto.randomUUID()}`
      const conversation = ensureConversation(conversationId, session, body.context)
      if (conversation.userId !== 'anonymous-demo' && conversation.userId !== conversationOwner(session)) return sendJson(req, res, 403, errorPayload(id, 'FORBIDDEN', 'This conversation belongs to another session.', false, active.mode), id)
      const audit = await appendAudit(req, { actor: session?.email || 'anonymous-demo', action: 'QUERY', resource: 'CaseIndex', requestId: id, mode: active.mode, details: { queryLength: body.query.length, answerMode: body.context.answerMode, conversationId } })
      const groundedQuery = retrievalQuery(body.query, body.context)
      let result = active.core.answer(groundedQuery, { mode: active.mode, requestId: id, auditRef: audit.id })
      if (groundedQuery !== body.query) result.contextUsed = { previousFirIds: body.context?.previousFirIds?.slice(0, 3) || [] }
      result.limitations = [...active.limitations, ...result.limitations]
      await attachQuickMlSignal(req, active, result)
      await attachGenerativeAnswer(active, body.query, body.context, result)
      const { enrichInvestigationResult } = await insightsPromise
      result = enrichInvestigationResult(result, { answerMode: body.context.answerMode, contextUsed: groundedQuery !== body.query })
      const messageId = `MSG-${crypto.randomUUID()}`
      result = {
        ...result,
        conversationId,
        messageId,
        investigationId: body.context.investigationId || null,
        dataVersion: active.core.dataset.version,
        queryPlan: buildQueryPlan(body.query, groundedQuery, result, body.context),
        claimCitations: result.citations || [],
        provider: result.provider || { name: 'KAVACH deterministic core', model: 'shared-domain-2.0', kind: 'deterministic' },
        latency: { totalMs: Date.now() - startedAt },
        approvalState: result.approvalState || (result.answerClass === 'DATABASE_GROUNDED' ? 'human-review-required' : 'not-required'),
      }
      storeConversationTurn(conversation, body.query, result, messageId)
      if (active.capabilities.datastore.available) {
        if (body.context.newConversation && !knownConversations.has(conversationId)) {
          await catalyst.appendRow(req, 'Conversations', { conversation_id: conversationId, user_id: session?.id || session?.email || 'anonymous-demo', language: body.context.language || body.context.interfaceLanguage || 'en', created_at: new Date().toISOString() }).then(() => { knownConversations.add(conversationId); conversation.persisted = true }).catch(() => null)
        }
        await Promise.all([
          catalyst.appendRow(req, 'QueryRuns', { request_id: id, conversation_id: conversationId, actor: session?.email || 'anonymous-demo', intent: result.intent, filters_json: JSON.stringify({ ...result.filters, answerMode: result.responseMode }), mode: active.mode, created_at: new Date().toISOString() }).catch(() => null),
          catalyst.appendRow(req, 'ConversationMessages', { message_id: messageId, conversation_id: conversationId, actor: session?.email || 'anonymous-demo', user_message: body.query, assistant_message: result.answer, answer_class: result.answerClass, request_id: id, citations_json: JSON.stringify(result.citations || []), provider_json: JSON.stringify(result.provider), data_version: result.dataVersion, created_at: new Date().toISOString() }).catch(() => null),
        ])
      }
      return sendJson(req, res, 200, result, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/similarity') {
      const body = SimilarSchema.parse(await readJson(req))
      const similarity = active.core.similar(body.firId)
      if (active.capabilities.intelligence.available && active.capabilities.intelligence.provider === 'Catalyst QuickML') {
        await Promise.all(similarity.matches.slice(0, 3).map(async (match) => {
          try {
            match.modelSignal = await catalyst.quickMlPredict(req, quickMlFeatures(match))
          } catch (error) {
            match.modelLimitation = `QuickML unavailable: ${error.message}`
          }
        }))
      }
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, model: active.capabilities.intelligence, ...similarity }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/graph') {
      const body = SimilarSchema.parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, graph: active.core.graph(body.firId) }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/hotspots') {
      const body = HotspotSchema.parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, hotspots: active.core.hotspots(body) }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/scenarios') {
      if (!['Admin', 'Investigator', 'Supervisor'].includes(authenticatedUser.role)) return sendJson(req, res, 403, errorPayload(id, 'FORBIDDEN', `The ${authenticatedUser.role} role cannot perform this action.`, false, active.mode), id)
      const body = ScenarioSchema.parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, scenario: active.core.scenario(body) }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/evidence/uploads') {
      const access = await requireIdentity(req, ['Investigator', 'Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      if (!active.capabilities.storage.available) return sendJson(req, res, 503, errorPayload(id, 'STORAGE_UNAVAILABLE', 'Catalyst Stratus/File Store is not enabled. Analyze locally without persistence.', false, active.mode), id)
      const upload = validatedEvidenceUpload(await readJson(req, 14 * 1024 * 1024 + 4096))
      const evidenceId = `EV-${upload.actualSha256.slice(0, 16).toUpperCase()}`
      let storage
      try {
        storage = await catalyst.storeEvidence(req, {
          evidenceId,
          fileName: upload.file.name,
          contentType: upload.contentType,
          buffer: upload.buffer,
          sha256: upload.actualSha256,
        })
        if (!storage) throw Object.assign(new Error('No Catalyst evidence storage adapter accepted the file.'), { code: 'STORAGE_UNAVAILABLE' })
        capabilityCanaries.storage = true
      } catch (error) {
        capabilityCanaries.storage = false
        return sendJson(req, res, 503, errorPayload(id, error.code || 'STORAGE_WRITE_FAILED', `Evidence was not persisted: ${error.message}`, false, active.mode), id)
      }
      let ocrExtraction = null
      let workflowRun = null
      const capabilityLimitations = []
      if (['png', 'jpg', 'jpeg'].includes(upload.extension) && active.capabilities.ocr?.available) {
        try {
          const output = await catalyst.extractOcr(req, { fileName: upload.file.name, buffer: upload.buffer, language: 'eng' })
          if (!output) throw Object.assign(new Error('Zia returned no extraction.'), { code: 'ZIA_OCR_EMPTY_RESPONSE' })
          capabilityCanaries.ocr = true
          ocrExtraction = { provider: 'Catalyst Zia OCR', verified: true, output }
        } catch (error) {
          capabilityCanaries.ocr = false
          capabilityLimitations.push(`Zia OCR did not complete: ${error.message}`)
        }
      }
      if (active.capabilities.orchestration?.available) {
        try {
          workflowRun = await catalyst.startCircuit(req, { name: `netra-evidence-${upload.actualSha256.slice(0, 12)}`, input: { evidenceId, sha256: upload.actualSha256, storageProvider: storage.provider, storageReference: storage.reference, workflow: ['extraction', 'matching', 'human-review', 'report'] } })
          capabilityCanaries.orchestration = Boolean(workflowRun?.executionId)
        } catch (error) {
          capabilityCanaries.orchestration = false
          capabilityLimitations.push(`Circuit workflow did not start: ${error.message}`)
        }
      }
      const audit = await appendAudit(req, { actor: access.user.email, action: 'STORE_EVIDENCE', resource: evidenceId, requestId: id, mode: active.mode, details: { fileName: upload.file.name, size: upload.buffer.length, sha256: upload.actualSha256, provider: storage.provider, ocrVerified: Boolean(ocrExtraction), circuitExecutionId: workflowRun?.executionId || null } })
      const evidence = {
        evidenceId,
        fileName: upload.file.name,
        contentType: upload.contentType,
        size: upload.buffer.length,
        sha256: upload.actualSha256,
        storage,
        provenance: {
          collectedAt: upload.collectedAt || null,
          receivedAt: new Date().toISOString(),
          serverHashVerified: true,
          syntheticOnly: true,
        },
        reviewState: 'unreviewed',
        ocrExtraction,
        workflowRun,
        limitations: capabilityLimitations,
        auditRef: audit.id,
      }
      evidenceObjects.set(evidenceId, evidence)
      if (active.capabilities.datastore.available) {
        await catalyst.appendRow(req, 'EvidenceObjects', {
          evidence_id: evidenceId,
          file_name: evidence.fileName,
          mime_type: evidence.contentType,
          size_bytes: evidence.size,
          sha256: evidence.sha256,
          storage_provider: storage.provider,
          storage_ref: storage.reference,
          provenance_json: JSON.stringify(evidence.provenance),
          review_status: evidence.reviewState,
          created_by: access.user.email,
          created_at: evidence.provenance.receivedAt,
        }).catch(() => null)
        if (ocrExtraction) await catalyst.appendRow(req, 'EvidenceFacts', { evidence_id: evidenceId, extractor: ocrExtraction.provider, facts_json: JSON.stringify(ocrExtraction.output), provenance: 'machine-extracted', review_status: 'unreviewed', created_at: evidence.provenance.receivedAt }).catch(() => null)
      }
      return sendJson(req, res, 201, { requestId: id, mode: active.mode, stored: true, evidence, runtime: runtimeTruth(active.capabilities, { dataSource: active.runtimeTruth.dataSource?.kind, persistence: active.runtimeTruth.persistence?.available }) }, id)
    }

    if (req.method === 'POST' && /^\/api\/v1\/evidence\/[^/]+\/analyze$/.test(path)) {
      const access = await requireIdentity(req, ['Investigator', 'Supervisor', 'Admin'])
      if (access.error && active.mode === 'catalyst-live') return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = EvidenceSchema.parse(await readJson(req))
      const evidenceId = decodeURIComponent(path.split('/')[4])
      const storedEvidence = evidenceObjects.get(evidenceId) || null
      const analysis = active.core.analyzeEvidence({ ...body, mode: active.mode, limitations: [...(body.limitations || []), ...active.limitations] })
      const audit = await appendAudit(req, { actor: access.user?.email || 'anonymous-demo', action: 'ANALYZE_EVIDENCE', resource: body.file.sha256, requestId: id, mode: active.mode, details: { fileName: body.file.name, size: body.file.size } })
      analysis.auditRef = audit.id
      analysis.evidenceId = evidenceId
      analysis.provenance = storedEvidence ? { ...storedEvidence.provenance, sha256: storedEvidence.sha256, storage: storedEvidence.storage, reviewState: storedEvidence.reviewState, workflowRun: storedEvidence.workflowRun } : { sha256: body.file.sha256, storage: null, reviewState: 'unreviewed', serverHashVerified: false }
      if (storedEvidence?.ocrExtraction) analysis.ocrExtraction = storedEvidence.ocrExtraction
      if (active.capabilities.datastore.available) await catalyst.appendRow(req, 'EvidenceExtractions', { evidence_id: body.file.sha256, extractor: 'SAMVAAD deterministic evidence parser', facts_json: JSON.stringify(analysis.facts || analysis.evidence || []), limitations_json: JSON.stringify(analysis.limitations || []), review_status: 'machine-extracted' }).catch(() => null)
      return sendJson(req, res, 200, { requestId: id, ...analysis }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/reports') {
      const access = await requireIdentity(req, ['Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      let body = z.object({
        answer: z.string().max(10000),
        answerClass: z.string().max(80).optional(),
        citations: z.array(z.object({ firId: z.string().regex(/^SYN-[A-Z0-9-]+$/i), field: z.string().max(100).optional(), excerpt: z.string().max(2000) }).passthrough()).max(100),
        approved: z.literal(true),
        conversationId: z.string().max(120).optional(),
        conversationHistory: z.array(z.object({ role: z.string().max(30).optional(), content: z.string().max(10000).optional(), query: z.string().max(4000).optional(), answer: z.string().max(10000).optional(), requestId: z.string().max(120).optional(), messageId: z.string().max(120).optional(), intent: z.string().max(100).optional(), timestamp: z.string().max(80).nullable().optional() }).passthrough()).max(500).optional(),
        dataVersion: z.string().max(100).optional(),
        queryId: z.string().max(120).optional(),
        filters: z.record(z.string(), z.unknown()).optional(),
        confidence: z.object({ score: z.number().min(0).max(1).optional(), band: z.string().max(40).optional(), calibration: z.string().max(500).optional() }).passthrough().optional(),
        provider: z.object({ name: z.string().max(160).optional(), model: z.string().max(160).optional(), kind: z.string().max(80).optional() }).passthrough().optional(),
        limitations: z.array(z.string().max(1000)).max(30).optional(),
      }).parse(await readJson(req, 8 * 1024 * 1024))
      const serverConversation = body.conversationId ? conversations.get(body.conversationId) : null
      const serverTurns = completeConversationTurns(serverConversation)
      if (serverTurns.length) {
        const citations = [...new Map(serverTurns.flatMap((turn) => turn.citations || []).map((citation) => [`${citation.firId}:${citation.field}:${citation.excerpt}`, citation])).values()]
        body = { ...body, conversationHistory: serverTurns, citations: citations.length ? citations : body.citations }
      }
      const audit = await appendAudit(req, { actor: access.user.email, action: 'APPROVE_REPORT', resource: body.queryId || 'EvidenceBrief', requestId: id, mode: active.mode, details: { conversationId: body.conversationId || null, dataVersion: body.dataVersion || active.core.dataset.version, citationCount: body.citations.length, transcriptTurns: body.conversationHistory?.length || 0 } })
      const html = reportHtml(body, access.user, audit.id)
      const pdf = active.capabilities.reports.available ? await catalyst.renderPdf(req, html).catch(() => null) : null
      if (pdf) capabilityCanaries.smartBrowz = true
      const reportId = `RPT-${crypto.randomUUID()}`
      if (active.capabilities.datastore.available) await catalyst.appendRow(req, 'Reports', { report_id: reportId, request_id: id, query_id: body.queryId || '', conversation_id: body.conversationId || '', data_version: body.dataVersion || active.core.dataset.version, approved_by: access.user.email, approval_state: 'approved', renderer: pdf ? 'Catalyst SmartBrowz' : 'Browser print fallback', storage_key: '', citation_count: body.citations.length, transcript_turns: body.conversationHistory?.length || 0, created_at: new Date().toISOString() }).catch(() => null)
      const report = { requestId: id, mode: active.mode, reportId, queryId: body.queryId || null, conversationId: body.conversationId || null, auditRef: audit.id, renderer: pdf ? 'Catalyst SmartBrowz' : 'Browser print fallback', html, pdf, createdAt: new Date().toISOString(), approvedBy: access.user.email, approvalState: 'approved', dataVersion: body.dataVersion || active.core.dataset.version, citationCount: body.citations.length, transcriptTurns: body.conversationHistory?.length || 0, limitations: pdf ? [] : ['SmartBrowz is unavailable; the returned HTML must be printed locally and is labeled accordingly.'] }
      reports.set(reportId, report)
      return sendJson(req, res, 200, report, id)
    }

    if (req.method === 'GET' && path.startsWith('/api/v1/reports/')) {
      const access = await requireIdentity(req, ['Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const reportId = decodeURIComponent(path.split('/').pop())
      const report = reports.get(reportId)
      return report ? sendJson(req, res, 200, report, id) : sendJson(req, res, 404, errorPayload(id, 'REPORT_NOT_FOUND', 'Report is unavailable in this runtime.', false, active.mode), id)
    }

    if (req.method === 'GET' && path === '/api/v1/audit') {
      const access = await requireIdentity(req, ['Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const persisted = active.capabilities.datastore.available ? await catalyst.loadRows(req, 'AuditEvents').catch(() => []) : []
      const events = persisted.length ? persisted.map(normalizedAuditEvent).sort((left, right) => right.sequence - left.sequence).slice(0, 100) : auditEvents.slice(-100).reverse()
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, events, chainHead: events[0]?.hash || auditEvents.at(-1)?.hash || 'GENESIS' }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/feedback') {
      const access = await requireIdentity(req, ['Investigator', 'Analyst', 'Supervisor', 'Admin'])
      if (access.error && active.mode === 'catalyst-live') return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = FeedbackSchema.parse(await readJson(req))
      const event = { id: `FDB-${feedbackEvents.length + 1}`, ...body, actor: access.user?.email || 'anonymous-demo', timestamp: new Date().toISOString() }
      feedbackEvents.push(event)
      await appendAudit(req, { actor: event.actor, action: 'REVIEW_LEAD', resource: body.requestId, requestId: id, mode: active.mode, details: { decision: body.decision } })
      if (active.capabilities.datastore.available) await catalyst.appendRow(req, 'Feedback', { feedback_id: event.id, request_id: body.requestId, actor: event.actor, decision: body.decision, note: body.note || '', created_at: event.timestamp }).catch(() => null)
      return sendJson(req, res, 201, { requestId: id, mode: active.mode, feedback: event }, id)
    }

    return sendJson(req, res, 404, errorPayload(id, 'ROUTE_NOT_FOUND', `No API route matches ${path}.`, false, active.mode), id)
  } catch (error) {
    if (error instanceof z.ZodError) return sendJson(req, res, 400, errorPayload(id, 'VALIDATION_ERROR', error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')), id)
    return sendJson(req, res, error.status || 500, errorPayload(id, error.code || 'INTERNAL_ERROR', error.message || 'Unexpected API error.', Boolean(error.retryable)), id)
  }
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3001)
  http.createServer(handleRequest).listen(port, () => console.log(`SAMVAAD-IQ API listening on http://127.0.0.1:${port}/api/v1`))
}

module.exports = handleRequest
