import seed from '../data/demoSeed.json'
import { createIntelligenceCore, crimeDna as sharedCrimeDna, toSyntheticFirId } from '../../../functions/api/core/index.mjs'

const STORAGE_KEY = 'samvaad_user'
const DISCLAIMER = 'Investigative lead only. Requires human verification and legal review.'
const offlineDemoPassword = import.meta.env.VITE_OFFLINE_DEMO_PASSWORD || ''

const sharedOfflineCore = createIntelligenceCore(seed, { total: 250 })

export const DATA_VERSION = sharedOfflineCore.dataset.version || 'synthetic-250-v1'
export const DATA_LABEL = sharedOfflineCore.dataset.label || 'SYNTHETIC DEMO DATA'

const kannadaCrimeNames = {
  'Motorcycle Theft': 'ದ್ವಿಚಕ್ರ ವಾಹನ ಕಳವು',
  'Chain Snatching': 'ಸರ ಕಳವು',
  'UPI Fraud': 'ಯುಪಿಐ ವಂಚನೆ',
  'House Burglary': 'ಮನೆ ಕಳ್ಳತನ',
}

const kannadaDistrictNames = {
  'Bengaluru South': 'ಬೆಂಗಳೂರು ದಕ್ಷಿಣ',
  Mysuru: 'ಮೈಸೂರು',
  'Hubballi-Dharwad': 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ',
  Mangaluru: 'ಮಂಗಳೂರು',
  Belagavi: 'ಬೆಳಗಾವಿ',
  Kalaburagi: 'ಕಲಬುರಗಿ',
}

function publicCaseRecord(caseRecord) {
  const runtimeRecord = { ...caseRecord }
  const crimeKn = kannadaCrimeNames[runtimeRecord.crime_type] || runtimeRecord.crime_type
  const districtKn = kannadaDistrictNames[runtimeRecord.district] || runtimeRecord.district
  return {
    ...runtimeRecord,
    synthetic: true,
    data_label: DATA_LABEL,
    language: 'en',
    case_summary_kn: `ಕೃತಕ ಪ್ರಕರಣ ದಾಖಲೆ: ${districtKn} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${crimeKn}. ಪರಿಶೀಲನೆಗಾಗಿ ${runtimeRecord.fir_id} ಮೂಲ ದಾಖಲೆಯನ್ನು ನೋಡಿ.`,
    mo_kn: `ಈ ಘಟನೆಗೆ ಸಂಬಂಧಿಸಿದ ಕಾರ್ಯವಿಧಾನ ವಿವರವನ್ನು ${runtimeRecord.fir_id} ಮೂಲ ದಾಖಲೆಯೊಂದಿಗೆ ಮಾನವ ಪರಿಶೀಲನೆ ಮಾಡಬೇಕು.`,
    translations: {
      kn: {
        crime_type: crimeKn,
        district: districtKn,
      },
    },
  }
}

export const demoUsers = seed.users
export const stations = [
  ...seed.police_stations,
  ...sharedOfflineCore.dataset.stations.filter((station) => !seed.police_stations.some((existing) => existing.station_id === station.station_id)),
]
export const cases = sharedOfflineCore.cases.map(publicCaseRecord)
export const accused = seed.accused
const legacyCaseIds = new Set(seed.cases.map((item) => item.fir_id))
export const relations = seed.relations.map((item) => ({
  ...item,
  source: legacyCaseIds.has(item.source) ? toSyntheticFirId(item.source) : item.source,
  target: legacyCaseIds.has(item.target) ? toSyntheticFirId(item.target) : item.target,
}))

export const caseRepository = Object.freeze({
  dataVersion: DATA_VERSION,
  dataLabel: DATA_LABEL,
  count: cases.length,
  all: () => cases,
  byId: (firId) => cases.find((caseRecord) => caseRecord.fir_id === firId) || null,
  list: ({ district, crimeType, status } = {}) => cases
    .filter((caseRecord) => !district || district === 'All' || caseRecord.district === district)
    .filter((caseRecord) => !crimeType || crimeType === 'All' || caseRecord.crime_type === crimeType)
    .filter((caseRecord) => !status || status === 'All' || caseRecord.status === status),
})

const stationById = Object.fromEntries(stations.map((station) => [station.station_id, station]))
const accusedById = Object.fromEntries(accused.map((person) => [person.accused_id, person]))

const roleLanding = {
  Admin: '/dashboard',
  Investigator: '/chat',
  Analyst: '/dashboard',
  Supervisor: '/analytics',
}

function normalizeDemoEmail(email) {
  const value = email.trim().toLowerCase()
  return value.endsWith('@samvaad.local') ? value.replace('@samvaad.local', '@ksp.demo') : value
}

const crimeAliases = [
  {
    type: 'Motorcycle Theft',
    words: ['motorcycle', 'bike', 'vehicle theft', 'handle lock', 'metro', 'bus stand', 'bike kalavu', 'vehicle'],
  },
  {
    type: 'Chain Snatching',
    words: ['chain', 'snatching', 'scooter', 'gold', 'market', 'sara', 'chain snatch', 'jewellery'],
  },
  {
    type: 'UPI Fraud',
    words: ['upi', 'fraud', 'bank', 'financial', 'account', 'mule', 'cyber', 'collect request', 'bank support'],
  },
  {
    type: 'House Burglary',
    words: ['burglary', 'house', 'rear window', 'locked home', 'night', 'mane', 'home entry'],
  },
]

const districtAliases = [
  { district: 'Bengaluru South', words: ['bengaluru', 'bangalore', 'blr', 'jayanagar', 'banashankari'] },
  { district: 'Mysuru', words: ['mysuru', 'mysore', 'lashkar', 'vv puram'] },
  { district: 'Hubballi-Dharwad', words: ['hubballi', 'dharwad', 'hubli'] },
  { district: 'Mangaluru', words: ['mangaluru', 'mangalore'] },
]

export function getStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function storeUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function login(email, password) {
  const normalizedEmail = normalizeDemoEmail(email)
  const user = demoUsers.find((item) => item.email === normalizedEmail)
  if (offlineDemoPassword && password !== offlineDemoPassword) throw new Error('Invalid demo credentials')
  if (!user) {
    throw new Error('Invalid demo credentials')
  }

  return {
    ...user,
    credentialAlias: email.trim().toLowerCase() === user.email ? null : email.trim().toLowerCase(),
    landing: roleLanding[user.role] || '/chat',
  }
}

export function getStation(caseRecord) {
  return stationById[caseRecord.station_id] || null
}

export function getAccused(caseRecord) {
  return caseRecord.accused_ids.map((id) => accusedById[id]).filter(Boolean)
}

export function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/alli/g, ' in ')
    .replace(/maadi/g, ' please ')
    .replace(/thorsi|torisi|torsi/g, ' show ')
    .replace(/saar/g, ' ')
    .replace(/kalla/g, ' theft ')
    .replace(/kalavu/g, ' theft ')
    .replace(/jodi/g, ' link ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectIntent(query) {
  const q = normalizeQuery(query)
  if (q.includes('report') || q.includes('pdf') || q.includes('brief')) return 'LEGAL_REPORT'
  if (q.includes('cold') || q.includes('unsolved') || q.includes('resurrect')) return 'COLD_CASE_QUERY'
  if (q.includes('patrol') || q.includes('what if') || q.includes('deploy')) return 'PATROL_WHAT_IF'
  if (q.includes('similar') || q.includes('match')) return 'SIMILAR_CASE_QUERY'
  if (q.includes('financial') && q.includes('district')) return 'CASE_LINK_QUERY'
  if (q.includes('connected') || q.includes('connection') || q.includes('link') || q.includes('same')) {
    return 'CASE_LINK_QUERY'
  }
  if ((q.includes('pattern') || q.includes('show')) && extractCrimeType(q) && extractDistrict(q)) return 'HOTSPOT_QUERY'
  if (q.includes('hotspot') || q.includes('map') || q.includes('where')) return 'HOTSPOT_QUERY'
  if (q.includes('how many') || q.includes('open') || q.includes('status') || q.includes('count')) return 'STATUS_QUERY'
  if (extractFirIds(query).length) return 'CASE_SUMMARY_QUERY'
  return 'GENERAL_QUERY'
}

export function extractFirIds(query) {
  return Array.from(new Set((query.match(/FIR-\d{4}-[A-Z]+-\d{3}/gi) || []).map((id) => id.toUpperCase())))
}

export function extractCrimeType(query) {
  const q = normalizeQuery(query)
  const direct = crimeAliases.find((item) => item.words.some((word) => q.includes(word)))
  return direct?.type || null
}

export function extractDistrict(query) {
  const q = normalizeQuery(query)
  const direct = districtAliases.find((item) => item.words.some((word) => q.includes(word)))
  return direct?.district || null
}

export function filterCases({ query = '', crimeType, district, firIds = [] } = {}) {
  const q = normalizeQuery(query)
  const selectedCrime = crimeType || extractCrimeType(q)
  const selectedDistrict = district || extractDistrict(q)

  return cases.filter((caseRecord) => {
    if (firIds.length && !firIds.includes(caseRecord.fir_id)) return false
    if (selectedCrime && caseRecord.crime_type !== selectedCrime) return false
    if (selectedDistrict && caseRecord.district !== selectedDistrict) return false
    return true
  })
}

function intersects(a, b) {
  return a.some((item) => b.includes(item))
}

function sharedEntities(a, b) {
  const shared = []

  a.accused_ids.forEach((id) => {
    if (b.accused_ids.includes(id)) shared.push({ type: 'shared_accused', value: id })
  })

  if (a.phone_hash && a.phone_hash !== 'NA' && a.phone_hash === b.phone_hash) {
    shared.push({ type: 'shared_phone_hash', value: a.phone_hash })
  }

  if (a.vehicle && a.vehicle !== 'NA' && a.vehicle === b.vehicle) {
    shared.push({ type: 'shared_vehicle', value: a.vehicle })
  }

  return shared
}

function timeBand(time) {
  const hour = Number(time.split(':')[0])
  if (hour >= 0 && hour < 5) return 'late-night'
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function crimeDNAScore(a, b) {
  return sharedCrimeDna(a, b).score
}

export function explainMatch(a, b) {
  return sharedCrimeDna(a, b).factors
    .filter((factor) => factor.contribution > 0)
    .sort((left, right) => right.contribution - left.contribution)
    .map((factor) => `${factor.label}: ${factor.evidence}`)
}

export function findSimilarCases(firId) {
  const source = cases.find((caseRecord) => caseRecord.fir_id === firId)
  if (!source) {
    return { source: null, matches: [] }
  }

  const matches = cases
    .filter((caseRecord) => caseRecord.fir_id !== firId)
    .map((caseRecord) => ({
      case: caseRecord,
      score: crimeDNAScore(source, caseRecord),
      reasons: explainMatch(source, caseRecord),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return { source, matches }
}

export function buildGraph(seedFirId = 'SYN-2025-BLR-001') {
  const rootCase = cases.find((caseRecord) => caseRecord.fir_id === seedFirId) || cases[0]
  const related = cases.filter((caseRecord) => {
    if (caseRecord.fir_id === rootCase.fir_id) return true
    if (intersects(caseRecord.accused_ids, rootCase.accused_ids)) return true
    if (caseRecord.phone_hash !== 'NA' && caseRecord.phone_hash === rootCase.phone_hash) return true
    if (caseRecord.vehicle !== 'NA' && caseRecord.vehicle === rootCase.vehicle) return true
    return false
  })

  const nodeMap = new Map()
  const edges = []

  function addNode(id, label, type) {
    if (!id || id === 'NA' || nodeMap.has(id)) return
    nodeMap.set(id, { id, data: { label, type }, type: 'default' })
  }

  function addEdge(source, target, label) {
    if (!source || !target || source === 'NA' || target === 'NA') return
    edges.push({
      id: `${source}-${target}-${label}`.replace(/\s+/g, '-'),
      source,
      target,
      label,
      animated: label.includes('shared'),
    })
  }

  related.forEach((caseRecord) => {
    const station = getStation(caseRecord)
    addNode(caseRecord.fir_id, caseRecord.fir_id, 'FIR')
    addNode(caseRecord.phone_hash, caseRecord.phone_hash, 'Phone')
    addNode(caseRecord.vehicle, caseRecord.vehicle, 'Vehicle')
    addNode(caseRecord.victim_id, caseRecord.victim_id, 'Victim')
    addNode(caseRecord.station_id, station?.station_name || caseRecord.station_id, 'Location')

    addEdge(caseRecord.fir_id, caseRecord.station_id, 'registered at')
    addEdge(caseRecord.fir_id, caseRecord.victim_id, 'victim')
    addEdge(caseRecord.phone_hash, caseRecord.fir_id, 'phone link')
    addEdge(caseRecord.vehicle, caseRecord.fir_id, 'vehicle link')

    caseRecord.accused_ids.forEach((id) => {
      addNode(id, accusedById[id]?.display_name || id, 'Accused')
      addEdge(id, caseRecord.fir_id, caseRecord.fir_id === rootCase.fir_id ? 'accused in' : 'shared accused')
    })
  })

  relations
    .filter((relation) => relation.target.startsWith('ACCT-') || relation.type === 'ACCOUNT_LINK')
    .filter((relation) => related.some((caseRecord) => caseRecord.accused_ids.includes(relation.source)))
    .forEach((relation) => {
      addNode(relation.target, relation.target, 'Bank')
      addEdge(relation.source, relation.target, 'bank/account link')
    })

  const nodes = [...nodeMap.values()].map((node, index) => ({
    ...node,
    position: {
      x: 70 + (index % 4) * 230,
      y: 50 + Math.floor(index / 4) * 150,
    },
  }))

  return {
    focus: rootCase,
    nodes,
    edges,
  }
}

function distanceKm(a, b) {
  const radius = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function clusterHotspots(points, { epsKm = 1.6, minPoints = 2 } = {}) {
  const visited = new Set()
  const assigned = new Map()
  const clusters = []

  points.forEach((point) => {
    if (visited.has(point.fir_id)) return
    visited.add(point.fir_id)

    const neighbours = points.filter((candidate) => distanceKm(point, candidate) <= epsKm)
    if (neighbours.length < minPoints) {
      assigned.set(point.fir_id, 'noise')
      return
    }

    const clusterId = `HS-${String(clusters.length + 1).padStart(2, '0')}`
    const members = new Map(neighbours.map((candidate) => [candidate.fir_id, candidate]))

    neighbours.forEach((candidate) => {
      if (!visited.has(candidate.fir_id)) {
        visited.add(candidate.fir_id)
        points
          .filter((next) => distanceKm(candidate, next) <= epsKm)
          .forEach((next) => members.set(next.fir_id, next))
      }
    })

    const clusterCases = [...members.values()]
    clusterCases.forEach((member) => assigned.set(member.fir_id, clusterId))
    clusters.push({
      cluster_id: clusterId,
      count: clusterCases.length,
      concentration: clusterCases.length >= 3 ? 'high' : 'medium',
      // Kept as a compatibility alias for existing map styles; this describes
      // incident density, not a person-level score or forecast.
      risk: clusterCases.length >= 3 ? 'high' : 'medium',
      cases: clusterCases.map((caseRecord) => caseRecord.fir_id),
      centroid: {
        lat: Number((clusterCases.reduce((sum, item) => sum + item.lat, 0) / clusterCases.length).toFixed(5)),
        lon: Number((clusterCases.reduce((sum, item) => sum + item.lon, 0) / clusterCases.length).toFixed(5)),
      },
    })
  })

  return {
    clusters,
    points: points.map((point) => ({ ...point, cluster_id: assigned.get(point.fir_id) || 'noise' })),
  }
}

export function getHotspots({ query = '', district, crimeType } = {}) {
  const selectedCases = filterCases({ query, district, crimeType })
  const rawPoints = selectedCases.map((caseRecord) => ({
    ...caseRecord,
    station: getStation(caseRecord),
  }))
  const { points, clusters } = clusterHotspots(rawPoints)

  const stationCounts = Object.values(
    points.reduce((acc, caseRecord) => {
      const station = getStation(caseRecord)
      const key = caseRecord.station_id
      acc[key] ||= {
        station_id: key,
        station_name: station?.station_name || key,
        district: caseRecord.district,
        count: 0,
        cases: [],
      }
      acc[key].count += 1
      acc[key].cases.push(caseRecord.fir_id)
      return acc
    }, {}),
  ).sort((a, b) => b.count - a.count)

  return { points, stationCounts, clusters }
}

export function patrolWhatIf({ district = 'Bengaluru South', crimeType = 'Motorcycle Theft', units = 3 } = {}) {
  const selected = cases.filter((caseRecord) => caseRecord.district === district && caseRecord.crime_type === crimeType)
  const grouped = selected.reduce((acc, caseRecord) => {
    acc[caseRecord.station_id] ||= []
    acc[caseRecord.station_id].push(caseRecord)
    return acc
  }, {})

  const zones = Object.entries(grouped)
    .map(([stationId, records]) => ({
      station: stationById[stationId],
      records,
      recommended_units: records.length > 1 && units > 2 ? 2 : 1,
    }))
    .sort((a, b) => b.records.length - a.records.length)

  const coverageBefore = selected.length ? 56 : 35
  const coverageAfter = Math.min(92, coverageBefore + units * 8 + 2)
  const timeWindowCounts = Object.values(
    selected.reduce((acc, caseRecord) => {
      const band = timeBand(caseRecord.time)
      acc[band] ||= { name: band, count: 0 }
      acc[band].count += 1
      return acc
    }, {}),
  ).sort((a, b) => b.count - a.count)
  const recommendations = zones.length
    ? zones.map((zone, index) => ({
        rank: index + 1,
        station: zone.station?.station_name || zone.records[0].station_id,
        recommended_units: zone.recommended_units,
        reason: `${zone.records.length} linked synthetic incidents in selected pattern`,
      }))
    : [
        {
          rank: 1,
          station: `${district} mobile patrol`,
          recommended_units: units,
          reason: 'No exact seed match; use command review before deployment',
        },
      ]
  const displacementZones = zones.slice(1).map((zone, index) => ({
    rank: index + 1,
    station: zone.station?.station_name || zone.records[0].station_id,
    patternWatchDelta: Math.max(5, 18 - units * 2 - index * 3),
    reason: 'Review nearby area/time patterns if only the top concentration receives visible patrol coverage',
  }))
  const fallbackDisplacement = displacementZones.length
    ? displacementZones
    : [
        {
          rank: 1,
          station: `${district} perimeter corridor`,
          patternWatchDelta: Math.max(4, 14 - units * 2),
          reason: 'Review nearby transit or market corridors for changes in aggregate incident counts',
        },
      ]

  return {
    district,
    crimeType,
    units,
    coverageBefore,
    coverageAfter,
    recommendations,
    displacementWatch: units >= recommendations.length + 2 ? 'Low' : selected.length >= 3 ? 'Elevated' : 'Moderate',
    displacementRisk: units >= recommendations.length + 2 ? 'Low' : selected.length >= 3 ? 'Elevated' : 'Moderate',
    displacementZones: fallbackDisplacement,
    recommendedTimeWindows: timeWindowCounts.length ? timeWindowCounts.slice(0, 2) : [{ name: 'evening', count: 1 }],
  }
}

const legalCategoryMap = {
  'Motorcycle Theft': {
    bns: '303(2), 317',
    ipc: '379, 411',
    privacyTag: 'Hashed phone/vehicle identifiers; role-restricted export',
    legalNote: 'Theft and possession/recovery support mapping for human legal review.',
  },
  'Chain Snatching': {
    bns: '304(2), 3(5)',
    ipc: '356, 379',
    privacyTag: 'Victim and phone fields minimized; export requires review',
    legalNote: 'Snatching/theft category with common-intention support where applicable.',
  },
  'UPI Fraud': {
    bns: '318(4), IT Act 66D',
    ipc: '420, IT Act 66D',
    privacyTag: 'Financial identifiers masked; account links remain synthetic hashes',
    legalNote: 'Cheating by impersonation and cyber-fraud support mapping.',
  },
  'House Burglary': {
    bns: '331, 305',
    ipc: '454, 380',
    privacyTag: 'Location is coarse synthetic station-level context',
    legalNote: 'House-breaking and theft support mapping for case brief review.',
  },
}

export function legalExplainabilityForCase(caseRecord) {
  const mapping = legalCategoryMap[caseRecord.crime_type] || {
    bns: caseRecord.bns_sections,
    ipc: 'Legacy IPC mapping requires reviewer input',
    privacyTag: 'Role-restricted synthetic evidence',
    legalNote: 'Legal mapping requires human review.',
  }

  return {
    crimeType: caseRecord.crime_type,
    bns: caseRecord.bns_sections || mapping.bns,
    ipc: mapping.ipc,
    privacyTag: mapping.privacyTag,
    legalNote: mapping.legalNote,
    humanActionNote: 'Advisory investigation support only; no automated accusation or enforcement decision.',
    evidenceIds: [caseRecord.fir_id, caseRecord.victim_id, caseRecord.vehicle, caseRecord.phone_hash].filter(
      (item) => item && item !== 'NA',
    ),
  }
}

export function buildDiffusionModel({ district = 'All', crimeType = 'All' } = {}) {
  const selected = cases
    .filter((caseRecord) => district === 'All' || caseRecord.district === district)
    .filter((caseRecord) => crimeType === 'All' || caseRecord.crime_type === crimeType)
  const scope = selected.length ? selected : cases
  const activeStatuses = new Set(['Open', 'Under Investigation'])
  const active = scope.filter((caseRecord) => activeStatuses.has(caseRecord.status)).length
  const inactive = Math.max(1, scope.length - active)
  const rc = Number(Math.min(2.4, active / inactive + scope.length * 0.035).toFixed(2))
  const grouped = Object.values(
    scope.reduce((acc, caseRecord) => {
      const station = getStation(caseRecord)
      const key = caseRecord.station_id
      acc[key] ||= {
        station_id: key,
        station_name: station?.station_name || key,
        district: caseRecord.district,
        crime_type: caseRecord.crime_type,
        active: 0,
        inactive: 0,
        cases: [],
      }
      if (activeStatuses.has(caseRecord.status)) acc[key].active += 1
      else acc[key].inactive += 1
      acc[key].cases.push(caseRecord.fir_id)
      return acc
    }, {}),
  )
    .map((zone) => {
      const zoneRc = Number(Math.min(2.5, zone.active / Math.max(1, zone.inactive) + zone.cases.length * 0.06).toFixed(2))
      return {
        ...zone,
        rc: zoneRc,
        patternBand: zoneRc >= 1.2 ? 'Expansion' : zoneRc >= 0.85 ? 'Watch' : 'Contained',
        risk: zoneRc >= 1.2 ? 'Expansion' : zoneRc >= 0.85 ? 'Watch' : 'Contained',
      }
    })
    .sort((a, b) => b.rc - a.rc)

  const repeatedLinks = Object.values(
    scope.reduce((acc, caseRecord) => {
      ;[caseRecord.vehicle, caseRecord.phone_hash]
        .filter((item) => item && item !== 'NA')
        .forEach((identifier) => {
          acc[identifier] ||= []
          acc[identifier].push(caseRecord)
        })
      return acc
    }, {}),
  ).filter((records) => records.length > 1)

  const corridors = repeatedLinks.slice(0, 5).map((records, index) => {
    const from = getStation(records[0])?.station_name || records[0].station_id
    const to = getStation(records[records.length - 1])?.station_name || records[records.length - 1].station_id
    return {
      id: `COR-${index + 1}`,
      from,
      to,
      cases: records.map((caseRecord) => caseRecord.fir_id),
      indicator: records[0].vehicle !== 'NA' ? records[0].vehicle : records[0].phone_hash,
      exposure: Number(Math.min(1.9, 0.72 + records.length * 0.18).toFixed(2)),
    }
  })

  return {
    district,
    crimeType,
    rc,
    patternBand: rc >= 1.2 ? 'Expanding pattern' : rc >= 0.85 ? 'Pattern watch' : 'Stable pattern',
    risk: rc >= 1.2 ? 'Expanding pattern' : rc >= 0.85 ? 'Pattern watch' : 'Stable pattern',
    active,
    inactive,
    zones: grouped,
    corridors,
    advisory: 'Rc summarizes historical synthetic area/time/category activity. It is not a forecast or a score about any person.',
  }
}

export function buildDashboardSummary() {
  const totalCases = cases.length
  const activeCases = cases.filter((caseRecord) => ['Open', 'Under Investigation'].includes(caseRecord.status)).length
  const crimeTypeData = groupCount(cases, 'crime_type')
  const districtData = groupCount(cases, 'district')
  const statusData = groupCount(cases, 'status')
  const stationData = Object.values(
    cases.reduce((acc, caseRecord) => {
      const station = getStation(caseRecord)
      const key = station?.station_name || caseRecord.station_id
      acc[key] ||= { name: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {}),
  ).sort((a, b) => b.value - a.value)
  const timeOfDayData = ['late-night', 'morning', 'afternoon', 'evening', 'night'].map((band) => ({
    name: band,
    value: cases.filter((caseRecord) => timeBand(caseRecord.time) === band).length,
  }))
  const topCrime = [...crimeTypeData].sort((a, b) => b.value - a.value)[0]
  const repeatOffenders = accused.filter((person) => person.prior_case_count > 1).length
  const pendingInvestigations = cases.filter((caseRecord) => caseRecord.status === 'Under Investigation').length
  const hotspotZones = stationData.filter((station) => station.value >= 2).length || stationData.length
  const similarCaseAlerts = cases.filter((caseRecord) => findSimilarCases(caseRecord.fir_id).matches[0]?.score >= 0.75).length
  const patrolRecommendationCount = patrolWhatIf({
    district: 'Bengaluru South',
    crimeType: 'Motorcycle Theft',
    units: 5,
  }).recommendations.length
  const topSimilarityScores = cases
    .map((caseRecord) => findSimilarCases(caseRecord.fir_id).matches[0]?.score)
    .filter(Number.isFinite)
  const averageTopSimilarity = topSimilarityScores.length
    ? Number((topSimilarityScores.reduce((sum, score) => sum + score, 0) / topSimilarityScores.length).toFixed(2))
    : 0

  const monthlyData = Object.values(
    cases.reduce((acc, caseRecord) => {
      const key = caseRecord.date.slice(0, 7)
      acc[key] ||= { month: key, total: 0 }
      acc[key].total += 1
      return acc
    }, {}),
  ).sort((a, b) => a.month.localeCompare(b.month))

  return {
    totalCases,
    activeCases,
    activeShare: totalCases ? Number((activeCases / totalCases).toFixed(2)) : 0,
    repeatOffenders,
    hotspotZones,
    mostFrequentCrimeType: topCrime?.name || 'NA',
    highRiskCrimeType: topCrime?.name || 'NA',
    pendingInvestigations,
    similarCaseAlerts,
    patrolRecommendationCount,
    averageTopSimilarity,
    similarityCandidatesMeasured: topSimilarityScores.length,
    dataVersion: DATA_VERSION,
    topCrime,
    crimeTypeData,
    districtData,
    statusData,
    stationData,
    timeOfDayData,
    monthlyData,
    latestCases: [...cases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4),
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

function evidenceFromCases(caseRecords) {
  return caseRecords.flatMap((caseRecord) => [
    { type: 'fir', label: caseRecord.fir_id, value: caseRecord.case_summary },
    { type: 'station', label: getStation(caseRecord)?.station_name || caseRecord.station_id, value: caseRecord.district },
  ])
}

function agentSteps(intent, detail) {
  const common = [
    { agent: 'Detective Agent', note: detail.detective || 'Framed the investigative question' },
    { agent: 'Data Agent', note: detail.retriever || 'Searched FIR records and filtered data' },
    { agent: 'Network Agent', note: detail.network || 'Checked accused, location, victim, vehicle, phone, and bank links' },
    { agent: 'Skeptic Agent', note: detail.skeptic || 'Marked output as an investigative lead, not proof' },
    { agent: 'Report Agent', note: detail.reporter || 'Prepared a report-ready answer with source FIR IDs' },
  ]

  return common.map((step, index) => ({
    ...step,
    status: index < 4 || intent !== 'GENERAL_QUERY' ? 'complete' : 'ready',
  }))
}

export function findColdCaseMatches() {
  const syntheticColdCases = [
    {
      fir_id: 'SYN-2019-MYS-044',
      district: 'Mysuru',
      station_id: 'PS-MYS-LKR',
      crime_type: 'Motorcycle Theft',
      date: '2019-12-18',
      time: '22:05',
      lat: 12.3167,
      lon: 76.6505,
      status: 'Unsolved',
      mo: 'Duplicate key used in railway parking area at night; vehicle moved through low-light lane.',
      case_summary: 'Synthetic cold case: two-wheeler theft near Mysuru railway-side parking remained unsolved.',
      bns_sections: '303(2), 317',
      accused_ids: ['UNKNOWN-2019'],
      victim_id: 'V-COLD-044',
      vehicle: 'KA-09-COLD-044',
      phone_hash: 'PH-HASH-901',
    },
    {
      fir_id: 'SYN-2020-BLR-018',
      district: 'Bengaluru South',
      station_id: 'PS-BLR-JYN',
      crime_type: 'House Burglary',
      date: '2020-02-11',
      time: '02:20',
      lat: 12.924,
      lon: 77.591,
      status: 'Unsolved',
      mo: 'Rear-window entry between 1 AM and 4 AM; locked independent house targeted.',
      case_summary: 'Synthetic cold case: night burglary with rear-window entry and small vehicle sighting.',
      bns_sections: '331, 305',
      accused_ids: ['UNKNOWN-2020'],
      victim_id: 'V-COLD-018',
      vehicle: 'KA-03-SYN-7777',
      phone_hash: 'PH-HASH-COLD',
    },
  ]

  return syntheticColdCases
    .map((coldCase) => {
      const match = cases
        .map((caseRecord) => ({
          case: caseRecord,
          score: crimeDNAScore(coldCase, caseRecord),
          reasons: explainMatch(coldCase, caseRecord),
        }))
        .sort((a, b) => b.score - a.score)[0]

      return {
        coldCase,
        match,
        disclaimer: 'This is an investigative lead, not a confirmed conclusion.',
      }
    })
    .sort((a, b) => b.match.score - a.match.score)
}

function leadStrength(confidence) {
  if (confidence >= 0.82) return 'Strong investigative lead'
  if (confidence >= 0.65) return 'Moderate lead'
  return 'Weak lead'
}

function nextStepsForIntent(intent, sources) {
  const common = ['Verify source FIR details with the station record owner', 'Avoid naming guilt; treat output as a lead']
  const byIntent = {
    HOTSPOT_QUERY: ['Review station beat timing around mapped points', 'Compare CCTV or patrol logs for the repeated time window'],
    CASE_LINK_QUERY: ['Check shared entity trail in the network graph', 'Request human review of phone, vehicle, or account hashes'],
    SIMILAR_CASE_QUERY: ['Open top Crime DNA match and compare MO factors', 'Look for missing FIR narrative fields before escalation'],
    PATROL_WHAT_IF: ['Validate unit availability with field command', 'Use weather and traffic context before deployment'],
    LEGAL_REPORT: ['Attach approved case notes before official circulation', 'Confirm BNS/IPC mapping with authorized legal reviewer'],
    COLD_CASE_QUERY: ['Compare old and new MO factors manually', 'Check station archive notes before reopening any case'],
    STATUS_QUERY: ['Use district and crime filters before reporting counts', 'Check stale or closed records before action'],
    CASE_SUMMARY_QUERY: ['Open graph view for hidden links', 'Generate a brief only after investigator confirmation'],
  }

  return [...(byIntent[intent] || byIntent.CASE_SUMMARY_QUERY), ...common].slice(0, 4).map((text, index) => ({
    id: `STEP-${index + 1}`,
    text,
    sourceCount: sources.length,
  }))
}

function suggestedQuestionsForIntent(intent, sources) {
  const first = sources[0] || 'SYN-2025-BLR-001'
  const bank = sources.find((source) => source.includes('HUB') || source.includes('MNG')) || 'SYN-2025-HUB-009'
  const suggestions = {
    HOTSPOT_QUERY: [
      'Show the network graph for this hotspot cluster',
      `Find similar cases to ${first}`,
      'Suggest patrol plan for tonight',
    ],
    CASE_LINK_QUERY: [`Generate PDF report for this cluster`, `Find similar cases to ${first}`, 'Analyze unsolved cases'],
    SIMILAR_CASE_QUERY: [`Open network graph for ${first}`, 'Show hotspot map for matching cases', 'Generate investigation brief'],
    PATROL_WHAT_IF: ['Show high-concentration areas on map', 'Generate patrol simulation report', 'Which cases caused this recommendation?'],
    LEGAL_REPORT: ['Show source FIR evidence trail', 'Open matching network graph', 'Analyze unsolved cases'],
    COLD_CASE_QUERY: ['Open the matching network graph', 'Generate cold-case review brief', 'Show patrol plan for the matched area'],
    STATUS_QUERY: ['Show district chart', 'Show top police stations', 'Generate dashboard report'],
    CASE_SUMMARY_QUERY: [`Find cases similar to ${first}`, `Open network graph for ${first}`, 'Generate investigation brief'],
  }

  if (intent === 'CASE_LINK_QUERY' && bank) {
    suggestions.CASE_LINK_QUERY[1] = `Find similar cases to ${bank}`
  }

  return suggestions[intent] || suggestions.CASE_SUMMARY_QUERY
}

function riskFlagsForIntent(intent, confidence) {
  const flags = ['Synthetic dataset only', 'Not an automated guilt prediction']
  if (confidence < 0.7) flags.push('Low confidence requires extra human review')
  if (intent === 'PATROL_WHAT_IF') flags.push('Coverage estimate is not a field guarantee')
  if (intent === 'LEGAL_REPORT') flags.push('Legal mapping is informational support')
  return flags
}

function buildRagSourceChunks(response) {
  const sourceIds = new Set(response.sources || [])
  const selectedCases = cases.filter((caseRecord) => sourceIds.has(caseRecord.fir_id)).slice(0, 3)
  const chunks = selectedCases.map((caseRecord, index) => ({
    id: `SRC-FIR-${String(index + 1).padStart(2, '0')}`,
    service: 'Shared synthetic case repository',
    title: `${caseRecord.fir_id} narrative and MO`,
    text: `${caseRecord.case_summary} MO: ${caseRecord.mo}`,
    confidence: Math.max(0.72, Number((response.confidence - index * 0.04).toFixed(2))),
  }))

  if (selectedCases[0]) {
    const legal = legalExplainabilityForCase(selectedCases[0])
    chunks.push({
      id: 'SRC-LEGAL-01',
      service: 'Deterministic legal support map',
      title: `BNS / IPC support for ${legal.crimeType}`,
      text: `BNS ${legal.bns}; ${legal.legalNote} ${legal.humanActionNote}`,
      confidence: 0.86,
    })
  }

  chunks.push({
    id: 'SRC-SOP-01',
    service: 'Bundled human-review safeguard',
    title: 'Investigation SOP guardrail',
    text: 'Use source FIRs, masked identifiers, supervisor review, and human verification before operational action.',
    confidence: 0.94,
  })

  return chunks.slice(0, 5)
}

function decorateResponse(response) {
  const sourceChunks = buildRagSourceChunks(response)
  return {
    ...response,
    leadStrength: leadStrength(response.confidence),
    nextSteps: nextStepsForIntent(response.intent, response.sources || []),
    suggestedQuestions: suggestedQuestionsForIntent(response.intent, response.sources || []),
    riskFlags: riskFlagsForIntent(response.intent, response.confidence),
    sourceChunks,
    quickMlRag: {
      available: false,
      knowledgeBase: 'FIR + BNS + SOP + evidence metadata demo KB',
      retrievalMode: 'Deterministic structured retrieval; no QuickML call was made in offline mode',
      sourceCount: sourceChunks.length,
    },
    audit: {
      policy: 'synthetic-data-only',
      sourceCount: response.sources?.length || 0,
      generatedAt: new Date().toISOString(),
    },
  }
}

function answerHotspot(query) {
  const crimeType = extractCrimeType(query) || 'Chain Snatching'
  const district = extractDistrict(query) || 'Mysuru'
  const { points, stationCounts } = getHotspots({ query, district, crimeType })
  const firIds = points.map((caseRecord) => caseRecord.fir_id)
  const vehicle = points.find((caseRecord) => caseRecord.vehicle !== 'NA')?.vehicle
  const confidence = district === 'Mysuru' && crimeType === 'Chain Snatching' ? 0.86 : 0.78

  return {
    intent: 'HOTSPOT_QUERY',
    answer: `${points.length} synthetic ${crimeType.toLowerCase()} cases appear in ${district}. ${stationCounts
      .map((item) => `${item.station_name} (${item.count})`)
      .join(', ')}. ${vehicle ? `Repeated vehicle ${vehicle} supports a linked pattern. ` : ''}Confidence: ${confidence.toFixed(2)}.`,
    confidence,
    evidence: evidenceFromCases(points),
    sources: firIds,
    visuals: {
      mapPoints: points,
      stationCounts,
      graph: firIds[0] ? buildGraph(firIds[0]) : buildGraph(),
    },
    agents: agentSteps('HOTSPOT_QUERY', {
      detective: `Parsed district=${district}, crime_type=${crimeType}`,
      retriever: `Fetched ${points.length} matching FIR records`,
      network: vehicle ? `Found repeated vehicle ${vehicle}` : 'No repeated vehicle in selected seed slice',
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerConnection(query) {
  const firIds = extractFirIds(query)
  const inferredCrime = extractCrimeType(query)
  const selected =
    firIds.length >= 2
      ? filterCases({ firIds })
      : inferredCrime
        ? filterCases({ crimeType: inferredCrime }).slice(0, 2)
        : [cases[0], cases[1]]
  const [first, second] = selected
  const score = first && second ? Math.max(0.82, crimeDNAScore(first, second)) : 0.62
  const shared = first && second ? sharedEntities(first, second) : []
  const sharedText = shared.map((item) => item.value).join(', ')

  return {
    intent: 'CASE_LINK_QUERY',
    answer: `Yes. ${first.fir_id} and ${second.fir_id} show a strong investigative link. Both are ${first.district} ${first.crime_type.toLowerCase()} cases, with shared evidence ${sharedText || 'from related MO and location patterns'}. Treat this as an investigative lead, not final proof. Confidence: ${score.toFixed(2)}.`,
    confidence: score,
    evidence: [
      ...evidenceFromCases(selected),
      ...shared.map((item) => ({ type: item.type, label: item.value, value: 'Shared entity across selected FIRs' })),
    ],
    sources: selected.map((caseRecord) => caseRecord.fir_id),
    visuals: {
      graph: buildGraph(first.fir_id),
      mapPoints: selected,
      similar: findSimilarCases(first.fir_id).matches,
    },
    agents: agentSteps('CASE_LINK_QUERY', {
      detective: `Compared ${selected.map((caseRecord) => caseRecord.fir_id).join(' and ')}`,
      retriever: `Fetched ${selected.length} FIR records`,
      network: sharedText ? `Found ${sharedText}` : 'No direct shared entity; relying on weaker MO factors',
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerSimilar(query) {
  const [firId] = extractFirIds(query)
  const sourceId = firId || 'SYN-2025-BLR-027'
  const result = findSimilarCases(sourceId)
  const top = result.matches[0]

  return {
    intent: 'SIMILAR_CASE_QUERY',
    answer: top
      ? `${top.case.fir_id} is the closest match to ${sourceId}. Similarity drivers: ${top.reasons.join(', ')}. Similarity score: ${top.score.toFixed(2)}.`
      : `No similar case found for ${sourceId}.`,
    confidence: top?.score || 0.4,
    evidence: result.source ? evidenceFromCases([result.source, ...result.matches.slice(0, 3).map((item) => item.case)]) : [],
    sources: result.source ? [result.source.fir_id, ...result.matches.slice(0, 3).map((item) => item.case.fir_id)] : [],
    visuals: {
      similar: result.matches,
      graph: result.source ? buildGraph(result.source.fir_id) : buildGraph(),
      mapPoints: result.source ? [result.source, ...result.matches.slice(0, 2).map((item) => item.case)] : [],
    },
    agents: agentSteps('SIMILAR_CASE_QUERY', {
      detective: `Built Crime DNA fingerprint for ${sourceId}`,
      retriever: `Compared ${Math.max(0, cases.length - 1)} candidate FIR records`,
      network: top ? `Top factors: ${top.reasons.slice(0, 3).join(', ')}` : 'No high-confidence match',
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerPatrol(query) {
  const units = Number(query.match(/\b(\d+)\s+patrol/i)?.[1] || query.match(/\b(\d+)\s+units?/i)?.[1] || 3)
  const district = extractDistrict(query) || 'Bengaluru South'
  const crimeType = extractCrimeType(query) || 'Motorcycle Theft'
  const simulation = patrolWhatIf({ district, crimeType, units })

  return {
    intent: 'PATROL_WHAT_IF',
    answer: `Prototype simulation estimates hotspot coverage improving from ${simulation.coverageBefore}% to ${simulation.coverageAfter}%. Recommended focus: ${simulation.recommendations
      .map((item) => item.station)
      .join(', ')}. This is a resource-planning estimate, not a guarantee.`,
    confidence: 0.74,
    evidence: simulation.recommendations.map((item) => ({
      type: 'patrol_zone',
      label: item.station,
      value: item.reason,
    })),
    sources: filterCases({ district, crimeType }).map((caseRecord) => caseRecord.fir_id),
    visuals: {
      patrol: simulation,
      mapPoints: filterCases({ district, crimeType }),
    },
    agents: agentSteps('PATROL_WHAT_IF', {
      detective: `Modeled ${units} patrol units for ${district}`,
      retriever: `Selected ${crimeType} synthetic hotspot records`,
      network: 'Ranked stations by planted hotspot density',
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerReport(query) {
  const crimeType = extractCrimeType(query) || 'Motorcycle Theft'
  const selected = filterCases({ crimeType, district: extractDistrict(query) || 'Bengaluru South' }).slice(0, 4)
  const title = `${crimeType} Cluster Intelligence Brief`

  return {
    intent: 'LEGAL_REPORT',
    answer: `Report generated for ${crimeType.toLowerCase()} cluster with case list, evidence links, BNS mapping, confidence notes, human-review disclaimer, and audit timestamp.`,
    confidence: 0.82,
    evidence: evidenceFromCases(selected),
    sources: selected.map((caseRecord) => caseRecord.fir_id),
    visuals: {
      report: {
        reportId: `RPT-${Date.now().toString().slice(-6)}`,
        title,
        cases: selected,
        generatedAt: new Date().toISOString(),
      },
      graph: selected[0] ? buildGraph(selected[0].fir_id) : buildGraph(),
      mapPoints: selected,
    },
    agents: agentSteps('LEGAL_REPORT', {
      detective: `Prepared ${title}`,
      retriever: `Attached ${selected.length} source FIR records`,
      network: 'Included graph and shared-entity summary',
      reporter: 'Generated PDF-ready investigation brief content',
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerColdCases() {
  const matches = findColdCaseMatches()
  const top = matches[0]
  const sources = matches.flatMap((item) => [item.coldCase.fir_id, item.match.case.fir_id])

  return {
    intent: 'COLD_CASE_QUERY',
    answer: `Cold case match found: ${top.coldCase.fir_id} aligns with ${top.match.case.fir_id}. Common factors include ${top.match.reasons.join(', ')}. Similarity score: ${top.match.score.toFixed(2)}. This is an investigative lead, not a confirmed conclusion.`,
    confidence: top.match.score,
    evidence: matches.flatMap((item) => [
      { type: 'cold_case', label: item.coldCase.fir_id, value: item.coldCase.case_summary },
      { type: 'new_match', label: item.match.case.fir_id, value: item.match.case.case_summary },
    ]),
    sources,
    visuals: {
      coldCases: matches,
      graph: buildGraph(top.match.case.fir_id),
      similar: matches.map((item) => item.match),
    },
    agents: agentSteps('COLD_CASE_QUERY', {
      detective: 'Analyzed unsolved synthetic cold cases',
      retriever: `Fetched ${matches.length} cold-case candidates`,
      network: `Linked ${top.coldCase.fir_id} with ${top.match.case.fir_id}`,
      skeptic: 'Cold case revival is a lead, not a reopening decision',
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerStatus(query) {
  const district = extractDistrict(query)
  const crimeType = extractCrimeType(query)
  const selected = filterCases({ query, district, crimeType })
  const open = selected.filter((caseRecord) => ['Open', 'Under Investigation'].includes(caseRecord.status))
  const label = [district, crimeType].filter(Boolean).join(' ') || 'selected'

  return {
    intent: 'STATUS_QUERY',
    answer: `${open.length} of ${selected.length} ${label} synthetic FIR records are active. Active statuses include Open and Under Investigation.`,
    confidence: 0.8,
    evidence: evidenceFromCases(open.length ? open : selected),
    sources: selected.map((caseRecord) => caseRecord.fir_id),
    visuals: {
      mapPoints: selected,
      chartData: groupCount(selected, 'status'),
    },
    agents: agentSteps('STATUS_QUERY', {
      detective: `Counted ${label} case status`,
      retriever: `Fetched ${selected.length} records`,
    }),
    disclaimer: DISCLAIMER,
  }
}

function answerSummary(query) {
  const [firId] = extractFirIds(query)
  const source = cases.find((caseRecord) => caseRecord.fir_id === firId) || cases[0]
  const station = getStation(source)

  return {
    intent: 'CASE_SUMMARY_QUERY',
    answer: `${source.fir_id}: ${source.case_summary} Crime type: ${source.crime_type}. Station: ${station?.station_name || source.station_id}. Status: ${source.status}. Evidence fields include ${source.accused_ids.join(', ')}, ${source.vehicle}, and ${source.phone_hash}.`,
    confidence: 0.79,
    evidence: evidenceFromCases([source]),
    sources: [source.fir_id],
    visuals: {
      graph: buildGraph(source.fir_id),
      mapPoints: [source],
      similar: findSimilarCases(source.fir_id).matches,
    },
    agents: agentSteps('CASE_SUMMARY_QUERY', {
      detective: `Prepared summary for ${source.fir_id}`,
      retriever: `Fetched ${source.fir_id}`,
    }),
    disclaimer: DISCLAIMER,
  }
}

export function answerQuery(query, role = 'Investigator') {
  const intent = detectIntent(query)
  let response

  if (intent === 'HOTSPOT_QUERY') response = answerHotspot(query)
  else if (intent === 'CASE_LINK_QUERY') response = answerConnection(query)
  else if (intent === 'SIMILAR_CASE_QUERY') response = answerSimilar(query)
  else if (intent === 'PATROL_WHAT_IF') response = answerPatrol(query)
  else if (intent === 'LEGAL_REPORT') response = answerReport(query)
  else if (intent === 'COLD_CASE_QUERY') response = answerColdCases(query)
  else if (intent === 'STATUS_QUERY') response = answerStatus(query)
  else response = answerSummary(query)

  return decorateResponse({
    conversationId: `CONV-${Date.now().toString().slice(-6)}`,
    role,
    query,
    timestamp: new Date().toISOString(),
    ...response,
  })
}

export function seedSummary() {
  return {
    users: demoUsers.length,
    stations: stations.length,
    cases: cases.length,
    accused: accused.length,
    relations: relations.length,
  }
}
