const seed = require('../../../data/seed-data.json')

const users = seed.users
const policeStations = seed.police_stations
const cases = seed.cases
const accused = seed.accused
const relations = seed.relations

const stationById = Object.fromEntries(policeStations.map((station) => [station.station_id, station]))
const accusedById = Object.fromEntries(accused.map((person) => [person.accused_id, person]))

function getStation(caseRecord) {
  return stationById[caseRecord.station_id] || null
}

module.exports = {
  seed,
  users,
  policeStations,
  cases,
  accused,
  relations,
  stationById,
  accusedById,
  getStation,
}
