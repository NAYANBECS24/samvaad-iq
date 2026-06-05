const { cases, getStation } = require('./seedData')

function buildDiffusionModel({ district = 'All', crimeType = 'All' } = {}) {
  const selected = cases
    .filter((caseRecord) => district === 'All' || caseRecord.district === district)
    .filter((caseRecord) => crimeType === 'All' || caseRecord.crime_type === crimeType)
  const scope = selected.length ? selected : cases
  const activeStatuses = new Set(['Open', 'Under Investigation'])
  const active = scope.filter((caseRecord) => activeStatuses.has(caseRecord.status)).length
  const inactive = Math.max(1, scope.length - active)
  const rc = Number(Math.min(2.4, active / inactive + scope.length * 0.035).toFixed(2))
  const zones = Object.values(
    scope.reduce((acc, caseRecord) => {
      const station = getStation(caseRecord)
      const key = caseRecord.station_id
      acc[key] ||= {
        station_id: key,
        station_name: station?.station_name || key,
        district: caseRecord.district,
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
        risk: zoneRc >= 1.2 ? 'Expansion' : zoneRc >= 0.85 ? 'Watch' : 'Contained',
      }
    })
    .sort((a, b) => b.rc - a.rc)

  return {
    district,
    crimeType,
    rc,
    risk: rc >= 1.2 ? 'Expansion risk' : rc >= 0.85 ? 'Watch closely' : 'Contained',
    active,
    inactive,
    zones,
    advisory: 'Rc is an area-level synthetic indicator, not a prediction about any person.',
  }
}

module.exports = { buildDiffusionModel }
