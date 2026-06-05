import { BadgeCheck, FileSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cases } from '../services/prototypeEngine.js'

const knownFirs = new Set(cases.map((caseRecord) => caseRecord.fir_id))

function EvidencePanel({ evidence = [], sources = [], confidence = 0, disclaimer }) {
  return (
    <section className="panel evidence-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Evidence</p>
          <h2>Source Trail</h2>
        </div>
        <span className="confidence-badge">{Math.round(confidence * 100)}%</span>
      </div>

      <div className="source-list">
        {sources.map((source) =>
          knownFirs.has(source) ? (
            <Link key={source} to={`/cases/${source}`} className="source-chip">
              <FileSearch size={14} />
              {source}
            </Link>
          ) : (
            <span key={source} className="source-chip">
              <FileSearch size={14} />
              {source}
            </span>
          ),
        )}
      </div>

      <div className="evidence-list">
        {evidence.slice(0, 8).map((item, index) => (
          <div key={`${item.label}-${index}`} className="evidence-row">
            <BadgeCheck size={16} />
            <div>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="disclaimer">{disclaimer}</p>
    </section>
  )
}

export default EvidencePanel
