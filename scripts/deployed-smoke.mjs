const webUrl = String(process.env.SAMVAAD_WEB_URL || '').replace(/\/$/, '')
const apiBase = String(process.env.SAMVAAD_API_BASE || '').replace(/\/$/, '')

if (!webUrl || !apiBase) {
  console.error('Set SAMVAAD_WEB_URL and SAMVAAD_API_BASE before running the deployed smoke test.')
  process.exit(2)
}

async function json(path) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { accept: 'application/json', origin: webUrl },
    signal: AbortSignal.timeout(20_000),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`)
  if (!contentType.includes('application/json')) throw new Error(`${path} returned ${contentType || 'no content type'} instead of JSON`)
  return response.json()
}

const web = await fetch(`${webUrl}/`, { signal: AbortSignal.timeout(20_000) })
if (!web.ok || !(web.headers.get('content-type') || '').includes('text/html')) {
  throw new Error(`Web client failed: HTTP ${web.status}`)
}

const html = await web.text()
if (!/assets\/index-[A-Za-z0-9_-]+\.js/.test(html)) throw new Error('Web client HTML does not reference a hashed JavaScript asset.')

const health = await json('/health')
const capabilities = await json('/capabilities')
const ai = await json('/ai/status')

if (health.status !== 'ok') throw new Error('Health payload is not healthy.')
if (!health.dataVersion) throw new Error('Health payload is missing dataVersion.')
if (!capabilities.capabilities && !capabilities.runtime) throw new Error('Capabilities payload is missing runtime truth.')
if (!ai.provider) throw new Error('AI status is missing its provider declaration.')

console.log(JSON.stringify({
  webUrl,
  apiBase,
  version: health.version,
  mode: health.mode,
  dataVersion: health.dataVersion,
  aiConfigured: Boolean(ai.configured),
  status: 'deployed-smoke-passed',
}, null, 2))
