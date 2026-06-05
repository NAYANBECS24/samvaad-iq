import { CalendarClock, FileSearch, GitBranch, MapPin, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const statusColors = {
  Open: 'var(--red)',
  'Under Investigation': 'var(--amber)',
  'Charge Sheet Filed': 'var(--emerald)',
  Closed: 'var(--dim)',
  Unsolved: 'var(--violet)',
}

function CaseCard({ caseRecord, compact }) {
  const color = statusColors[caseRecord.status] || 'var(--amber)'

  return (
    <article className={`case-card${compact ? ' compact' : ''}`} style={{
      '--card-accent': color,
    }}>
      <style>{`
        .case-card { position: relative; }
        .case-card::before {
          background: linear-gradient(90deg, var(--card-accent, var(--amber)), transparent) !important;
        }
      `}</style>
      <div className="case-card-header">
        <Link to={`/cases/${caseRecord.fir_id}`} className="case-id">
          {caseRecord.fir_id}
        </Link>
        <span className="status-pill" style={{
          color,
          background: `${color}18`,
          borderColor: `${color}22`,
        }}>
          {caseRecord.status}
        </span>
      </div>
      <p>{caseRecord.case_summary || caseRecord.crime_type}</p>
      <dl className="case-meta">
        <div>
          <Shield size={15} />
          <dt>Type</dt>
          <dd>{caseRecord.crime_type}</dd>
        </div>
        <div>
          <MapPin size={15} />
          <dt>District</dt>
          <dd>{caseRecord.district}</dd>
        </div>
        <div>
          <CalendarClock size={15} />
          <dt>Date</dt>
          <dd>{caseRecord.date} {caseRecord.time}</dd>
        </div>
      </dl>
      <div className="mini-action-row">
        <Link to={`/cases/${caseRecord.fir_id}`}>
          <FileSearch size={13} />
          Dossier
        </Link>
        <Link to={`/network/${caseRecord.fir_id}`}>
          <GitBranch size={13} />
          Graph
        </Link>
      </div>
    </article>
  )
}

export default CaseCard
