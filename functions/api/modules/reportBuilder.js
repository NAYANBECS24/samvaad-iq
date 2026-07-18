const { cases } = require('./seedData')

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildHtml({ reportId, title, generatedAt, query, answer, selected, disclaimer }) {
  const rows = selected
    .map(
      (caseRecord) => `<tr>
        <td>${escapeHtml(caseRecord.fir_id)}</td>
        <td>${escapeHtml(caseRecord.crime_type)}</td>
        <td>${escapeHtml(caseRecord.district)}</td>
        <td>${escapeHtml(caseRecord.status)}</td>
        <td>${escapeHtml(caseRecord.bns_sections)}</td>
      </tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #17202a; margin: 32px; }
      h1 { margin-bottom: 4px; }
      .meta { color: #5d6d7e; margin-bottom: 24px; }
      table { border-collapse: collapse; width: 100%; margin-top: 12px; }
      th, td { border: 1px solid #d5d8dc; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #eef2f7; }
      .note { border-left: 4px solid #b03a2e; padding-left: 12px; color: #641e16; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">${escapeHtml(reportId)} | ${escapeHtml(generatedAt)}</p>
    <h2>Query</h2>
    <p>${escapeHtml(query || 'Generated cluster report')}</p>
    <h2>Answer</h2>
    <p>${escapeHtml(answer || 'Evidence-grounded synthetic investigation brief generated.')}</p>
    <h2>Evidence Trail</h2>
    <table>
      <thead>
        <tr><th>FIR</th><th>Crime</th><th>District</th><th>Status</th><th>BNS / Legal Mapping</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <h2>Human Review Note</h2>
    <p class="note">${escapeHtml(disclaimer || 'Investigative lead only. Requires human verification and legal review.')}</p>
  </body>
</html>`
}

function buildReport(payload = {}) {
  const {
    answer = '',
    crimeType = 'Motorcycle Theft',
    district = 'Bengaluru South',
    intent = 'LEGAL_REPORT',
    query = '',
    sources = [],
    disclaimer = 'Investigative lead only. Requires human verification and legal review.',
  } = payload

  const selectedFromSources = sources.length
    ? cases.filter((caseRecord) => sources.includes(caseRecord.fir_id))
    : []
  const selected = selectedFromSources.length
    ? selectedFromSources
    : cases.filter((caseRecord) => caseRecord.crime_type === crimeType && caseRecord.district === district)
  const reportId = `RPT-${Date.now().toString().slice(-6)}`
  const title = payload.title || `${crimeType} Cluster Intelligence Brief`
  const generatedAt = new Date().toISOString()

  return {
    reportId,
    title,
    generatedAt,
    intent,
    source_firs: selected.map((caseRecord) => caseRecord.fir_id),
    cases: selected,
    html: buildHtml({ reportId, title, generatedAt, query, answer, selected, disclaimer }),
    smartBrowz: {
      renderJobId: null,
      available: false,
      verified: false,
      status: 'capability-unavailable',
      service: 'Catalyst SmartBrowz',
    },
    stratusObject: {
      bucket: null,
      key: null,
      available: false,
      verified: false,
      service: 'Catalyst Stratus',
    },
    mailEvent: {
      template: null,
      available: false,
      verified: false,
      status: 'capability-unavailable',
      service: 'Catalyst Mail',
    },
    status: 'local-html-ready',
  }
}

module.exports = { buildReport }
