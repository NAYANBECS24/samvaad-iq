const DISCLAIMER = 'Investigative lead only. Human verification and supervisory approval are required.'

const DISTRICTS = [
  { name: 'Bengaluru South', code: 'BLR', lat: 12.925, lon: 77.594 },
  { name: 'Mysuru', code: 'MYS', lat: 12.316, lon: 76.651 },
  { name: 'Hubballi-Dharwad', code: 'HBL', lat: 15.364, lon: 75.124 },
  { name: 'Mangaluru', code: 'MNG', lat: 12.914, lon: 74.856 },
  { name: 'Belagavi', code: 'BLG', lat: 15.849, lon: 74.497 },
  { name: 'Kalaburagi', code: 'KLB', lat: 17.329, lon: 76.834 },
]

const CRIME_PROFILES = [
  {
    type: 'Motorcycle Theft',
    mo: 'Two-person team targets parked motorcycles, defeats the handle lock and leaves through a connecting road.',
    summary: 'Synthetic report of a motorcycle removed from a public parking area during a low-visibility period.',
    sections: 'BNS 303(2), 317',
  },
  {
    type: 'Chain Snatching',
    mo: 'Rider and pillion approach a pedestrian from the left, snatch jewellery and leave on a scooter.',
    summary: 'Synthetic report of evening chain snatching near a commercial or transit corridor.',
    sections: 'BNS 304(2), 3(5)',
  },
  {
    type: 'UPI Fraud',
    mo: 'Caller impersonates support staff and induces the victim to approve a collect request through a mule account.',
    summary: 'Synthetic report of a social-engineering payment fraud using a disposable phone number.',
    sections: 'BNS 318(4); IT Act 66D',
  },
  {
    type: 'House Burglary',
    mo: 'Rear entry is forced while occupants are away and compact valuables are removed without disturbing larger items.',
    summary: 'Synthetic report of residential burglary during a predictable unoccupied window.',
    sections: 'BNS 305, 331(4)',
  },
  {
    type: 'Mobile Phone Theft',
    mo: 'Offender exploits a crowded queue or bus boarding point and transfers the handset to an associate.',
    summary: 'Synthetic report of a handset theft in a crowded public place.',
    sections: 'BNS 303(2), 3(5)',
  },
]

const STOP_WORDS = new Set([
  'the', 'and', 'near', 'case', 'cases', 'with', 'from', 'for', 'into', 'after', 'show', 'please', 'find',
  'last', 'months', 'report', 'synthetic', 'alli', 'maadi', 'saar', 'what', 'where', 'which', 'about',
])

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function stableId(prefix = 'REQ') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeQuery(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ಮೋಟಾರ್\s*ಸೈಕಲ್|ಬೈಕ್/g, ' motorcycle ')
    .replace(/ಕಳ್ಳತನ|ಕಳವು/g, ' theft ')
    .replace(/ಸರಗಳ್ಳತನ|ಚೈನ್\s*ಸ್ನ್ಯಾಚಿಂಗ್/g, ' chain snatching ')
    .replace(/ವಂಚನೆ|ಮೋಸ/g, ' fraud ')
    .replace(/ಪ್ರಕರಣ|ಎಫ್‌ಐಆರ್/g, ' fir ')
    .replace(/ಹೋಲುವ|ಹೋಲಿಕೆ/g, ' similar ')
    .replace(/ತೋರಿಸಿ|ತೋರಿಸು/g, ' show ')
    .replace(/ಹಾಟ್[‌್]?ಸ್ಪಾಟ್/g, ' hotspot ')
    .replace(/ಮೈಸೂರು/g, ' mysuru ')
    .replace(/ಬೆಂಗಳೂರು/g, ' bengaluru south ')
    .replace(/ಮಂಗಳೂರು/g, ' mangaluru ')
    .replace(/alli/g, ' in ')
    .replace(/maadi/g, ' please ')
    .replace(/thorsi|torisi|torsi/g, ' show ')
    .replace(/kalavu|kalla/g, ' theft ')
    .replace(/jodi/g, ' link ')
    .replace(/mysore/g, 'mysuru')
    .replace(/mangalore/g, 'mangaluru')
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value = '') {
  return new Set(
    normalizeQuery(value)
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  )
}

function jaccard(leftValue, rightValue) {
  const left = tokenize(leftValue)
  const right = tokenize(rightValue)
  const union = new Set([...left, ...right])
  if (!union.size) return 0
  return [...left].filter((token) => right.has(token)).length / union.size
}

function timeBand(time = '12:00') {
  const hour = Number(String(time).split(':')[0])
  if (hour < 5) return 'late-night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function sharedEntities(left, right) {
  const shared = []
  for (const id of left.accused_ids || []) {
    if ((right.accused_ids || []).includes(id)) shared.push({ type: 'accused', value: id })
  }
  if (left.phone_hash && left.phone_hash !== 'NA' && left.phone_hash === right.phone_hash) {
    shared.push({ type: 'phone_hash', value: left.phone_hash })
  }
  if (left.vehicle && left.vehicle !== 'NA' && left.vehicle === right.vehicle) {
    shared.push({ type: 'vehicle', value: left.vehicle })
  }
  return shared
}

function opaqueSyntheticToken(namespace, seedNumber, groupIndex) {
  let hash = 2166136261
  for (const character of `${namespace}:${seedNumber}:${groupIndex}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x85ebca6b)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 0xc2b2ae35)
  hash ^= hash >>> 16
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0')
}

export function crimeDna(left, right) {
  const entityMatches = sharedEntities(left, right)
  const factors = [
    { key: 'crimeType', label: 'Crime category', weight: 0.25, score: Number(left.crime_type === right.crime_type), evidence: left.crime_type },
    { key: 'modusOperandi', label: 'Modus operandi', weight: 0.2, score: jaccard(left.mo, right.mo), evidence: 'Narrative token overlap' },
    { key: 'geography', label: 'Geography', weight: 0.15, score: left.district === right.district ? 1 : 0.2, evidence: `${left.district} / ${right.district}` },
    { key: 'timePattern', label: 'Time pattern', weight: 0.1, score: Number(timeBand(left.time) === timeBand(right.time)), evidence: `${timeBand(left.time)} / ${timeBand(right.time)}` },
    { key: 'sharedEntities', label: 'Shared entities', weight: 0.2, score: Math.min(1, entityMatches.length / 2), evidence: entityMatches.map((item) => item.value).join(', ') || 'No shared hashed entity' },
    { key: 'summary', label: 'Narrative similarity', weight: 0.1, score: jaccard(left.case_summary, right.case_summary), evidence: 'Summary token overlap' },
  ].map((factor) => ({ ...factor, contribution: Number((factor.weight * factor.score).toFixed(3)) }))

  const score = Number(Math.min(0.98, factors.reduce((total, factor) => total + factor.contribution, 0)).toFixed(3))
  const band = score >= 0.72 ? 'high' : score >= 0.48 ? 'medium' : 'low'
  return {
    score,
    band,
    threshold: 0.48,
    included: score >= 0.48,
    factors,
    sharedEntities: entityMatches,
    disclaimer: DISCLAIMER,
  }
}

function seededStation(district, index) {
  return `PS-${district.code}-SYN-${String((index % 12) + 1).padStart(2, '0')}`
}

export function toSyntheticFirId(value, fallbackIndex = 0) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized.startsWith('SYN-')) return normalized
  const dated = normalized.match(/^FIR-(\d{4})-([A-Z]+)-(\d{3,4})$/)
  if (dated) return `SYN-${dated[1]}-${dated[2]}-${dated[3]}`
  const numeric = normalized.match(/^FIR-(\d+)$/)
  if (numeric) return `SYN-2026-LEG-${numeric[1].padStart(4, '0')}`
  return `SYN-2026-LEG-${String(fallbackIndex + 1).padStart(4, '0')}`
}

export function generateSyntheticDataset(baseSeed, total = 1000, seedNumber = 20260717) {
  const random = mulberry32(seedNumber)
  const baseCases = (baseSeed?.cases || []).map((item, index) => ({
    ...item,
    fir_id: toSyntheticFirId(item.fir_id, index),
    synthetic: true,
    data_label: 'SYNTHETIC DEMO DATA',
  }))
  const cases = [...baseCases]
  const patternFamilyCount = 6

  for (let index = cases.length; index < total; index += 1) {
    const district = DISTRICTS[index % DISTRICTS.length]
    const groupIndex = index % 17 === 0 ? Math.floor(index / 17) % patternFamilyCount : -1
    const profile = CRIME_PROFILES[groupIndex >= 0 ? groupIndex % CRIME_PROFILES.length : (index * 7) % CRIME_PROFILES.length]
    const isPatternCase = groupIndex >= 0
    const dayOffset = index % 540
    const date = new Date(Date.UTC(2024, 7, 1 + dayOffset)).toISOString().slice(0, 10)
    const hour = isPatternCase ? 21 + (index % 2) : 6 + ((index * 5) % 18)
    const minute = (index * 13) % 60
    const patternSuffix = ''
    const accusedId = isPatternCase ? `A-SYN-${opaqueSyntheticToken('actor', seedNumber, groupIndex)}` : `A-SYN-${String(index + 1000).padStart(4, '0')}`
    const phoneHash = isPatternCase ? `PH-SYN-${opaqueSyntheticToken('phone', seedNumber, groupIndex)}` : `PH-SYN-${String(index + 5000).padStart(5, '0')}`
    const caseNumber = String(index + 1).padStart(4, '0')

    cases.push({
      fir_id: `SYN-2026-${district.code}-${caseNumber}`,
      district: district.name,
      station_id: seededStation(district, index),
      crime_type: profile.type,
      date,
      time: `${String(hour % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      lat: Number((district.lat + (random() - 0.5) * 0.16).toFixed(5)),
      lon: Number((district.lon + (random() - 0.5) * 0.16).toFixed(5)),
      status: ['Open', 'Under Investigation', 'Charge Sheet Filed', 'Closed'][index % 4],
      mo: `${profile.mo}${patternSuffix}`,
      case_summary: `${profile.summary}${patternSuffix}`,
      bns_sections: profile.sections,
      accused_ids: [accusedId],
      victim_id: `V-SYN-${String(index + 8000).padStart(5, '0')}`,
      vehicle: profile.type.includes('Theft') && index % 3 === 0 ? `KA-SYN-${String(index + 3000).padStart(5, '0')}` : 'NA',
      phone_hash: phoneHash,
      synthetic: true,
      data_label: 'SYNTHETIC DEMO DATA',
    })
  }

  const stations = unique(cases.map((item) => item.station_id)).map((stationId) => {
    const caseRecord = cases.find((item) => item.station_id === stationId)
    return {
      station_id: stationId,
      station_name: stationId.includes('SYN') ? `Synthetic Station ${stationId.split('-').slice(-1)[0]}` : stationId,
      district: caseRecord?.district || 'Unknown',
      synthetic: true,
    }
  })

  return {
    version: `synthetic-${seedNumber}-${total}`,
    label: 'SYNTHETIC DEMO DATA — NOT AN OPERATIONAL POLICE RECORD',
    cases,
    stations,
    plantedPatternFamilies: patternFamilyCount,
  }
}

export function extractFirIds(query) {
  return unique(String(query).match(/(?:FIR|SYN)-\d{4}-[A-Z]+-\d{3,4}/gi) || []).map((id) => id.toUpperCase())
}

export function extractDistrict(query) {
  const normalized = normalizeQuery(query)
  return DISTRICTS.find((district) => normalized.includes(normalizeQuery(district.name)))?.name || null
}

export function extractCrimeType(query) {
  const normalized = normalizeQuery(query)
  if (normalized.includes('chain') || normalized.includes('snatching')) return 'Chain Snatching'
  if (normalized.includes('upi') || normalized.includes('fraud') || normalized.includes('cyber')) return 'UPI Fraud'
  if (normalized.includes('burglary') || normalized.includes('house')) return 'House Burglary'
  if (normalized.includes('mobile') || normalized.includes('phone theft')) return 'Mobile Phone Theft'
  if (normalized.includes('motorcycle') || normalized.includes('bike') || normalized.includes('theft')) return 'Motorcycle Theft'
  return null
}

function extractStructuredFilters(query) {
  const normalized = normalizeQuery(query)
  const isoDates = unique(String(query).match(/\b20\d{2}-\d{2}-\d{2}\b/g) || []).sort()
  const stationId = String(query).match(/\bPS-[A-Z]+-(?:SYN-)?\d{2}\b/i)?.[0]?.toUpperCase() || null
  const status = /charge\s*sheet/i.test(query)
    ? 'Charge Sheet Filed'
    : /under investigation|ತನಿಖೆ/i.test(query)
      ? 'Under Investigation'
      : /\bclosed\b|ಮುಚ್ಚ/i.test(query)
        ? 'Closed'
        : /\bopen\b/i.test(query)
          ? 'Open'
          : null
  const bnsSections = unique(String(query).match(/\bBNS\s*\d+(?:\(\d+\))?/gi) || []).map((value) => value.toUpperCase().replace(/\s+/g, ' '))
  const entityRefs = unique(String(query).match(/(?:PH-(?:HASH|SYN)[-A-Z0-9]+|KA-[A-Z0-9-]{5,}|A-SYN-[A-Z0-9]+)/gi) || []).map((value) => value.toUpperCase())
  const timeBandFilter = /late[ -]?night|midnight/i.test(query)
    ? 'late-night'
    : /morning|ಬೆಳಗ್ಗೆ/i.test(query)
      ? 'morning'
      : /afternoon|ಮಧ್ಯಾಹ್ನ/i.test(query)
        ? 'afternoon'
        : /evening|ಸಂಜೆ/i.test(query)
          ? 'evening'
          : /\bnight\b|ರಾತ್ರಿ/i.test(query)
            ? 'night'
            : null
  const relative = normalized.match(/last (\d{1,3}) (day|days|week|weeks|month|months)/)
  return {
    district: extractDistrict(query),
    crimeType: extractCrimeType(query),
    firIds: extractFirIds(query),
    stationId,
    status,
    bnsSections,
    entityRefs,
    dateFrom: isoDates[0] || null,
    dateTo: isoDates[1] || isoDates[0] || null,
    relativePeriod: relative ? { value: Number(relative[1]), unit: relative[2] } : null,
    timeBand: timeBandFilter,
  }
}

export function detectQueryLanguage(query = '') {
  if (/[\u0C80-\u0CFF]/u.test(query)) return 'kn'
  if (/\b(mahiti|maadi|thorsi|torisi|alli|beku|yenu|ideya|jothe|eshtu|helu)\b/i.test(query)) return 'kanglish'
  return 'en'
}

export function classifyIntent(query) {
  const normalized = normalizeQuery(query)
  if (!normalized) return { intent: 'AMBIGUOUS_QUERY', reason: 'Please type a question so I can help.' }
  if (/^(hi|hii+|hello|hey|hlo|hai|namaste|namaskara|ನಮಸ್ಕಾರ|ಶುಭೋದಯ)( everyone| samvaad| there| sir| madam)?$/.test(normalized)) {
    return { intent: 'CONVERSATIONAL_QUERY', conversationType: 'greeting' }
  }
  if (/^(thanks|thank you|thankyou|ಧನ್ಯವಾದ|ಧನ್ಯವಾದಗಳು|ok thanks|great thanks)/.test(normalized)) {
    return { intent: 'CONVERSATIONAL_QUERY', conversationType: 'thanks' }
  }
  if (/who are you|what is samvaad|what is netra|your name|introduce yourself|ನೀವು ಯಾರು|ನಿನ್ನ ಹೆಸರೇನು/.test(normalized)) {
    return { intent: 'CONVERSATIONAL_QUERY', conversationType: 'identity' }
  }
  if (/what can you do|how can you help|help me|how (do i|to) use|capabilit|commands|examples|ಏನು ಮಾಡಬಹುದು|ಸಹಾಯ/.test(normalized)) {
    return { intent: 'CONVERSATIONAL_QUERY', conversationType: 'help' }
  }
  if (/good (morning|afternoon|evening|night)|bye|goodbye|see you|take care/.test(normalized)) {
    return { intent: 'CONVERSATIONAL_QUERY', conversationType: 'greeting' }
  }
  if (/who is guilty|prove (he|she|they) did|predict (a )?person|person risk score|rank (people|suspects)|identify caste|religion.*risk|bypass|hack.*database|reveal.*personal|real fir|operational deployment/.test(normalized)) {
    return { intent: 'SAFETY_REFUSAL', reason: 'SAMVAAD-IQ cannot determine guilt, rank people, reveal operational or personal data, or bypass safeguards.' }
  }
  if (/medical advice|diagnose me|legal advice for me|self harm|suicide/.test(normalized)) {
    return { intent: 'SAFETY_REFUSAL', reason: 'This request needs an appropriately qualified human or emergency service rather than a police-database assistant.' }
  }
  if (/chain of custody|evidence handling|preserve evidence|human review|supervisor approval|investigation sop|standard operating procedure|how should evidence/.test(normalized)) {
    return { intent: 'KNOWLEDGE_QUERY', knowledgeTopic: 'evidence-governance' }
  }
  if (/how many|count|overview|database summary|data summary|statistics|stats|total cases|crime breakdown|district breakdown/.test(normalized)) return { intent: 'DATABASE_SUMMARY_QUERY' }
  if (/hotspot|map|where|area pattern|high crime|most incidents|crime trend|crime pattern/.test(normalized)) return { intent: 'HOTSPOT_QUERY' }
  if (/connected|connection|link|network|graph/.test(normalized)) return { intent: 'CASE_LINK_QUERY' }
  if (/similar|match|crime dna|cold|unsolved/.test(normalized)) return { intent: 'SIMILAR_CASE_QUERY' }
  if (/patrol|what if|scenario|units/.test(normalized)) return { intent: 'SCENARIO_QUERY' }
  if (/report|pdf|brief/.test(normalized)) return { intent: 'REPORT_QUERY' }
  if (/fir|syn-|case|cases|incident|record|database|search|list|summary|summarize|theft|fraud|burglary|snatching|ಪ್ರಕರಣ/.test(normalized)) return { intent: 'CASE_SEARCH_QUERY' }
  if (/current|latest|recent|today|yesterday|pending|open|active|new|ongoing|status/.test(normalized)) return { intent: 'CASE_SEARCH_QUERY' }
  if (/tell me|show me|give me|display|fetch|get/.test(normalized)) return { intent: 'DATABASE_SUMMARY_QUERY' }
  if (/weather|cricket|stock|movie|election|recipe|quantum|science|history|technology|coding|capital of|recommendation/.test(normalized)) return { intent: 'GENERAL_QUERY' }
  if (/crime|police|station|district|bengaluru|mysuru|mangaluru|hubballi|belagavi|kalaburagi|karnataka/.test(normalized)) return { intent: 'CASE_SEARCH_QUERY' }
  if (normalized.split(' ').length < 2 && !normalized.includes('?')) return { intent: 'AMBIGUOUS_QUERY', reason: 'Please provide more details so I can help.' }
  return { intent: 'CASE_SEARCH_QUERY' }
}

function conversationalAnswer(query, conversationType) {
  const hasKannada = /[\u0C80-\u0CFF]/u.test(String(query))
  if (hasKannada) {
    if (conversationType === 'thanks') return 'ಸ್ವಾಗತ! ಇನ್ನೊಂದು ಪ್ರಕರಣ, ಹಾಟ್‌ಸ್ಪಾಟ್, ಸಂಪರ್ಕ ಅಥವಾ ಸಾಕ್ಷ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ.'
    if (conversationType === 'identity') return 'ನಾನು SAMVAAD-IQ — NETRA ವೇದಿಕೆಯ ಸಂವಾದಾತ್ಮಕ ತನಿಖಾ ಸಹಾಯಕ. ನಾನು ಸಿಂಥೆಟಿಕ್ FIR ಡೇಟಾವನ್ನು ಹುಡುಕಿ, ಉಲ್ಲೇಖಗಳೊಂದಿಗೆ ಉತ್ತರಿಸಿ, KAVACH ಮೂಲಕ ಪ್ರಕರಣಗಳ ಹೋಲಿಕೆ ವಿವರಿಸುತ್ತೇನೆ.'
    if (conversationType === 'help') return 'ನೀವು ಸಹಜ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಬಹುದು. ಉದಾಹರಣೆ: “ಮೈಸೂರು ಬೈಕ್ ಕಳ್ಳತನದ ಹಾಟ್‌ಸ್ಪಾಟ್ ತೋರಿಸಿ”, “SYN-2025-BLR-001 ಪ್ರಕರಣವನ್ನು ಸಂಕ್ಷಿಪ್ತಗೊಳಿಸಿ”, ಅಥವಾ “ಎರಡು ಪ್ರಕರಣಗಳ ನಡುವೆ ಸಂಪರ್ಕವಿದೆಯೇ?”'
    return 'ನಮಸ್ಕಾರ! ನಾನು SAMVAAD-IQ. ಪ್ರಕರಣ ಹುಡುಕಾಟ, ಹಾಟ್‌ಸ್ಪಾಟ್, ಪ್ರಕರಣಗಳ ಸಂಪರ್ಕ, Crime DNA ಹೋಲಿಕೆ ಮತ್ತು ಸಾಕ್ಷ್ಯಾಧಾರಿತ ಸಾರಾಂಶದಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ನೀವು ಏನು ಪರಿಶೀಲಿಸಲು ಬಯಸುತ್ತೀರಿ?'
  }
  if (conversationType === 'thanks') return 'You’re welcome. Ask another question whenever you’re ready—I can keep the current case context or start a new investigation.'
  if (conversationType === 'identity') return 'I’m SAMVAAD-IQ, the conversational investigation workspace inside NETRA. I search the synthetic FIR database, explain KAVACH case-similarity signals, and return traceable evidence without treating a lead as proof.'
  if (conversationType === 'help') return 'You can ask me in normal English, Kannada, or Kanglish. I can search and summarize FIRs, compare cases with Crime DNA, trace shared signals, show area/time hotspots, test patrol scenarios, and prepare an auditable brief. Try: “Summarize SYN-2025-BLR-014” or “Show motorcycle-theft hotspots in Mysuru.”'
  return 'Hello! I’m SAMVAAD-IQ. I can help you search cases, summarize FIRs, compare Crime DNA, inspect connections, explore hotspots, and plan evidence-backed next steps. What would you like to investigate?'
}

function knowledgeAnswer(query) {
  const hasKannada = /[\u0C80-\u0CFF]/u.test(String(query))
  if (hasKannada) {
    return 'ಡಿಜಿಟಲ್ ಅಥವಾ ದಾಖಲೆ ಸಾಕ್ಷ್ಯವನ್ನು ಮೂಲ ಸ್ಥಿತಿಯಲ್ಲಿ ಉಳಿಸಿ, ಪ್ರವೇಶವನ್ನು ಮಿತಿಗೊಳಿಸಿ, ಸ್ವೀಕೃತಿ ಸಮಯ ಮತ್ತು ಹಸ್ತಾಂತರವನ್ನು ದಾಖಲಿಸಿ, SHA-256 ಹ್ಯಾಶ್ ಮೂಲಕ ಸಮಗ್ರತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಯಾವುದೇ ವಿಶ್ಲೇಷಣೆಯನ್ನು ತನಿಖಾಧಿಕಾರಿ ತಿದ್ದುಪಡಿಗಳಿಂದ ಪ್ರತ್ಯೇಕವಾಗಿ ಗುರುತಿಸಿ. ಪ್ರಕರಣದ ಸಂಪರ್ಕ ಅಥವಾ ವರದಿ ಕ್ರಮಕ್ಕೆ ಮುನ್ನ ಮಾನವ ಪರಿಶೀಲನೆ ಮತ್ತು ಮೇಲ್ವಿಚಾರಕರ ಅನುಮೋದನೆ ಅಗತ್ಯ.'
  }
  return 'Preserve the original evidence, restrict access, record collection time and every hand-off, verify integrity with a SHA-256 hash, and keep machine-extracted facts separate from analyst edits. Treat any match as an investigative lead; a human must verify the source and a supervisor must approve an actionable report.'
}

function generalFallbackAnswer(query) {
  const hasKannada = /[\u0C80-\u0CFF]/u.test(String(query))
  if (hasKannada) return 'ಇದು ಸಿಂಥೆಟಿಕ್ FIR ಡೇಟಾಬೇಸ್‌ಗೆ ನೇರವಾಗಿ ಸಂಬಂಧಿಸಿಲ್ಲ. ನಾನು ಈ ಕೆಳಗಿನವುಗಳನ್ನು ಮಾಡಬಲ್ಲೆ:\n\n• FIR ಪ್ರಕರಣಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತಗೊಳಿಸಿ\n• Crime DNA ಮೂಲಕ ಪ್ರಕರಣಗಳನ್ನು ಹೋಲಿಸಿ\n• ಹಾಟ್‌ಸ್ಪಾಟ್ ಮತ್ತು ಅಪರಾಧ ಮಾದರಿಗಳನ್ನು ತೋರಿಸಿ\n• ಪೆಟ್ರೋಲ್ ಯೋಜನೆ ಸನ್ನಿವೇಶಗಳನ್ನು ಚಲಾಯಿಸಿ\n\nಉದಾಹರಣೆ: "ಮೈಸೂರು ಬೈಕ್ ಕಳ್ಳತನ ಹಾಟ್‌ಸ್ಪಾಟ್ ತೋರಿಸಿ"'
  return `I understand your question, but it falls outside the synthetic crime database I specialize in. Here's what I can help you with:\n\n• **Search & summarize FIR cases** — Try: "Show motorcycle theft cases in Mysuru"\n• **Compare cases using Crime DNA** — Try: "Find similar cases to SYN-2026-BLR-0103"\n• **Explore crime hotspots** — Try: "Mysuru crime hotspots"\n• **Trace case connections** — Try: "Are SYN-2026-BLR-0103 and SYN-2026-BLR-0205 connected?"\n• **Run patrol scenarios** — Try: "What if 3 patrol units are added in Mysuru?"\n• **Generate reports** — Try: "Generate report for latest cases"\n\nAsk me any crime-database question and I'll respond with cited evidence!`
}

function answerClassForIntent(intent) {
  if (['CASE_SEARCH_QUERY', 'CASE_LINK_QUERY', 'SIMILAR_CASE_QUERY', 'HOTSPOT_QUERY', 'SCENARIO_QUERY', 'REPORT_QUERY', 'DATABASE_SUMMARY_QUERY', 'INSUFFICIENT_EVIDENCE'].includes(intent)) return 'DATABASE_GROUNDED'
  if (intent === 'KNOWLEDGE_QUERY') return 'APPROVED_KNOWLEDGE'
  if (['GENERAL_QUERY', 'CONVERSATIONAL_QUERY'].includes(intent)) return 'GENERAL_AI'
  if (intent === 'SAFETY_REFUSAL' || intent === 'OUT_OF_SCOPE') return 'SAFETY_REFUSAL'
  return 'CLARIFICATION'
}

function publicCase(caseRecord) {
  if (!caseRecord) return caseRecord
  const safe = { ...caseRecord }
  delete safe.truth_group
  delete safe.truthGroup
  delete safe.evaluation_label
  delete safe.evaluationLabel
  return safe
}

function publicValue(value) {
  if (Array.isArray(value)) return value.map(publicValue)
  if (!value || typeof value !== 'object') return value
  const safe = {}
  for (const [key, item] of Object.entries(value)) {
    safe[key] = publicValue(item)
  }
  return safe
}

function citation(caseRecord, field = 'case_summary') {
  const value = caseRecord?.[field] || caseRecord?.case_summary || ''
  return {
    id: `CITE-${caseRecord.fir_id}-${field}`,
    firId: caseRecord.fir_id,
    field,
    excerpt: String(value).slice(0, 220),
    sourceType: 'synthetic-fir',
    dataLabel: caseRecord.data_label || 'SYNTHETIC DEMO DATA',
  }
}

function responseEnvelope({ mode, intent, filters = {}, answer, citations = [], confidence = 0, evidence = [], visualizations = {}, limitations = [], nextActions = [], auditRef = null, requestId = stableId(), includeDisclaimer = true }) {
  const score = Number(Math.max(0, Math.min(1, confidence)).toFixed(3))
  return {
    requestId,
    mode,
    answerClass: answerClassForIntent(intent),
    intent,
    filters,
    answer,
    citations,
    claimCitations: citations,
    confidence: {
      score,
      band: score >= 0.8 ? 'high' : score >= 0.55 ? 'medium' : 'low',
      calibration: 'Measured against deterministic planted-truth evaluation cases; not a probability of guilt.',
    },
    evidence: evidence.map(publicCase),
    visualizations: publicValue(visualizations),
    limitations: unique([...(limitations || []), includeDisclaimer ? DISCLAIMER : null]),
    nextActions,
    auditRef,
    approvalState: answerClassForIntent(intent) === 'DATABASE_GROUNDED' ? 'human-review-required' : 'not-required',
  }
}

export function createIntelligenceCore(baseSeed, options = {}) {
  const dataset = generateSyntheticDataset(baseSeed, options.total || 1000, options.seed || 20260717)
  const cases = dataset.cases
  const caseById = new Map(cases.map((item) => [item.fir_id, item]))

  function search(query, filters = {}, limit = 8) {
    const queryTokens = tokenize(query)
    const hasRestrictiveFilter = Boolean(filters.district || filters.crimeType || filters.stationId || filters.status || filters.dateFrom || filters.dateTo || filters.timeBand || filters.bnsSections?.length || filters.entityRefs?.length)
    const results = cases
      .filter((item) => !filters.district || item.district === filters.district)
      .filter((item) => !filters.crimeType || item.crime_type === filters.crimeType)
      .filter((item) => !filters.stationId || item.station_id === filters.stationId)
      .filter((item) => !filters.status || item.status === filters.status)
      .filter((item) => !filters.dateFrom || item.date >= filters.dateFrom)
      .filter((item) => !filters.dateTo || item.date <= filters.dateTo)
      .filter((item) => !filters.timeBand || timeBand(item.time) === filters.timeBand)
      .filter((item) => !filters.bnsSections?.length || filters.bnsSections.some((section) => String(item.bns_sections || '').toUpperCase().includes(section.replace('BNS ', ''))))
      .filter((item) => !filters.entityRefs?.length || filters.entityRefs.some((entity) => [item.phone_hash, item.vehicle, ...(item.accused_ids || [])].map(String).map((value) => value.toUpperCase()).includes(entity)))
      .map((item) => {
        const haystack = tokenize(`${item.fir_id} ${item.crime_type} ${item.district} ${item.mo} ${item.case_summary} ${(item.accused_ids || []).join(' ')}`)
        const overlap = [...queryTokens].filter((token) => haystack.has(token)).length
        const exactFir = normalizeQuery(query).includes(normalizeQuery(item.fir_id)) ? 8 : 0
        return { case: item, score: exactFir + overlap }
      })
      .filter((entry) => entry.score > 0 || hasRestrictiveFilter)
      .sort((left, right) => right.score - left.score || right.case.date.localeCompare(left.case.date))
      .slice(0, limit)
    return results
  }

  function similar(firId, limit = 5) {
    const source = caseById.get(firId)
    if (!source) return { source: null, matches: [] }
    const matches = cases
      .filter((item) => item.fir_id !== firId)
      .map((item) => ({ fir_id: item.fir_id, case: item, ...crimeDna(source, item) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
    return { source, matches }
  }

  function hotspots(filters = {}) {
    const filtered = cases.filter((item) => (!filters.district || item.district === filters.district) && (!filters.crimeType || item.crime_type === filters.crimeType))
    const counts = new Map()
    for (const item of filtered) {
      const key = `${item.district}|${item.station_id}`
      const current = counts.get(key) || { district: item.district, stationId: item.station_id, count: 0, lat: 0, lon: 0 }
      current.count += 1
      current.lat += item.lat
      current.lon += item.lon
      counts.set(key, current)
    }
    const clusters = [...counts.values()]
      .map((item) => ({ ...item, lat: Number((item.lat / item.count).toFixed(5)), lon: Number((item.lon / item.count).toFixed(5)), riskBand: item.count >= 20 ? 'high' : item.count >= 10 ? 'medium' : 'low' }))
      .sort((left, right) => right.count - left.count)
    return { filters, total: filtered.length, clusters, points: filtered.slice(0, 250) }
  }

  function graph(firId) {
    const source = caseById.get(firId)
    if (!source) return { nodes: [], edges: [], limitations: ['Case not found.'] }
    const result = similar(firId, 6)
    const included = result.matches.filter((item) => item.included)
    return {
      nodes: [
        { id: source.fir_id, type: 'case', label: source.fir_id, primary: true },
        ...included.map((item) => ({ id: item.fir_id, type: 'case', label: item.fir_id, score: item.score })),
      ],
      edges: included.map((item) => ({ id: `${source.fir_id}-${item.fir_id}`, source: source.fir_id, target: item.fir_id, score: item.score, reason: item.factors.filter((factor) => factor.contribution > 0).map((factor) => factor.label).join(', ') })),
      limitations: [DISCLAIMER],
    }
  }

  function scenario(input = {}) {
    const units = Math.max(0, Math.min(20, Number(input.units || 3)))
    const district = input.district || 'Bengaluru South'
    const crimeType = input.crimeType || 'Motorcycle Theft'
    const hotspotResult = hotspots({ district, crimeType })
    const baseline = Math.min(72, 28 + hotspotResult.clusters.length * 4)
    const coverageAfter = Math.min(92, baseline + units * 6)
    return {
      district,
      crimeType,
      units,
      coverageBefore: baseline,
      coverageAfter,
      recommendations: hotspotResult.clusters.slice(0, units || 1).map((cluster, index) => ({ priority: index + 1, stationId: cluster.stationId, timeBand: '18:00–23:00', rationale: `${cluster.count} synthetic incidents in the selected filter.` })),
      limitations: ['Area-level planning aid only; validate unit availability and live field conditions.', DISCLAIMER],
    }
  }

  function answer(query, context = {}) {
    const mode = context.mode || 'offline-demo'
    const requestId = context.requestId || stableId()
    const classified = classifyIntent(query)
    const filters = extractStructuredFilters(query)
    if (filters.relativePeriod && !filters.dateFrom) {
      const latestDate = cases.reduce((latest, item) => item.date > latest ? item.date : latest, '')
      const boundary = new Date(`${latestDate}T00:00:00Z`)
      const multiplier = filters.relativePeriod.unit.startsWith('week') ? 7 : filters.relativePeriod.unit.startsWith('month') ? 30 : 1
      boundary.setUTCDate(boundary.getUTCDate() - filters.relativePeriod.value * multiplier)
      filters.dateFrom = boundary.toISOString().slice(0, 10)
      filters.dateTo = latestDate
    }
    const auditRef = context.auditRef || `AUD-${requestId.replace(/^REQ-/, '')}`

    if (classified.intent === 'CONVERSATIONAL_QUERY') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: conversationalAnswer(query, classified.conversationType), confidence: 1, limitations: [], nextActions: [], includeDisclaimer: false })
    }

    if (classified.intent === 'KNOWLEDGE_QUERY') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: knowledgeAnswer(query), confidence: 0.95, limitations: ['Approved prototype guidance only; follow the applicable KSP policy and supervisor direction.'], nextActions: ['Record provenance and preserve the original evidence.', 'Request human review before operational use.'], includeDisclaimer: false })
    }

    if (classified.intent === 'GENERAL_QUERY') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: generalFallbackAnswer(query), confidence: 0, limitations: ['No database claim was made and no external model response was available.'], nextActions: [], includeDisclaimer: false })
    }

    if (classified.intent === 'SAFETY_REFUSAL') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `${classified.reason} I can provide a source-cited synthetic database summary or explain safe evidence-review steps instead.`, confidence: 0, limitations: [classified.reason], nextActions: ['Ask for an aggregate, evidence-grounded, human-reviewable analysis.'], includeDisclaimer: false })
    }

    if (classified.intent === 'OUT_OF_SCOPE') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: 'I can’t reliably answer that from the SAMVAAD-IQ crime database. I can help with synthetic FIR search, case summaries, Crime DNA comparisons, network links, hotspots, evidence review, and patrol scenarios. What would you like to investigate?', confidence: 0, limitations: [classified.reason], nextActions: ['Ask a question about the synthetic crime database.'], includeDisclaimer: false })
    }

    if (classified.intent === 'AMBIGUOUS_QUERY') {
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `${classified.reason} Ask me naturally—for example: “Show motorcycle-theft cases in Mysuru,” “Summarize SYN-2025-BLR-014,” or “Which cases are similar to SYN-2025-BLR-001?”`, confidence: 0, limitations: ['No database claim was made because the request did not identify a usable case, place, crime category, or analysis.'], nextActions: ['Add a FIR ID, district, crime category, time range, or requested analysis.'], includeDisclaimer: false })
    }

    if (classified.intent === 'DATABASE_SUMMARY_QUERY') {
      const filtered = cases.filter((item) => (!filters.district || item.district === filters.district) && (!filters.crimeType || item.crime_type === filters.crimeType))
      const districtCounts = [...new Set(filtered.map((item) => item.district))].map((district) => ({ district, count: filtered.filter((item) => item.district === district).length })).sort((left, right) => right.count - left.count)
      const crimeCounts = [...new Set(filtered.map((item) => item.crime_type))].map((crimeType) => ({ crimeType, count: filtered.filter((item) => item.crime_type === crimeType).length })).sort((left, right) => right.count - left.count)
      const selected = filtered.slice(0, 5)
      const scope = [filters.crimeType, filters.district].filter(Boolean).join(' in ') || 'the complete synthetic dataset'
      const answer = `Here’s the database summary for ${scope}:\n\n• ${filtered.length} synthetic FIR records match the selected scope.\n• Largest area grouping: ${districtCounts[0]?.district || 'none'} (${districtCounts[0]?.count || 0} records).\n• Most frequent recorded category: ${crimeCounts[0]?.crimeType || 'none'} (${crimeCounts[0]?.count || 0} records).\n\nThese are descriptive counts from the seeded dataset, not forecasts or individual risk scores.`
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer, confidence: filtered.length ? 0.96 : 0, citations: selected.map((item) => citation(item)), evidence: selected, visualizations: { resultCount: filtered.length, districtCounts, crimeCounts }, limitations: ['Citations are representative source records; the aggregate is computed over the current deterministic data version.'], nextActions: ['Narrow the result by district or crime category.', 'Open a cited FIR before making an investigative decision.'] })
    }

    if (classified.intent === 'HOTSPOT_QUERY') {
      const result = hotspots(filters)
      const selected = result.points.slice(0, 5)
      const strongest = result.clusters[0]
      const answer = result.total
        ? `I found ${result.total} synthetic ${filters.crimeType || 'crime'} records for ${filters.district || 'the selected Karnataka regions'}. The strongest area-level cluster is ${strongest?.stationId || 'not available'} with ${strongest?.count || 0} records.\n\nThis is a descriptive area-and-time pattern from the database—not a prediction about any person. Open the cited FIRs or the hotspot map to verify the pattern before planning action.`
        : `I couldn’t find a synthetic record matching those hotspot filters. Try another district, crime category, or time range and I’ll search again.`
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer, confidence: result.total ? 0.88 : 0.22, citations: selected.map((item) => citation(item)), evidence: selected, visualizations: { hotspots: result }, limitations: result.total ? [] : ['No records matched the selected filters.'], nextActions: ['Inspect the highest-volume station cluster.', 'Compare time bands and verify source FIR narratives.'] })
    }

    if (classified.intent === 'CASE_LINK_QUERY') {
      const selected = filters.firIds.map((id) => caseById.get(id)).filter(Boolean)
      const searchResults = selected.length >= 2 ? selected : search(query, filters, 2).map((entry) => entry.case)
      if (searchResults.length < 2) return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: 'At least two identifiable synthetic cases are required for a connection check.', confidence: 0.1, limitations: ['Insufficient evidence for a case-link conclusion.'], nextActions: ['Provide two FIR IDs or more specific filters.'] })
      const analysis = crimeDna(searchResults[0], searchResults[1])
      const supporting = analysis.sharedEntities.map((item) => item.value)
      const contradiction = searchResults[0].crime_type !== searchResults[1].crime_type ? 'The recorded crime categories differ.' : null
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: supporting.length ? `${searchResults[0].fir_id} and ${searchResults[1].fir_id} share ${supporting.join(', ')}. KAVACH scores the lead at ${Math.round(analysis.score * 100)}%; this requires source verification.` : `No shared hashed entity was found between ${searchResults[0].fir_id} and ${searchResults[1].fir_id}. Narrative similarity alone is insufficient to claim a connection.`, confidence: supporting.length ? analysis.score : Math.min(0.4, analysis.score), citations: searchResults.map((item) => citation(item)), evidence: searchResults, visualizations: { crimeDna: analysis, graph: graph(searchResults[0].fir_id) }, limitations: contradiction ? [contradiction] : [], nextActions: ['Verify the cited entity fields.', 'Record an analyst accept/reject decision before escalation.'] })
    }

    if (classified.intent === 'SIMILAR_CASE_QUERY') {
      const requested = filters.firIds[0] || search(query, filters, 1)[0]?.case?.fir_id
      const result = similar(requested, 5)
      if (!result.source) return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: 'No matching synthetic FIR was found.', confidence: 0, limitations: ['Case identifier not found.'], nextActions: ['Open Case Workspace and select an available synthetic FIR.'] })
      const included = result.matches.filter((item) => item.included)
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: included.length ? `${included[0].fir_id} is the strongest explainable match to ${result.source.fir_id} at ${Math.round(included[0].score * 100)}%. Each factor is shown for analyst review.` : `No case crossed the ${Math.round(result.matches[0]?.threshold * 100 || 48)}% KAVACH inclusion threshold.`, confidence: included[0]?.score || 0.3, citations: [citation(result.source), ...included.slice(0, 3).map((item) => citation(item.case, 'mo'))], evidence: [result.source, ...included.slice(0, 3).map((item) => item.case)], visualizations: { similar: result.matches }, nextActions: ['Compare the top match factor-by-factor.', 'Reject weak or contradictory leads and record feedback.'] })
    }

    if (classified.intent === 'SCENARIO_QUERY') {
      const units = Number(normalizeQuery(query).match(/\b(\d+)\b/)?.[1] || 3)
      const result = scenario({ ...filters, units })
      const evidence = hotspots(filters).points.slice(0, 4)
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `Adding ${result.units} units changes modeled area coverage from ${result.coverageBefore}% to ${result.coverageAfter}%. This is a transparent planning scenario, not a forecast of individual offending.`, confidence: 0.7, citations: evidence.map((item) => citation(item)), evidence, visualizations: { scenario: result }, limitations: result.limitations, nextActions: ['Confirm unit availability with a supervisor.', 'Compare the scenario with live field conditions.'] })
    }

    const results = search(query, filters, 5)
    if (!results.length) {
      const allRecent = cases.slice(0, 5)
      return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer: `I couldn't find a specific record matching "${query.slice(0, 60)}", but here are the most recent synthetic FIR records in the database. You can refine your search by adding a district name (e.g., Mysuru, Bengaluru), crime type (e.g., theft, fraud), or a specific FIR ID.`, confidence: 0.4, citations: allRecent.map((item) => citation(item)), evidence: allRecent, visualizations: { resultCount: allRecent.length }, limitations: ['Broad search returned the latest records. Narrow your query for more specific results.'], nextActions: ['Try adding a district, crime category, or FIR ID to refine results.', 'Browse the Case Explorer for the full database.'] })
    }
    const selected = results.map((entry) => entry.case)
    const leading = selected[0]
    const answer = `I found ${selected.length} relevant synthetic record${selected.length === 1 ? '' : 's'}. The strongest match is ${leading.fir_id}, recorded as ${leading.crime_type} in ${leading.district}.\n\n${leading.case_summary}\n\nI’ve attached the matching source excerpts below. Treat this as an investigative starting point and verify the original record before taking action.`
    return responseEnvelope({ mode, requestId, auditRef, intent: classified.intent, filters, answer, confidence: Math.min(0.92, 0.62 + results[0].score * 0.04), citations: selected.map((item) => citation(item)), evidence: selected, visualizations: { resultCount: selected.length }, nextActions: ['Open the leading case dossier.', 'Run KAVACH similarity and verify cited fields.'] })
  }

  function analyzeEvidence(input = {}) {
    const text = String(input.text || '').slice(0, 200000)
    const firIds = extractFirIds(text)
    const directCases = firIds.map((id) => caseById.get(id)).filter(Boolean)
    const matched = directCases.length ? directCases : search(text, {}, 5).map((entry) => entry.case)
    const facts = {
      firIds,
      phoneHashes: unique(text.match(/PH-(?:HASH|SYN)[-A-Z0-9]+/gi) || []),
      vehicleIds: unique(text.match(/KA-[A-Z0-9-]{5,}/gi) || []),
      bnsReferences: unique(text.match(/BNS\s*\d+(?:\(\d+\))?/gi) || []),
    }
    return {
      analysisId: stableId('EVD'),
      mode: input.mode || 'offline-demo',
      file: input.file || {},
      facts,
      matchedCases: matched,
      citations: matched.map((item) => citation(item)),
      confidence: matched.length ? Math.min(0.9, 0.55 + matched.length * 0.06) : 0.15,
      limitations: unique([...(input.limitations || []), matched.length ? null : 'No case could be grounded in the supplied text.', DISCLAIMER]),
      nextActions: ['Verify extracted fields against the original file.', 'Request supervisor approval before attaching the analysis to a case.'],
    }
  }

  return {
    dataset,
    cases,
    caseById,
    search,
    similar,
    graph,
    hotspots,
    scenario,
    answer,
    analyzeEvidence,
  }
}

export { DISCLAIMER }
