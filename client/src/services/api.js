const configuredBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, '')
const API_BASES = configuredBase
  ? [configuredBase]
  : ['127.0.0.1', 'localhost'].includes(window.location.hostname)
    ? ['/api/v1']
    : ['/server/api/api/v1', '/api/v1']
const SESSION_KEY = 'samvaad_api_token'
let activeApiBase = API_BASES[0]

export class ApiError extends Error {
  constructor(message, payload = {}, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = payload.code || 'API_ERROR'
    this.requestId = payload.requestId || null
    this.retryable = Boolean(payload.retryable)
    this.status = status
  }
}

export function storeApiToken(token, scheme = 'Bearer') {
  window.localStorage.removeItem(SESSION_KEY)
  if (token) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, scheme }))
  else window.sessionStorage.removeItem(SESSION_KEY)
}

export function isRetryableApiError(error) {
  if (!error) return false
  if (!(error instanceof ApiError)) return error instanceof TypeError || error.name === 'AbortError'
  return error.retryable || error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500 || ['API_TIMEOUT', 'NON_JSON_API', 'NETWORK_ERROR'].includes(error.code)
}

function apiSession() {
  const stored = window.sessionStorage.getItem(SESSION_KEY)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    return parsed?.token ? parsed : null
  } catch {
    return { token: stored, scheme: 'Bearer' }
  }
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 6000)
  const session = apiSession()
  try {
    let lastError
    const bases = [activeApiBase, ...API_BASES.filter((base) => base !== activeApiBase)]
    for (const base of bases) {
      try {
        const response = await fetch(`${base}${path}`, {
          ...options,
          signal: controller.signal,
          credentials: 'include',
          headers: {
            accept: 'application/json',
            ...(options.body ? { 'content-type': 'application/json' } : {}),
            ...(session ? { authorization: `${session.scheme || 'Bearer'} ${session.token}` } : {}),
            ...(options.headers || {}),
          },
        })
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) throw new ApiError('The configured API returned the web application instead of JSON.', { code: 'NON_JSON_API' }, response.status)
        const payload = await response.json()
        if (!response.ok) throw new ApiError(payload.message || `API request failed with ${response.status}.`, payload, response.status)
        activeApiBase = base
        return payload
      } catch (error) {
        lastError = error
        if (error instanceof ApiError && !['NON_JSON_API', 'ROUTE_NOT_FOUND'].includes(error.code)) throw error
      }
    }
    throw lastError
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('The API health window expired.', { code: 'API_TIMEOUT', retryable: true })
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export const api = {
  health: () => request('/health', { timeout: 3500 }),
  capabilities: () => request('/capabilities', { timeout: 3500 }),
  aiStatus: () => request('/ai/status', { timeout: 3500 }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  demoSession: (profile) => request('/auth/demo-session', { method: 'POST', body: JSON.stringify(typeof profile === 'string' ? { email: profile } : profile) }),
  secureLogin: () => request('/auth/secure-url'),
  logout: () => request('/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
  currentUser: () => request('/auth/me'),
  seedSyntheticData: () => request('/admin/seed', { method: 'POST', body: JSON.stringify({ confirm: true }), timeout: 60000 }),
  cases: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value))
    return request(`/cases${params.size ? `?${params}` : ''}`)
  },
  caseByFir: (firId) => request(`/cases/${encodeURIComponent(firId)}`),
  query: (query, context = {}) => request('/query', {
    method: 'POST',
    body: JSON.stringify({
      message: query,
      conversationId: context.conversationId,
      investigationId: context.investigationId,
      answerMode: context.answerMode,
      language: context.language || context.interfaceLanguage,
      contextRefs: context.contextRefs || context.previousFirIds,
      dataVersion: context.dataVersion,
      context,
    }),
    timeout: 25_000,
  }),
  conversations: () => request('/conversations'),
  conversationMessages: (conversationId) => request(`/conversations/${encodeURIComponent(conversationId)}/messages`),
  dataVersions: () => request('/data/versions'),
  search: (query, limit = 10) => request(`/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`),
  knowledgeSearch: (query = '') => request(`/knowledge/search${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  investigations: () => request('/investigations'),
  createInvestigation: (payload) => request('/investigations', { method: 'POST', body: JSON.stringify(payload) }),
  updateInvestigation: (investigationId, payload) => request(`/investigations/${encodeURIComponent(investigationId)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  tasks: () => request('/tasks'),
  requestApproval: (payload) => request('/approvals', { method: 'POST', body: JSON.stringify(payload) }),
  updateApproval: (approvalId, payload) => request(`/approvals/${encodeURIComponent(approvalId)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  trends: (filters = {}) => request('/analytics/trends', { method: 'POST', body: JSON.stringify(filters) }),
  alerts: (filters = {}) => request('/analytics/alerts', { method: 'POST', body: JSON.stringify(filters) }),
  cohorts: (dimension = 'district') => request('/analytics/cohorts', { method: 'POST', body: JSON.stringify({ dimension }) }),
  similarity: (firId) => request('/analytics/similarity', { method: 'POST', body: JSON.stringify({ firId }) }),
  graph: (firId) => request('/analytics/graph', { method: 'POST', body: JSON.stringify({ firId }) }),
  hotspots: (filters) => request('/analytics/hotspots', { method: 'POST', body: JSON.stringify(filters) }),
  scenario: (payload) => request('/scenarios', { method: 'POST', body: JSON.stringify(payload) }),
  createEvidenceUpload: (payload) => request('/evidence/uploads', { method: 'POST', body: JSON.stringify(payload), timeout: 30_000 }),
  analyzeEvidence: (evidenceId, payload) => request(`/evidence/${encodeURIComponent(evidenceId)}/analyze`, { method: 'POST', body: JSON.stringify(payload), timeout: 15000 }),
  report: (payload) => request('/reports', { method: 'POST', body: JSON.stringify(payload), timeout: 20000 }),
  audit: () => request('/audit'),
  feedback: (payload) => request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
}

export { activeApiBase as API_BASE }
