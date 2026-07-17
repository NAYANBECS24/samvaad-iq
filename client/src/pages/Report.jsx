import { AlertTriangle, CheckCircle2, FileDown, FileText, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { getStoredUser } from '../services/prototypeEngine.js'
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

function Report() {
  const user = useMemo(() => getStoredUser(), [])
  const result = useMemo(() => lastResult(), [])
  const { runtime } = useRuntime()
  const [approved, setApproved] = useState(false)
  const [status, setStatus] = useState('A supervisor must approve the evidence brief before export.')
  const [isWorking, setIsWorking] = useState(false)
  const canApprove = ['Supervisor', 'Admin'].includes(user?.role)

  async function exportReport() {
    if (!result || !approved || !canApprove) return
    setIsWorking(true)
    try {
      if (runtime.mode === 'catalyst-live') {
        const report = await api.report({ answer: result.answer, citations: result.citations.map(({ firId, excerpt }) => ({ firId, excerpt })), approved: true })
        if (report.pdf?.base64) {
          savePdf(report.pdf.base64, `${report.reportId}.pdf`)
          setStatus(`SmartBrowz report generated. Audit reference: ${report.auditRef}`)
        } else {
          const view = window.open('', '_blank', 'noopener,noreferrer')
          if (view) { view.document.write(report.html); view.document.close(); view.print() }
          setStatus(`Browser-print fallback opened. ${report.limitations.join(' ')}`)
        }
      } else {
        window.print()
        setStatus('Offline browser-print fallback opened. No server report or audit event was created.')
      }
    } catch (error) {
      setStatus(`Report was not generated: ${error.message}`)
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header"><div><p className="eyebrow">Supervisor evidence brief</p><h1>Auditable Investigation Report</h1><p>Sources, confidence, runtime mode, analyst identity, limitations, and approval remain visible.</p></div><span className="data-label">SYNTHETIC DEMO DATA</span></header>
      {!result ? <article className="panel empty-state"><FileText size={28} /><strong>No investigation result selected</strong><p>Run a question in Ask SAMVAAD before preparing a report.</p></article> : (
        <article className="panel report-preview">
          <div className="section-heading"><div><p className="eyebrow">{result.intent.replaceAll('_', ' ')}</p><h2>SAMVAAD-IQ Evidence Brief</h2></div><ShieldCheck size={22} /></div>
          <p className="answer-copy">{result.answer}</p>
          <div className="answer-meta-row"><span>{result.requestId}</span><span>{result.mode}</span><span>{result.auditRef || 'No server audit'}</span><span>{Math.round(result.confidence.score * 100)}% {result.confidence.band}</span></div>
          <h3>Evidence citations</h3>
          <ol className="action-list">{result.citations.map((item) => <li key={item.id}><strong>{item.firId}</strong> — {item.excerpt}</li>)}</ol>
          <h3>Limitations</h3>
          <ul className="action-list">{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="disclaimer">Investigative lead only. Human verification and supervisory approval are required.</p>
        </article>
      )}
      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Approval gate</p><h2>Human authorization</h2></div>{approved ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}</div>
        <label className="approval-check"><input type="checkbox" checked={approved} disabled={!canApprove || !result} onChange={(event) => setApproved(event.target.checked)} /><span>I reviewed the cited synthetic evidence and approve this brief for demonstration export.</span></label>
        {!canApprove ? <p className="form-error">The {user?.role} role cannot approve reports. Sign in as Supervisor or Admin.</p> : null}
        <button type="button" className="primary-button" disabled={!approved || !canApprove || !result || isWorking} onClick={exportReport}><FileDown size={18} />{isWorking ? 'Generating…' : runtime.mode === 'catalyst-live' ? 'Generate verified report' : 'Open local print fallback'}</button>
        <p className="query-status" role="status">{status}</p>
      </section>
    </div>
  )
}

export default Report
