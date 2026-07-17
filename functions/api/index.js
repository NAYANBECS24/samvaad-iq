const http = require('http')
const crypto = require('crypto')
const { URL } = require('url')
const { z } = require('zod')
const seed = require('./data/seed-data.json')
const catalyst = require('./providers/catalyst')

const corePromise = import('./core/index.mjs')
let memoryCorePromise = null
let catalystCoreCache = null
const auditEvents = []
const feedbackEvents = []
const rateWindows = new Map()

const demoUsers = seed.users
const roleLanding = { Admin: '/dashboard', Investigator: '/chat', Analyst: '/dashboard', Supervisor: '/analytics' }
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173,https://samvaad-iq-ziiputqp.onslate.in')
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
    'access-control-allow-methods': 'GET,POST,OPTIONS',
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

async function runtime(req) {
  const capabilities = catalyst.capabilitySnapshot(req)
  if (capabilities.datastore.available) {
    try {
      const rows = await catalyst.loadCases(req)
      if (rows?.length) {
        const dataVersion = `${rows.length}-${rows[0]?.MODIFIEDTIME || ''}`
        if (!catalystCoreCache || catalystCoreCache.version !== dataVersion) {
          const { createIntelligenceCore } = await corePromise
          catalystCoreCache = { version: dataVersion, core: createIntelligenceCore({ ...seed, cases: rows }, { total: rows.length }) }
        }
        return { core: catalystCoreCache.core, mode: 'catalyst-live', capabilities, limitations: [] }
      }
      return { core: await baseCore(), mode: 'offline-demo', capabilities, limitations: ['Catalyst Data Store is enabled but contains no Cases rows; using the labeled synthetic fallback.'] }
    } catch (error) {
      return { core: await baseCore(), mode: 'offline-demo', capabilities, limitations: [`Catalyst Data Store was unavailable: ${error.message}`] }
    }
  }
  return { core: await baseCore(), mode: 'offline-demo', capabilities, limitations: ['Catalyst Data Store is not enabled; using the labeled deterministic demo dataset.'] }
}

function appendAudit({ actor, action, resource, requestId: id, mode, details = {} }) {
  const previousHash = auditEvents.at(-1)?.hash || 'GENESIS'
  const event = {
    id: `AUD-${String(auditEvents.length + 1).padStart(6, '0')}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    resource,
    requestId: id,
    mode,
    details,
    previousHash,
  }
  event.hash = crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex')
  auditEvents.push(event)
  return event
}

async function identity(req) {
  const catalystUser = await catalyst.currentUser(req)
  if (catalystUser) return catalystUser
  const bearer = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '')
  return catalyst.verifyLocalToken(bearer)
}

async function requireIdentity(req, roles = []) {
  const user = await identity(req)
  if (!user) return { error: { status: 401, code: 'AUTH_REQUIRED', message: 'A Catalyst or explicitly enabled local demo session is required.' } }
  if (roles.length && !roles.includes(user.role)) return { error: { status: 403, code: 'FORBIDDEN', message: `The ${user.role} role cannot perform this action.` } }
  return { user }
}

function reportHtml(payload, user, auditRef) {
  const citations = (payload.citations || []).map((item) => `<li><strong>${escapeHtml(item.firId)}</strong> — ${escapeHtml(item.excerpt)}</li>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>SAMVAAD-IQ Evidence Brief</title><style>body{font:14px Arial;color:#132238;line-height:1.5}h1{color:#073b5c}section{border-top:1px solid #ccd6df;padding-top:12px;margin-top:16px}.label{color:#a33;font-weight:bold}</style></head><body><p class="label">SYNTHETIC DEMO DATA</p><h1>SAMVAAD-IQ Evidence Brief</h1><p>NETRA intelligence platform · KAVACH explainable analysis</p><section><h2>Analyst summary</h2><p>${escapeHtml(payload.answer || 'No summary supplied.')}</p></section><section><h2>Evidence citations</h2><ol>${citations || '<li>No cited evidence supplied.</li>'}</ol></section><section><h2>Governance</h2><p>Prepared for ${escapeHtml(user.email)} (${escapeHtml(user.role)}). Audit reference: ${escapeHtml(auditRef)}. Investigative lead only. Human verification and supervisory approval are required.</p></section></body></html>`
}

const QuerySchema = z.object({ query: z.string().trim().min(4).max(4000), context: z.record(z.string(), z.unknown()).optional() })
const SimilarSchema = z.object({ firId: z.string().min(5).max(64) })
const HotspotSchema = z.object({ district: z.string().max(80).nullable().optional(), crimeType: z.string().max(80).nullable().optional() })
const ScenarioSchema = HotspotSchema.extend({ units: z.coerce.number().int().min(0).max(20).default(3) })
const EvidenceSchema = z.object({ text: z.string().max(200000).default(''), file: z.object({ name: z.string().max(255), type: z.string().max(120), size: z.number().int().min(0).max(10 * 1024 * 1024), sha256: z.string().regex(/^[a-f0-9]{64}$/i) }).passthrough(), limitations: z.array(z.string()).optional() })
const FeedbackSchema = z.object({ requestId: z.string().max(100), decision: z.enum(['accept', 'reject', 'needs-review']), note: z.string().max(1000).optional() })

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
      return sendJson(req, res, 200, { requestId: id, status: 'ok', name: 'SAMVAAD-IQ API', version: '1.0.0', mode: active.mode, dataVersion: active.core.dataset.version, timestamp: new Date().toISOString() }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/capabilities') {
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataLabel: active.core.dataset.label, capabilities: active.capabilities, limitations: active.limitations }, id)
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
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, token, user: { ...candidate, landing: roleLanding[candidate.role] } }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/cases') {
      const filters = { district: url.searchParams.get('district'), crimeType: url.searchParams.get('crimeType') }
      const query = url.searchParams.get('q') || `${filters.district || ''} ${filters.crimeType || ''}`
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
      const cases = query.trim() ? active.core.search(query, filters, limit).map((item) => item.case) : active.core.cases.slice(0, limit)
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, dataVersion: active.core.dataset.version, cases, totalAvailable: active.core.cases.length, limitations: active.limitations }, id)
    }

    if (req.method === 'GET' && path.startsWith('/api/v1/cases/')) {
      const firId = decodeURIComponent(path.split('/').pop())
      const caseRecord = active.core.caseById.get(firId)
      return caseRecord ? sendJson(req, res, 200, { requestId: id, mode: active.mode, case: caseRecord }, id) : sendJson(req, res, 404, errorPayload(id, 'CASE_NOT_FOUND', 'Synthetic case not found.', false, active.mode), id)
    }

    if (req.method === 'POST' && path === '/api/v1/query') {
      const body = QuerySchema.parse(await readJson(req))
      const session = await identity(req)
      const audit = appendAudit({ actor: session?.email || 'anonymous-demo', action: 'QUERY', resource: 'CaseIndex', requestId: id, mode: active.mode, details: { queryLength: body.query.length } })
      const result = active.core.answer(body.query, { mode: active.mode, requestId: id, auditRef: audit.id })
      result.limitations = [...active.limitations, ...result.limitations]
      if (active.capabilities.datastore.available) await catalyst.appendRow(req, 'QueryRuns', { request_id: id, actor: session?.email || 'anonymous-demo', intent: result.intent, mode: active.mode, created_at: new Date().toISOString() }).catch(() => null)
      return sendJson(req, res, 200, result, id)
    }

    if (req.method === 'POST' && path === '/api/v1/analytics/similarity') {
      const body = SimilarSchema.parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, ...active.core.similar(body.firId) }, id)
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
      const body = ScenarioSchema.parse(await readJson(req))
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, scenario: active.core.scenario(body) }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/evidence/uploads') {
      const access = await requireIdentity(req, ['Investigator', 'Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      if (!active.capabilities.storage.available) return sendJson(req, res, 503, errorPayload(id, 'STORAGE_UNAVAILABLE', 'Catalyst Stratus/File Store is not enabled. Analyze locally without persistence.', false, active.mode), id)
      return sendJson(req, res, 501, errorPayload(id, 'PRESIGN_NOT_CONFIGURED', 'Storage is enabled but bucket configuration is incomplete.', false, active.mode), id)
    }

    if (req.method === 'POST' && /^\/api\/v1\/evidence\/[^/]+\/analyze$/.test(path)) {
      const access = await requireIdentity(req, ['Investigator', 'Supervisor', 'Admin'])
      if (access.error && active.mode === 'catalyst-live') return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = EvidenceSchema.parse(await readJson(req))
      const analysis = active.core.analyzeEvidence({ ...body, mode: active.mode, limitations: [...(body.limitations || []), ...active.limitations] })
      const audit = appendAudit({ actor: access.user?.email || 'anonymous-demo', action: 'ANALYZE_EVIDENCE', resource: body.file.sha256, requestId: id, mode: active.mode, details: { fileName: body.file.name, size: body.file.size } })
      analysis.auditRef = audit.id
      return sendJson(req, res, 200, { requestId: id, ...analysis }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/reports') {
      const access = await requireIdentity(req, ['Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = z.object({ answer: z.string().max(10000), citations: z.array(z.object({ firId: z.string(), excerpt: z.string() })).max(30), approved: z.literal(true) }).parse(await readJson(req))
      const audit = appendAudit({ actor: access.user.email, action: 'APPROVE_REPORT', resource: 'EvidenceBrief', requestId: id, mode: active.mode })
      const html = reportHtml(body, access.user, audit.id)
      const pdf = active.capabilities.reports.available ? await catalyst.renderPdf(req, html).catch(() => null) : null
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, reportId: `RPT-${crypto.randomUUID()}`, auditRef: audit.id, renderer: pdf ? 'Catalyst SmartBrowz' : 'Browser print fallback', html, pdf, limitations: pdf ? [] : ['SmartBrowz is unavailable; the returned HTML must be printed locally and is labeled accordingly.'] }, id)
    }

    if (req.method === 'GET' && path === '/api/v1/audit') {
      const access = await requireIdentity(req, ['Supervisor', 'Admin'])
      if (access.error) return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      return sendJson(req, res, 200, { requestId: id, mode: active.mode, events: auditEvents.slice(-100).reverse(), chainHead: auditEvents.at(-1)?.hash || 'GENESIS' }, id)
    }

    if (req.method === 'POST' && path === '/api/v1/feedback') {
      const access = await requireIdentity(req, ['Investigator', 'Analyst', 'Supervisor', 'Admin'])
      if (access.error && active.mode === 'catalyst-live') return sendJson(req, res, access.error.status, errorPayload(id, access.error.code, access.error.message, false, active.mode), id)
      const body = FeedbackSchema.parse(await readJson(req))
      const event = { id: `FDB-${feedbackEvents.length + 1}`, ...body, actor: access.user?.email || 'anonymous-demo', timestamp: new Date().toISOString() }
      feedbackEvents.push(event)
      appendAudit({ actor: event.actor, action: 'REVIEW_LEAD', resource: body.requestId, requestId: id, mode: active.mode, details: { decision: body.decision } })
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
