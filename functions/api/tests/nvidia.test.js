const test = require('node:test')
const assert = require('node:assert/strict')

const nvidia = require('../providers/nvidia')

const result = {
  intent: 'CASE_SEARCH_QUERY',
  filters: {},
  answer: 'Deterministic finding for SYN-2025-BLR-001.',
  confidence: { score: 0.88, band: 'high' },
  limitations: [],
  citations: [{ firId: 'SYN-2025-BLR-001', field: 'case_summary', excerpt: 'Synthetic motorcycle theft record.' }],
  evidence: [{
    fir_id: 'SYN-2025-BLR-001',
    district: 'Bengaluru Urban',
    station_id: 'SYN-STN-BLR-01',
    crime_type: 'Motorcycle Theft',
    date: '2025-02-01',
    case_summary: 'Synthetic motorcycle theft record.',
    synthetic: true,
  }],
}

test.beforeEach(() => {
  process.env.SAMVAAD_NVIDIA_LLM_ENABLED = 'true'
  process.env.NVIDIA_API_KEY = 'test-key-never-logged'
  process.env.NVIDIA_LLM_MODEL = 'z-ai/glm-5.2'
})

test.afterEach(() => {
  delete process.env.SAMVAAD_NVIDIA_LLM_ENABLED
  delete process.env.NVIDIA_API_KEY
  delete process.env.NVIDIA_LLM_MODEL
})

test('NVIDIA adapter sends only server-grounded evidence and returns a cited answer', async () => {
  let request
  const generated = await nvidia.generateGroundedAnswer({
    query: 'Summarize the case',
    result,
    context: { answerMode: 'brief' },
    fetchImpl: async (url, options) => {
      request = { url, options }
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'The synthetic record concerns motorcycle theft [SYN-2025-BLR-001].' } }],
          usage: { prompt_tokens: 100, completion_tokens: 20 },
        }),
      }
    },
  })

  assert.equal(generated.model, 'z-ai/glm-5.2')
  assert.match(generated.answer, /\[SYN-2025-BLR-001\]/)
  assert.equal(request.url, 'https://integrate.api.nvidia.com/v1/chat/completions')
  assert.equal(request.options.headers.authorization, 'Bearer test-key-never-logged')
  const payload = JSON.parse(request.options.body)
  assert.equal(payload.stream, false)
  assert.equal(payload.temperature, 0.2)
  assert.match(payload.messages[1].content, /"answer_mode":"brief"/)
  assert.match(payload.messages[1].content, /Synthetic motorcycle theft record/)
})

test('NVIDIA adapter rejects an invented FIR identifier', async () => {
  await assert.rejects(
    nvidia.generateGroundedAnswer({
      query: 'Summarize the case',
      result,
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'See SYN-2025-BLR-999 for proof.' } }] }),
      }),
    }),
    (error) => error.code === 'LLM_UNGROUNDED_IDENTIFIER',
  )
})

test('NVIDIA adapter does not call the model for out-of-scope or uncited requests', async () => {
  let called = false
  const generated = await nvidia.generateGroundedAnswer({
    query: 'What is the cricket score?',
    result: { ...result, intent: 'OUT_OF_SCOPE', citations: [], evidence: [] },
    fetchImpl: async () => { called = true },
  })
  assert.equal(generated, null)
  assert.equal(called, false)
})

test('NVIDIA adapter supports clearly separated general chat without FIR context', async () => {
  let request
  const generated = await nvidia.generateGeneralAnswer({
    query: 'Explain how hashing helps verify file integrity',
    fetchImpl: async (url, options) => {
      request = { url, options }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'A cryptographic hash acts like a repeatable fingerprint for a file. If the file changes, its hash normally changes too.' } }] }) }
    },
  })
  assert.match(generated.answer, /cryptographic hash/i)
  const payload = JSON.parse(request.options.body)
  assert.match(payload.messages[0].content, /GENERAL AI mode/)
  assert.doesNotMatch(payload.messages[0].content, /test-key-never-logged/)
})

test('general chat rejects invented FIR identifiers', async () => {
  await assert.rejects(
    nvidia.generateGeneralAnswer({
      query: 'Tell me something',
      fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Open SYN-2026-BLR-9999.' } }] }) }),
    }),
    (error) => error.code === 'LLM_UNGROUNDED_IDENTIFIER',
  )
})
