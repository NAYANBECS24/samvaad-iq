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

test.before(async () => {
  server = http.createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
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

test('health is versioned JSON and exposes the honest runtime mode', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  const payload = await response.json()
  assert.equal(payload.mode, 'offline-demo')
  assert.equal(payload.version, '1.1.0')
})

test('query returns the standardized evidence envelope', async () => {
  const response = await fetch(`${baseUrl}/api/v1/query`, {
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
})

test('invalid requests use the standard error contract', async () => {
  const response = await fetch(`${baseUrl}/api/v1/query`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'x' }),
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

test('CORS never reflects an unapproved origin', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`, { headers: { origin: 'https://attacker.example' } })
  assert.equal(response.headers.get('access-control-allow-origin'), null)
})

test('evidence validation rejects a declared file above 10 MB', async () => {
  const response = await fetch(`${baseUrl}/api/v1/evidence/sample/analyze`, {
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

test('audit events form a verifiable append-only hash chain', async () => {
  const supervisor = await loginAs('supervisor@ksp.demo')
  const response = await fetch(`${baseUrl}/api/v1/audit`, { headers: { authorization: `Bearer ${supervisor.token}` } })
  assert.equal(response.status, 200)
  const payload = await response.json()
  const chronological = [...payload.events].reverse()
  for (let index = 0; index < chronological.length; index += 1) {
    const event = chronological[index]
    const { hash, ...unsigned } = event
    assert.equal(hash, crypto.createHash('sha256').update(JSON.stringify(unsigned)).digest('hex'))
    assert.equal(event.previousHash, index ? chronological[index - 1].hash : 'GENESIS')
  }
  assert.equal(payload.chainHead, chronological.at(-1)?.hash || 'GENESIS')
})
