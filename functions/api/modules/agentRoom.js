function buildAgentRoom(summary = {}) {
  return [
    { agent: 'Detective Agent', note: summary.detective || 'Framed the investigative question' },
    { agent: 'Data Agent', note: summary.retriever || 'Fetched synthetic FIR records' },
    { agent: 'Network Agent', note: summary.network || 'Checked shared entities and graph links' },
    { agent: 'Skeptic Agent', note: summary.skeptic || 'Marked output as investigative support only' },
    { agent: 'Report Agent', note: summary.reporter || 'Prepared evidence-grounded answer' },
  ]
}

module.exports = { buildAgentRoom }
