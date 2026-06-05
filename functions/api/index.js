const http = require('http')
const { URL } = require('url')
const { cases, policeStations, users, accused, relations } = require('./modules/seedData')
const { answerQuery } = require('./modules/queryEngine')
const { findSimilarCases } = require('./modules/crimeDNA')
const { buildGraph } = require('./modules/graphBuilder')
const { getHotspots } = require('./modules/hotspotEngine')
const { patrolWhatIf } = require('./modules/patrolEngine')
const { buildReport } = require('./modules/reportBuilder')
const { legalExplainabilityForCase } = require('./modules/legalXai')
const { buildDiffusionModel } = require('./modules/diffusionEngine')

const roleLanding = {
  Admin: '/dashboard',
  Investigator: '/chat',
  Analyst: '/dashboard',
  Supervisor: '/patrol',
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  })
  res.end(JSON.stringify(payload, null, 2))
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function normalizeDemoEmail(email = '') {
  const value = email.trim().toLowerCase()
  return value.endsWith('@samvaad.local') ? value.replace('@samvaad.local', '@ksp.demo') : value
}

function publicUser(user, alias = '') {
  return {
    email: user.email,
    credentialAlias: alias && alias !== user.email ? alias : null,
    role: user.role,
    access: user.access,
    landing: roleLanding[user.role] || '/chat',
  }
}

function groupCount(source, field) {
  return Object.values(
    source.reduce((acc, item) => {
      const key = item[field]
      acc[key] ||= { name: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {}),
  )
}

function buildDashboardSummary() {
  const activeCases = cases.filter((caseRecord) => ['Open', 'Under Investigation'].includes(caseRecord.status)).length
  const stationData = Object.values(
    cases.reduce((acc, caseRecord) => {
      const station = policeStations.find((item) => item.station_id === caseRecord.station_id)
      const key = station?.station_name || caseRecord.station_id
      acc[key] ||= { name: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {}),
  ).sort((a, b) => b.value - a.value)
  const crimeTypeData = groupCount(cases, 'crime_type')
  const topCrime = [...crimeTypeData].sort((a, b) => b.value - a.value)[0]

  return {
    totalCases: cases.length,
    activeCases,
    repeatOffenders: accused.filter((person) => person.prior_case_count > 1).length,
    hotspotZones: stationData.filter((station) => station.value >= 2).length || stationData.length,
    highRiskCrimeType: topCrime?.name || 'NA',
    pendingInvestigations: cases.filter((caseRecord) => caseRecord.status === 'Under Investigation').length,
    similarCaseAlerts: cases.filter((caseRecord) => findSimilarCases(caseRecord.fir_id).matches[0]?.score >= 0.75).length,
    patrolRecommendationCount: patrolWhatIf({
      district: 'Bengaluru South',
      crimeType: 'Motorcycle Theft',
      units: 5,
    }).recommendations.length,
    crimeTypeData,
    districtData: groupCount(cases, 'district'),
    statusData: groupCount(cases, 'status'),
    stationData,
  }
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {})
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname

  try {
    if (req.method === 'GET' && path === '/api/health') {
      return sendJson(res, 200, { status: 'ok', name: 'SAMVAAD-IQ API' })
    }

    if (req.method === 'GET' && path === '/api/seed/summary') {
      return sendJson(res, 200, {
        users: users.length,
        stations: policeStations.length,
        cases: cases.length,
        accused: accused.length,
        relations: relations.length,
      })
    }

    if (req.method === 'GET' && path === '/api/dashboard/summary') {
      return sendJson(res, 200, buildDashboardSummary())
    }

    if (req.method === 'GET' && path === '/api/audit/logs') {
      return sendJson(res, 200, {
        events: [
          { id: 'AUD-01', actor: 'Auth Layer', event: 'RBAC session checked' },
          { id: 'AUD-02', actor: 'Data Agent', event: `${cases.length} synthetic FIR records available` },
          { id: 'AUD-03', actor: 'Skeptic Agent', event: 'Decision-support guardrail attached' },
          { id: 'AUD-04', actor: 'Report Agent', event: 'Evidence export path ready' },
        ],
      })
    }

    if (req.method === 'POST' && path === '/api/auth/login') {
      const body = await readJson(req)
      const alias = (body.email || '').trim().toLowerCase()
      const normalizedEmail = normalizeDemoEmail(alias)
      const user = users.find((item) => item.email === normalizedEmail && item.password === body.password)

      return user
        ? sendJson(res, 200, { success: true, user: publicUser(user, alias) })
        : sendJson(res, 401, { success: false, error: 'Invalid demo credentials' })
    }

    if (req.method === 'GET' && path === '/api/cases') {
      return sendJson(res, 200, cases)
    }

    if (req.method === 'GET' && path.startsWith('/api/cases/')) {
      const firId = decodeURIComponent(path.split('/').pop())
      const caseRecord = cases.find((item) => item.fir_id === firId)
      return caseRecord ? sendJson(res, 200, caseRecord) : sendJson(res, 404, { error: 'Case not found' })
    }

    if (req.method === 'POST' && path === '/api/chat') {
      const body = await readJson(req)
      return sendJson(res, 200, answerQuery(body.query || '', body.role || 'Investigator'))
    }

    if (req.method === 'GET' && path.startsWith('/api/similar/')) {
      const firId = decodeURIComponent(path.split('/').pop())
      return sendJson(res, 200, findSimilarCases(firId))
    }

    if (req.method === 'POST' && path === '/api/crime-dna/similar') {
      const body = await readJson(req)
      return sendJson(res, 200, findSimilarCases(body.firId || body.fir_id || 'FIR-1003'))
    }

    if (req.method === 'GET' && path.startsWith('/api/graph/')) {
      const firId = decodeURIComponent(path.split('/').pop())
      return sendJson(res, 200, buildGraph(firId))
    }

    if (req.method === 'GET' && path === '/api/hotspots') {
      return sendJson(res, 200, getHotspots({ district: url.searchParams.get('district'), crimeType: url.searchParams.get('crimeType') }))
    }

    if (req.method === 'POST' && path === '/api/whatif') {
      const body = await readJson(req)
      return sendJson(res, 200, patrolWhatIf(body))
    }

    if (req.method === 'POST' && path === '/api/simulate/patrol') {
      const body = await readJson(req)
      return sendJson(res, 200, patrolWhatIf(body))
    }

    if (req.method === 'GET' && path === '/api/diffusion') {
      return sendJson(
        res,
        200,
        buildDiffusionModel({
          district: url.searchParams.get('district') || 'All',
          crimeType: url.searchParams.get('crimeType') || 'All',
        }),
      )
    }

    if (req.method === 'POST' && path === '/api/legal/map') {
      const body = await readJson(req)
      return sendJson(res, 200, legalExplainabilityForCase(body.firId || body.fir_id || 'FIR-1003'))
    }

    if (req.method === 'POST' && path === '/api/report') {
      const body = await readJson(req)
      return sendJson(res, 200, buildReport(body))
    }

    return sendJson(res, 404, { error: 'Route not found', path })
  } catch (error) {
    return sendJson(res, 500, { error: error.message })
  }
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3001)
  http.createServer(handleRequest).listen(port, () => {
    console.log(`SAMVAAD-IQ API listening on http://localhost:${port}`)
  })
}

module.exports = handleRequest
