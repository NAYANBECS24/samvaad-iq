const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const http = require('node:http')

process.env.ALLOW_DEMO_AUTH = 'true'
process.env.CATALYST_RUNTIME = 'false'
const TEST_PASSWORD = `test-${crypto.randomUUID()}`
process.env.DEMO_PASSWORD = TEST_PASSWORD
process.env.DEMO_AUTH_SECRET = `secret-${crypto.randomUUID()}`

const handler = require('../index')
let server
let baseUrl
let investigatorSession

test.before(async () => {
  server = http.createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  investigatorSession = await loginAs('investigator@ksp.demo')
})

test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

async function loginAs(email) {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  })
  assert.equal(response.status, 200)
  return response.json()
}

function protectedFetch(path, options = {}, session = investigatorSession) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${session.token}`,
      ...(options.headers || {}),
    },
  })
}

test('health is versioned JSON and exposes the honest runtime mode', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  const payload = await response.json()
  assert.equal(payload.mode, 'offline-demo')
  assert.equal(payload.version, '2.0.0')
  assert.equal(payload.runtime.apiReachable, true)
  assert.equal(payload.runtime.persistence.available, false)
  assert.equal(payload.runtime.generativeAi.verified, false)
})

test('query returns the standardized evidence envelope', async () => {
  const response = await protectedFetch('/api/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'Find similar cases to SYN-2025-BLR-001' }),
  })
  assert.equal(response.status, 200)
  const payload = await response.json()
  for (const field of ['requestId', 'mode', 'intent', 'filters', 'answer', 'citations', 'confidence', 'evidence', 'visualizations', 'limitations', 'nextActions', 'auditRef']) {
    assert.ok(Object.hasOwn(payload, field), `missing ${field}`)
  }
  assert.ok(payload.citations.length > 0)
  assert.equal(payload.responseMode, 'investigator')
  assert.equal(payload.pipeline.length, 6)
  assert.equal(payload.investigationInsights.coverage.unsupportedAnswerIds.length, 0)
})

test('query supports timeline response mode and bounded conversation context', async () => {
  const response = await protectedFetch('/api/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: 'Summarize motorcycle theft cases',
      context: {
        conversationId: 'CONV-TEST-TIMELINE',
        newConversation: true,
        answerMode: 'timeline',
        interfaceLanguage: 'en',
        history: [{ query: 'Find motorcycle theft', intent: 'CASE_SEARCH_QUERY', firIds: ['SYN-2025-BLR-001'] }],
      },
    }),
  })
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.responseMode, 'timeline')
  assert.ok(payload.investigationInsights.timeline.length > 0)
  assert.match(payload.investigationInsights.modeSummary, /Timeline prepared/)
})

test('short conversational prompts receive a normal assistant response', async () => {
  const response = await protectedFetch('/api/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'hi' }),
  })
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.intent, 'CONVERSATIONAL_QUERY')
  assert.match(payload.answer, /SAMVAAD-IQ/)
  assert.equal(payload.citations.length, 0)
  assert.equal(payload.answerClass, 'GENERAL_AI')
})

test('general questions are explicitly separated from database-grounded answers', async () => {
  const response = await protectedFetch('/api/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'What is the capital of France?', conversationId: 'CONV-GENERAL-TEST', language: 'en' }),
  })
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.answerClass, 'GENERAL_AI')
  assert.equal(payload.conversationId, 'CONV-GENERAL-TEST')
  assert.match(payload.messageId, /^MSG-/)
  assert.equal(payload.citations.length, 0)
  assert.equal(payload.queryPlan.groundingRequired, false)
  assert.equal(payload.dataVersion, 'synthetic-20260717-1000')
})

test('fixed demo profiles receive a signed server demo session without a browser-supplied role', async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/demo-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'analyst@ksp.demo' }),
  })
  assert.equal(response.status, 201)
  const payload = await response.json()
  assert.equal(payload.user.role, 'Analyst')
  assert.ok(payload.token)
})

test('conversation messages restore in ordered server history', async () => {
  const conversationId = `CONV-${crypto.randomUUID()}`
  await protectedFetch('/api/v1/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'hello', conversationId }) })
  const response = await protectedFetch(`/api/v1/conversations/${conversationId}/messages`)
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.deepEqual(payload.messages.map((item) => item.role), ['user', 'assistant'])
})

test('additive search, data-version, knowledge, trend, alert, and cohort contracts are honest', async () => {
  const endpoints = [
    ['/api/v1/data/versions', undefined],
    ['/api/v1/search?q=motorcycle', undefined],
    ['/api/v1/knowledge/search?q=evidence', undefined],
    ['/api/v1/analytics/trends', {}],
    ['/api/v1/analytics/alerts', {}],
    ['/api/v1/analytics/cohorts', { dimension: 'district' }],
  ]
  for (const [path, body] of endpoints) {
    const response = await protectedFetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal(response.status, 200, path)
    const payload = await response.json()
    assert.equal(payload.mode, 'offline-demo')
    assert.equal(JSON.stringify(payload).includes('truth_group'), false)
  }
})

test('AI status reports provider safeguards without exposing credentials', async () => {
  const response = await fetch(`${baseUrl}/api/v1/ai/status`)
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.provider, 'NVIDIA NIM')
  assert.ok(payload.safeguards.includes('Uncited FIR rejection'))
  assert.equal(JSON.stringify(payload).includes('NVIDIA_API_KEY'), false)
})

test('invalid requests use the standard error contract', async () => {
  const response = await protectedFetch('/api/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  })
  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.code, 'VALIDATION_ERROR')
  assert.equal(typeof payload.retryable, 'boolean')
})

test('server derives role from a signed session and protects audit', async () => {
  const denied = await fetch(`${baseUrl}/api/v1/audit`)
  assert.equal(denied.status, 401)

  const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'supervisor@ksp.demo', password: TEST_PASSWORD }),
  })
  const session = await login.json()
  assert.equal(session.user.role, 'Supervisor')

  const allowed = await fetch(`${baseUrl}/api/v1/audit`, { headers: { authorization: `Bearer ${session.token}` } })
  assert.equal(allowed.status, 200)
  const audit = await allowed.json()
  assert.ok(audit.chainHead)
})

test('anonymous requests never receive a placeholder Catalyst identity', async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`)
  const payload = await response.json()
  assert.equal(response.status, 401)
  assert.equal(payload.code, 'AUTH_REQUIRED')
  assert.equal(payload.user, undefined)
})

test('investigative APIs require a real session even when optional services are unavailable', async () => {
  const requests = [
    ['/api/v1/cases', undefined],
    ['/api/v1/search?q=motorcycle', undefined],
    ['/api/v1/data/versions', undefined],
    ['/api/v1/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'hello' }) }],
    ['/api/v1/analytics/trends', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }],
    ['/api/v1/scenarios', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ units: 3 }) }],
    ['/api/v1/evidence/sample/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }],
    ['/api/v1/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }],
  ]
  for (const [path, options] of requests) {
    const response = await fetch(`${baseUrl}${path}`, options)
    assert.equal(response.status, 401, path)
    const payload = await response.json()
    assert.equal(payload.code, 'AUTH_REQUIRED', path)
  }
})

test('Analyst cannot call field-operation scenarios directly', async () => {
  const analyst = await loginAs('analyst@ksp.demo')
  const response = await protectedFetch('/api/v1/scenarios', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ district: 'Mysuru', units: 3 }),
  }, analyst)
  assert.equal(response.status, 403)
  assert.equal((await response.json()).code, 'FORBIDDEN')
})

test('CORS never reflects an unapproved origin', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`, { headers: { origin: 'https://attacker.example' } })
  assert.equal(response.headers.get('access-control-allow-origin'), null)
})

test('evidence validation rejects a declared file above 10 MB', async () => {
  const response = await protectedFetch('/api/v1/evidence/sample/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      text: 'synthetic evidence',
      file: { name: 'too-large.csv', type: 'text/csv', size: 10 * 1024 * 1024 + 1, sha256: 'a'.repeat(64) },
    }),
  })
  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.code, 'VALIDATION_ERROR')
})

test('reports are supervisor-gated, escaped, and audit-linked', async () => {
  const investigator = await loginAs('investigator@ksp.demo')
  const denied = await fetch(`${baseUrl}/api/v1/reports`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${investigator.token}` },
    body: JSON.stringify({ answer: 'Denied', citations: [], approved: true }),
  })
  assert.equal(denied.status, 403)

  const supervisor = await loginAs('supervisor@ksp.demo')
  const generated = await fetch(`${baseUrl}/api/v1/reports`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${supervisor.token}` },
    body: JSON.stringify({ answer: '<script>alert(1)</script>', citations: [{ firId: 'SYN-2025-BLR-001', excerpt: '<img src=x>' }], approved: true }),
  })
  assert.equal(generated.status, 200)
  const report = await generated.json()
  assert.match(report.auditRef, /^AUD-/)
  assert.doesNotMatch(report.html, /<script>|<img src=x>/)
  assert.match(report.html, /&lt;script&gt;/)
})

test('concurrent audit events form one sequenced, verifiable append-only hash chain', async () => {
  const supervisor = await loginAs('supervisor@ksp.demo')
  const queryResponses = await Promise.all(Array.from({ length: 8 }, (_, index) => protectedFetch('/api/v1/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: `Summarize synthetic motorcycle theft cases ${index + 1}`, conversationId: `CONV-AUDIT-${index + 1}` }),
  }, supervisor)))
  assert.deepEqual(queryResponses.map((response) => response.status), Array(8).fill(200))

  const response = await fetch(`${baseUrl}/api/v1/audit`, { headers: { authorization: `Bearer ${supervisor.token}` } })
  assert.equal(response.status, 200)
  const payload = await response.json()
  const chronological = [...payload.events].sort((left, right) => left.sequence - right.sequence)
  assert.equal(new Set(chronological.map((event) => event.sequence)).size, chronological.length)
  for (let index = 0; index < chronological.length; index += 1) {
    const event = chronological[index]
    const { hash, ...unsigned } = event
    assert.equal(hash, crypto.createHash('sha256').update(JSON.stringify(unsigned)).digest('hex'))
    assert.equal(event.sequence, index + 1)
    assert.equal(event.previousHash, index ? chronological[index - 1].hash : 'GENESIS')
  }
  assert.equal(payload.chainHead, chronological.at(-1)?.hash || 'GENESIS')
})
