const { cases, getStation } = require('./seedData')

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

function getHotspots({ district, crimeType } = {}) {
  const rawPoints = cases
    .filter((caseRecord) => !district || caseRecord.district === district)
    .filter((caseRecord) => !crimeType || caseRecord.crime_type === crimeType)
    .map((caseRecord) => ({ ...caseRecord, station: getStation(caseRecord) }))
  const { points, clusters } = clusterHotspots(rawPoints)

  const stationCounts = Object.values(
    points.reduce((acc, caseRecord) => {
      const station = getStation(caseRecord)
      acc[caseRecord.station_id] ||= {
        station_id: caseRecord.station_id,
        station_name: station?.station_name || caseRecord.station_id,
        count: 0,
        cases: [],
      }
      acc[caseRecord.station_id].count += 1
      acc[caseRecord.station_id].cases.push(caseRecord.fir_id)
      return acc
    }, {}),
  )

  return { points, stationCounts, clusters }
}

module.exports = { clusterHotspots, getHotspots }
