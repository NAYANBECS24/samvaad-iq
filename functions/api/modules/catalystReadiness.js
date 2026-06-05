const blueprint = require('../../../data/catalyst-service-map.json')

function groupByStatus(items) {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})
}

function getCatalystReadiness() {
  return {
    ...blueprint,
    counts: {
      services: blueprint.serviceMap.length,
      statuses: groupByStatus(blueprint.serviceMap),
      githubSteps: blueprint.githubFlow.length,
      readinessGates: blueprint.readinessGates.length,
    },
  }
}

module.exports = { getCatalystReadiness }
