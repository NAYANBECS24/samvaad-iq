import { AlertTriangle, FileCheck2, FileSearch, Fingerprint, HardDrive, Image, ShieldCheck, Upload } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { readEvidenceRecords } from '../services/fileAnalysis.js'
import { useRuntime } from '../services/runtime.jsx'

function formatBytes(value) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function capabilityStatus(capability) {
  return capability?.available ? 'Verified available' : 'Unavailable in this runtime'
}

function DigitalEvidence() {
  const { runtime } = useRuntime()
  const records = useMemo(() => readEvidenceRecords(), [])
  const imageRecords = records.filter((record) => ['png', 'jpg', 'jpeg'].includes(record.extension))
  const storage = runtime.capabilities?.storage
  const ocr = runtime.capabilities?.ocr || runtime.capabilities?.intelligence

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Digital Evidence</p>
          <h1>Evidence Provenance Workbench</h1>
          <p>Verified file metadata and capability-aware extraction results—no invented detections or confidence scores.</p>
        </div>
        <div className="intent-pill">
          <HardDrive size={16} />
          {storage?.available ? 'SERVER STORAGE VERIFIED' : 'LOCAL METADATA ONLY'}
        </div>
      </header>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Evidence index</p>
              <h2>{records.length} prepared file{records.length === 1 ? '' : 's'}</h2>
            </div>
            <Fingerprint size={20} />
          </div>
          <p>
            The browser retains only provenance metadata for the public demo. File bytes and extracted text are not silently
            uploaded or presented as server-persisted evidence.
          </p>
          <div className="mini-action-row">
            <Link to="/evidence-lab"><Upload size={15} />Prepare evidence</Link>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Runtime capabilities</p>
              <h2>Extraction boundary</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="station-row"><strong>Evidence storage</strong><span>{capabilityStatus(storage)}</span><small>{storage?.provider || 'Browser metadata index'}</small></div>
          <div className="station-row"><strong>OCR / visual extraction</strong><span>{capabilityStatus(ocr)}</span><small>{ocr?.available ? ocr.provider : 'Images expose dimensions and file metadata only'}</small></div>
          <p className="disclaimer">Face identity, object recognition, and plate OCR are never inferred unless a verified server capability returns actual source-backed output.</p>
        </article>
      </section>

      {!records.length ? (
        <article className="panel empty-state">
          <FileSearch size={28} />
          <strong>No evidence has been prepared in this browser</strong>
          <p>Use Evidence Lab to validate a synthetic file, calculate SHA-256, and create a local provenance record.</p>
          <Link className="primary-button" to="/evidence-lab"><Upload size={17} />Open Evidence Lab</Link>
        </article>
      ) : (
        <section className="media-chip-grid">
          {records.map((record) => (
            <article key={record.evidenceId} className="panel media-evidence-card">
              <div className="section-heading">
                <div><p className="eyebrow">{record.persistence}</p><h2>{record.name}</h2></div>
                {['png', 'jpg', 'jpeg'].includes(record.extension) ? <Image size={19} /> : <FileCheck2 size={19} />}
              </div>
              <div className="provenance-grid">
                <div><span>Evidence ID</span><strong>{record.evidenceId}</strong></div>
                <div><span>Type</span><strong>{record.type}</strong></div>
                <div><span>Size</span><strong>{formatBytes(record.size)}</strong></div>
                <div><span>Parser</span><strong>{record.parser}</strong></div>
                <div><span>Extracted characters</span><strong>{record.extractedCharacters}</strong></div>
                <div><span>Review</span><strong>{record.reviewStatus}</strong></div>
              </div>
              <div className="hash-cell"><span>SHA-256</span><code>{record.sha256}</code></div>
              {record.limitations?.length ? <p className="disclaimer"><AlertTriangle size={14} /> {record.limitations.join(' ')}</p> : null}
            </article>
          ))}
        </section>
      )}

      {imageRecords.length ? (
        <p className="disclaimer">{imageRecords.length} image file{imageRecords.length === 1 ? '' : 's'} indexed. Visual content remains unclassified while verified OCR is unavailable.</p>
      ) : null}
    </div>
  )
}

export default DigitalEvidence
