const API_BASE = (import.meta.env.VITE_API_BASE || '/api/v1').replace(/\/$/, '')
const SESSION_KEY = 'samvaad_api_token'

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

export function storeApiToken(token) {
  if (token) window.localStorage.setItem(SESSION_KEY, token)
  else window.localStorage.removeItem(SESSION_KEY)
}

function apiToken() {
  return window.localStorage.getItem(SESSION_KEY)
}

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 6000)
  const token = apiToken()
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        accept: 'application/json',
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) throw new ApiError('The configured API returned a non-JSON response.', { code: 'NON_JSON_API' }, response.status)
    const payload = await response.json()
    if (!response.ok) throw new ApiError(payload.message || `API request failed with ${response.status}.`, payload, response.status)
    return payload
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
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  cases: (filters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value))
    return request(`/cases${params.size ? `?${params}` : ''}`)
  },
  caseByFir: (firId) => request(`/cases/${encodeURIComponent(firId)}`),
  query: (query, context = {}) => request('/query', { method: 'POST', body: JSON.stringify({ query, context }) }),
  similarity: (firId) => request('/analytics/similarity', { method: 'POST', body: JSON.stringify({ firId }) }),
  graph: (firId) => request('/analytics/graph', { method: 'POST', body: JSON.stringify({ firId }) }),
  hotspots: (filters) => request('/analytics/hotspots', { method: 'POST', body: JSON.stringify(filters) }),
  scenario: (payload) => request('/scenarios', { method: 'POST', body: JSON.stringify(payload) }),
  createEvidenceUpload: (payload) => request('/evidence/uploads', { method: 'POST', body: JSON.stringify(payload) }),
  analyzeEvidence: (evidenceId, payload) => request(`/evidence/${encodeURIComponent(evidenceId)}/analyze`, { method: 'POST', body: JSON.stringify(payload), timeout: 15000 }),
  report: (payload) => request('/reports', { method: 'POST', body: JSON.stringify(payload), timeout: 20000 }),
  audit: () => request('/audit'),
  feedback: (payload) => request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
}

export { API_BASE }
