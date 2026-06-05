const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:3001/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `API request failed with ${response.status}`)
  }

  return payload
}

export const api = {
  health: () => request('/health'),
  seedSummary: () => request('/seed/summary'),
  dashboardSummary: () => request('/dashboard/summary'),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  cases: () => request('/cases'),
  caseByFir: (firId) => request(`/cases/${encodeURIComponent(firId)}`),
  chat: (query, role = 'Investigator') =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ query, role }),
    }),
  similar: (firId) => request(`/similar/${encodeURIComponent(firId)}`),
  crimeDnaSimilar: (firId) =>
    request('/crime-dna/similar', {
      method: 'POST',
      body: JSON.stringify({ firId }),
    }),
  graph: (firId) => request(`/graph/${encodeURIComponent(firId)}`),
  hotspots: ({ district, crimeType } = {}) => {
    const params = new URLSearchParams()
    if (district) params.set('district', district)
    if (crimeType) params.set('crimeType', crimeType)
    const suffix = params.toString() ? `?${params}` : ''
    return request(`/hotspots${suffix}`)
  },
  whatIf: (payload) =>
    request('/whatif', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  simulatePatrol: (payload) =>
    request('/simulate/patrol', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  diffusion: ({ district = 'All', crimeType = 'All' } = {}) => {
    const params = new URLSearchParams({ district, crimeType })
    return request(`/diffusion?${params}`)
  },
  legalMap: (firId) =>
    request('/legal/map', {
      method: 'POST',
      body: JSON.stringify({ firId }),
    }),
  auditLogs: () => request('/audit/logs'),
  catalystReadiness: () => request('/catalyst/readiness'),
  buildReport: (payload) =>
    request('/report', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
