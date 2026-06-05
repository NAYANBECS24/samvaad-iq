import html2pdf from 'html2pdf.js'
import { Download, FileText, GitBranch, MapPinned, ShieldCheck, Stamp } from 'lucide-react'
import { useMemo } from 'react'
import DetectiveRoom from '../components/DetectiveRoom.jsx'
import {
  answerQuery,
  buildGraph,
  cases,
  getStation,
  legalExplainabilityForCase,
} from '../services/prototypeEngine.js'

function getLastChatResponse() {
  try {
    const stored = localStorage.getItem('samvaad_last_chat')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function buildReportFromResponse(response) {
  if (response.visuals?.report) return response.visuals.report

  const sourceIds = new Set(response.sources || [])
  const selected = cases.filter((caseRecord) => sourceIds.has(caseRecord.fir_id))

  return {
    reportId: `RPT-${Date.now().toString().slice(-6)}`,
    title: `${response.intent.replace(/_/g, ' ')} Investigation Brief`,
    generatedAt: response.timestamp || new Date().toISOString(),
    cases: selected,
  }
}

function normalizePoint(caseRecord, reportCases) {
  const lats = reportCases.map((item) => item.lat)
  const lons = reportCases.map((item) => item.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const latSpan = Math.max(0.001, maxLat - minLat)
  const lonSpan = Math.max(0.001, maxLon - minLon)

  return {
    left: 12 + ((caseRecord.lon - minLon) / lonSpan) * 76,
    top: 84 - ((caseRecord.lat - minLat) / latSpan) * 68,
  }
}

function ReportMapPreview({ reportCases }) {
  if (!reportCases.length) {
    return <p className="disclaimer">No mappable source FIR records in this brief.</p>
  }

  return (
    <div className="report-map-preview">
      <div className="report-map-grid" />
      {reportCases.map((caseRecord) => {
        const point = normalizePoint(caseRecord, reportCases)
        return (
          <span
            key={caseRecord.fir_id}
            className="report-map-pin"
            style={{ '--pin-left': `${point.left}%`, '--pin-top': `${point.top}%` }}
            title={caseRecord.fir_id}
          >
            {caseRecord.fir_id.slice(-3)}
          </span>
        )
      })}
    </div>
  )
}

function ReportNetworkPreview({ graph }) {
  return (
    <div className="report-network-preview">
      <div className="report-network-stats">
        <span>{graph.nodes.length} nodes</span>
        <span>{graph.edges.length} links</span>
      </div>
      {graph.edges.slice(0, 7).map((edge) => (
        <div key={edge.id} className="network-edge-row">
          <strong>{edge.source}</strong>
          <span>{edge.label}</span>
          <strong>{edge.target}</strong>
        </div>
      ))}
    </div>
  )
}

function Report() {
  const response = useMemo(
    () => getLastChatResponse() || answerQuery('Generate PDF report for the motorcycle theft cluster', 'Supervisor'),
    [],
  )
  const report = useMemo(() => buildReportFromResponse(response), [response])
  const graph = useMemo(
    () => buildGraph(report.cases[0]?.fir_id || response.sources?.[0] || 'FIR-2025-BLR-001'),
    [report.cases, response.sources],
  )
  const legalRows = useMemo(() => report.cases.map((caseRecord) => legalExplainabilityForCase(caseRecord)), [report.cases])

  function exportPdf() {
    const element = document.getElementById('report-preview')
    if (!element) return
    html2pdf()
      .set({
        margin: 0.45,
        filename: 'SAMVAAD-IQ-Investigation-Brief.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save()
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Investigation Brief Export</h1>
        </div>
        <button className="primary-button" type="button" onClick={exportPdf}>
          <Download size={18} />
          Export PDF
        </button>
      </header>

      <section id="report-preview" className="report-preview">
        <div className="ksp-report-masthead">
          <div className="ksp-seal">
            <ShieldCheck size={30} />
          </div>
          <div>
            <p>Karnataka State Police</p>
            <h2>SAMVAAD-IQ Investigation Brief</h2>
            <span>Prototype intelligence dossier | Synthetic FIR evidence only</span>
          </div>
          <div className="report-classification">
            <Stamp size={18} />
            REVIEW
          </div>
        </div>

        <div className="report-header">
          <FileText size={26} />
          <div>
            <p className="eyebrow">SAMVAAD-IQ Investigation Brief</p>
            <h2>{report.title}</h2>
            <p>
              {report.reportId} | {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <section className="report-meta-grid">
          {[
            ['Synthetic Case IDs', report.cases.map((caseRecord) => caseRecord.fir_id).join(', ') || 'None'],
            ['Source Count', `${report.cases.length} FIR records`],
            ['Confidence', `${Math.round((response.confidence || 0) * 100)}%`],
            ['Conversation', response.conversationId || 'CONV-DEMO'],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section>
          <h3>Query</h3>
          <p>{response.query}</p>
        </section>

        <section>
          <h3>Answer</h3>
          <p>{response.answer}</p>
        </section>

        <section>
          <h3>Evidence Trail</h3>
          <table>
            <thead>
              <tr>
                <th>FIR</th>
                <th>Crime</th>
                <th>Station</th>
                <th>BNS / Legal Mapping</th>
              </tr>
            </thead>
            <tbody>
              {report.cases.map((caseRecord) => (
                <tr key={caseRecord.fir_id}>
                  <td>{caseRecord.fir_id}</td>
                  <td>{caseRecord.crime_type}</td>
                  <td>{getStation(caseRecord)?.station_name || caseRecord.station_id}</td>
                  <td>{caseRecord.bns_sections}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Map & Network Snapshot</h3>
          <div className="brief-visual-grid">
            <div>
              <div className="report-visual-heading">
                <MapPinned size={18} />
                <strong>Hotspot Context</strong>
              </div>
              <ReportMapPreview reportCases={report.cases} />
            </div>
            <div>
              <div className="report-visual-heading">
                <GitBranch size={18} />
                <strong>Shared Entity Graph</strong>
              </div>
              <ReportNetworkPreview graph={graph} />
            </div>
          </div>
        </section>

        <section>
          <h3>BNS / Privacy Review</h3>
          <div className="legal-note-grid">
            {legalRows.map((row, index) => (
              <div key={`${row.crimeType}-${row.bns}-${index}`}>
                <strong>{row.crimeType}</strong>
                <span>BNS {row.bns}</span>
                <p>{row.privacyTag}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>Human Review Note</h3>
          <p>{response.disclaimer || 'Investigative lead only. Requires human verification and legal review.'}</p>
        </section>

        <section>
          <h3>Recommended Follow-Up</h3>
          <ul>
            {(response.nextSteps || []).map((item, index) => (
              <li key={item.id || item || index}>{typeof item === 'string' ? item : item.text}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Guardrails</h3>
          <ul>
            {(response.riskFlags || []).map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </section>
      </section>

      <DetectiveRoom agents={response.agents || []} />
    </div>
  )
}

export default Report
