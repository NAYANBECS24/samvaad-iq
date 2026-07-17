import { AlertTriangle, CheckCircle2, FileDown, FileText, GitBranch, MapPinned, Printer, ShieldCheck, Stamp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { buildGraph, getStation, getStoredUser, legalExplainabilityForCase } from '../services/prototypeEngine.js'
import { useRuntime } from '../services/runtime.jsx'

function lastResult() {
  try { return JSON.parse(window.localStorage.getItem('samvaad_last_chat') || 'null') } catch { return null }
}

function savePdf(base64, fileName) {
  const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function normalizePoint(caseRecord, reportCases) {
  const lats = reportCases.map((item) => item.lat).filter(Number.isFinite)
  const lons = reportCases.map((item) => item.lon).filter(Number.isFinite)
  if (!lats.length || !lons.length) return { left: 50, top: 50 }
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
  if (!reportCases.length) return <p className="disclaimer">No mappable source records are attached to this brief.</p>
  return (
    <div className="report-map-preview">
      <div className="report-map-grid" />
      {reportCases.map((caseRecord) => {
        const point = normalizePoint(caseRecord, reportCases)
        return <span key={caseRecord.fir_id} className="report-map-pin" style={{ '--pin-left': `${point.left}%`, '--pin-top': `${point.top}%` }} title={caseRecord.fir_id}>{caseRecord.fir_id.slice(-3)}</span>
      })}
    </div>
  )
}

function ReportNetworkPreview({ graph }) {
  return (
    <div className="report-network-preview">
      <div className="report-network-stats"><span>{graph.nodes.length} nodes</span><span>{graph.edges.length} links</span></div>
      {graph.edges.slice(0, 7).map((edge) => (
        <div key={edge.id} className="network-edge-row"><strong>{edge.source}</strong><span>{edge.label || edge.reason || 'explainable link'}</span><strong>{edge.target}</strong></div>
      ))}
      {!graph.edges.length ? <p className="disclaimer">No cross-case edge was included in this result.</p> : null}
    </div>
  )
}

function Report() {
  const user = useMemo(() => getStoredUser(), [])
  const result = useMemo(() => lastResult(), [])
  const { runtime } = useRuntime()
  const [approved, setApproved] = useState(false)
  const [status, setStatus] = useState('A supervisor must approve the evidence brief before export.')
  const [isWorking, setIsWorking] = useState(false)
  const canApprove = ['Supervisor', 'Admin'].includes(user?.role)
  const reportCases = useMemo(() => (result?.evidence || []).filter((item) => item?.fir_id).slice(0, 8), [result])
  const graph = useMemo(() => reportCases.length ? buildGraph(reportCases[0].fir_id) : { nodes: [], edges: [] }, [reportCases])
  const legalRows = useMemo(() => reportCases.map((caseRecord) => legalExplainabilityForCase(caseRecord)), [reportCases])

  async function exportReport() {
    if (!result || !approved || !canApprove) return
    setIsWorking(true)
    try {
      if (runtime.mode === 'catalyst-live') {
        const report = await api.report({
          answer: result.answer,
          citations: result.citations.map(({ firId, excerpt }) => ({ firId, excerpt })),
          approved: true,
          requestId: result.requestId,
          auditRef: result.auditRef,
        })
        if (report.pdf?.base64) {
          savePdf(report.pdf.base64, `${report.reportId}.pdf`)
          setStatus(`SmartBrowz report generated. Audit reference: ${report.auditRef}`)
        } else {
          const view = window.open('', '_blank', 'noopener,noreferrer')
          if (view) { view.document.write(report.html); view.document.close(); view.print() }
          setStatus(`Browser-print fallback opened. ${report.limitations.join(' ')}`)
        }
      } else {
        const { default: html2pdf } = await import('html2pdf.js')
        const element = document.getElementById('report-preview')
        await html2pdf().set({
          margin: 0.35,
          filename: `SAMVAAD-IQ-${result.requestId || 'LOCAL'}-Evidence-Brief.pdf`,
          html2canvas: { scale: 1.7, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        }).from(element).save()
        setStatus('Local PDF downloaded. It is not a Catalyst-persisted report and no server audit event was created.')
      }
    } catch (error) {
      setStatus(`Report was not generated: ${error.message}`)
    } finally {
      setIsWorking(false)
    }
  }

  function printReport() {
    if (!approved || !canApprove || !result) return
    window.print()
    setStatus('Offline browser-print fallback opened. No server report or audit event was created.')
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">Supervisor evidence brief</p><h1>Auditable Investigation Report</h1><p>Rich case, map, graph, legal, citation, confidence, approval, and audit context in one export.</p></div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>

      {!result ? (
        <article className="panel empty-state"><FileText size={28} /><strong>No investigation result selected</strong><p>Run a question in Ask SAMVAAD before preparing a report.</p></article>
      ) : (
        <section id="report-preview" className="report-preview rich-report-preview">
          <div className="ksp-report-masthead">
            <div className="ksp-seal"><ShieldCheck size={30} /></div>
            <div><p>Karnataka State Police</p><h2>SAMVAAD-IQ Investigation Brief</h2><span>NETRA workspace · KAVACH explainability · Synthetic evidence only</span></div>
            <div className="report-classification"><Stamp size={18} />REVIEW</div>
          </div>

          <div className="report-header">
            <FileText size={26} />
            <div><p className="eyebrow">{result.intent.replaceAll('_', ' ')}</p><h2>Evidence-Grounded Intelligence Brief</h2><p>{result.requestId} · {result.auditRef || 'No server audit'} · {new Date().toLocaleString()}</p></div>
          </div>

          <section className="report-meta-grid">
            {[
              ['Synthetic Case IDs', reportCases.map((item) => item.fir_id).join(', ') || 'None'],
              ['Source Count', `${result.citations.length} cited excerpts`],
              ['Confidence', `${Math.round(result.confidence.score * 100)}% ${result.confidence.band}`],
              ['Runtime', result.mode],
            ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </section>

          <section><h3>Question</h3><p>{result.query}</p></section>
          <section><h3>Grounded Answer</h3><p>{result.answer}</p></section>

          <section>
            <h3>Evidence Trail</h3>
            <div className="table-wrap"><table><thead><tr><th>FIR</th><th>Crime</th><th>Station</th><th>BNS / Legal Mapping</th></tr></thead><tbody>
              {reportCases.map((caseRecord) => <tr key={caseRecord.fir_id}><td>{caseRecord.fir_id}</td><td>{caseRecord.crime_type}</td><td>{getStation(caseRecord)?.station_name || caseRecord.station_id}</td><td>{caseRecord.bns_sections}</td></tr>)}
            </tbody></table></div>
          </section>

          <section>
            <h3>Map & Network Snapshot</h3>
            <div className="brief-visual-grid">
              <div><div className="report-visual-heading"><MapPinned size={18} /><strong>Hotspot Context</strong></div><ReportMapPreview reportCases={reportCases} /></div>
              <div><div className="report-visual-heading"><GitBranch size={18} /><strong>Shared Entity Graph</strong></div><ReportNetworkPreview graph={graph} /></div>
            </div>
          </section>

          <section><h3>Cited Excerpts</h3><ol>{result.citations.map((item) => <li key={item.id}><strong>{item.firId}</strong> · {item.field}: {item.excerpt}</li>)}</ol></section>

          {legalRows.length ? <section><h3>BNS / Privacy Review</h3><div className="legal-note-grid">{legalRows.map((row, index) => <div key={`${row.crimeType}-${row.bns}-${index}`}><strong>{row.crimeType}</strong><span>BNS {row.bns}</span><p>{row.privacyTag}</p></div>)}</div></section> : null}

          <section><h3>Recommended Follow-Up</h3><ul>{result.nextActions.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h3>Limitations And Human Review</h3><ul>{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul><p className="disclaimer">Investigative lead only. Human verification and supervisory approval are required.</p></section>
        </section>
      )}

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Approval gate</p><h2>Human authorization</h2></div>{approved ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}</div>
        <label className="approval-check"><input type="checkbox" checked={approved} disabled={!canApprove || !result} onChange={(event) => setApproved(event.target.checked)} /><span>I reviewed the cited synthetic evidence and approve this brief for demonstration export.</span></label>
        {!canApprove ? <p className="form-error">The {user?.role} role cannot approve reports. Sign in as Supervisor or Admin.</p> : null}
        <div className="action-row report-export-actions">
          <button type="button" className="primary-button" disabled={!approved || !canApprove || !result || isWorking} onClick={exportReport}><FileDown size={18} />{isWorking ? 'Generating…' : runtime.mode === 'catalyst-live' ? 'Generate verified report' : 'Download local PDF'}</button>
          {runtime.mode !== 'catalyst-live' ? <button type="button" className="secondary-button" disabled={!approved || !canApprove || !result || isWorking} onClick={printReport}><Printer size={18} />Print / Save as PDF</button> : null}
        </div>
        <p className="query-status" role="status">{status}</p>
      </section>
    </div>
  )
}

export default Report
