const { accusedById, cases, getStation, relations } = require('./seedData')

function intersects(a, b) {
  return a.some((item) => b.includes(item))
}

function buildGraph(firId = 'SYN-2025-BLR-001') {
  const rootCase = cases.find((caseRecord) => caseRecord.fir_id === firId) || cases[0]
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
    nodeMap.set(id, { id, label, type })
  }

  function addEdge(source, target, label) {
    if (!source || !target || source === 'NA' || target === 'NA') return
    edges.push({ source, target, label })
  }

  related.forEach((caseRecord) => {
    const station = getStation(caseRecord)
    addNode(caseRecord.fir_id, caseRecord.fir_id, 'FIR')
    addNode(caseRecord.station_id, station?.station_name || caseRecord.station_id, 'Location')
    addNode(caseRecord.phone_hash, caseRecord.phone_hash, 'Phone')
    addNode(caseRecord.vehicle, caseRecord.vehicle, 'Vehicle')
    addNode(caseRecord.victim_id, caseRecord.victim_id, 'Victim')
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

  return { focus: rootCase.fir_id, nodes: [...nodeMap.values()], edges }
}

module.exports = { buildGraph }
