import { cases, stations } from './intelligenceRepository.js'

const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast'
const API_HEALTH_URL = 'http://127.0.0.1:3001/api/health'
const WEATHER_TIMEOUT_MS = 2500
const API_TIMEOUT_MS = 1200

const districtCenters = Object.values(
  stations.reduce((acc, station) => {
    acc[station.district] ||= {
      district: station.district,
      lat: 0,
      lon: 0,
      count: 0,
    }
    acc[station.district].lat += station.lat
    acc[station.district].lon += station.lon
    acc[station.district].count += 1
    return acc
  }, {}),
).map((item) => ({
  district: item.district,
  lat: Number((item.lat / item.count).toFixed(4)),
  lon: Number((item.lon / item.count).toFixed(4)),
}))

function syntheticFallback(center, index) {
  const activeCases = cases.filter((caseRecord) => caseRecord.district === center.district).length
  return {
    district: center.district,
    temperature: 27 + index,
    humidity: 62 + index * 3,
    rain: index === 1 ? 0.4 : 0,
    wind: 9 + index * 2,
    weatherCode: 1,
    condition: index === 1 ? 'Cloudy patrol window' : 'Clear patrol window',
    risk: activeCases > 2 ? 'Elevated' : 'Watch',
    source: 'Synthetic fallback',
  }
}

export function getFallbackFieldMetrics() {
  return {
    fetchedAt: new Date().toISOString(),
    latencyMs: 0,
    apiHealth: {
      status: 'fallback',
      latencyMs: null,
      name: 'Client seed engine',
    },
    weather: districtCenters.map((center, index) => syntheticFallback(center, index)),
    syntheticData: {
      firs: cases.length,
      districts: districtCenters.length,
      active: cases.filter((caseRecord) => ['Open', 'Under Investigation'].includes(caseRecord.status)).length,
    },
  }
}

function describeWeather(code, rain = 0) {
  if (rain > 0) return 'Rain watch'
  if ([45, 48].includes(code)) return 'Low visibility'
  if (code >= 80) return 'Showers likely'
  if (code >= 61) return 'Rain likely'
  if (code >= 51) return 'Drizzle watch'
  if (code >= 1 && code <= 3) return 'Partly cloudy'
  return 'Clear'
}

function fieldRisk({ rain, wind, humidity }) {
  if (rain > 1 || wind > 28) return 'High'
  if (rain > 0 || wind > 18 || humidity > 80) return 'Elevated'
  return 'Normal'
}

async function fetchWeather(center, index) {
  const params = new URLSearchParams({
    latitude: String(center.lat),
    longitude: String(center.lon),
    current: 'temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m',
    timezone: 'Asia/Kolkata',
  })

  try {
    const response = await fetch(`${WEATHER_BASE}?${params}`, { signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) })
    if (!response.ok) throw new Error(`Weather API ${response.status}`)
    const data = await response.json()
    const current = data.current || {}
    const rain = Number(current.rain || 0)
    const wind = Number(current.wind_speed_10m || 0)
    const humidity = Number(current.relative_humidity_2m || 0)
    const weatherCode = Number(current.weather_code || 0)

    return {
      district: center.district,
      temperature: Number(current.temperature_2m || 0),
      humidity,
      rain,
      wind,
      weatherCode,
      condition: describeWeather(weatherCode, rain),
      risk: fieldRisk({ rain, wind, humidity }),
      source: 'Open-Meteo live',
    }
  } catch {
    return syntheticFallback(center, index)
  }
}

export async function fetchLiveFieldMetrics() {
  const startedAt = Date.now()
  const weather = await Promise.all(districtCenters.map((center, index) => fetchWeather(center, index)))

  let apiHealth

  try {
    const apiStarted = Date.now()
    const response = await fetch(API_HEALTH_URL, { signal: AbortSignal.timeout(API_TIMEOUT_MS) })
    const data = await response.json()
    apiHealth = {
      status: data.status || 'ok',
      latencyMs: Date.now() - apiStarted,
      name: data.name || 'SAMVAAD-IQ API',
    }
  } catch {
    apiHealth = {
      status: 'client-only',
      latencyMs: null,
      name: 'Local API fallback',
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    apiHealth,
    weather,
    syntheticData: {
      firs: cases.length,
      districts: districtCenters.length,
      active: cases.filter((caseRecord) => ['Open', 'Under Investigation'].includes(caseRecord.status)).length,
    },
  }
}
