const { cases, stationById } = require('./seedData')

function timeBand(time) {
  const hour = Number(time.split(':')[0])
  if (hour >= 0 && hour < 5) return 'late-night'
  if (hour >= 17 && hour < 21) return 'evening'
  if (hour >= 21) return 'night'
  return 'day'
}

function patrolWhatIf({ district = 'Bengaluru South', crimeType = 'Motorcycle Theft', units = 3 } = {}) {
  const selected = cases.filter((caseRecord) => caseRecord.district === district && caseRecord.crime_type === crimeType)
  const grouped = selected.reduce((acc, caseRecord) => {
    acc[caseRecord.station_id] ||= []
    acc[caseRecord.station_id].push(caseRecord)
    return acc
  }, {})

  const zones = Object.entries(grouped).map(([stationId, records], index) => ({
    rank: index + 1,
    station: stationById[stationId]?.station_name || stationId,
    recommended_units: records.length > 1 && units > 2 ? 2 : 1,
    reason: `${records.length} linked synthetic incidents in selected pattern`,
    records,
  }))
  const recommendations = zones.map(({ records, ...zone }) => zone)
  const timeWindowCounts = Object.values(
    selected.reduce((acc, caseRecord) => {
      const band = timeBand(caseRecord.time)
      acc[band] ||= { name: band, count: 0 }
      acc[band].count += 1
      return acc
    }, {}),
  ).sort((a, b) => b.count - a.count)
  const displacementZones = zones.slice(1).map((zone, index) => ({
    rank: index + 1,
    station: zone.station,
    riskDelta: Math.max(5, 18 - units * 2 - index * 3),
    reason: 'Pattern may shift if only the top hotspot receives visible patrol pressure',
  }))

  return {
    district,
    crimeType,
    units,
    coverageBefore: selected.length ? 56 : 35,
    coverageAfter: Math.min(92, (selected.length ? 56 : 35) + units * 8 + 2),
    recommendations,
    displacementRisk: units >= recommendations.length + 2 ? 'Low' : selected.length >= 3 ? 'Elevated' : 'Moderate',
    displacementZones: displacementZones.length
      ? displacementZones
      : [
          {
            rank: 1,
            station: `${district} perimeter corridor`,
            riskDelta: Math.max(4, 14 - units * 2),
            reason: 'Monitor nearby transit or market corridors for displacement signals',
          },
        ],
    recommendedTimeWindows: timeWindowCounts.length ? timeWindowCounts.slice(0, 2) : [{ name: 'evening', count: 1 }],
  }
}

module.exports = { patrolWhatIf }
