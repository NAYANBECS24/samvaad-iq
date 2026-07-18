import { AlertTriangle, CheckCircle2, FileCheck2, FileUp, Fingerprint, Loader2, ScanSearch, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { prepareEvidenceFile, rememberPreparedEvidence } from '../services/fileAnalysis.js'
import { useRuntime } from '../services/runtime.jsx'

const accepted = '.pdf,.docx,.xlsx,.csv,.json,.png,.jpg,.jpeg'

function formatBytes(value) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function EvidenceLab() {
  const { runtime, analyzeEvidence } = useRuntime()
  const inputRef = useRef(null)
  const [prepared, setPrepared] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState('Select a synthetic evidence file. Nothing is uploaded until analysis is requested.')
  const [error, setError] = useState('')
  const [isPreparing, setIsPreparing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  async function selectFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPrepared(null)
    setAnalysis(null)
    setError('')
    setIsPreparing(true)
    setStatus('Validating, hashing, and extracting readable content locally…')
    try {
      const result = await prepareEvidenceFile(file)
      const evidenceRecord = rememberPreparedEvidence(result)
      setPrepared({ ...result, evidenceRecord })
      setStatus(`Prepared ${file.name}. Its provenance metadata is stored locally; verify the hash before grounded analysis.`)
    } catch (nextError) {
      setError(nextError.message)
      setStatus('The file was rejected before analysis.')
    } finally {
      setIsPreparing(false)
    }
  }

  async function runAnalysis() {
    if (!prepared) return
    setIsAnalyzing(true)
    setError('')
    setStatus(runtime.apiReachable
      ? runtime.truth?.storage?.configured || runtime.truth?.storage?.available
        ? 'Uploading verified evidence bytes to Catalyst, then running grounded analysis…'
        : 'Running grounded analysis on the server; evidence bytes will remain local because storage is unavailable…'
      : 'Running the shared engine locally; no evidence will be persisted…')
    try {
      const result = await analyzeEvidence(prepared)
      setAnalysis(result)
      setStatus(result.upload
        ? `Catalyst stored the server-verified file and completed analysis. Audit reference: ${result.auditRef}`
        : runtime.apiReachable
          ? `Server analysis completed with ${result.auditRef ? `audit reference ${result.auditRef}` : 'no persistent audit'}; evidence bytes were not stored.`
          : 'Offline analysis completed; results remain local to this browser session.')
    } catch (nextError) {
      setError(nextError.message)
      setStatus('Evidence analysis failed safely; no match was asserted.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">NETRA Evidence Lab</p><h1>Verifiable Evidence Intake</h1><p>Actual file parsing, SHA-256 provenance, grounded case matches, and explicit capability limits.</p></div>
        <span className="data-label">SYNTHETIC FILES ONLY</span>
      </header>

      <section className="evidence-lab-layout">
        <article className="panel evidence-drop-panel">
          <div className="section-heading"><div><p className="eyebrow">Step 1</p><h2>Validate and hash</h2></div><FileUp size={22} /></div>
          <button type="button" className="evidence-drop-zone" onClick={() => inputRef.current?.click()} disabled={isPreparing}>
            {isPreparing ? <Loader2 className="spin" size={30} /> : <FileCheck2 size={30} />}
            <strong>{isPreparing ? 'Preparing evidence…' : 'Choose evidence file'}</strong>
            <span>PDF, DOCX, XLSX, CSV, JSON, PNG, or JPEG · maximum 10 MB</span>
          </button>
          <input ref={inputRef} className="sr-only" type="file" accept={accepted} onChange={selectFile} />
          <p className="query-status" role="status">{status}</p>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </article>

        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">Runtime boundary</p><h2>{runtime.label}</h2></div><ShieldCheck size={22} /></div>
          <p>{runtime.apiReachable ? 'The server verifies identity, evidence hash, storage, analysis, and audit capabilities independently.' : 'The browser can parse supported files and calculate provenance, but storage and server audit are unavailable.'}</p>
          <ul className="capability-list">
            <li><CheckCircle2 size={16} />SHA-256 and structured-text extraction</li>
            <li><CheckCircle2 size={16} />Grounded matching against synthetic FIRs</li>
            <li className={runtime.truth?.storage?.available ? '' : 'is-unavailable'}><AlertTriangle size={16} />Catalyst evidence persistence {runtime.truth?.storage?.configured && !runtime.truth?.storage?.available ? '(awaiting live upload verification)' : ''}</li>
            <li className={runtime.truth?.ocr?.available ? '' : 'is-unavailable'}><AlertTriangle size={16} />Verified server OCR</li>
          </ul>
        </article>
      </section>

      {prepared ? (
        <section className="panel provenance-panel">
          <div className="section-heading"><div><p className="eyebrow">Provenance</p><h2>Prepared file record</h2></div><Fingerprint size={22} /></div>
          <div className="provenance-grid">
            <div><span>File</span><strong>{prepared.file.name}</strong></div>
            <div><span>Type</span><strong>{prepared.file.type}</strong></div>
            <div><span>Size</span><strong>{formatBytes(prepared.file.size)}</strong></div>
            <div className="hash-cell"><span>SHA-256</span><code>{prepared.file.sha256}</code></div>
            <div><span>Extracted text</span><strong>{prepared.text.length.toLocaleString('en-IN')} characters</strong></div>
            <div><span>Parser limits</span><strong>{prepared.limitations.length || 'None reported'}</strong></div>
            <div><span>Local evidence ID</span><strong>{prepared.evidenceRecord?.evidenceId}</strong></div>
          </div>
          <button type="button" className="primary-button" onClick={runAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <Loader2 className="spin" size={18} /> : <ScanSearch size={18} />}{isAnalyzing ? 'Analyzing evidence…' : 'Run grounded analysis'}</button>
        </section>
      ) : null}

      {analysis ? (
        <>
          <section className="panel">
            <div className="section-heading"><div><p className="eyebrow">Extracted facts</p><h2>Facts separated from interpretation</h2></div><ScanSearch size={22} /></div>
            <div className="fact-grid">
              {Object.entries(analysis.facts || {}).map(([key, values]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{values.length ? values.join(', ') : 'None extracted'}</strong></div>)}
            </div>
            <div className="answer-meta-row"><span>{analysis.analysisId}</span><span>{analysis.mode}</span><span>{analysis.auditRef || 'Not persisted'}</span></div>
            {analysis.upload ? <div className="form-notice compact"><CheckCircle2 size={16} />Stored by {analysis.upload.storage.provider}; server SHA-256 verification passed.</div> : null}
          </section>

          {analysis.ocrExtraction ? (
            <section className="panel">
              <div className="section-heading"><div><p className="eyebrow">Capability canary passed</p><h2>Verified Zia OCR extraction</h2></div><CheckCircle2 size={22} /></div>
              <pre className="evidence-extraction-output">{JSON.stringify(analysis.ocrExtraction.output, null, 2)}</pre>
              <p className="disclaimer">Machine-extracted text remains unreviewed until an analyst compares it with the original image.</p>
            </section>
          ) : null}

          <section className="panel">
            <div className="section-heading"><div><p className="eyebrow">Grounded matches</p><h2>Cases supported by extracted content</h2></div><FileCheck2 size={22} /></div>
            {analysis.citations?.length ? <div className="citation-grid">{analysis.citations.map((item) => <Link className="citation-card" to={`/cases/${item.firId}`} key={item.id}><strong>{item.firId}</strong><span>{item.field}</span><p>{item.excerpt}</p><small>{item.dataLabel}</small></Link>)}</div> : <div className="empty-state"><AlertTriangle size={24} /><strong>No grounded match</strong><p>The system did not invent a link from unsupported content.</p></div>}
          </section>

          <section className="decision-grid">
            <article className="panel"><div className="section-heading"><div><p className="eyebrow">Next actions</p><h2>Human verification</h2></div></div><ol className="action-list">{analysis.nextActions.map((item) => <li key={item}>{item}</li>)}</ol></article>
            <article className="panel warning-panel"><div className="section-heading"><div><p className="eyebrow">Limitations</p><h2>Capability-aware boundaries</h2></div><AlertTriangle size={20} /></div><ul className="action-list">{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default EvidenceLab
